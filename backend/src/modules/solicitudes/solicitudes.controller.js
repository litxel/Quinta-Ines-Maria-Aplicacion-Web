'use strict';
const svc       = require('./solicitudes.service');
const auditoria = require('../../utils/auditoria.service');
const email     = require('../../utils/email.service');

// ── POST /api/solicitudes ─────────────────────────────────────────────────────
const crearSolicitud = async (req, res, next) => {
  try {
    const {
      sesion_id, numero_cotizacion, tipo_evento_id, paquete_id,
      num_invitados, precio_estimado, observaciones, telefono_contacto
    } = req.body;

    if (!paquete_id)
      return res.status(400).json({ success: false, message: 'paquete_id es requerido.' });
    if (!num_invitados || parseInt(num_invitados, 10) < 100)
      return res.status(400).json({ success: false, message: 'Mínimo 100 invitados.' });
    if (!numero_cotizacion)
      return res.status(400).json({ success: false, message: 'numero_cotizacion es requerido.' });

    const solicitud = await svc.crearSolicitud({
      usuarioId:        req.user.id,
      eqimCotizacionId: sesion_id        ?? null,
      numeroSolicitud:  numero_cotizacion,
      tipoEventoId:     tipo_evento_id   ?? null,
      paqueteId:        paquete_id,
      numInvitados:     parseInt(num_invitados, 10),
      precioEstimado:   parseFloat(precio_estimado ?? 0),
      mensajeCliente:   observaciones    ?? null,
      telefonoContacto: telefono_contacto ?? null
    });

    email.enviarConfirmacionSolicitud({
      nombre:  req.user.nombre,
      correo:  req.user.correo,
      numero:  numero_cotizacion,
      total:   parseFloat(precio_estimado ?? 0),
    }).catch((e) => console.warn('⚠ Email confirmación:', e.message));

    await auditoria.registrarLogOperacion({
      schemaTabla: 'eqim_solicitudes.eqim_solicitudes',
      operacion:   'INSERT',
      usuarioId:   req.user.id,
      datosNuevos: { solicitud_id: solicitud.solicitud_id, numero: numero_cotizacion },
      ipOrigen:    req.ip,
      userAgent:   req.headers['user-agent'],
      descripcion: `Nueva solicitud creada: ${numero_cotizacion}`,
    });

    return res.status(201).json({
      success:  true,
      message:  'Solicitud creada. Recibirás un correo de confirmación.',
      data:     solicitud,
    });
  } catch (err) { next(err); }
};

// ── GET /api/solicitudes/mis-solicitudes ──────────────────────────────────────
const getMisSolicitudes = async (req, res, next) => {
  try {
    const solicitudes = await svc.obtenerMisSolicitudes(req.user.id);
    return res.json({ success: true, data: solicitudes, total: solicitudes.length });
  } catch (err) { next(err); }
};

// ── GET /api/solicitudes ──────────────────────────────────────────────────────
const getTodasSolicitudes = async (req, res, next) => {
  try {
    const { estado, pagina = 1, limite = 25 } = req.query;
    const resultado = await svc.obtenerTodasSolicitudes({
      estado,
      pagina:  parseInt(pagina,  10),
      limite:  parseInt(limite,  10),
    });
    return res.json({ success: true, ...resultado });
  } catch (err) { next(err); }
};

// ── GET /api/solicitudes/dashboard ───────────────────────────────────────────
const getDashboard = async (req, res, next) => {
  try {
    const datos = await svc.obtenerResumenDashboard();
    return res.json({ success: true, data: datos });
  } catch (err) { next(err); }
};

// ── GET /api/solicitudes/:id ──────────────────────────────────────────────────
const getSolicitud = async (req, res, next) => {
  try {
    const id      = parseInt(req.params.id, 10);
    const esAdmin = req.user.rol === 'ADMIN';
    if (isNaN(id))
      return res.status(400).json({ success: false, message: 'ID inválido.' });

    const solicitud = await svc.obtenerSolicitudPorId(
      id,
      esAdmin ? null : req.user.id,
      esAdmin
    );
    return res.json({ success: true, data: solicitud });
  } catch (err) { next(err); }
};

// ── PUT /api/solicitudes/:id/estado ──────────────────────────────────────────
const actualizarEstado = async (req, res, next) => {
  try {
    const id            = parseInt(req.params.id, 10);
    const { estado, observaciones } = req.body;

    if (isNaN(id))
      return res.status(400).json({ success: false, message: 'ID inválido.' });
    if (!estado)
      return res.status(400).json({ success: false, message: 'El campo "estado" es requerido.' });

    const resultado = await svc.actualizarEstado(id, estado, observaciones ?? null, req.user.id);

    await auditoria.registrarLogOperacion({
      schemaTabla: 'eqim_solicitudes.eqim_solicitudes',
      operacion:   'UPDATE',
      usuarioId:   req.user.id,
      datosNuevos: { solicitud_id: id, nuevo_estado: estado },
      ipOrigen:    req.ip,
      userAgent:   req.headers['user-agent'],
      descripcion: `Admin cambió estado de solicitud ${id} a ${estado}`,
    });

    return res.json({
      success: true,
      message: `Estado actualizado a "${estado}".`,
      data:    resultado,
    });
  } catch (err) { next(err); }
};
// ── PUT /api/solicitudes/:id/cancelar ──────────────────────────────────────────
const cancelarSolicitud = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID inválido.' });

    await svc.cancelarMiSolicitud(id, req.user.id);

    await auditoria.registrarLogOperacion({
      schemaTabla: 'eqim_solicitudes.eqim_solicitudes', operacion: 'UPDATE',
      usuarioId: req.user.id, datosNuevos: { solicitud_id: id, nuevo_estado: 'CANCELADA' },
      ipOrigen: req.ip, userAgent: req.headers['user-agent'],
      descripcion: `El cliente canceló su solicitud ${id}`,
    });

    return res.json({ success: true, message: 'Solicitud cancelada exitosamente.' });
  } catch (err) { next(err); }
};

module.exports = {
  crearSolicitud, getMisSolicitudes, getTodasSolicitudes,
  getDashboard, getSolicitud, actualizarEstado, cancelarSolicitud // cada funcion exportada
};
