'use strict';
const jwt  = require("jsonwebtoken");
const pool = require("../config/db");

// =============================================================================
//  MIDDLEWARES DE AUTENTICACIÓN Y AUTORIZACIÓN — EventPlanner QIM
// =============================================================================

/**
 * verifyToken — verifica que el token JWT sea válido y que el usuario siga
 * existiendo y activo. Los datos (rol, correo, nombre) se leen de la BD en cada
 * petición: así un usuario desactivado o con rol cambiado pierde el acceso al
 * instante, y los tokens de OAuth (que solo llevan id y rol) también tienen el
 * correo disponible.
 */
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Acceso denegado. Token no proporcionado.",
      code: "TOKEN_MISSING",
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    // Detectamos si el error es porque el tiempo del token ya expiró
    const esExpirado = err.name === 'TokenExpiredError';
    return res.status(401).json({
      success: false,
      message: esExpirado
        ? 'La sesión ha expirado. Por favor inicia sesión nuevamente.'
        : 'Token inválido.',
      code: esExpirado ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID',
    });
  }

  try {
    const { rows } = await pool.query(
      `SELECT u.usuario_id, u.correo, u.nombre_completo, u.activo, r.rol_codigo
       FROM eqim_seguridad.usuarios u
       JOIN eqim_seguridad.roles r ON r.rol_id = u.rol_id
       WHERE u.usuario_id = $1`,
      [decoded.id]
    );
    const u = rows[0];
    if (!u || !u.activo) {
      return res.status(401).json({
        success: false,
        message: 'Tu cuenta está desactivada o ya no existe.',
        code: 'USER_INACTIVE',
      });
    }

    req.user = { id: u.usuario_id, rol: u.rol_codigo, correo: u.correo, nombre: u.nombre_completo };
    next();
  } catch (err) { next(err); }
};

/**
 * isAdmin — verifica que el usuario autenticado sea ADMIN.
 */
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'No autenticado.' });
  }

  if (req.user.rol === 'ADMIN') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Acceso denegado: se requiere rol de administrador.",
      code: 'FORBIDDEN_ADMIN_REQUIRED',
    });
  }
};

/**
 * isCliente — verifica que el usuario sea CLIENTE o ADMIN.
 * Permite que los admins también accedan a las rutas de los clientes.
 */
const isCliente = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'No autenticado.' });
  }

  if (req.user.rol === 'CLIENTE' || req.user.rol === 'ADMIN') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado.',
      code: 'FORBIDDEN',
    });
  }
};

module.exports = { verifyToken, isAdmin, isCliente };
