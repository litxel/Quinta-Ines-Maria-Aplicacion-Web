'use strict';
const router      = require('express').Router();
const ctrl        = require('./configurador.controller');
const limites     = require('../../middlewares/rateLimit');
const { verifyToken, isAdmin } = require('../../middlewares/auth');

// =============================================================================
//  RUTAS DEL CONFIGURADOR — EventPlanner QIM
//
//  PÚBLICAS (sin token):
//    GET  /api/configurador/datos              → catálogos para el configurador
//    POST /api/configurador/calcular-precio    → precio desde el servidor
//    GET  /api/configurador/fechas-ocupadas    → fechas no disponibles
//    POST /api/configurador/recomendar         → asistente IA (con límite de uso)
//
//  OPCIONALES (token si está logueado, null si no):
//    POST /api/configurador/sesion             → crear sesión
//    PUT  /api/configurador/sesion/:sesionId   → actualizar sesión
//    GET  /api/configurador/sesion/:sesionId   → recuperar sesión
//
//  ADMIN:
//    GET/POST/DELETE /api/configurador/admin/calendario
//
//  NOTA: el envío de la cotización por correo está en
//  POST /api/solicitudes/:id/cotizacion (requiere sesión y solo envía al dueño).
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
router.get( '/fechas-ocupadas',    ctrl.getFechasOcupadas);

// Asistente IA — público, con límite de consultas para no agotar la cuota de Gemini
router.post('/recomendar', limites.ia, softAuth, ctrl.recomendarConIA);

// Rutas con soft auth (funcionan con y sin login)
router.post('/sesion',             softAuth, ctrl.crearSesion);
router.put( '/sesion/:sesionId',   softAuth, ctrl.actualizarSesion);
router.get( '/sesion/:sesionId',   softAuth, ctrl.getSesion);

// ── RUTAS ADMIN CALENDARIO ───────────────────────────────────────────────────
router.get(   '/admin/calendario',     verifyToken, isAdmin, ctrl.getCalendarioAdmin);
router.post(  '/admin/calendario',     verifyToken, isAdmin, ctrl.bloquearFecha);
router.delete('/admin/calendario/:id', verifyToken, isAdmin, ctrl.desbloquearFecha);

module.exports = router;
