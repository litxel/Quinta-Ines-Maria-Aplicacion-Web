'use strict';

const svc       = require('./auth.service');
const auditoria = require('../../utils/auditoria.service');
const emailSvc = require('../../utils/email.service');

// ── POST /api/auth/register ───────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    // 🚀 NUEVO: Extraemos el teléfono del body
    const { nombre_completo, correo, telefono, password } = req.body;

    // Validaciones de entrada
    const errores = [];
    if (!nombre_completo || nombre_completo.trim().length < 2)
      errores.push('El nombre debe tener al menos 2 caracteres.');
    if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo))
      errores.push('El correo no tiene un formato válido.');
    if (!password || password.length < 8)
      errores.push('La contraseña debe tener mínimo 8 caracteres.');
    if (password && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password))
      errores.push('La contraseña debe tener al menos una mayúscula, una minúscula y un número.');
    if (errores.length > 0)
      return res.status(400).json({ success: false, errores });

    // 1. Registra al usuario y obtiene el token limpio (AGREGAMOS TELÉFONO)
    const { usuario, tokenLimpio } = await svc.registrarUsuario({ nombre_completo, correo, telefono, password }, req.ip);
    
    // Usamos FRONTEND_URL de tu .env, o el localhost por defecto
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const enlaceVerificacion = `${baseUrl}/verificar-cuenta?token=${tokenLimpio}`;

    await emailSvc.enviarVerificacionCorreo({
      nombre: usuario.nombre_completo,
      correo: usuario.correo,
      enlace: enlaceVerificacion
    });

    await auditoria.registrarLogOperacion({
      schemaTabla: 'eqim_seguridad.usuarios',
      operacion:   'INSERT',
      usuarioId:   usuario.usuario_id,
      datosNuevos: { correo: usuario.correo, nombre: usuario.nombre_completo },
      ipOrigen:    req.ip,
      userAgent:   req.headers['user-agent'],
      descripcion: 'Registro de nuevo usuario cliente',
    });

    return res.status(201).json({
      success: true,
      message: 'Cuenta creada. Revisa tu correo para verificarla.',
      data:    { correo: usuario.correo, nombre_completo: usuario.nombre_completo },
    });
  } catch (err) { next(err); }
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { correo, password } = req.body;
    if (!correo || !password)
      return res.status(400).json({ success: false, message: 'Correo y contraseña requeridos.' });

    const resultado = await svc.loginUsuario({ correo, password });

    await auditoria.registrarLogAutenticacion({
      correo:   svc.sanitizar(correo).toLowerCase(),
      exitoso:  true,
      ipOrigen: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, message: 'Inicio de sesión exitoso.', ...resultado });
  } catch (err) {
    await auditoria.registrarLogAutenticacion({
      correo:      svc.sanitizar(req.body?.correo ?? '').toLowerCase(),
      exitoso:     false,
      ipOrigen:    req.ip,
      userAgent:   req.headers['user-agent'],
      motivoFallo: err.message,
    }).catch(() => {});
    next(err);
  }
};

// ── GET /api/auth/profile ─────────────────────────────────────────────────────
const getProfile = (req, res) =>
  res.json({ success: true, data: req.user }); // req.user.id desde JWT

// ── GET /api/auth/verificar?token=xxx ────────────────────────────────────────
const verificarCuenta = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token)
      return res.status(400).json({ success: false, message: 'Token requerido.' });

    const r = await svc.verificarCuenta(token);
    return res.json({ success: true, message: `Cuenta de ${r.nombre_completo} verificada.`, data: r });
  } catch (err) { next(err); }
};

// ── POST /api/auth/recuperar-clave ────────────────────────────────────────────
const recuperarClave = async (req, res, next) => {
  try {
    const { correo } = req.body;
    if (!correo)
      return res.status(400).json({ success: false, message: 'Correo requerido.' });

    await svc.solicitarResetPassword(correo, req.ip);

    // Siempre 200 — no revelar si el correo existe (OWASP)
    return res.json({ success: true, message: 'Si el correo está registrado, recibirás un enlace en breve.' });
  } catch (err) { next(err); }
};

// ── POST /api/auth/nueva-clave ────────────────────────────────────────────────
const nuevaClave = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password)
      return res.status(400).json({ success: false, message: 'Token y nueva contraseña requeridos.' });
    if (password.length < 8)
      return res.status(400).json({ success: false, message: 'Mínimo 8 caracteres.' });
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password))
      return res.status(400).json({ success: false, message: 'Debe tener mayúscula, minúscula y número.' });

    await svc.restablecerPassword(token, password);
    return res.json({ success: true, message: 'Contraseña restablecida. Ya puedes iniciar sesión.' });
  } catch (err) { next(err); }
};

module.exports = { register, login, getProfile, verificarCuenta, recuperarClave, nuevaClave };