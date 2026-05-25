'use strict';
const pool     = require('../../config/db');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');
const email    = require('../../utils/email.service');
require('dotenv').config();

// =============================================================================
//  SERVICIO DE AUTENTICACIÓN — Sprint 5
//  Tabla: eqim_seguridad.usuarios
// =============================================================================

const sanitizar = (str) =>
  typeof str === 'string'
    ? str.trim().replace(/[<>"'`]/g, '').slice(0, 255)
    : '';

const registrarUsuario = async ({ nombre_completo, correo, password, telefono }, ipOrigen) => {
  const correoLimpio   = sanitizar(correo).toLowerCase();
  const nombreLimpio   = sanitizar(nombre_completo);
  const telefonoLimpio = sanitizar(telefono); // 🚀 BUG FIX: Rescatamos el teléfono

  if (!correoLimpio || !nombreLimpio || !password) {
    const e = new Error('Todos los campos son requeridos.'); e.statusCode = 400; throw e;
  }

  const existe = await pool.query(
    'SELECT usuario_id FROM eqim_seguridad.usuarios WHERE correo = $1',
    [correoLimpio]
  );
  if (existe.rows.length > 0) {
    const e = new Error('Este correo ya está registrado.'); e.statusCode = 409; throw e;
  }

  const salt          = await bcrypt.genSalt(12);
  const password_hash = await bcrypt.hash(password, salt);

  // 🚀 BUG FIX: Agregamos el teléfono al INSERT
  const { rows } = await pool.query(
    `INSERT INTO eqim_seguridad.usuarios
       (nombre_completo, correo, telefono, password_hash, rol_id)
     VALUES ($1, $2, $3, $4, 2)
     RETURNING usuario_id, nombre_completo, correo, telefono, rol_id, correo_verificado`,
    [nombreLimpio, correoLimpio, telefonoLimpio, password_hash]
  );
  const usuario = rows[0];

  const rawToken   = crypto.randomBytes(32).toString('hex');
  const tokenHash  = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expira     = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  await pool.query(
    `INSERT INTO eqim_seguridad.tokens
       (usuario_id, token_hash, tipo, expira_en, ip_origen)
     VALUES ($1, $2, 'VERIFICACION_CORREO', $3, $4)`,
    [usuario.usuario_id, tokenHash, expira, ipOrigen]
  );

  return { usuario, tokenLimpio: rawToken };
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

  if (!u.activo) throw Object.assign(new Error('Cuenta desactivada.'), { statusCode: 403 });

  if (u.bloqueado_hasta && new Date(u.bloqueado_hasta) > new Date()) {
    const min = Math.ceil((new Date(u.bloqueado_hasta) - Date.now()) / 60000);
    throw Object.assign(
      new Error(`Cuenta bloqueada. Intenta en ${min} minuto(s).`),
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
      [intentos, bloqueo, u.usuario_id]
    );
    throw errCred;
  }

  await pool.query(
    `UPDATE eqim_seguridad.usuarios
     SET intentos_fallidos = 0, bloqueado_hasta = NULL, ultimo_login = NOW()
     WHERE usuario_id = $1`,
    [u.usuario_id]
  );

  const token = jwt.sign(
    { id: u.usuario_id, correo: u.correo, rol: u.rol_codigo, nombre: u.nombre_completo },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' }
  );

  return {
    token,
    usuario: {
      id:                  u.usuario_id,
      nombre_completo:     u.nombre_completo,
      correo:              u.correo,
      rol_codigo:          u.rol_codigo,
      correo_verificado:   u.correo_verificado,
    },
  };
};

const verificarCuenta = async (rawToken) => {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const { rows } = await pool.query(
    `SELECT t.*, u.nombre_completo, u.correo
     FROM eqim_seguridad.tokens t
     JOIN eqim_seguridad.usuarios u ON u.usuario_id = t.usuario_id
     WHERE t.token_hash = $1 AND t.tipo = 'VERIFICACION_CORREO'
       AND t.usado = false AND t.expira_en > NOW()`,
    [tokenHash]
  );

  if (rows.length === 0)
    throw Object.assign(new Error('Token inválido o expirado.'), { statusCode: 400 });

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

  const rawToken  = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expira    = new Date(Date.now() + 60 * 60 * 1000); 

  await pool.query(
    `UPDATE eqim_seguridad.tokens SET usado = true
     WHERE usuario_id = $1 AND tipo = 'RESET_PASSWORD' AND usado = false`,
    [u.usuario_id]
  );

  await pool.query(
    `INSERT INTO eqim_seguridad.tokens
       (usuario_id, token_hash, tipo, expira_en, ip_origen)
     VALUES ($1, $2, 'RESET_PASSWORD', $3, $4)`,
    [u.usuario_id, tokenHash, expira, ipOrigen]
  );

  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const enlace = `${baseUrl}/nueva-clave?token=${rawToken}`;
  
  await email.enviarResetPassword({
    nombre: u.nombre_completo,
    correo: u.correo,
    enlace,
  }).catch((err) => console.error('🚨 ERROR ENVIANDO EMAIL DE RECUPERACIÓN:', err));
};

const restablecerPassword = async (rawToken, nuevaPassword) => {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const { rows } = await pool.query(
    `SELECT t.token_id, t.usuario_id
     FROM eqim_seguridad.tokens t
     WHERE t.token_hash = $1 AND t.tipo = 'RESET_PASSWORD' 
       AND t.usado = false AND t.expira_en > NOW()`,
    [tokenHash]
  );

  if (rows.length === 0)
    throw Object.assign(new Error('Token inválido o expirado.'), { statusCode: 400 });

  const t    = rows[0];
  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(nuevaPassword, salt);

  await pool.query(
    `UPDATE eqim_seguridad.usuarios
     SET password_hash = $1, intentos_fallidos = 0, bloqueado_hasta = NULL, actualizado_en = NOW()
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
  loginUsuario,
  verificarCuenta,
  solicitarResetPassword,
  restablecerPassword,
};