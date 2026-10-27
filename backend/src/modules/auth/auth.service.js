'use strict';
const pool     = require('../../config/db');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');
const email    = require('../../utils/email.service');

// =============================================================================
//  SERVICIO DE AUTENTICACIÓN — Sprint 5
//  Tabla: eqim_seguridad.usuarios
// =============================================================================

const sanitizar = (str) =>
  typeof str === 'string'
    ? str.trim().replace(/[<>"'`]/g, '').slice(0, 255)
    : '';

const urlFrontend = () =>
  (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim().replace(/\/$/, '');

const hashToken = (raw) => crypto.createHash('sha256').update(raw).digest('hex');

// Crea un token de un solo uso (verificación o reset) y devuelve el valor en claro
const crearTokenUnUso = async (usuarioId, tipo, horas, ipOrigen) => {
  // Invalida los tokens anteriores del mismo tipo: solo vale el último enlace
  await pool.query(
    `UPDATE eqim_seguridad.tokens SET usado = true
     WHERE usuario_id = $1 AND tipo = $2 AND usado = false`,
    [usuarioId, tipo]
  );

  const rawToken = crypto.randomBytes(32).toString('hex');
  await pool.query(
    `INSERT INTO eqim_seguridad.tokens
       (usuario_id, token_hash, tipo, expira_en, ip_origen)
     VALUES ($1, $2, $3, $4, $5)`,
    [usuarioId, hashToken(rawToken), tipo, new Date(Date.now() + horas * 60 * 60 * 1000), ipOrigen]
  );
  return rawToken;
};

const registrarUsuario = async ({ nombre_completo, correo, password, telefono }, ipOrigen) => {
  const correoLimpio   = sanitizar(correo).toLowerCase();
  const nombreLimpio   = sanitizar(nombre_completo).slice(0, 150);
  const telefonoLimpio = sanitizar(telefono).slice(0, 20) || null;

  if (!correoLimpio || !nombreLimpio || !password) {
    const e = new Error('Todos los campos son requeridos.'); e.statusCode = 400; throw e;
  }

  const existe = await pool.query(
    'SELECT usuario_id FROM eqim_seguridad.usuarios WHERE correo = $1',
    [correoLimpio]
  );
  if (existe.rows.length > 0) {
    const e = new Error('Este correo ya está registrado. Si no verificaste tu cuenta, puedes pedir un nuevo enlace desde el inicio de sesión.');
    e.statusCode = 409; throw e;
  }

  const salt          = await bcrypt.genSalt(12);
  const password_hash = await bcrypt.hash(password, salt);

  const { rows } = await pool.query(
    `INSERT INTO eqim_seguridad.usuarios
       (nombre_completo, correo, telefono, password_hash, rol_id)
     VALUES ($1, $2, $3, $4, (SELECT rol_id FROM eqim_seguridad.roles WHERE rol_codigo = 'CLIENTE'))
     RETURNING usuario_id, nombre_completo, correo, telefono, rol_id, correo_verificado`,
    [nombreLimpio, correoLimpio, telefonoLimpio, password_hash]
  );
  const usuario = rows[0];

  const tokenLimpio = await crearTokenUnUso(usuario.usuario_id, 'VERIFICACION_CORREO', 24, ipOrigen);
  return { usuario, tokenLimpio };
};

const enviarCorreoVerificacion = (usuario, rawToken) =>
  email.enviarVerificacionCorreo({
    nombre: usuario.nombre_completo,
    correo: usuario.correo,
    enlace: `${urlFrontend()}/verificar-cuenta?token=${rawToken}`,
  });

const reenviarVerificacion = async (correo, ipOrigen) => {
  const { rows } = await pool.query(
    `SELECT usuario_id, nombre_completo, correo
     FROM eqim_seguridad.usuarios
     WHERE correo = $1 AND activo = true AND correo_verificado = false`,
    [sanitizar(correo).toLowerCase()]
  );
  if (rows.length === 0) return;  // no revelar si existe o ya está verificado

  const rawToken = await crearTokenUnUso(rows[0].usuario_id, 'VERIFICACION_CORREO', 24, ipOrigen);
  await enviarCorreoVerificacion(rows[0], rawToken)
    .catch((err) => console.error('[EMAIL] Error reenviando verificación:', email.describirErrorCorreo(err)));
};

const loginUsuario = async ({ correo, password }) => {
  const correoLimpio = sanitizar(correo).toLowerCase();

  const { rows } = await pool.query(
    `SELECT u.*, r.rol_codigo
     FROM eqim_seguridad.usuarios u
     JOIN eqim_seguridad.roles r ON r.rol_id = u.rol_id
     WHERE u.correo = $1`,
    [correoLimpio]
  );

  const errCred = Object.assign(new Error('Correo o contraseña incorrectos.'), { statusCode: 401 });

  if (rows.length === 0) throw errCred;
  const u = rows[0];

  if (u.bloqueado_hasta && new Date(u.bloqueado_hasta) > new Date()) {
    const min = Math.ceil((new Date(u.bloqueado_hasta) - Date.now()) / 60000);
    throw Object.assign(
      new Error(`Cuenta bloqueada por intentos fallidos. Intenta en ${min} minuto(s).`),
      { statusCode: 429 }
    );
  }

  const esValida = await bcrypt.compare(password, u.password_hash);

  if (!esValida) {
    const intentos = (u.intentos_fallidos ?? 0) + 1;
    const bloqueo  = intentos >= 5
      ? new Date(Date.now() + 15 * 60 * 1000)
      : null;

    await pool.query(
      `UPDATE eqim_seguridad.usuarios
       SET intentos_fallidos = $1, bloqueado_hasta = $2
       WHERE usuario_id = $3`,
      [bloqueo ? 0 : intentos, bloqueo, u.usuario_id]
    );
    throw errCred;
  }

  // Estos avisos solo se muestran a quien ya demostró conocer la contraseña
  if (!u.activo) throw Object.assign(new Error('Tu cuenta está desactivada. Contacta con la Quinta.'), { statusCode: 403 });

  // Los administradores quedan exentos para no bloquear el panel
  if (!u.correo_verificado && u.rol_codigo !== 'ADMIN') {
    throw Object.assign(
      new Error('Debes verificar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada (y la carpeta de spam) o pide un nuevo enlace.'),
      { statusCode: 403, codigo: 'EMAIL_NO_VERIFICADO' }
    );
  }

  await pool.query(
    `UPDATE eqim_seguridad.usuarios
     SET intentos_fallidos = 0, bloqueado_hasta = NULL, ultimo_login = NOW()
     WHERE usuario_id = $1`,
    [u.usuario_id]
  );

  const token = jwt.sign(
    { id: u.usuario_id, rol: u.rol_codigo },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' }
  );

  return {
    token,
    usuario: {
      id:                  u.usuario_id,
      nombre_completo:     u.nombre_completo,
      correo:              u.correo,
      telefono:            u.telefono || null,
      rol_codigo:          u.rol_codigo,
      correo_verificado:   u.correo_verificado,
      foto_perfil:         u.foto_perfil || null,
    },
  };
};

const verificarCuenta = async (rawToken) => {
  const { rows } = await pool.query(
    `SELECT t.*, u.nombre_completo, u.correo
     FROM eqim_seguridad.tokens t
     JOIN eqim_seguridad.usuarios u ON u.usuario_id = t.usuario_id
     WHERE t.token_hash = $1 AND t.tipo = 'VERIFICACION_CORREO'
       AND t.usado = false AND t.expira_en > NOW()`,
    [hashToken(rawToken)]
  );

  if (rows.length === 0)
    throw Object.assign(new Error('El enlace no es válido o ya expiró. Pide uno nuevo desde el inicio de sesión.'), { statusCode: 400 });

  const t = rows[0];

  await pool.query(
    `UPDATE eqim_seguridad.usuarios SET correo_verificado = true WHERE usuario_id = $1`,
    [t.usuario_id]
  );
  await pool.query(
    `UPDATE eqim_seguridad.tokens SET usado = true WHERE token_id = $1`,
    [t.token_id]
  );

  return { nombre_completo: t.nombre_completo, correo: t.correo };
};

const solicitarResetPassword = async (correo, ipOrigen) => {
  const correoLimpio = sanitizar(correo).toLowerCase();

  const { rows } = await pool.query(
    'SELECT usuario_id, nombre_completo, correo FROM eqim_seguridad.usuarios WHERE correo = $1 AND activo = true',
    [correoLimpio]
  );

  if (rows.length === 0) return;

  const u = rows[0];
  const rawToken = await crearTokenUnUso(u.usuario_id, 'RESET_PASSWORD', 1, ipOrigen);

  await email.enviarResetPassword({
    nombre: u.nombre_completo,
    correo: u.correo,
    enlace: `${urlFrontend()}/nueva-clave?token=${rawToken}`,
  }).catch((err) => console.error('[EMAIL] Error enviando recuperación de contraseña:', email.describirErrorCorreo(err)));
};

const restablecerPassword = async (rawToken, nuevaPassword) => {
  const { rows } = await pool.query(
    `SELECT t.token_id, t.usuario_id
     FROM eqim_seguridad.tokens t
     WHERE t.token_hash = $1 AND t.tipo = 'RESET_PASSWORD'
       AND t.usado = false AND t.expira_en > NOW()`,
    [hashToken(rawToken)]
  );

  if (rows.length === 0)
    throw Object.assign(new Error('El enlace no es válido o ya expiró. Solicita uno nuevo.'), { statusCode: 400 });

  const t    = rows[0];
  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(nuevaPassword, salt);

  // Quien recibe el enlace demostró ser dueño del correo: se marca como verificado
  await pool.query(
    `UPDATE eqim_seguridad.usuarios
     SET password_hash = $1, intentos_fallidos = 0, bloqueado_hasta = NULL,
         correo_verificado = true, actualizado_en = NOW()
     WHERE usuario_id = $2`,
    [hash, t.usuario_id]
  );
  await pool.query(
    'UPDATE eqim_seguridad.tokens SET usado = true WHERE token_id = $1',
    [t.token_id]
  );
};

module.exports = {
  sanitizar,
  registrarUsuario,
  enviarCorreoVerificacion,
  reenviarVerificacion,
  loginUsuario,
  verificarCuenta,
  solicitarResetPassword,
  restablecerPassword,
};
