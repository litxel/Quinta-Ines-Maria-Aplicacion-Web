'use strict';
const pool   = require('../../config/db');
const bcrypt = require('bcryptjs');
const { guardarImagen, eliminarImagen } = require('../../utils/almacenamiento.service');
const { TEL_RE, errorPassword } = require('../../utils/validaciones');

const sanitizar = (str) =>
  typeof str === 'string' ? str.trim().replace(/[<>"'`]/g, '').slice(0, 255) : '';

// ── ADMIN: Listar todos los clientes ──────────────────────────────────────────
const listarClientes = async ({ busqueda = '', pagina = 1, limite = 20 } = {}) => {
  pagina = Number.isInteger(pagina) && pagina > 0 ? pagina : 1;
  limite = Number.isInteger(limite) && limite > 0 ? Math.min(limite, 100) : 20;
  const offset = (pagina - 1) * limite;
  const like   = `%${String(busqueda).slice(0, 100)}%`;

  const { rows } = await pool.query(`
    SELECT
      u.usuario_id, u.usuario_uuid, u.nombre_completo, u.correo, u.telefono,
      u.correo_verificado, u.activo, u.ultimo_login, u.creado_en, r.rol_codigo,
      u.foto_perfil,
      (SELECT COUNT(*)::int FROM eqim_solicitudes.eqim_solicitudes s
       WHERE s.usuario_id = u.usuario_id AND s.archivado = false) AS solicitudes_count
    FROM eqim_seguridad.usuarios u
    JOIN eqim_seguridad.roles r ON r.rol_id = u.rol_id
    WHERE r.rol_codigo = 'CLIENTE'
      AND (u.nombre_completo ILIKE $1 OR u.correo ILIKE $1)
    ORDER BY u.creado_en DESC
    LIMIT $2 OFFSET $3
  `, [like, limite, offset]);

  const { rows: cnt } = await pool.query(`
    SELECT COUNT(*) AS total
    FROM eqim_seguridad.usuarios u
    JOIN eqim_seguridad.roles r ON r.rol_id = u.rol_id
    WHERE r.rol_codigo = 'CLIENTE'
      AND (u.nombre_completo ILIKE $1 OR u.correo ILIKE $1)
  `, [like]);

  return { clientes: rows, total: parseInt(cnt[0].total), pagina, limite };
};

// ── ADMIN: Toggle activo ───────────────────────────────────────────────────────
// Solo se pueden activar/desactivar clientes (nunca a un administrador)
const toggleActivoUsuario = async (usuarioId) => {
  const { rows } = await pool.query(`
    UPDATE eqim_seguridad.usuarios
    SET activo = NOT activo
    WHERE usuario_id = $1
      AND rol_id = (SELECT rol_id FROM eqim_seguridad.roles WHERE rol_codigo = 'CLIENTE')
    RETURNING usuario_id, nombre_completo, correo, activo
  `, [usuarioId]);

  if (!rows.length) {
    const e = new Error('Cliente no encontrado.'); e.statusCode = 404; throw e;
  }
  return rows[0];
};

// ── CLIENTE: Obtener perfil propio (incluye foto_perfil) ───────────────────────
const obtenerPerfil = async (usuarioId) => {
  const { rows } = await pool.query(`
    SELECT u.usuario_id, u.usuario_uuid, u.nombre_completo, u.correo, u.telefono,
           u.correo_verificado, u.activo, u.ultimo_login, u.creado_en, r.rol_codigo,
           u.foto_perfil
    FROM eqim_seguridad.usuarios u
    JOIN eqim_seguridad.roles r ON r.rol_id = u.rol_id
    WHERE u.usuario_id = $1
  `, [usuarioId]);

  if (!rows.length) {
    const e = new Error('Usuario no encontrado.'); e.statusCode = 404; throw e;
  }
  return rows[0];
};

// ── CLIENTE: Actualizar nombre y teléfono ──────────────────────────────────────
const actualizarPerfil = async (usuarioId, { nombre_completo, telefono }) => {
  const nombreLimpio   = sanitizar(nombre_completo);
  const telefonoLimpio = sanitizar(telefono);

  if (!nombreLimpio) {
    const e = new Error('El nombre es requerido.'); e.statusCode = 400; throw e;
  }
  if (telefonoLimpio && !TEL_RE.test(telefonoLimpio)) {
    const e = new Error('El teléfono no tiene un formato válido.'); e.statusCode = 400; throw e;
  }

  const { rows } = await pool.query(`
    UPDATE eqim_seguridad.usuarios
    SET nombre_completo = $1, telefono = $2
    WHERE usuario_id = $3
    RETURNING usuario_id, nombre_completo, correo, telefono, correo_verificado, foto_perfil
  `, [nombreLimpio, telefonoLimpio || null, usuarioId]);

  return rows[0];
};

// ── CLIENTE / ADMIN: Subir foto de perfil ─────────────────────────────────────
const subirFotoPerfil = async (usuarioId, base64Image) => {
  // Valida tipo real y tamaño (máx. 5 MB) y la guarda en Cloudinary o en disco
  const urlNueva = await guardarImagen(base64Image, 'perfiles');

  const { rows: current } = await pool.query(
    'SELECT foto_perfil FROM eqim_seguridad.usuarios WHERE usuario_id = $1',
    [usuarioId]
  );

  const { rows } = await pool.query(`
    UPDATE eqim_seguridad.usuarios
    SET foto_perfil = $1
    WHERE usuario_id = $2
    RETURNING usuario_id, nombre_completo, correo, foto_perfil
  `, [urlNueva, usuarioId]);

  // Eliminar la foto anterior una vez guardada la nueva
  if (current[0]?.foto_perfil) await eliminarImagen(current[0].foto_perfil);

  return rows[0];
};

// ── CLIENTE: Cambiar contraseña ────────────────────────────────────────────────
const cambiarPassword = async (usuarioId, { password_actual, password_nueva }) => {
  if (!password_actual || !password_nueva) {
    const e = new Error('Debes ingresar la contraseña actual y la nueva.'); e.statusCode = 400; throw e;
  }
  const errPass = errorPassword(password_nueva);
  if (errPass) {
    const e = new Error(errPass); e.statusCode = 400; throw e;
  }

  const { rows } = await pool.query(
    'SELECT password_hash FROM eqim_seguridad.usuarios WHERE usuario_id = $1',
    [usuarioId]
  );
  if (!rows.length) {
    const e = new Error('Usuario no encontrado.'); e.statusCode = 404; throw e;
  }

  const coincide = await bcrypt.compare(password_actual, rows[0].password_hash);
  if (!coincide) {
    const e = new Error('La contraseña actual es incorrecta.'); e.statusCode = 400; throw e;
  }

  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(password_nueva, salt);

  await pool.query(
    'UPDATE eqim_seguridad.usuarios SET password_hash = $1, actualizado_en = NOW() WHERE usuario_id = $2',
    [hash, usuarioId]
  );
  return { ok: true };
};

module.exports = { listarClientes, toggleActivoUsuario, obtenerPerfil, actualizarPerfil, subirFotoPerfil, cambiarPassword };
