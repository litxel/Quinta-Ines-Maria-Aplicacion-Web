'use strict';
const svc       = require('./configurador.service');
const auditoria = require('../../utils/auditoria.service');

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

module.exports = { getDatosConfiguracion, crearSesion, actualizarSesion, getSesion, calcularPrecio };
