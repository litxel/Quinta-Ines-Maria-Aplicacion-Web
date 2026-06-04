'use strict';
const pool    = require('../../config/db');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
require('dotenv').config();

// ── Configurar Passport con Google ──────────────────────────────────────────
const configurarOAuth = () => {
  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'PENDIENTE') {
    console.warn('[OAuth] GOOGLE_CLIENT_ID no configurado — botones OAuth estarán en modo demo.');
    return;
  }

  passport.use(new GoogleStrategy({
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`,
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email  = profile.emails?.[0]?.value;
      const nombre = profile.displayName;
      const foto   = profile.photos?.[0]?.value;

      if (!email) return done(new Error('No se pudo obtener el correo de Google.'));

      // Buscar usuario existente
      let { rows } = await pool.query(
        `SELECT u.*, r.rol_codigo FROM eqim_seguridad.usuarios u JOIN eqim_seguridad.roles r ON r.rol_id = u.rol_id WHERE u.correo = $1`,
        [email]
      );

      if (rows.length === 0) {
        // Crear nuevo usuario OAuth
        const { rows: roleRows } = await pool.query(`SELECT rol_id FROM eqim_seguridad.roles WHERE rol_codigo = 'CLIENTE' LIMIT 1`);
        const rol_id = roleRows[0]?.rol_id;
        const hashTemp = await bcrypt.hash(`oauth_${Date.now()}`, 10);
        const insert = await pool.query(
          `INSERT INTO eqim_seguridad.usuarios (nombre_completo, correo, password_hash, rol_id, correo_verificado, activo)
           VALUES ($1, $2, $3, $4, true, true) RETURNING *`,
          [nombre, email, hashTemp, rol_id]
        );
        const { rows: newRoleRows } = await pool.query(
          `SELECT u.*, r.rol_codigo FROM eqim_seguridad.usuarios u JOIN eqim_seguridad.roles r ON r.rol_id = u.rol_id WHERE u.usuario_id = $1`,
          [insert.rows[0].usuario_id]
        );
        rows = newRoleRows;
      }

      const usuario = rows[0];
      if (!usuario.activo) return done(new Error('Tu cuenta está bloqueada.'));

      return done(null, usuario);
    } catch (err) {
      return done(err);
    }
  }));

  console.log('[OAuth] Google Strategy configurada correctamente.');
};

// ── Generar JWT tras OAuth exitoso ───────────────────────────────────────────
const generarTokenYRedirigir = (req, res) => {
  const usuario = req.user;
  if (!usuario) return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);

  const token = jwt.sign(
    { id: usuario.usuario_id, rol: usuario.rol_codigo },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  // Redirigir al frontend con el token en query param
  const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${token}&nombre=${encodeURIComponent(usuario.nombre_completo)}&correo=${encodeURIComponent(usuario.correo)}&rol=${usuario.rol_codigo}`;
  res.redirect(redirectUrl);
};

module.exports = { configurarOAuth, generarTokenYRedirigir };
