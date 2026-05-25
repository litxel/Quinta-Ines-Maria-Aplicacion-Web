'use strict';
const jwt = require("jsonwebtoken");
require("dotenv").config();

// =============================================================================
//  MIDDLEWARES DE AUTENTICACIÓN Y AUTORIZACIÓN — EventPlanner QIM
// =============================================================================

/**
 * verifyToken — verifica que el token JWT sea válido.
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Acceso denegado. Token no proporcionado.",
      code: "TOKEN_MISSING",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
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
};

/**
 * isAdmin — verifica que el usuario autenticado sea ADMIN.
 */
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'No autenticado.' });
  }

  // Mantenemos tu lógica original: Acepta 'ADMIN' o 'administrador'
  if (req.user.rol === 'ADMIN' || req.user.rol === 'administrador') {
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

  // Permitimos el paso si es CLIENTE, ADMIN o administrador
  if (req.user.rol === 'CLIENTE' || req.user.rol === 'ADMIN' || req.user.rol === 'administrador') {
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