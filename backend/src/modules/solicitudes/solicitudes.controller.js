'use strict';
const svc       = require('./solicitudes.service');
const auditoria = require('../../utils/auditoria.service');
const email     = require('../../utils/email.service');

const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;
const HEX_RE   = /^#[0-9a-f]{6}$/i;
const ESTADOS_CON_AVISO = ['EN_REVISION', 'CONFIRMADA', 'RECHAZADA', 'COMPLETADA'];
const MAX_PDF_BYTES = 5 * 1024 * 1024;

const parseId = (valor) => {
  const id = parseInt(valor, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
};
const idOpcional = (valor) => (valor === null || valor === undefined || valor === '' ? null : parseId(valor));
const textoOpcional = (valor, max) => (typeof valor === 'string' && valor.trim() ? valor.trim().slice(0, max) : null);

// Comprueba que la cadena sea una fecha real del calendario (descarta 2026-02-31)
const esFechaValida = (f) => {
  if (typeof f !== 'string' || !FECHA_RE.test(f)) return false;
  const d = new Date(`${f}T12:00:00Z`);
  return !isNaN(d) && d.toISOString().slice(0, 10) === f;
};

// ── POST /api/solicitudes ─────────────────────────────────────────────────────
const crearSolicitud = async (req, res, next) => {
  try {
    const {
      tipo_evento_id, paquete_id, num_invitados, fecha_evento,
      telefono_contacto, mensaje_cliente,
      color_primario, color_secundario, estilo_deco_id, centro_mesa_id, extras,
    } = req.body;

    const paqueteId    = parseId(paquete_id);
    const numInvitados = parseInt(num_invitados, 10);

    if (!paqueteId)
      return res.status(400).json({ success: false, message: 'Debes elegir un paquete.' });
    if (!Number.isInteger(numInvitados) || numInvitados < 100 || numInvitados > 5000)
      return res.status(400).json({ success: false, message: 'El número de invitados debe estar entre 100 y 5000.' });
    if (!esFechaValida(fecha_evento))
      return res.status(400).json({ success: false, message: 'Debes elegir la fecha del evento en el configurador.' });

    const solicitud = await svc.crearSolicitud({
      usuarioId:        req.user.id,
      tipoEventoId:     idOpcional(tipo_evento_id),
      paqueteId,
      numInvitados,
      fechaEvento:      fecha_evento,
      mensajeCliente:   textoOpcional(mensaje_cliente, 1000),
      telefonoContacto: textoOpcional(telefono_contacto, 20),
      colorPrimario:    HEX_RE.test(color_primario ?? '')   ? color_primario   : null,
      colorSecundario:  HEX_RE.test(color_secundario ?? '') ? color_secundario : null,
      estilodecoId:     idOpcional(estilo_deco_id),
      centroMesaId:     idOpcional(centro_mesa_id),
      extras:           Array.isArray(extras) ? extras.slice(0, 50) : [],
    });

    await auditoria.registrarLogOperacion({
      schemaTabla: 'eqim_solicitudes.eqim_solicitudes',
      operacion:   'INSERT',
      usuarioId:   req.user.id,
      datosNuevos: { solicitud_id: solicitud.solicitud_id, numero: solicitud.numero_cotizacion },
      ipOrigen:    req.ip,
      userAgent:   req.headers['user-agent'],
      descripcion: `Nueva solicitud creada: ${solicitud.numero_cotizacion}`,
    });

    // El correo de confirmación (con el PDF) se envía en POST /:id/cotizacion,
    // cuando el navegador ya generó el PDF con este mismo número.
    return res.status(201).json({
      success:  true,
      message:  'Solicitud registrada correctamente.',
      data:     solicitud,
    });
  } catch (err) { next(err); }
};

// ── POST /api/solicitudes/:id/cotizacion ─────────────────────────────────────
// Envía al dueño de la solicitud (al correo registrado en la BD, nunca a uno
// enviado por el navegador) la confirmación con la cotización PDF adjunta.
const enviarCotizacion = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'ID inválido.' });

    const solicitud = await svc.obtenerSolicitudPorId(id, req.user.id, false);

    let pdfBase64 = null;
    if (req.body?.pdf_base64) {
      const crudo = String(req.body.pdf_base64);
      pdfBase64 = crudo.includes('base64,') ? crudo.split('base64,')[1] : crudo;
      const buffer = Buffer.from(pdfBase64, 'base64');
      if (buffer.length > MAX_PDF_BYTES || buffer.toString('ascii', 0, 5) !== '%PDF-') {
        return res.status(400).json({ success: false, message: 'El PDF adjunto no es válido.' });
      }
    }

    try {
      await email.enviarConfirmacionSolicitud({
        nombre:      req.user.nombre,
        correo:      req.user.correo,
        numero:      solicitud.numero_cotizacion,
        total:       parseFloat(solicitud.precio_estimado ?? 0),
        fechaEvento: solicitud.fecha_evento,
        pdfBase64,
      });
    } catch (errCorreo) {
      const causa = email.describirErrorCorreo(errCorreo);
      console.error(`[EMAIL] No se pudo enviar la cotización ${solicitud.numero_cotizacion}: ${causa}`);
      // La causa técnica solo se muestra al administrador o en desarrollo
      const verDetalle = req.user.rol === 'ADMIN' || process.env.NODE_ENV !== 'production';
      return res.status(502).json({
        success: false,
        code:    'EMAIL_NO_ENVIADO',
        message: verDetalle
          ? `No se pudo enviar el correo: ${causa}`
          : 'Tu solicitud quedó registrada, pero no pudimos enviarte el correo en este momento.',
      });
    }

    return res.json({ success: true, message: `Te enviamos la cotización a ${req.user.correo}.` });
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
    const { estado, pagina = 1, limite = 25, usuario_id, archivadas } = req.query;
    const resultado = await svc.obtenerTodasSolicitudes({
      estado,
      pagina:     parseInt(pagina,  10),
      limite:     parseInt(limite,  10),
      usuario_id: parseId(usuario_id),
      archivadas: archivadas === 'true',
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
    const id      = parseId(req.params.id);
    const esAdmin = req.user.rol === 'ADMIN';
    if (!id)
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
    const id            = parseId(req.params.id);
    const { estado } = req.body;
    const observaciones = textoOpcional(req.body.observaciones, 2000);

    if (!id)
      return res.status(400).json({ success: false, message: 'ID inválido.' });
    if (!estado || typeof estado !== 'string')
      return res.status(400).json({ success: false, message: 'El campo "estado" es requerido.' });

    const resultado = await svc.actualizarEstado(id, estado, observaciones, req.user.id);

    await auditoria.registrarLogOperacion({
      schemaTabla: 'eqim_solicitudes.eqim_solicitudes',
      operacion:   'UPDATE',
      usuarioId:   req.user.id,
      datosNuevos: { solicitud_id: id, nuevo_estado: resultado.estado_codigo },
      ipOrigen:    req.ip,
      userAgent:   req.headers['user-agent'],
      descripcion: `Admin cambió estado de solicitud ${id} a ${resultado.estado_codigo}`,
    });

    // Aviso por correo al cliente (no bloquea la respuesta)
    if (ESTADOS_CON_AVISO.includes(resultado.estado_codigo) && resultado.estado_anterior !== resultado.estado_codigo) {
      svc.obtenerSolicitudPorId(id, null, true)
        .then((s) => email.enviarCambioEstado({
          nombre:        s.cliente_nombre,
          correo:        s.cliente_correo,
          numero:        s.numero_cotizacion,
          estado:        resultado.estado_codigo,
          fechaEvento:   s.fecha_evento,
          observaciones,
        }))
        .catch((e) => console.warn('[EMAIL] Error enviando aviso de cambio de estado:', email.describirErrorCorreo(e)));
    }

    return res.json({
      success: true,
      message: `Estado actualizado a "${resultado.estado_codigo}".`,
      data:    resultado,
    });
  } catch (err) { next(err); }
};

// ── PUT /api/solicitudes/:id/cancelar ──────────────────────────────────────────
const cancelarSolicitud = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'ID inválido.' });

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

// ── PATCH /api/solicitudes/:id/archivar ──────────────────────────────────────
const archivarSolicitud = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'ID inválido.' });
    const data = await svc.archivarSolicitud(id);
    return res.json({ success: true, message: 'Solicitud archivada.', data });
  } catch (err) { next(err); }
};

// ── PATCH /api/solicitudes/:id/desarchivar ───────────────────────────────────
const desarchivarSolicitud = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'ID inválido.' });
    const data = await svc.desarchivarSolicitud(id);
    return res.json({ success: true, message: 'Solicitud desarchivada.', data });
  } catch (err) { next(err); }
};

// ── DELETE /api/solicitudes/:id/permanente ───────────────────────────────────
const eliminarPermanente = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'ID inválido.' });
    const motivo = textoOpcional(req.body?.motivo, 1000);
    if (!motivo) {
      return res.status(400).json({ success: false, message: 'El motivo de eliminación es obligatorio.' });
    }
    const data = await svc.eliminarSolicitudPermanente(id, motivo);

    await auditoria.registrarLogOperacion({
      schemaTabla: 'eqim_solicitudes.eqim_solicitudes', operacion: 'DELETE',
      usuarioId: req.user.id, datosNuevos: { solicitud_id: id, motivo },
      ipOrigen: req.ip, userAgent: req.headers['user-agent'],
      descripcion: `Admin eliminó permanentemente solicitud ${id}: ${motivo}`,
    });

    return res.json({ success: true, message: `Solicitud ${data.numero_solicitud} eliminada. Notificación enviada a ${data.correo}.`, data });
  } catch (err) { next(err); }
};

module.exports = {
  crearSolicitud, enviarCotizacion, getMisSolicitudes, getTodasSolicitudes,
  getDashboard, getSolicitud, actualizarEstado, cancelarSolicitud,
  archivarSolicitud, desarchivarSolicitud, eliminarPermanente,
};
