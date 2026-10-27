'use strict';
const pool     = require('../../config/db');
const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');
const jwt      = require('jsonwebtoken');
const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { Strategy: MicrosoftStrategy } = require('passport-microsoft');

const BACKEND_URL = (process.env.BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');
const urlFrontend = () => (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim().replace(/\/$/, '');

const limpiarNombre = (nombre) =>
  String(nombre || 'Usuario').replace(/[<>"'`]/g, '').trim().slice(0, 150) || 'Usuario';

async function findOrCreateOAuthUser({ email, nombre }) {
  if (!email) throw new Error('No se pudo obtener el correo del proveedor OAuth.');
  const correo = String(email).trim().toLowerCase();

  let { rows } = await pool.query(
    `SELECT u.*, r.rol_codigo
     FROM eqim_seguridad.usuarios u
     JOIN eqim_seguridad.roles r ON r.rol_id = u.rol_id
     WHERE u.correo = $1`,
    [correo]
  );

  if (rows.length === 0) {
    // Contraseña aleatoria imposible de adivinar: la cuenta solo entra por OAuth
    // (o con "recuperar contraseña" si el usuario quiere una propia).
    const hashTemp = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
    const insert = await pool.query(
      `INSERT INTO eqim_seguridad.usuarios (nombre_completo, correo, password_hash, rol_id, correo_verificado, activo)
       VALUES ($1, $2, $3, (SELECT rol_id FROM eqim_seguridad.roles WHERE rol_codigo = 'CLIENTE'), true, true)
       RETURNING usuario_id`,
      [limpiarNombre(nombre), correo, hashTemp]
    );
    ({ rows } = await pool.query(
      `SELECT u.*, r.rol_codigo
       FROM eqim_seguridad.usuarios u
       JOIN eqim_seguridad.roles r ON r.rol_id = u.rol_id
       WHERE u.usuario_id = $1`,
      [insert.rows[0].usuario_id]
    ));
  } else if (!rows[0].correo_verificado) {
    // El proveedor confirmó que el correo es suyo
    await pool.query(
      'UPDATE eqim_seguridad.usuarios SET correo_verificado = true WHERE usuario_id = $1',
      [rows[0].usuario_id]
    );
  }

  const usuario = rows[0];
  if (!usuario.activo) throw new Error('Tu cuenta está desactivada.');
  await pool.query('UPDATE eqim_seguridad.usuarios SET ultimo_login = NOW() WHERE usuario_id = $1', [usuario.usuario_id]);
  return usuario;
}

const configurarOAuth = () => {
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'PENDIENTE') {
    passport.use('google', new GoogleStrategy({
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  `${BACKEND_URL}/api/auth/google/callback`,
    }, async (_accessToken, _refreshToken, profile, done) => {
      try {
        // Solo se aceptan correos que Google confirma como verificados
        if (profile._json?.email_verified === false) {
          return done(new Error('El correo de Google no está verificado.'));
        }
        const email  = profile.emails?.[0]?.value;
        const nombre = profile.displayName || profile.name?.givenName || 'Usuario';
        const usuario = await findOrCreateOAuthUser({ email, nombre });
        return done(null, usuario);
      } catch (err) {
        return done(err);
      }
    }));
    console.log('[OAuth] Google Strategy configurada.');
  } else {
    console.warn('[OAuth] GOOGLE_CLIENT_ID no configurado.');
  }

  // ⚠ Microsoft con tenant "common" permite cuentas cuyo campo "mail" no está
  // verificado: no configurarlo en producción mientras se vincule por correo.
  if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_ID !== 'PENDIENTE') {
    passport.use('microsoft', new MicrosoftStrategy({
      clientID:     process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      callbackURL:  `${BACKEND_URL}/api/auth/microsoft/callback`,
      scope:        ['user.read'],
      tenant:       process.env.MICROSOFT_TENANT || 'common',
    }, async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email  = profile.emails?.[0]?.value || profile._json?.mail || profile._json?.userPrincipalName;
        const nombre = profile.displayName || profile.name?.givenName || 'Usuario';
        const usuario = await findOrCreateOAuthUser({ email, nombre });
        return done(null, usuario);
      } catch (err) {
        return done(err);
      }
    }));
    console.log('[OAuth] Microsoft Strategy configurada.');
  } else {
    console.warn('[OAuth] MICROSOFT_CLIENT_ID no configurado.');
  }
};

const generarTokenYRedirigir = (req, res) => {
  const usuario = req.user;
  if (!usuario) return res.redirect(`${urlFrontend()}/login?error=oauth_failed`);

  const token = jwt.sign(
    { id: usuario.usuario_id, rol: usuario.rol_codigo },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  const requiereTelefono = usuario.rol_codigo === 'CLIENTE' &&
    (!usuario.telefono || String(usuario.telefono).trim() === '');

  const params = new URLSearchParams({ token });
  if (requiereTelefono) params.set('requiere_telefono', '1');

  // El token va en el fragmento (#): el navegador nunca lo envía a ningún servidor
  // ni queda en logs, a diferencia de la query (?token=).
  res.redirect(`${urlFrontend()}/auth/callback#${params.toString()}`);
};

const oauthConfigurado = (proveedor) => {
  if (proveedor === 'google') {
    return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'PENDIENTE');
  }
  if (proveedor === 'microsoft') {
    return !!(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_ID !== 'PENDIENTE');
  }
  return false;
};

module.exports = { configurarOAuth, generarTokenYRedirigir, oauthConfigurado };
