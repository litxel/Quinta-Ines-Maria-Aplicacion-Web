'use strict';
const router = require('express').Router();
const ctrl = require('./galeria.controller');
const { verifyToken, isAdmin } = require('../../middlewares/auth');

// ─── Rutas públicas (No requieren token) ──────────────────────────────────────
router.get('/categorias', ctrl.listarCategorias);
router.get('/paquete/:paqueteId', ctrl.imagenesDePaquete);
router.get('/', ctrl.listarImagenesPublicas);

// ─── Rutas admin (Requieren JWT y rol de administrador) ───────────────────────
router.get('/admin', verifyToken, isAdmin, ctrl.listarTodasAdmin);
router.post('/admin', verifyToken, isAdmin, ctrl.agregarImagen);
router.put('/admin/:id', verifyToken, isAdmin, ctrl.actualizarImagen);
router.delete('/admin/:id', verifyToken, isAdmin, ctrl.eliminarImagen);
router.post('/admin/categorias', verifyToken, isAdmin, ctrl.agregarCategoria);

module.exports = router;