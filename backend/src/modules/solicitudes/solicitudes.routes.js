'use strict';
const router = require('express').Router();
const ctrl   = require('./solicitudes.controller');
const { verifyToken, isAdmin, isCliente } = require('../../middlewares/auth');

// =============================================================================
//  RUTAS DE SOLICITUDES — EventPlanner QIM
//
//  CLIENTE (verifyToken + isCliente):
//    POST /api/solicitudes                    → crear solicitud
//    GET  /api/solicitudes/mis-solicitudes    → solo las del cliente
//    GET  /api/solicitudes/:id                → detalle de UNA suya
//
//  ADMIN (verifyToken + isAdmin):
//    GET  /api/solicitudes                    → TODAS con filtros y paginación
//    GET  /api/solicitudes/dashboard          → métricas del panel
//    GET  /api/solicitudes/:id                → detalle de cualquiera
//    PUT  /api/solicitudes/:id/estado         → cambiar estado
// =============================================================================

// ── IMPORTANTE: /dashboard y /mis-solicitudes ANTES de /:id ──────────────────
// Si van después, Express interpreta "dashboard" y "mis-solicitudes" como :id.

// Dashboard — solo admin
router.get('/dashboard', verifyToken, isAdmin, ctrl.getDashboard);

// Mis solicitudes — solo cliente (o admin como cliente)
router.get('/mis-solicitudes', verifyToken, isCliente, ctrl.getMisSolicitudes);

// Todas las solicitudes — solo admin (con ?estado=PENDIENTE&pagina=1&limite=25)
router.get('/', verifyToken, isAdmin, ctrl.getTodasSolicitudes);

// Crear solicitud — cliente autenticado
router.post('/', verifyToken, isCliente, ctrl.crearSolicitud);

// Detalle de una solicitud — cliente (solo las suyas) o admin (cualquiera)
router.get('/:id', verifyToken, ctrl.getSolicitud);

// Actualizar estado — solo admin
router.put('/:id/estado', verifyToken, isAdmin, ctrl.actualizarEstado);

//cancelar solcicitud cliente
router.put('/:id/cancelar', verifyToken, ctrl.cancelarSolicitud);

module.exports = router;
