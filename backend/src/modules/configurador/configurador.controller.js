'use strict';
const svc       = require('./configurador.service');
const auditoria = require('../../utils/auditoria.service');
const emailSvc = require('../../utils/email.service');
const { consultarAsistente } = require('../../utils/gemini');
console.log('🔍 Clave Gemini detectada:', process.env.GEMINI_API_KEY ? 'SÍ (oculta)' : 'NO');
// =============================================================================
//  CONTROLADOR DEL CONFIGURADOR — EventPlanner QIM
//  Middleware de auth en: src/middlewares/auth.js → { verifyToken, isAdmin }
//  JWT guarda el ID del usuario en: req.user.id  (NO req.user.usuario_id)
// =============================================================================


/**
 * GET /api/configurador/datos
 * Devuelve todos los catálogos necesarios para el configurador en una sola llamada:
 * tipos_evento, estilos_decoracion, centros_mesa, servicios_adicionales.
 * Ruta pública — no requiere token.
 */
const getDatosConfiguracion = async (req, res, next) => {
  try {
    const datos = await svc.obtenerDatosConfiguracion();
    return res.json({ success: true, data: datos });
  } catch (err) {
    next(err);
  }
};


/**
 * POST /api/configurador/sesion
 * Crea una nueva sesión del configurador.
 * No requiere autenticación (usuarios anónimos pueden configurar).
 *
 * Body esperado:
 * {
 *   tipo_evento_id,  paquete_id,   num_invitados,
 *   color_primario,  color_secundario,
 *   estilo_deco_id,  centro_mesa_id,
 *   num_mesas,       num_meseros,
 *   paso_actual,     completada,
 *   precio_estimado,
 *   servicios: [{ adicional_id, cantidad, precio_snapshot }]
 * }
 */
const crearSesion = async (req, res, next) => {
  try {
    const { num_invitados = 100 } = req.body;

    // Validación protectora (ISO 25010: protección frente a errores)
    if (parseInt(num_invitados, 10) < 100) {
      return res.status(400).json({
        success: false,
        message: 'El número mínimo de invitados es 100 personas.',
      });
    }

    const sesion = await svc.guardarSesion({
      usuarioId: req.user?.id ?? null,   // req.user.id — puede ser null si es anónimo
      datos:     req.body,
      ipOrigen:  req.ip,
      userAgent: req.headers['user-agent'],
    });

    await auditoria.registrarLogOperacion({
      schemaTabla: 'eqim_configurador.sesiones',
      operacion:   'INSERT',
      usuarioId:   req.user?.id ?? null,
      datosNuevos: { sesion_id: sesion.sesion_id, paquete_id: sesion.paquete_id },
      ipOrigen:    req.ip,
      userAgent:   req.headers['user-agent'],
      descripcion: `Sesión configurador creada, paso ${sesion.paso_actual}`,
    });

    return res.status(201).json({
      success:  true,
      message:  'Sesión creada.',
      data:     sesion,
    });
  } catch (err) {
    next(err);
  }
};


/**
 * PUT /api/configurador/sesion/:sesionId
 * Actualiza una sesión existente (avanzar pasos, cambiar opciones).
 */
const actualizarSesion = async (req, res, next) => {
  try {
    const sesionId     = parseInt(req.params.sesionId, 10);
    const { num_invitados = 100 } = req.body;

    if (isNaN(sesionId)) {
      return res.status(400).json({ success: false, message: 'ID de sesión inválido.' });
    }
    if (parseInt(num_invitados, 10) < 100) {
      return res.status(400).json({
        success: false,
        message: 'El número mínimo de invitados es 100 personas.',
      });
    }

    const sesion = await svc.guardarSesion({
      usuarioId: req.user?.id ?? null,
      datos:     req.body,
      ipOrigen:  req.ip,
      userAgent: req.headers['user-agent'],
      sesionId,
    });

    await auditoria.registrarLogOperacion({
      schemaTabla: 'eqim_configurador.sesiones',
      operacion:   'UPDATE',
      usuarioId:   req.user?.id ?? null,
      datosNuevos: { sesion_id: sesion.sesion_id, paso_actual: sesion.paso_actual },
      ipOrigen:    req.ip,
      userAgent:   req.headers['user-agent'],
      descripcion: `Sesión ${sesionId} actualizada, paso ${sesion.paso_actual}`,
    });

    return res.json({ success: true, message: 'Sesión actualizada.', data: sesion });
  } catch (err) {
    next(err);
  }
};


/**
 * GET /api/configurador/sesion/:sesionId
 * Recupera una sesión con todos sus servicios asociados.
 */
const getSesion = async (req, res, next) => {
  try {
    const sesionId = parseInt(req.params.sesionId, 10);
    if (isNaN(sesionId)) {
      return res.status(400).json({ success: false, message: 'ID de sesión inválido.' });
    }

    const sesion = await svc.obtenerSesion(sesionId);
    return res.json({ success: true, data: sesion });
  } catch (err) {
    next(err);
  }
};


/**
 * POST /api/configurador/calcular-precio
 * Calcula el precio total en el servidor (fuente de verdad).
 * El frontend lo llama en el paso 7 antes de enviar la solicitud.
 *
 * Body: { paquete_id, num_invitados, centro_mesa_id, servicios[] }
 */
const calcularPrecio = async (req, res, next) => {
  try {
    const { paquete_id, num_invitados, centro_mesa_id, servicios = [] } = req.body;

    if (!paquete_id) {
      return res.status(400).json({ success: false, message: 'paquete_id es requerido.' });
    }
    if (!num_invitados || parseInt(num_invitados, 10) < 100) {
      return res.status(400).json({
        success: false,
        message: 'num_invitados es requerido y debe ser mínimo 100.',
      });
    }

    const resultado = await svc.calcularPrecioTotal({
      paqueteId:   paquete_id,
      numInvitados: parseInt(num_invitados, 10),
      centrMesaId:  centro_mesa_id ?? null,
      servicios,
    });

    return res.json({ success: true, data: resultado });
  } catch (err) {
    next(err);
  }
};
/**
 * POST /api/configurador/enviar-solicitud
 * Recibe los datos finales y el PDF en base64 para enviarlo por correo.
 */
const enviarSolicitudFinal = async (req, res, next) => {
  try {
    const { correo_cliente, nombre_cliente, total_estimado, pdf_base64 } = req.body;

    if (!correo_cliente || !pdf_base64) {
      return res.status(400).json({ success: false, message: 'Faltan datos o el PDF para enviar el correo.' });
    }

    // Generamos un número de cotización oficial
    const numeroCotizacion = `QIM-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    // Enviamos el correo con el PDF adjunto
    await emailSvc.enviarConfirmacionSolicitud({
      nombre: nombre_cliente,
      correo: correo_cliente,
      numero: numeroCotizacion,
      total: total_estimado || 0,
      pdfBase64: pdf_base64
    });

    return res.json({ 
      success: true, 
      message: '¡Solicitud y cotización PDF enviadas exitosamente a tu correo!' 
    });
  } catch (err) {
    next(err);
  }
};

// ── Sprint 4-IA — NUEVO endpoint /recomendar ──────────────────────────────────
/**
 * POST /api/configurador/recomendar
 * Body:
 * {
 *   mensaje:   string,   // consulta del usuario en lenguaje natural
 *   historial: Array     // (opcional) turnos previos para conversación multi-turno
 *                        // [{ role: 'user'|'model', parts: [{ text: '' }] }]
 * }
 *
 * Respuesta siempre exitosa (fallback controlado):
 * {
 *   success:   true,
 *   data: {
 *     respuesta: string,    // texto de Gemini o mensaje de fallback
 *     exito:     boolean,   // true = Gemini respondió / false = fallback
 *     fallback:  boolean,
 *   }
 * }
 *

 * No modifica sesiones ni escribe en la BD. Solo lectura + IA.
 */
const recomendarConIA = async (req, res, next) => {
  try {
    const { mensaje, historial = [] } = req.body;

    // Validaciones básicas de entrada
    if (!mensaje || typeof mensaje !== 'string' || mensaje.trim().length === 0)
      return res.status(400).json({
        success: false,
        message: 'El campo "mensaje" es requerido y no puede estar vacío.',
      });

    if (mensaje.trim().length > 500)
      return res.status(400).json({
        success: false,
        message: 'El mensaje no puede superar los 500 caracteres.',
      });

    // Validar formato del historial (si se envía)
    if (!Array.isArray(historial))
      return res.status(400).json({ success: false, message: '"historial" debe ser un array.' });

    // ── Consultar a Gemini (con fallback incorporado — nunca rompe) ──────────
    const resultado = await consultarAsistente(mensaje.trim(), historial);

    // Registrar consulta en auditoría (sin datos personales del mensaje)
    await auditoria.registrarLogOperacion({
      schemaTabla: 'eqim_configurador.sesiones',
      operacion:   'SELECT',
      usuarioId:   req.user?.id ?? null,
      datosNuevos: { tipo: 'consulta_ia', exito: resultado.exito, fallback: resultado.fallback },
      ipOrigen:    req.ip,
      userAgent:   req.headers['user-agent'],
      descripcion: `Consulta asistente IA — ${resultado.exito ? 'Gemini OK' : 'fallback activado'}`,
      exitoso:     true,   // la operación del sistema fue exitosa aunque Gemini falle
    }).catch(() => {});    // no bloquear si la auditoría falla

    // Siempre responder 200 — el fallback ya maneja el caso de error de Gemini
    return res.json({
      success: true,
      data:    resultado,
    });

  } catch (err) {
    // Este catch es para errores del propio controlador (no de Gemini)
    // Gemini ya tiene su propio try/catch en gemini.js
    next(err);
  }
};

/**
 * GET /api/configurador/fechas-ocupadas
 * Devuelve un array con las fechas bloqueadas.
 */
const getFechasOcupadas = async (req, res, next) => {
  try {
    const fechas = await svc.obtenerFechasOcupadas();
    return res.json({ success: true, data: fechas });
  } catch (err) {
    next(err);
  }
};
/**
 * GET /api/configurador/admin/calendario
 */
const getCalendarioAdmin = async (req, res, next) => {
  try {
    const data = await svc.obtenerCalendarioAdmin();
    return res.json({ success: true, data });
  } catch (err) { next(err); }
};

/**
 * POST /api/configurador/admin/calendario
 */
const bloquearFecha = async (req, res, next) => {
  try {
    const { fecha, nota_interna } = req.body;
    if (!fecha) return res.status(400).json({ success: false, message: 'La fecha es obligatoria.' });
    
    // Fallback seguro para obtener el ID del administrador
    const adminId = req.user?.id || req.user?.usuario_id || null;

    const data = await svc.bloquearFechaManual(fecha, nota_interna || 'Bloqueado por administrador', adminId);
    
    // Envolvemos la auditoría en un try/catch propio para que no bloquee el guardado si falla
    try {
      if (adminId) {
        await auditoria.registrarLogOperacion({
          schemaTabla: 'eqim_solicitudes.disponibilidad', operacion: 'INSERT',
          usuarioId: adminId, datosNuevos: data, ipOrigen: req.ip,
          userAgent: req.headers['user-agent'], descripcion: `Fecha bloqueada: ${fecha}`
        });
      }
    } catch (auditoriaErr) {
      console.warn('⚠️ La auditoría falló, pero la fecha SÍ se bloqueó:', auditoriaErr.message);
    }

    return res.json({ success: true, message: 'Fecha bloqueada exitosamente.', data });
  } catch (err) { 
    console.error('❌ Error en bloquearFecha:', err.message);
    return res.status(500).json({ success: false, message: 'Error BD: ' + err.message });
  }
};

/**
 * DELETE /api/configurador/admin/calendario/:id
 */
const desbloquearFecha = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    await svc.desbloquearFechaManual(id);
    return res.json({ success: true, message: 'Fecha desbloqueada exitosamente.' });
  } catch (err) { 
    return res.status(500).json({ success: false, message: 'Error BD: ' + err.message });
  }
};

module.exports = { 
  getDatosConfiguracion, crearSesion, actualizarSesion, getSesion, calcularPrecio, 
  enviarSolicitudFinal, recomendarConIA, getFechasOcupadas,
  getCalendarioAdmin, bloquearFecha, desbloquearFecha // 🚀 Agregados
};