'use strict';
const router = require('express').Router();
const ctrl = require('./catalogo.controller');
const { verifyToken, isAdmin } = require('../../middlewares/auth');

// ─── Rutas públicas (No requieren token) ──────────────────────────────────────
router.get('/paquetes', ctrl.listarPaquetesPublicos);
router.get('/paquetes/:codigo/precio', ctrl.calcularPrecioPaquete);
router.get('/paquetes/:codigo', ctrl.detallePaquete);
router.get('/paquetes/:id/servicios', ctrl.listarServiciosDePaquete);

// ─── Rutas admin (Requieren JWT y rol de administrador) ───────────────────────

// 1. Paquetes y sus servicios incluidos
router.get('/admin/paquetes', verifyToken, isAdmin, ctrl.listarPaquetesAdmin);
router.post('/admin/paquetes', verifyToken, isAdmin, ctrl.crearPaquete);
router.put('/admin/paquetes/:id', verifyToken, isAdmin, ctrl.actualizarPaquete);
router.delete('/admin/paquetes/:id', verifyToken, isAdmin, ctrl.desactivarPaquete);

router.post('/admin/paquetes/:id/servicios', verifyToken, isAdmin, ctrl.agregarServicio);
router.put('/admin/servicios/:servicioId', verifyToken, isAdmin, ctrl.actualizarServicio);
router.delete('/admin/servicios/:servicioId', verifyToken, isAdmin, ctrl.eliminarServicio);
router.put('/admin/paquetes/:id/servicios/:servicioId', verifyToken, isAdmin, ctrl.actualizarServicio);
router.delete('/admin/paquetes/:id/servicios/:servicioId', verifyToken, isAdmin, ctrl.eliminarServicio);

// 2. Tipos de Evento (Paso 1 - Configurador)
router.get('/admin/tipos-evento', verifyToken, isAdmin, ctrl.listarTiposEvento);
router.post('/admin/tipos-evento', verifyToken, isAdmin, ctrl.crearTipoEvento);
router.put('/admin/tipos-evento/:id', verifyToken, isAdmin, ctrl.actualizarTipoEvento);
router.delete('/admin/tipos-evento/:id', verifyToken, isAdmin, ctrl.desactivarTipoEvento);

// 3. Estilos de Decoración (Paso 6 - Configurador)
router.get('/admin/estilos', verifyToken, isAdmin, ctrl.listarEstilos);
router.post('/admin/estilos', verifyToken, isAdmin, ctrl.crearEstilo);
router.put('/admin/estilos/:id', verifyToken, isAdmin, ctrl.actualizarEstilo);
router.delete('/admin/estilos/:id', verifyToken, isAdmin, ctrl.desactivarEstilo);

// 4. Centros de Mesa (Paso 6 - Configurador)
router.get('/admin/centros-mesa', verifyToken, isAdmin, ctrl.listarCentrosMesa);
router.post('/admin/centros-mesa', verifyToken, isAdmin, ctrl.crearCentroMesa);
router.put('/admin/centros-mesa/:id', verifyToken, isAdmin, ctrl.actualizarCentroMesa);
router.delete('/admin/centros-mesa/:id', verifyToken, isAdmin, ctrl.desactivarCentroMesa);

// 5. Servicios Adicionales / Extras (Paso 7 - Configurador)
router.get('/admin/extras', verifyToken, isAdmin, ctrl.listarExtras);
router.post('/admin/extras', verifyToken, isAdmin, ctrl.crearExtra);
router.put('/admin/extras/:id', verifyToken, isAdmin, ctrl.actualizarExtra);
router.delete('/admin/extras/:id', verifyToken, isAdmin, ctrl.desactivarExtra);

module.exports = router;