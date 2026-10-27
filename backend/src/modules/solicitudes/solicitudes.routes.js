'use strict';
const router  = require('express').Router();
const ctrl    = require('./solicitudes.controller');
const limites = require('../../middlewares/rateLimit');
const { verifyToken, isAdmin, isCliente } = require('../../middlewares/auth');

// =============================================================================
//  RUTAS DE SOLICITUDES — EventPlanner QIM
//
//  CLIENTE (verifyToken + isCliente):
//    POST /api/solicitudes                    → crear solicitud
//    POST /api/solicitudes/:id/cotizacion     → enviar su cotización PDF a su correo
//    GET  /api/solicitudes/mis-solicitudes    → solo las del cliente
//    GET  /api/solicitudes/:id                → detalle de UNA suya
//    PUT  /api/solicitudes/:id/cancelar       → cancelar una suya (si está pendiente)
//
//  ADMIN (verifyToken + isAdmin):
//    GET  /api/solicitudes                    → TODAS con filtros y paginación
//    GET  /api/solicitudes/dashboard          → métricas del panel
//    GET  /api/solicitudes/:id                → detalle de cualquiera
//    PUT  /api/solicitudes/:id/estado         → cambiar estado (avisa al cliente por correo)
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
router.post('/', limites.solicitud, verifyToken, isCliente, ctrl.crearSolicitud);

// Enviar la cotización PDF de una solicitud propia a su correo
router.post('/:id/cotizacion', limites.correo, verifyToken, isCliente, ctrl.enviarCotizacion);

// Detalle de una solicitud — cliente (solo las suyas) o admin (cualquiera)
router.get('/:id', verifyToken, ctrl.getSolicitud);

// Actualizar estado — solo admin
router.put('/:id/estado', verifyToken, isAdmin, ctrl.actualizarEstado);

// Archivar solicitud — solo admin
router.patch('/:id/archivar',     verifyToken, isAdmin, ctrl.archivarSolicitud);

// Desarchivar solicitud — solo admin
router.patch('/:id/desarchivar',  verifyToken, isAdmin, ctrl.desarchivarSolicitud);

// Eliminar permanentemente — solo admin (requiere motivo en body)
router.delete('/:id/permanente',  verifyToken, isAdmin, ctrl.eliminarPermanente);

// Cancelar solicitud — el propio cliente
router.put('/:id/cancelar', verifyToken, isCliente, ctrl.cancelarSolicitud);

module.exports = router;
