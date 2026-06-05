'use strict';
const pool   = require('../../config/db');
const bcrypt = require('bcryptjs');
const path   = require('path');
const fs     = require('fs');

const sanitizar = (str) =>
  typeof str === 'string' ? str.trim().replace(/[<>"'`]/g, '').slice(0, 255) : '';

// ── ADMIN: Listar todos los clientes ──────────────────────────────────────────
const listarClientes = async ({ busqueda = '', pagina = 1, limite = 20 } = {}) => {
  const offset = (pagina - 1) * limite;
  const like   = `%${busqueda}%`;

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
const toggleActivoUsuario = async (usuarioId) => {
  const { rows } = await pool.query(`
    UPDATE eqim_seguridad.usuarios
    SET activo = NOT activo
    WHERE usuario_id = $1
    RETURNING usuario_id, nombre_completo, correo, activo
  `, [usuarioId]);

  if (!rows.length) {
    const e = new Error('Usuario no encontrado.'); e.statusCode = 404; throw e;
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
  if (!base64Image || !base64Image.startsWith('data:image/')) {
    const e = new Error('Formato de imagen inválido.'); e.statusCode = 400; throw e;
  }

  // Determinar extensión desde el data URI
  const match = base64Image.match(/^data:image\/(jpeg|jpg|png|gif|webp);base64,/i);
  if (!match) {
    const e = new Error('Tipo de imagen no permitido. Usa JPEG, PNG o WebP.'); e.statusCode = 400; throw e;
  }
  const ext    = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
  const base64 = base64Image.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64, 'base64');

  // Verificar tamaño: máximo 5MB
  if (buffer.length > 5 * 1024 * 1024) {
    const e = new Error('La imagen no puede superar 5MB.'); e.statusCode = 400; throw e;
  }

  // Crear directorio si no existe
  const uploadDir = path.join(__dirname, '../../../public/uploads/perfiles'); //backend\public\uploads\perfiles
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  // Eliminar foto anterior si existe
  const { rows: current } = await pool.query(
    'SELECT foto_perfil FROM eqim_seguridad.usuarios WHERE usuario_id = $1',
    [usuarioId]
  );
  if (current[0]?.foto_perfil) {
    const relPath = current[0].foto_perfil.replace(/^\//, '');
    const oldPath = path.join(__dirname, '../../../public', relPath);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  // Guardar nueva foto con nombre único
  const filename = `perfil_${usuarioId}_${Date.now()}.${ext}`;
  const filePath = path.join(uploadDir, filename);
  fs.writeFileSync(filePath, buffer);

  const urlRelativa = `/uploads/perfiles/${filename}`;

  // Actualizar BD
  const { rows } = await pool.query(`
    UPDATE eqim_seguridad.usuarios
    SET foto_perfil = $1
    WHERE usuario_id = $2
    RETURNING usuario_id, nombre_completo, correo, foto_perfil
  `, [urlRelativa, usuarioId]);

  return rows[0];
};

// ── CLIENTE: Cambiar contraseña ────────────────────────────────────────────────
const cambiarPassword = async (usuarioId, { password_actual, password_nueva }) => {
  if (!password_actual || !password_nueva) {
    const e = new Error('Debes ingresar la contraseña actual y la nueva.'); e.statusCode = 400; throw e;
  }
  if (password_nueva.length < 8) {
    const e = new Error('La nueva contraseña debe tener al menos 8 caracteres.'); e.statusCode = 400; throw e;
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
    'UPDATE eqim_seguridad.usuarios SET password_hash = $1 WHERE usuario_id = $2',
    [hash, usuarioId]
  );
  return { ok: true };
};

module.exports = { listarClientes, toggleActivoUsuario, obtenerPerfil, actualizarPerfil, subirFotoPerfil, cambiarPassword };
