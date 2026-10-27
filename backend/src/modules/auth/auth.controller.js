'use strict';

const svc       = require('./auth.service');
const auditoria = require('../../utils/auditoria.service');
const { describirErrorCorreo } = require('../../utils/email.service');

const { EMAIL_RE, TEL_RE, errorPassword } = require('../../utils/validaciones');

// ── POST /api/auth/register ───────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { nombre_completo, correo, telefono, password } = req.body;

    // Validaciones de entrada
    const errores = [];
    if (typeof nombre_completo !== 'string' || nombre_completo.trim().length < 2)
      errores.push('El nombre debe tener al menos 2 caracteres.');
    if (typeof correo !== 'string' || !EMAIL_RE.test(correo))
      errores.push('El correo no tiene un formato válido.');
    if (telefono && (typeof telefono !== 'string' || !TEL_RE.test(telefono.trim())))
      errores.push('El teléfono no tiene un formato válido.');
    const errPass = errorPassword(password);
    if (errPass) errores.push(errPass);
    if (errores.length > 0)
      return res.status(400).json({ success: false, message: errores[0], errores });

    const { usuario, tokenLimpio } = await svc.registrarUsuario({ nombre_completo, correo, telefono, password }, req.ip);

    // Si el correo falla, la cuenta igual queda creada: el usuario puede pedir
    // un nuevo enlace desde el login ("Reenviar correo de verificación").
    let correoEnviado = true;
    try {
      await svc.enviarCorreoVerificacion(usuario, tokenLimpio);
    } catch (err) {
      correoEnviado = false;
      console.error('[EMAIL] No se pudo enviar el correo de verificación:', describirErrorCorreo(err));
    }

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
      message: correoEnviado
        ? 'Cuenta creada. Revisa tu correo para verificarla.'
        : 'Cuenta creada, pero no pudimos enviarte el correo de verificación. Puedes pedir uno nuevo desde el inicio de sesión.',
      data:    { correo: usuario.correo, nombre_completo: usuario.nombre_completo, correo_enviado: correoEnviado },
    });
  } catch (err) { next(err); }
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { correo, password } = req.body;
    if (typeof correo !== 'string' || typeof password !== 'string' || !correo || !password)
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
  res.json({ success: true, data: req.user });

// ── GET /api/auth/verificar?token=xxx ────────────────────────────────────────
const verificarCuenta = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (typeof token !== 'string' || !token)
      return res.status(400).json({ success: false, message: 'Token requerido.' });

    const r = await svc.verificarCuenta(token);
    return res.json({ success: true, message: `Cuenta de ${r.nombre_completo} verificada.`, data: r });
  } catch (err) { next(err); }
};

// ── POST /api/auth/reenviar-verificacion ─────────────────────────────────────
const reenviarVerificacion = async (req, res, next) => {
  try {
    const { correo } = req.body;
    if (typeof correo !== 'string' || !EMAIL_RE.test(correo))
      return res.status(400).json({ success: false, message: 'Ingresa un correo válido.' });

    await svc.reenviarVerificacion(correo, req.ip);

    // Siempre la misma respuesta: no revelar si el correo existe (OWASP)
    return res.json({
      success: true,
      message: 'Si tu cuenta existe y aún no está verificada, recibirás un nuevo enlace en unos minutos.',
    });
  } catch (err) { next(err); }
};

// ── POST /api/auth/recuperar-clave ────────────────────────────────────────────
const recuperarClave = async (req, res, next) => {
  try {
    const { correo } = req.body;
    if (typeof correo !== 'string' || !correo)
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
    if (typeof token !== 'string' || !token || !password)
      return res.status(400).json({ success: false, message: 'Token y nueva contraseña requeridos.' });
    const errPass = errorPassword(password);
    if (errPass)
      return res.status(400).json({ success: false, message: errPass });

    await svc.restablecerPassword(token, password);
    return res.json({ success: true, message: 'Contraseña restablecida. Ya puedes iniciar sesión.' });
  } catch (err) { next(err); }
};

module.exports = {
  register, login, getProfile, verificarCuenta, reenviarVerificacion, recuperarClave, nuevaClave,
};
