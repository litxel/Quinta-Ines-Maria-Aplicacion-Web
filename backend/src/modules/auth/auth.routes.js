'use strict';
const router = require('express').Router();
const ctrl   = require('./auth.controller');
const { verifyToken } = require('../../middlewares/auth');

// Públicas
router.post('/register',        ctrl.register);
router.post('/login',           ctrl.login);
router.get( '/verificar',       ctrl.verificarCuenta);   // ?token=xxx
router.post('/recuperar-clave', ctrl.recuperarClave);
router.post('/nueva-clave',     ctrl.nuevaClave);

// Protegidas
router.get('/profile', verifyToken, ctrl.getProfile);

module.exports = router;
