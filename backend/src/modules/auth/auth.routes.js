'use strict';
const router = require('express').Router();
const ctrl   = require('./auth.controller');
const { verifyToken } = require('../../middlewares/auth');

router.post('/register',        ctrl.register);
router.post('/login',           ctrl.login);
router.get( '/verificar',       ctrl.verificarCuenta);
router.post('/recuperar-clave', ctrl.recuperarClave);
router.post('/nueva-clave',     ctrl.nuevaClave);
router.get('/profile', verifyToken, ctrl.getProfile);

const passport = require('passport');
const { configurarOAuth, generarTokenYRedirigir, oauthConfigurado } = require('./oauth.controller');
configurarOAuth();

const oauthGuard = (proveedor) => (req, res, next) => {
  if (!oauthConfigurado(proveedor)) {
    return res.status(503).json({
      success: false,
      message: `OAuth ${proveedor} no está configurado. Usa login/registro tradicional.`,
    });
  }
  next();
};

router.get('/google', oauthGuard('google'),
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get('/google/callback',
  oauthGuard('google'),
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_failed` }),
  generarTokenYRedirigir
);

router.get('/microsoft', oauthGuard('microsoft'),
  passport.authenticate('microsoft', { session: false })
);

router.get('/microsoft/callback',
  oauthGuard('microsoft'),
  passport.authenticate('microsoft', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=microsoft_failed` }),
  generarTokenYRedirigir
);

module.exports = router;
