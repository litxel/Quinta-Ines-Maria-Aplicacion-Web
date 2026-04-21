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
router.get('/admin/paquetes', verifyToken, isAdmin, ctrl.listarPaquetesAdmin);
router.post('/admin/paquetes', verifyToken, isAdmin, ctrl.crearPaquete);
router.put('/admin/paquetes/:id', verifyToken, isAdmin, ctrl.actualizarPaquete);
router.delete('/admin/paquetes/:id', verifyToken, isAdmin, ctrl.desactivarPaquete);
router.post('/admin/paquetes/:id/servicios', verifyToken, isAdmin, ctrl.agregarServicio);
router.put('/admin/servicios/:servicioId', verifyToken, isAdmin, ctrl.actualizarServicio);
router.delete('/admin/servicios/:servicioId', verifyToken, isAdmin, ctrl.eliminarServicio);

module.exports = router;