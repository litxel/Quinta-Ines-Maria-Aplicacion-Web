'use strict';
const pool = require('../../config/db');

// ── GET todos los datos del catálogo para el configurador ────────────────────
const obtenerDatosConfiguracion = async () => {
  const [tipos, estilos, centros, adicionales, paquetes] = await Promise.all([

    pool.query(`SELECT tipo_id, tipo_codigo, tipo_nombre, tipo_icono, descripcion FROM eqim_catalogo.tipos_evento WHERE activo = true ORDER BY orden_display ASC`),
    pool.query(`SELECT estilo_id, estilo_codigo, nombre, descripcion, imagen_url, costo_adicional FROM eqim_catalogo.estilos_decoracion WHERE activo = true ORDER BY estilo_id ASC`),
    pool.query(`SELECT centro_id, nombre, descripcion, imagen_url, costo_por_mesa FROM eqim_catalogo.centros_mesa WHERE activo = true ORDER BY centro_id ASC`),
    pool.query(`SELECT adicional_id, nombre, descripcion, precio_unitario, unidad, categoria, imagen_url FROM eqim_catalogo.servicios_adicionales WHERE activo = true ORDER BY categoria, adicional_id ASC`),
    pool.query(`SELECT paquete_id, paquete_nombre, paquete_codigo, precio_persona, minimo_invitados, color_principal FROM eqim_catalogo.paquetes WHERE activo = true ORDER BY orden_display ASC`)
  ]);

  return {
    tipos_evento:          tipos.rows,
    estilos_decoracion:    estilos.rows,
    centros_mesa:          centros.rows,
    servicios_adicionales: adicionales.rows,
    paquetes:              paquetes.rows, 
  };
};

// ── CREAR / actualizar sesión del configurador ────────────────────────────────
const guardarSesion = async ({
  usuarioId,
  datos,
  ipOrigen  = null,
  userAgent = null,
  sesionId  = null,
}) => {
  const {
    tipo_evento_id   = null,
    paquete_id       = null,
    num_invitados    = 100,
    color_primario   = null,
    color_secundario = null,
    estilo_deco_id   = null,
    centro_mesa_id   = null,
    num_mesas        = 0,
    num_meseros      = 0,
    paso_actual      = 1,
    completada       = false,
    precio_estimado  = 0,
    servicios        = [],   
  } = datos;

  if (num_invitados < 100) {
    const err = new Error('El mínimo de invitados es 100 personas.');
    err.statusCode = 400;
    throw err;
  }

  let sesion;

  if (sesionId) {
    const result = await pool.query(
      `UPDATE eqim_configurador.sesiones SET
         tipo_evento_id   = COALESCE($1,  tipo_evento_id),
         paquete_id       = COALESCE($2,  paquete_id),
         num_invitados    = $3,
         color_primario   = COALESCE($4,  color_primario),
         color_secundario = COALESCE($5,  color_secundario),
         estilo_deco_id   = COALESCE($6,  estilo_deco_id),
         centro_mesa_id   = COALESCE($7,  centro_mesa_id),
         num_mesas        = $8,
         num_meseros      = $9,
         paso_actual      = $10,
         completada       = $11,
         precio_estimado  = $12,
         actualizado_en   = NOW()
       WHERE sesion_id = $13 AND completada = false
       RETURNING *`,
      [
        tipo_evento_id, paquete_id, num_invitados,
        color_primario, color_secundario,
        estilo_deco_id, centro_mesa_id,
        num_mesas, num_meseros,
        paso_actual, completada, precio_estimado,
        sesionId,
      ]
    );

    if (result.rows.length === 0) {
      const err = new Error('Sesión no encontrada o ya completada.');
      err.statusCode = 404;
      throw err;
    }
    sesion = result.rows[0];

  } else {
    const result = await pool.query(
      `INSERT INTO eqim_configurador.sesiones
         (usuario_id, ip_origen, user_agent,
          tipo_evento_id, paquete_id, num_invitados,
          color_primario, color_secundario,
          estilo_deco_id, centro_mesa_id,
          num_mesas, num_meseros,
          paso_actual, completada, precio_estimado)
       VALUES
         ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        usuarioId, ipOrigen, userAgent,
        tipo_evento_id, paquete_id, num_invitados,
        color_primario, color_secundario,
        estilo_deco_id, centro_mesa_id,
        num_mesas, num_meseros,
        paso_actual, completada, precio_estimado,
      ]
    );
    sesion = result.rows[0];
  }

  if (servicios.length > 0) {
    await pool.query(
      'DELETE FROM eqim_configurador.sesion_servicios WHERE sesion_id = $1',
      [sesion.sesion_id]
    );

    for (const svc of servicios) {
      if (!svc.adicional_id || svc.cantidad < 1) continue;
      await pool.query(
        `INSERT INTO eqim_configurador.sesion_servicios
           (sesion_id, adicional_id, cantidad, precio_snapshot)
         VALUES ($1, $2, $3, $4)`,
        [sesion.sesion_id, svc.adicional_id, svc.cantidad, svc.precio_snapshot]
      );
    }
  } else if (sesionId) {
    await pool.query(
      'DELETE FROM eqim_configurador.sesion_servicios WHERE sesion_id = $1',
      [sesion.sesion_id]
    );
  }

  return sesion;
};

// ── GET sesión por ID (con sus servicios) ─────────────────────────────────────
const obtenerSesion = async (sesionId) => {
  const { rows } = await pool.query(
    `SELECT s.*,
            COALESCE(
              json_agg(
                json_build_object(
                  'adicional_id',     ss.adicional_id,
                  'nombre',           sa.nombre,
                  'cantidad',         ss.cantidad,
                  'precio_snapshot',  ss.precio_snapshot,
                  'subtotal',         (ss.cantidad * ss.precio_snapshot)
                )
              ) FILTER (WHERE ss.adicional_id IS NOT NULL),
              '[]'
            ) AS servicios
     FROM eqim_configurador.sesiones s
     LEFT JOIN eqim_configurador.sesion_servicios ss
            ON ss.sesion_id = s.sesion_id
     LEFT JOIN eqim_catalogo.servicios_adicionales sa
            ON sa.adicional_id = ss.adicional_id
     WHERE s.sesion_id = $1
     GROUP BY s.sesion_id`,
    [sesionId]
  );

  if (rows.length === 0) {
    const err = new Error(`Sesión ${sesionId} no encontrada.`);
    err.statusCode = 404;
    throw err;
  }
  return rows[0];
};

// ── Calcular precio total en el servidor (fuente de verdad) ──────────────────
const calcularPrecioTotal = async ({
  paqueteId,
  numInvitados,
  centrMesaId = null,
  servicios   = [],
}) => {
  if (numInvitados < 100) {
    const err = new Error('Mínimo 100 invitados.');
    err.statusCode = 400;
    throw err;
  }

  const paq = await pool.query(
    `SELECT precio_persona, minimo_invitados
     FROM eqim_catalogo.paquetes
     WHERE paquete_id = $1 AND activo = true`,
    [paqueteId]
  );
  if (paq.rows.length === 0) {
    const err = new Error('Paquete no encontrado.');
    err.statusCode = 404;
    throw err;
  }

  const { precio_persona, minimo_invitados } = paq.rows[0];
  const personas       = Math.max(numInvitados, minimo_invitados);
  const subtotalPaq    = parseFloat(precio_persona) * personas;

  let subtotalMesas = 0;
  if (centrMesaId) {
    const cm = await pool.query(
      'SELECT costo_por_mesa FROM eqim_catalogo.centros_mesa WHERE centro_id = $1',
      [centrMesaId]
    );
    if (cm.rows.length > 0) {
      const numMesas    = Math.ceil(personas / 8);
      subtotalMesas     = parseFloat(cm.rows[0].costo_por_mesa) * numMesas;
    }
  }

  let subtotalAdicionales = 0;
  for (const svc of servicios) {
    if (!svc.adicional_id || svc.cantidad < 1) continue;
    const ad = await pool.query(
      'SELECT precio_unitario FROM eqim_catalogo.servicios_adicionales WHERE adicional_id = $1',
      [svc.adicional_id]
    );
    if (ad.rows.length > 0) {
      subtotalAdicionales += parseFloat(ad.rows[0].precio_unitario) * svc.cantidad;
    }
  }

  const total = subtotalPaq + subtotalMesas + subtotalAdicionales;

  return {
    subtotal_paquete:     subtotalPaq,
    subtotal_mesas:       subtotalMesas,
    subtotal_adicionales: subtotalAdicionales,
    total,
    num_personas:         personas,
    num_mesas:            Math.ceil(personas / 8),
    num_meseros:          Math.ceil(personas / 10),
  };
};

const obtenerFechasOcupadas = async () => {
  const { rows } = await pool.query(
    `SELECT fecha_evento AS fecha 
     FROM eqim_solicitudes.eqim_solicitudes 
     WHERE estado_id IN (SELECT estado_id FROM eqim_solicitudes.estados WHERE codigo IN ('CONFIRMADA', 'COMPLETADA')) 
       AND fecha_evento IS NOT NULL
     UNION
     SELECT fecha FROM eqim_solicitudes.disponibilidad WHERE estado = 'BLOQUEADA'`
  );
  return rows.map(r => {
    const d = new Date(r.fecha);
    return d.toISOString().split('T')[0];
  });
};

const obtenerCalendarioAdmin = async () => {
  const solicitudes = await pool.query(`
    SELECT s.solicitud_id, s.fecha_evento AS fecha, s.numero_solicitud, s.num_invitados, 
           c.paquete_nombre, COALESCE(u.nombre_completo, 'Cliente Registrado') AS cliente, e.codigo AS estado_codigo
    FROM eqim_solicitudes.eqim_solicitudes s
    LEFT JOIN eqim_catalogo.paquetes c ON s.paquete_id = c.paquete_id
    LEFT JOIN eqim_solicitudes.estados e ON s.estado_id = e.estado_id
    LEFT JOIN eqim_seguridad.usuarios u ON s.usuario_id = u.usuario_id 
    WHERE e.codigo IN ('CONFIRMADA', 'COMPLETADA') AND s.fecha_evento IS NOT NULL
  `);

  const bloqueos = await pool.query(`
    SELECT disponibilidad_id, fecha, estado, nota_interna 
    FROM eqim_solicitudes.disponibilidad 
    WHERE estado = 'BLOQUEADA'
  `);

  return { eventos: solicitudes.rows, bloqueos: bloqueos.rows };
};

// 🚀 FASE 2: EL ESCUDO DEL CALENDARIO (REGLA DE NEGOCIO)
const bloquearFechaManual = async (fecha, nota_interna, adminId) => {
  // Verificamos si hay algún evento vivo en esa fecha (Pendiente, Revisión, Confirmada, Completada)
  const checkEventos = await pool.query(
    `SELECT s.numero_solicitud, e.codigo 
     FROM eqim_solicitudes.eqim_solicitudes s
     JOIN eqim_solicitudes.estados e ON s.estado_id = e.estado_id
     WHERE s.fecha_evento = $1 AND e.codigo NOT IN ('CANCELADA', 'RECHAZADA')`,
    [fecha]
  );

  if (checkEventos.rows.length > 0) {
    const err = new Error('Operación denegada. Hay clientes con solicitudes activas para esta fecha.');
    err.statusCode = 400; 
    throw err;
  }

  const { rows } = await pool.query(
    `INSERT INTO eqim_solicitudes.disponibilidad (fecha, estado, nota_interna, configurado_por)
     VALUES ($1, 'BLOQUEADA', $2, $3) RETURNING *`,
    [fecha, nota_interna, adminId]
  );
  return rows[0];
};

const desbloquearFechaManual = async (id) => {
  await pool.query(`DELETE FROM eqim_solicitudes.disponibilidad WHERE disponibilidad_id = $1`, [id]);
  return true;
};

module.exports = {
  obtenerDatosConfiguracion,
  guardarSesion,
  obtenerSesion,
  calcularPrecioTotal,
  obtenerFechasOcupadas,
  obtenerCalendarioAdmin,
  bloquearFechaManual,
  desbloquearFechaManual
};