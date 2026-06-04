'use strict';
const router = require('express').Router();
const ctrl   = require('./usuarios.controller');
const { verifyToken, isAdmin, isCliente } = require('../../middlewares/auth');

// ── ADMIN: Ver todos los clientes ──────────────────────────────────────────────
router.get('/',                  verifyToken, isAdmin,   ctrl.getClientes);
router.patch('/:id/toggle',      verifyToken, isAdmin,   ctrl.toggleActivo);

// ── CLIENTE / ADMIN: Mi perfil ────────────────────────────────────────────────
router.get('/me',                verifyToken, isCliente, ctrl.getMiPerfil);
router.put('/me',                verifyToken, isCliente, ctrl.putMiPerfil);
router.post('/me/foto',          verifyToken, isCliente, ctrl.subirFoto);
router.post('/me/cambiar-clave', verifyToken, isCliente, ctrl.cambiarPassword);

module.exports = router;
