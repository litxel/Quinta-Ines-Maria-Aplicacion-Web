'use strict';
const pool = require('../../config/db');

// =============================================================================
//  SERVICIO DEL CONFIGURADOR — EventPlanner QIM
//
//  Tablas reales usadas (verificadas en el .sql):
//
//  eqim_configurador.sesiones:
//    sesion_id, sesion_uuid, usuario_id, ip_origen, user_agent,
//    tipo_evento_id, paquete_id, num_invitados, color_primario,
//    color_secundario, estilo_deco_id, centro_mesa_id, num_mesas,
//    num_meseros, paso_actual, completada, precio_estimado,
//    creado_en, actualizado_en, expira_en
//
//  eqim_configurador.sesion_servicios:
//    sesion_id, adicional_id, cantidad, precio_snapshot
//
//  eqim_catalogo.estilos_decoracion:
//    estilo_id, estilo_codigo, nombre, descripcion, imagen_url,
//    costo_adicional, activo
//
//  eqim_catalogo.centros_mesa:
//    centro_id, nombre, descripcion, imagen_url, costo_por_mesa, activo
//
//  eqim_catalogo.servicios_adicionales:
//    adicional_id, nombre, descripcion, precio_unitario, unidad,
//    categoria, imagen_url, activo
//
//  eqim_catalogo.tipos_evento:
//    tipo_id, tipo_codigo, tipo_nombre, tipo_icono, descripcion,
//    activo, orden_display
// =============================================================================


// ── GET todos los datos del catálogo para el configurador ────────────────────
const obtenerDatosConfiguracion = async () => {
  const [tipos, estilos, centros, adicionales] = await Promise.all([

    pool.query(
      `SELECT tipo_id, tipo_codigo, tipo_nombre, tipo_icono, descripcion
       FROM eqim_catalogo.tipos_evento
       WHERE activo = true
       ORDER BY orden_display ASC`
    ),

    pool.query(
      `SELECT estilo_id, estilo_codigo, nombre, descripcion,
              imagen_url, costo_adicional
       FROM eqim_catalogo.estilos_decoracion
       WHERE activo = true
       ORDER BY estilo_id ASC`
    ),

    pool.query(
      `SELECT centro_id, nombre, descripcion,
              imagen_url, costo_por_mesa
       FROM eqim_catalogo.centros_mesa
       WHERE activo = true
       ORDER BY centro_id ASC`
    ),

    pool.query(
      `SELECT adicional_id, nombre, descripcion,
              precio_unitario, unidad, categoria, imagen_url
       FROM eqim_catalogo.servicios_adicionales
       WHERE activo = true
       ORDER BY categoria, adicional_id ASC`
    ),
  ]);

  return {
    tipos_evento:          tipos.rows,
    estilos_decoracion:    estilos.rows,
    centros_mesa:          centros.rows,
    servicios_adicionales: adicionales.rows,
  };
};


// ── CREAR / actualizar sesión del configurador ────────────────────────────────
/**
 * Upsert de la sesión: si ya existe una sesión activa del usuario la actualiza,
 * si no existe crea una nueva.
 *
 * @param {number|null} usuarioId   - req.user.id (null si anónimo)
 * @param {Object}      datos       - campos de eqim_configurador.sesiones
 * @param {string}      ipOrigen    - req.ip
 * @param {string}      userAgent   - req.headers['user-agent']
 * @param {number|null} sesionId    - ID de sesión existente (para actualizar)
 */
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
    servicios        = [],   // [{adicional_id, cantidad, precio_snapshot}]
  } = datos;

  // Validación: mínimo 100 personas (regla de negocio de la Quinta)
  if (num_invitados < 100) {
    const err = new Error('El mínimo de invitados es 100 personas.');
    err.statusCode = 400;
    throw err;
  }

  let sesion;

  // ── UPDATE si ya hay sesión activa ────────────────────────────────────────
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

  // ── INSERT si es sesión nueva ─────────────────────────────────────────────
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

  // ── Sincronizar servicios adicionales ─────────────────────────────────────
  if (servicios.length > 0) {
    // Borrar los servicios actuales de esta sesión y reinsertar
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
    // Si se envía array vacío en un update, eliminar los servicios
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
/**
 * Calcula el precio desde la BD para que el frontend nunca pueda
 * manipular los precios.
 */
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

  // Precio del paquete
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

  // Precio centro de mesa (num_mesas lo calculamos: personas / 8 redondeado)
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

  // Precio servicios adicionales
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

module.exports = {
  obtenerDatosConfiguracion,
  guardarSesion,
  obtenerSesion,
  calcularPrecioTotal,
};
