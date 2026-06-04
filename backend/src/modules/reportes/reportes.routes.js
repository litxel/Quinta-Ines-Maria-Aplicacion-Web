'use strict';
const router = require('express').Router();
const ctrl   = require('./reportes.controller');
const { verifyToken, isAdmin } = require('../../middlewares/auth');

router.get('/resumen',          verifyToken, isAdmin, ctrl.getResumen);
router.get('/ingresos',         verifyToken, isAdmin, ctrl.getIngresos);
router.get('/paquetes',         verifyToken, isAdmin, ctrl.getPaquetes);
router.get('/tipos-evento',     verifyToken, isAdmin, ctrl.getTiposEvento);
router.get('/tasa-conversion',  verifyToken, isAdmin, ctrl.getTasa);
router.get('/proximos-eventos', verifyToken, isAdmin, ctrl.getProximos);

module.exports = router;
