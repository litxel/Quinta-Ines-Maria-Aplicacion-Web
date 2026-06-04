'use strict';
const pool = require('../../config/db');

const ESTADOS_VALIDOS = ['PENDIENTE', 'EN_REVISION', 'CONFIRMADA', 'RECHAZADA', 'CANCELADA', 'COMPLETADA'];
const FLUJO_NORMAL = ['PENDIENTE', 'EN_REVISION', 'CONFIRMADA', 'COMPLETADA'];

// ─────────────────────────────────────────────────────────────────────────────
const crearSolicitud = async ({
  usuarioId, eqimCotizacionId, numeroSolicitud, tipoEventoId, paqueteId,
  numInvitados, precioEstimado, mensajeCliente, telefonoContacto,
  colorPrimario, colorSecundario, estilodecoId, centroMesaId, extras
}) => {
  const existe = await pool.query(
    'SELECT solicitud_id FROM eqim_solicitudes.eqim_solicitudes WHERE numero_solicitud = $1',
    [numeroSolicitud]
  );
  if (existe.rows.length > 0) {
    const err = new Error(`La cotización ${numeroSolicitud} ya fue registrada.`);
    err.statusCode = 409; throw err;
  }

  const { rows } = await pool.query(
    `INSERT INTO eqim_solicitudes.eqim_solicitudes
       (usuario_id, eqim_cotizacion_id, numero_solicitud, tipo_evento_id, paquete_id,
        num_invitados, telefono_contacto, precio_estimado, estado_id, mensaje_cliente, fecha_evento,
        color_primario, color_secundario, estilo_deco_id, centro_mesa_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,
       (SELECT estado_id FROM eqim_solicitudes.estados WHERE codigo='PENDIENTE'),
       $9, CURRENT_DATE,
       $10, $11, $12, $13)
     RETURNING solicitud_id, numero_solicitud AS numero_cotizacion`,
    [
      usuarioId,
      eqimCotizacionId,
      numeroSolicitud,
      tipoEventoId,
      paqueteId,
      numInvitados,
      telefonoContacto || 'No especificado',
      precioEstimado,
      mensajeCliente,
      colorPrimario    || null,
      colorSecundario  || null,
      estilodecoId     || null,
      centroMesaId     || null,
    ]
  );

  const solicitud = rows[0];

  // Guardar extras seleccionados por el cliente
  if (Array.isArray(extras) && extras.length > 0) {
    for (const ext of extras) {
      if (!ext.nombre || ext.cantidad < 1) continue;
      await pool.query(
        `INSERT INTO eqim_solicitudes.solicitud_extras
           (solicitud_id, adicional_id, nombre_snapshot, cantidad, precio_snapshot)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          solicitud.solicitud_id,
          ext.adicional_id || null,
          ext.nombre,
          ext.cantidad,
          parseFloat(ext.precio_snapshot || 0),
        ]
      );
    }
  }

  return solicitud;
};


// ─────────────────────────────────────────────────────────────────────────────
const obtenerMisSolicitudes = async (usuarioId) => {
  const { rows } = await pool.query(
    `SELECT
       s.solicitud_id,
       s.numero_solicitud AS numero_cotizacion,
       s.num_invitados,
       s.precio_estimado,
       COALESCE(s.comentario_admin, s.mensaje_cliente) AS observaciones,
       s.creado_en,
       s.actualizado_en,
       e.codigo AS estado_codigo,
       e.nombre AS estado_nombre,
       e.color_hex AS estado_color,
       te.tipo_nombre,
       p.paquete_nombre
     FROM eqim_solicitudes.eqim_solicitudes s
     JOIN eqim_solicitudes.estados e          ON e.estado_id  = s.estado_id
     LEFT JOIN eqim_catalogo.tipos_evento te  ON te.tipo_id   = s.tipo_evento_id
     LEFT JOIN eqim_catalogo.paquetes p       ON p.paquete_id = s.paquete_id
     WHERE s.usuario_id = $1
     ORDER BY s.creado_en DESC`,
    [usuarioId]
  );
  return rows;
};

// ─────────────────────────────────────────────────────────────────────────────
const obtenerTodasSolicitudes = async ({ estado = null, pagina = 1, limite = 25, archivadas = false } = {}) => {
  const offset = (pagina - 1) * limite;
  const condiciones = estado && ESTADOS_VALIDOS.includes(estado.toUpperCase())
    ? `AND e.codigo = '${estado.toUpperCase()}'` : '';
  const condArchivado = archivadas ? `AND s.archivado = true` : `AND s.archivado = false`;

  const { rows } = await pool.query(
    `SELECT
       s.solicitud_id,
       s.numero_solicitud AS numero_cotizacion,
       s.num_invitados,
       s.precio_estimado,
       s.creado_en,
       s.archivado,
       e.codigo AS estado_codigo,
       e.nombre AS estado_nombre,
       e.color_hex AS estado_color,
       u.nombre_completo AS cliente_nombre,
       u.correo AS cliente_correo,
       te.tipo_nombre,
       p.paquete_nombre
     FROM eqim_solicitudes.eqim_solicitudes s
     JOIN eqim_solicitudes.estados e           ON e.estado_id  = s.estado_id
     JOIN eqim_seguridad.usuarios u            ON u.usuario_id = s.usuario_id
     LEFT JOIN eqim_catalogo.tipos_evento te   ON te.tipo_id   = s.tipo_evento_id
     LEFT JOIN eqim_catalogo.paquetes p        ON p.paquete_id = s.paquete_id
     WHERE 1=1 ${condiciones} ${condArchivado}
     ORDER BY s.creado_en DESC
     LIMIT $1 OFFSET $2`,
    [limite, offset]
  );

  const { rows: total } = await pool.query(
    `SELECT COUNT(*) AS total
     FROM eqim_solicitudes.eqim_solicitudes s
     JOIN eqim_solicitudes.estados e ON e.estado_id = s.estado_id
     WHERE 1=1 ${condiciones} ${condArchivado}`
  );

  return {
    solicitudes: rows,
    total: parseInt(total[0].total, 10),
    pagina,
    limite,
    totalPaginas: Math.ceil(parseInt(total[0].total, 10) / limite),
  };
};


// ─────────────────────────────────────────────────────────────────────────────
const obtenerSolicitudPorId = async (solicitudId, usuarioId = null, esAdmin = false) => {
  const condicionUsuario = esAdmin ? '' : 'AND s.usuario_id = $2';
  const params = esAdmin ? [solicitudId] : [solicitudId, usuarioId];

  const { rows } = await pool.query(
    `SELECT
       s.solicitud_id, s.numero_solicitud AS numero_cotizacion, s.precio_estimado,
       s.num_invitados, s.mensaje_cliente, s.comentario_admin AS observaciones, s.creado_en, s.fecha_evento,
       e.codigo AS estado_codigo, e.nombre AS estado_nombre, e.color_hex AS estado_color,
       u.nombre_completo AS cliente_nombre, u.correo AS cliente_correo,
       COALESCE(s.telefono_contacto, u.telefono) AS cliente_telefono,
       te.tipo_nombre, p.paquete_nombre, p.precio_persona,
       s.color_primario, s.color_secundario,
       ed.nombre AS estilo_decoracion, cm.nombre AS centro_mesa,
       (
         SELECT COALESCE(json_agg(json_build_object(
           'nombre', se.nombre_snapshot,
           'cantidad', se.cantidad,
           'precio', se.precio_snapshot
         )), '[]')
         FROM eqim_solicitudes.solicitud_extras se
         WHERE se.solicitud_id = s.solicitud_id
       ) AS extras
     FROM eqim_solicitudes.eqim_solicitudes s
     JOIN eqim_solicitudes.estados e             ON e.estado_id  = s.estado_id
     JOIN eqim_seguridad.usuarios u              ON u.usuario_id = s.usuario_id
     LEFT JOIN eqim_catalogo.tipos_evento te     ON te.tipo_id   = s.tipo_evento_id
     LEFT JOIN eqim_catalogo.paquetes p          ON p.paquete_id = s.paquete_id
     LEFT JOIN eqim_catalogo.estilos_decoracion ed ON ed.estilo_id = s.estilo_deco_id
     LEFT JOIN eqim_catalogo.centros_mesa cm     ON cm.centro_id = s.centro_mesa_id
     WHERE s.solicitud_id = $1 ${condicionUsuario}`,
    params
  );

  if (rows.length === 0) {
    const err = new Error('Solicitud no encontrada o no tienes permisos.');
    err.statusCode = 404; throw err;
  }
  return rows[0];
};


// ─────────────────────────────────────────────────────────────────────────────
// 🚀 MÁQUINA DE ESTADOS ESTRICTA
const actualizarEstado = async (solicitudId, estadoCodigo, observaciones = null, adminId) => {
  const codigoUpper = estadoCodigo.toUpperCase();
  if (!ESTADOS_VALIDOS.includes(codigoUpper)) {
    const err = new Error(`Estado inválido.`);
    err.statusCode = 400; throw err;
  }

  const { rows: reqInfo } = await pool.query(
    `SELECT s.estado_id AS estado_anterior_id, 
            e.estado_id AS estado_nuevo_id,
            (SELECT codigo FROM eqim_solicitudes.estados WHERE estado_id = s.estado_id) as codigo_anterior
     FROM eqim_solicitudes.eqim_solicitudes s
     CROSS JOIN eqim_solicitudes.estados e
     WHERE s.solicitud_id = $1 AND e.codigo = $2`,
    [solicitudId, codigoUpper]
  );
  
  if (reqInfo.length === 0) {
    const err = new Error('Solicitud o estado no encontrado.'); 
    err.statusCode = 404; 
    throw err;
  }
  
  const { estado_anterior_id, estado_nuevo_id, codigo_anterior } = reqInfo[0];

  // Regla 1: No se puede sacar una solicitud de un estado terminal (Rechazada/Cancelada)
  if (['RECHAZADA', 'CANCELADA'].includes(codigo_anterior) && codigoUpper !== codigo_anterior) {
    const err = new Error(`Operación denegada. La solicitud ya fue ${codigo_anterior.toLowerCase()}.`);
    err.statusCode = 400; throw err;
  }

  // Regla 2: No se puede retroceder en el flujo normal (Ej: Confirmada -> Pendiente)
  const indexAnterior = FLUJO_NORMAL.indexOf(codigo_anterior);
  const indexNuevo = FLUJO_NORMAL.indexOf(codigoUpper);
  if (indexAnterior !== -1 && indexNuevo !== -1 && indexNuevo < indexAnterior) {
    const err = new Error(`Operación denegada. No se puede retroceder de ${codigo_anterior} a ${codigoUpper}.`);
    err.statusCode = 400; throw err;
  }

  const { rows } = await pool.query(
    `UPDATE eqim_solicitudes.eqim_solicitudes
     SET estado_id        = $1,
         comentario_admin = COALESCE($2, comentario_admin),
         actualizado_en   = NOW()
     WHERE solicitud_id = $3
     RETURNING solicitud_id, numero_solicitud AS numero_cotizacion`,
    [estado_nuevo_id, observaciones, solicitudId]
  );

  await pool.query(
    `INSERT INTO eqim_solicitudes.historial_estados 
     (solicitud_id, estado_anterior_id, estado_nuevo_id, comentario, cambiado_por)
     VALUES ($1, $2, $3, $4, $5)`,
    [solicitudId, estado_anterior_id, estado_nuevo_id, observaciones, adminId]
  );

  return { ...rows[0], estado_codigo: codigoUpper };
};

// ─────────────────────────────────────────────────────────────────────────────
const cancelarMiSolicitud = async (solicitudId, usuarioId) => {
  const { rows: actual } = await pool.query(
    `SELECT e.codigo FROM eqim_solicitudes.eqim_solicitudes s
     JOIN eqim_solicitudes.estados e ON e.estado_id = s.estado_id
     WHERE s.solicitud_id = $1 AND s.usuario_id = $2`,
    [solicitudId, usuarioId]
  );

  if (actual.length === 0) throw new Error('Solicitud no encontrada.');
  if (actual[0].codigo !== 'PENDIENTE') {
    const err = new Error('Solo puedes cancelar solicitudes que están Pendientes.');
    err.statusCode = 400; throw err;
  }

  return await actualizarEstado(solicitudId, 'CANCELADA', 'El cliente canceló la solicitud.', usuarioId);
};

// ─────────────────────────────────────────────────────────────────────────────
const obtenerResumenDashboard = async () => {
  const { rows } = await pool.query(
    `SELECT
       COUNT(*) AS total_solicitudes,
       COUNT(*) FILTER (WHERE e.codigo = 'PENDIENTE') AS pendientes,
       COUNT(*) FILTER (WHERE e.codigo = 'EN_REVISION') AS en_revision,
       COUNT(*) FILTER (WHERE e.codigo = 'CONFIRMADA') AS confirmadas,
       COUNT(*) FILTER (WHERE e.codigo = 'RECHAZADA') AS rechazadas,
       COALESCE(SUM(s.precio_estimado) FILTER (WHERE e.codigo = 'CONFIRMADA'), 0) AS ingresos_confirmados,
       COALESCE(SUM(s.precio_estimado) FILTER (WHERE e.codigo = 'PENDIENTE'), 0) AS ingresos_potenciales
     FROM eqim_solicitudes.eqim_solicitudes s
     JOIN eqim_solicitudes.estados e ON e.estado_id = s.estado_id`
  );

  const { rows: ultimas } = await pool.query(
    `SELECT
       s.solicitud_id, s.numero_solicitud AS numero_cotizacion, s.precio_estimado, s.creado_en,
       e.codigo AS estado_codigo, e.nombre AS estado_nombre, e.color_hex AS estado_color,
       u.nombre_completo AS cliente_nombre, p.paquete_nombre
     FROM eqim_solicitudes.eqim_solicitudes s
     JOIN eqim_solicitudes.estados e   ON e.estado_id  = s.estado_id
     JOIN eqim_seguridad.usuarios u    ON u.usuario_id = s.usuario_id
     LEFT JOIN eqim_catalogo.paquetes p ON p.paquete_id = s.paquete_id
     ORDER BY s.creado_en DESC LIMIT 5`
  );

  return { resumen: rows[0], ultimas };
};

// ─────────────────────────────────────────────────────────────────────────────
const archivarSolicitud = async (solicitudId) => {
  const { rows } = await pool.query(
    `UPDATE eqim_solicitudes.eqim_solicitudes
     SET archivado = true, actualizado_en = NOW()
     WHERE solicitud_id = $1
     RETURNING solicitud_id, numero_solicitud`,
    [solicitudId]
  );
  if (!rows.length) { const err = new Error('Solicitud no encontrada.'); err.statusCode = 404; throw err; }
  return rows[0];
};

// ─────────────────────────────────────────────────────────────────────────────
const desarchivarSolicitud = async (solicitudId) => {
  const { rows } = await pool.query(
    `UPDATE eqim_solicitudes.eqim_solicitudes
     SET archivado = false, actualizado_en = NOW()
     WHERE solicitud_id = $1
     RETURNING solicitud_id, numero_solicitud`,
    [solicitudId]
  );
  if (!rows.length) { const err = new Error('Solicitud no encontrada.'); err.statusCode = 404; throw err; }
  return rows[0];
};

// ─────────────────────────────────────────────────────────────────────────────
const eliminarSolicitudPermanente = async (solicitudId, motivo) => {
  if (!motivo || !motivo.trim()) {
    const err = new Error('El motivo de eliminación es obligatorio.'); err.statusCode = 400; throw err;
  }

  // 1. Obtener datos del cliente ANTES de eliminar
  const { rows: datos } = await pool.query(
    `SELECT s.numero_solicitud, u.nombre_completo, u.correo
     FROM eqim_solicitudes.eqim_solicitudes s
     JOIN eqim_seguridad.usuarios u ON u.usuario_id = s.usuario_id
     WHERE s.solicitud_id = $1`,
    [solicitudId]
  );
  if (!datos.length) { const err = new Error('Solicitud no encontrada.'); err.statusCode = 404; throw err; }
  const { numero_solicitud, nombre_completo, correo } = datos[0];

  // 2. Eliminar (los extras se borran por ON DELETE CASCADE)
  await pool.query('DELETE FROM eqim_solicitudes.eqim_solicitudes WHERE solicitud_id = $1', [solicitudId]);

  // 3. Notificar al cliente por email (no bloqueante)
  const email = require('../../utils/email.service');
  email.enviarCancelacionSolicitud({ nombre: nombre_completo, correo, numero: numero_solicitud, motivo })
    .catch(err => console.error('[EMAIL] Error enviando cancelación:', err.message));

  return { numero_solicitud, correo };
};

module.exports = {
  crearSolicitud, obtenerMisSolicitudes, obtenerTodasSolicitudes,
  obtenerSolicitudPorId, actualizarEstado, cancelarMiSolicitud,
  obtenerResumenDashboard, archivarSolicitud, desarchivarSolicitud,
  eliminarSolicitudPermanente, ESTADOS_VALIDOS
};