'use strict';
const router = require('express').Router();
const ctrl   = require('./auth.controller');
const { verifyToken } = require('../../middlewares/auth');
const limites = require('../../middlewares/rateLimit');

router.post('/register',               limites.auth, limites.correo, ctrl.register);
router.post('/login',                  limites.auth, ctrl.login);
router.get( '/verificar',              limites.auth, ctrl.verificarCuenta);
router.post('/reenviar-verificacion',  limites.auth, limites.correo, ctrl.reenviarVerificacion);
router.post('/recuperar-clave',        limites.auth, limites.correo, ctrl.recuperarClave);
router.post('/nueva-clave',            limites.auth, ctrl.nuevaClave);
router.get('/profile', verifyToken, ctrl.getProfile);

const passport = require('passport');
const { configurarOAuth, generarTokenYRedirigir, oauthConfigurado } = require('./oauth.controller');
configurarOAuth();

const urlFrontend = () => (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim().replace(/\/$/, '');

const oauthGuard = (proveedor) => (req, res, next) => {
  if (!oauthConfigurado(proveedor)) {
    return res.status(503).json({
      success: false,
      message: `OAuth ${proveedor} no está configurado. Usa login/registro tradicional.`,
    });
  }
  next();
};

// Si el proveedor falla (o la cuenta está desactivada) se vuelve al login con un aviso
const oauthCallback = (proveedor) => (req, res, next) =>
  passport.authenticate(proveedor, { session: false }, (err, usuario) => {
    if (err || !usuario) {
      if (err) console.warn(`[OAuth ${proveedor}]`, err.message);
      return res.redirect(`${urlFrontend()}/login?error=${proveedor}_failed`);
    }
    req.user = usuario;
    return generarTokenYRedirigir(req, res);
  })(req, res, next);

router.get('/google', limites.auth, oauthGuard('google'),
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get('/google/callback', oauthGuard('google'), oauthCallback('google'));

router.get('/microsoft', limites.auth, oauthGuard('microsoft'),
  passport.authenticate('microsoft', { session: false })
);

router.get('/microsoft/callback', oauthGuard('microsoft'), oauthCallback('microsoft'));

module.exports = router;
