'use strict';
const pool  = require('../../config/db');
const { calcularPrecioTotal } = require('../configurador/configurador.service');

const ESTADOS_VALIDOS = ['PENDIENTE', 'EN_REVISION', 'CONFIRMADA', 'RECHAZADA', 'CANCELADA', 'COMPLETADA'];
const FLUJO_NORMAL = ['PENDIENTE', 'EN_REVISION', 'CONFIRMADA', 'COMPLETADA'];

const errorHttp = (msg, statusCode) => Object.assign(new Error(msg), { statusCode });

// Fecha de hoy en Ecuador como 'YYYY-MM-DD' (el servidor puede estar en UTC)
const hoyEcuador = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil' }).format(new Date());

/**
 * Comprueba si una fecha está libre: no bloqueada por el admin y sin otro
 * evento CONFIRMADO o COMPLETADO ese día.
 * @returns {Promise<string|null>} motivo por el que no está libre, o null
 */
const motivoFechaNoDisponible = async (fecha, excluirSolicitudId = null, db = pool) => {
  const bloqueo = await db.query(
    `SELECT 1 FROM eqim_solicitudes.disponibilidad WHERE fecha = $1 AND estado = 'BLOQUEADA'`,
    [fecha]
  );
  if (bloqueo.rows.length > 0) return 'La fecha elegida no está disponible (bloqueada por la Quinta).';

  const ocupada = await db.query(
    `SELECT s.numero_solicitud
     FROM eqim_solicitudes.eqim_solicitudes s
     JOIN eqim_solicitudes.estados e ON e.estado_id = s.estado_id
     WHERE s.fecha_evento = $1
       AND e.codigo IN ('CONFIRMADA', 'COMPLETADA')
       AND ($2::int IS NULL OR s.solicitud_id <> $2)`,
    [fecha, excluirSolicitudId]
  );
  if (ocupada.rows.length > 0) return `La fecha elegida ya está reservada (${ocupada.rows[0].numero_solicitud}).`;

  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
/**
 * Crea una solicitud. El precio y los extras se calculan aquí con los precios
 * vigentes de la BD (nunca se confía en lo que envía el navegador). El número
 * SOL-AAAA-NNNNNN lo genera el trigger trg_solicitud_numero.
 */
const crearSolicitud = async ({
  usuarioId, tipoEventoId, paqueteId, numInvitados, fechaEvento,
  mensajeCliente, telefonoContacto,
  colorPrimario, colorSecundario, estilodecoId, centroMesaId, extras,
}) => {
  if (fechaEvento < hoyEcuador()) throw errorHttp('La fecha del evento no puede estar en el pasado.', 400);

  const motivo = await motivoFechaNoDisponible(fechaEvento);
  if (motivo) throw errorHttp(`${motivo} Por favor elige otra fecha en el configurador.`, 409);

  // Extras: solo los activos, con nombre y precio de la BD
  const cantidades = new Map();
  for (const ext of extras) {
    const id = parseInt(ext?.adicional_id, 10);
    const cantidad = parseInt(ext?.cantidad, 10);
    if (id > 0 && cantidad > 0) cantidades.set(id, Math.min(cantidad, 1000));
  }
  const { rows: extrasBD } = cantidades.size > 0
    ? await pool.query(
        `SELECT adicional_id, nombre, precio_unitario
         FROM eqim_catalogo.servicios_adicionales
         WHERE adicional_id = ANY($1::int[]) AND activo = true`,
        [[...cantidades.keys()]]
      )
    : { rows: [] };

  const precio = await calcularPrecioTotal({
    paqueteId,
    numInvitados,
    centrMesaId: centroMesaId,
    servicios:   extrasBD.map((e) => ({ adicional_id: e.adicional_id, cantidad: cantidades.get(e.adicional_id) })),
  });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO eqim_solicitudes.eqim_solicitudes
         (usuario_id, tipo_evento_id, paquete_id,
          num_invitados, telefono_contacto, precio_estimado, estado_id, mensaje_cliente, fecha_evento,
          color_primario, color_secundario, estilo_deco_id, centro_mesa_id)
       VALUES ($1, $2, $3, $4, $5, $6,
         (SELECT estado_id FROM eqim_solicitudes.estados WHERE codigo = 'PENDIENTE'),
         $7, $8, $9, $10, $11, $12)
       RETURNING solicitud_id, numero_solicitud AS numero_cotizacion, precio_estimado,
                 TO_CHAR(fecha_evento, 'YYYY-MM-DD') AS fecha_evento`,
      [
        usuarioId,
        tipoEventoId,
        paqueteId,
        numInvitados,
        telefonoContacto || 'No especificado',
        precio.total,
        mensajeCliente,
        fechaEvento,
        colorPrimario,
        colorSecundario,
        estilodecoId,
        centroMesaId,
      ]
    );
    const solicitud = rows[0];

    for (const e of extrasBD) {
      await client.query(
        `INSERT INTO eqim_solicitudes.solicitud_extras
           (solicitud_id, adicional_id, nombre_snapshot, cantidad, precio_snapshot)
         VALUES ($1, $2, $3, $4, $5)`,
        [solicitud.solicitud_id, e.adicional_id, e.nombre, cantidades.get(e.adicional_id), e.precio_unitario]
      );
    }

    await client.query('COMMIT');
    return { ...solicitud, precio_estimado: parseFloat(solicitud.precio_estimado), desglose: precio };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};


// ─────────────────────────────────────────────────────────────────────────────
const obtenerMisSolicitudes = async (usuarioId) => {
  const { rows } = await pool.query(
    `SELECT
       s.solicitud_id,
       s.numero_solicitud AS numero_cotizacion,
       s.num_invitados,
       s.precio_estimado,
       TO_CHAR(s.fecha_evento, 'YYYY-MM-DD') AS fecha_evento,
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
const obtenerTodasSolicitudes = async ({ estado = null, pagina = 1, limite = 25, archivadas = false, usuario_id = null } = {}) => {
  pagina = Number.isInteger(pagina) && pagina > 0 ? pagina : 1;
  limite = Number.isInteger(limite) && limite > 0 ? Math.min(limite, 100) : 25;
  const offset = (pagina - 1) * limite;

  // `estado` se valida contra la lista blanca antes de usarlo en el SQL
  const condiciones = estado && ESTADOS_VALIDOS.includes(String(estado).toUpperCase())
    ? `AND e.codigo = '${String(estado).toUpperCase()}'` : '';
  const condArchivado = archivadas ? `AND s.archivado = true` : `AND s.archivado = false`;
  const uid = usuario_id ? parseInt(usuario_id, 10) : null;
  const condUsuario = uid ? `AND s.usuario_id = $3` : '';
  const queryParams = uid ? [limite, offset, uid] : [limite, offset];

  const { rows } = await pool.query(
    `SELECT
       s.solicitud_id,
       s.usuario_id,
       s.numero_solicitud AS numero_cotizacion,
       s.num_invitados,
       s.precio_estimado,
       TO_CHAR(s.fecha_evento, 'YYYY-MM-DD') AS fecha_evento,
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
     WHERE 1=1 ${condiciones} ${condArchivado} ${condUsuario}
     ORDER BY s.creado_en DESC
     LIMIT $1 OFFSET $2`,
    queryParams
  );

  const countParams = uid ? [uid] : [];
  const countUsuario = uid ? 'AND s.usuario_id = $1' : '';
  const { rows: total } = await pool.query(
    `SELECT COUNT(*) AS total
     FROM eqim_solicitudes.eqim_solicitudes s
     JOIN eqim_solicitudes.estados e ON e.estado_id = s.estado_id
     WHERE 1=1 ${condiciones} ${condArchivado} ${countUsuario}`,
    countParams
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
       s.num_invitados, s.mensaje_cliente, s.comentario_admin AS observaciones, s.creado_en,
       TO_CHAR(s.fecha_evento, 'YYYY-MM-DD') AS fecha_evento,
       e.codigo AS estado_codigo, e.nombre AS estado_nombre, e.color_hex AS estado_color,
       u.nombre_completo AS cliente_nombre, u.correo AS cliente_correo,
       COALESCE(s.telefono_contacto, u.telefono) AS cliente_telefono,
       u.foto_perfil AS cliente_foto,
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

  if (rows.length === 0) throw errorHttp('Solicitud no encontrada o no tienes permisos.', 404);
  return rows[0];
};


// ─────────────────────────────────────────────────────────────────────────────
// 🚀 MÁQUINA DE ESTADOS ESTRICTA
const actualizarEstado = async (solicitudId, estadoCodigo, observaciones = null, adminId, { registrarAtencion = true } = {}) => {
  const codigoUpper = String(estadoCodigo).toUpperCase();
  if (!ESTADOS_VALIDOS.includes(codigoUpper)) throw errorHttp('Estado inválido.', 400);

  const { rows: reqInfo } = await pool.query(
    `SELECT s.estado_id AS estado_anterior_id,
            e.estado_id AS estado_nuevo_id,
            TO_CHAR(s.fecha_evento, 'YYYY-MM-DD') AS fecha_evento,
            (SELECT codigo FROM eqim_solicitudes.estados WHERE estado_id = s.estado_id) as codigo_anterior
     FROM eqim_solicitudes.eqim_solicitudes s
     CROSS JOIN eqim_solicitudes.estados e
     WHERE s.solicitud_id = $1 AND e.codigo = $2`,
    [solicitudId, codigoUpper]
  );

  if (reqInfo.length === 0) throw errorHttp('Solicitud o estado no encontrado.', 404);

  const { estado_anterior_id, estado_nuevo_id, codigo_anterior, fecha_evento } = reqInfo[0];

  // Regla 1: No se puede sacar una solicitud de un estado terminal (Rechazada/Cancelada)
  if (['RECHAZADA', 'CANCELADA'].includes(codigo_anterior) && codigoUpper !== codigo_anterior) {
    throw errorHttp(`Operación denegada. La solicitud ya fue ${codigo_anterior.toLowerCase()}.`, 400);
  }

  // Regla 2: No se puede retroceder en el flujo normal (Ej: Confirmada -> Pendiente)
  const indexAnterior = FLUJO_NORMAL.indexOf(codigo_anterior);
  const indexNuevo = FLUJO_NORMAL.indexOf(codigoUpper);
  if (indexAnterior !== -1 && indexNuevo !== -1 && indexNuevo < indexAnterior) {
    throw errorHttp(`Operación denegada. No se puede retroceder de ${codigo_anterior} a ${codigoUpper}.`, 400);
  }

  // Regla 3: No se pueden confirmar dos eventos el mismo día ni en un día bloqueado
  if (codigoUpper === 'CONFIRMADA' && codigo_anterior !== 'CONFIRMADA') {
    const motivo = await motivoFechaNoDisponible(fecha_evento, solicitudId);
    if (motivo) throw errorHttp(`No se puede confirmar: ${motivo}`, 409);
  }

  const { rows } = await pool.query(
    `UPDATE eqim_solicitudes.eqim_solicitudes
     SET estado_id        = $1,
         comentario_admin = COALESCE($2, comentario_admin),
         atendido_por     = COALESCE($4, atendido_por),
         actualizado_en   = NOW()
     WHERE solicitud_id = $3
     RETURNING solicitud_id, numero_solicitud AS numero_cotizacion`,
    [estado_nuevo_id, observaciones, solicitudId, registrarAtencion ? adminId : null]
  );

  await pool.query(
    `INSERT INTO eqim_solicitudes.historial_estados
     (solicitud_id, estado_anterior_id, estado_nuevo_id, comentario, cambiado_por)
     VALUES ($1, $2, $3, $4, $5)`,
    [solicitudId, estado_anterior_id, estado_nuevo_id, observaciones, adminId]
  );

  return { ...rows[0], estado_codigo: codigoUpper, estado_anterior: codigo_anterior };
};

// ─────────────────────────────────────────────────────────────────────────────
const cancelarMiSolicitud = async (solicitudId, usuarioId) => {
  const { rows: actual } = await pool.query(
    `SELECT e.codigo FROM eqim_solicitudes.eqim_solicitudes s
     JOIN eqim_solicitudes.estados e ON e.estado_id = s.estado_id
     WHERE s.solicitud_id = $1 AND s.usuario_id = $2`,
    [solicitudId, usuarioId]
  );

  if (actual.length === 0) throw errorHttp('Solicitud no encontrada.', 404);
  if (actual[0].codigo !== 'PENDIENTE') {
    throw errorHttp('Solo puedes cancelar solicitudes que están Pendientes.', 400);
  }

  return await actualizarEstado(solicitudId, 'CANCELADA', 'El cliente canceló la solicitud.', usuarioId, { registrarAtencion: false });
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
       TO_CHAR(s.fecha_evento, 'YYYY-MM-DD') AS fecha_evento,
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
  if (!rows.length) throw errorHttp('Solicitud no encontrada.', 404);
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
  if (!rows.length) throw errorHttp('Solicitud no encontrada.', 404);
  return rows[0];
};

// ─────────────────────────────────────────────────────────────────────────────
const eliminarSolicitudPermanente = async (solicitudId, motivo) => {
  if (!motivo || !motivo.trim()) throw errorHttp('El motivo de eliminación es obligatorio.', 400);

  // 1. Obtener datos del cliente ANTES de eliminar
  const { rows: datos } = await pool.query(
    `SELECT s.numero_solicitud, u.nombre_completo, u.correo
     FROM eqim_solicitudes.eqim_solicitudes s
     JOIN eqim_seguridad.usuarios u ON u.usuario_id = s.usuario_id
     WHERE s.solicitud_id = $1`,
    [solicitudId]
  );
  if (!datos.length) throw errorHttp('Solicitud no encontrada.', 404);
  const { numero_solicitud, nombre_completo, correo } = datos[0];

  // 2. Eliminar (los extras se borran por ON DELETE CASCADE)
  await pool.query('DELETE FROM eqim_solicitudes.eqim_solicitudes WHERE solicitud_id = $1', [solicitudId]);

  // 3. Notificar al cliente por email (no bloqueante)
  const email = require('../../utils/email.service');
  email.enviarCancelacionSolicitud({ nombre: nombre_completo, correo, numero: numero_solicitud, motivo })
    .catch(err => console.error('[EMAIL] Error enviando cancelación:', email.describirErrorCorreo(err)));

  return { numero_solicitud, correo };
};

module.exports = {
  crearSolicitud, obtenerMisSolicitudes, obtenerTodasSolicitudes,
  obtenerSolicitudPorId, actualizarEstado, cancelarMiSolicitud,
  obtenerResumenDashboard, archivarSolicitud, desarchivarSolicitud,
  eliminarSolicitudPermanente, ESTADOS_VALIDOS, hoyEcuador,
};
