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

// OAuth Google
const passport = require('passport');
const { configurarOAuth, generarTokenYRedirigir } = require('./oauth.controller');
configurarOAuth();

router.get('/google',
  (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'PENDIENTE') {
      return res.status(503).json({ success: false, message: 'OAuth Google no está configurado aún. Usa login/registro tradicional.' });
    }
    next();
  },
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_failed` }),
  generarTokenYRedirigir
);

module.exports = router;
