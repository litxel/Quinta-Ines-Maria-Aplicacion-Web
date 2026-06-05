'use strict';
const pool     = require('../../config/db');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { Strategy: MicrosoftStrategy } = require('passport-microsoft');
require('dotenv').config();

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

async function findOrCreateOAuthUser({ email, nombre }) {
  if (!email) throw new Error('No se pudo obtener el correo del proveedor OAuth.');

  let { rows } = await pool.query(
    `SELECT u.*, r.rol_codigo
     FROM eqim_seguridad.usuarios u
     JOIN eqim_seguridad.roles r ON r.rol_id = u.rol_id
     WHERE u.correo = $1`,
    [email]
  );

  if (rows.length === 0) {
    const { rows: roleRows } = await pool.query(
      `SELECT rol_id FROM eqim_seguridad.roles WHERE rol_codigo = 'CLIENTE' LIMIT 1`
    );
    const rol_id = roleRows[0]?.rol_id;
    const hashTemp = await bcrypt.hash(`oauth_${Date.now()}`, 10);
    const insert = await pool.query(
      `INSERT INTO eqim_seguridad.usuarios (nombre_completo, correo, password_hash, rol_id, correo_verificado, activo)
       VALUES ($1, $2, $3, $4, true, true)
       RETURNING usuario_id`,
      [nombre, email, hashTemp, rol_id]
    );
    const { rows: newRoleRows } = await pool.query(
      `SELECT u.*, r.rol_codigo
       FROM eqim_seguridad.usuarios u
       JOIN eqim_seguridad.roles r ON r.rol_id = u.rol_id
       WHERE u.usuario_id = $1`,
      [insert.rows[0].usuario_id]
    );
    rows = newRoleRows;
  }

  const usuario = rows[0];
  if (!usuario.activo) throw new Error('Tu cuenta está bloqueada.');
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
  if (!usuario) return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);

  const token = jwt.sign(
    { id: usuario.usuario_id, rol: usuario.rol_codigo },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  const requiereTelefono = usuario.rol_codigo === 'CLIENTE' &&
    (!usuario.telefono || String(usuario.telefono).trim() === '');

  const params = new URLSearchParams({
    token,
    nombre: usuario.nombre_completo,
    correo: usuario.correo,
    rol:    usuario.rol_codigo,
  });
  if (requiereTelefono) params.set('requiere_telefono', '1');

  res.redirect(`${process.env.FRONTEND_URL}/auth/callback?${params.toString()}`);
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
