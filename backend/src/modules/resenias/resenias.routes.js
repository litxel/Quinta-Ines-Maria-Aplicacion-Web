'use strict';
const router = require('express').Router();
const ctrl = require('./resenias.controller');
const { verifyToken } = require('../../middlewares/auth');

// ─── Pública ──────────────────────────────────────────────────────────────────
router.get('/', ctrl.listar);
router.get('/google', ctrl.googleReviews);

// ─── Requiere sesión iniciada (cualquier usuario autenticado) ─────────────────
router.post('/', verifyToken, ctrl.crear);

module.exports = router;
