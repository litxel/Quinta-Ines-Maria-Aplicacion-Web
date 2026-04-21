'use strict';
const router      = require('express').Router();
const ctrl        = require('./configurador.controller');
const { verifyToken } = require('../../middlewares/auth');
// ↑ El middleware está en src/middlewares/auth.js (SIN .middleware en el nombre)

// =============================================================================
//  RUTAS DEL CONFIGURADOR — EventPlanner QIM
//
//  PÚBLICAS (sin token):
//    GET  /api/configurador/datos              → catálogos para el configurador
//    POST /api/configurador/calcular-precio    → precio desde el servidor
//
//  OPCIONALES (token si está logueado, null si no):
//    POST /api/configurador/sesion             → crear sesión
//    PUT  /api/configurador/sesion/:sesionId   → actualizar sesión
//    GET  /api/configurador/sesion/:sesionId   → recuperar sesión
//
//  NOTA: Las rutas de sesión usan un middleware "soft auth" — si el usuario
//  está logueado se guarda su ID, si no se guarda null (sesión anónima).
// =============================================================================

// Middleware "soft auth": intenta verificar el token pero no bloquea si no hay
const softAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return next();          // anónimo — ok
  verifyToken(req, res, next);             // si hay token, lo verifica
};

// Rutas públicas
router.get( '/datos',              ctrl.getDatosConfiguracion);
router.post('/calcular-precio',    ctrl.calcularPrecio);

// Rutas con soft auth (funcionan con y sin login)
router.post('/sesion',             softAuth, ctrl.crearSesion);
router.put( '/sesion/:sesionId',   softAuth, ctrl.actualizarSesion);
router.get( '/sesion/:sesionId',   softAuth, ctrl.getSesion);

module.exports = router;
