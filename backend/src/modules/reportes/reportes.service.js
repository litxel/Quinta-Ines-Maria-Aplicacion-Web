'use strict';
const pool = require('../../config/db');

// ── Ingresos por mes (últimos 6 meses) ────────────────────────────────────────
const getIngresosPorMes = async () => {
  const { rows } = await pool.query(`
    SELECT
      TO_CHAR(DATE_TRUNC('month', fecha_evento), 'YYYY-MM') AS mes,
      TO_CHAR(DATE_TRUNC('month', fecha_evento), 'Mon YYYY') AS mes_label,
      COUNT(*) AS total_eventos,
      COALESCE(SUM(precio_estimado), 0) AS ingresos
    FROM eqim_solicitudes.eqim_solicitudes s
    JOIN eqim_solicitudes.estados est ON est.estado_id = s.estado_id
    WHERE est.codigo IN ('CONFIRMADA', 'COMPLETADA')
      AND fecha_evento >= DATE_TRUNC('month', NOW()) - INTERVAL '5 months'
    GROUP BY 1, 2
    ORDER BY 1
  `);
  return rows;
};

// ── Paquetes más solicitados ───────────────────────────────────────────────────
const getPaquetesPopulares = async () => {
  const { rows } = await pool.query(`
    SELECT p.paquete_nombre AS nombre, COUNT(*) AS total
    FROM eqim_solicitudes.eqim_solicitudes s
    JOIN eqim_catalogo.paquetes p ON p.paquete_id = s.paquete_id
    WHERE s.paquete_id IS NOT NULL
    GROUP BY p.paquete_nombre
    ORDER BY total DESC
    LIMIT 8
  `);
  return rows;
};

// ── Resumen general (KPIs) ─────────────────────────────────────────────────────
const getResumen = async () => {
  const { rows: kpis } = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE est.codigo = 'CONFIRMADA')  AS confirmadas,
      COUNT(*) FILTER (WHERE est.codigo = 'COMPLETADA')  AS completadas,
      COUNT(*) FILTER (WHERE est.codigo = 'PENDIENTE')   AS pendientes,
      COUNT(*) FILTER (WHERE est.codigo = 'EN_REVISION') AS en_revision,
      COUNT(*) FILTER (WHERE est.codigo = 'RECHAZADA')   AS rechazadas,
      COUNT(*) FILTER (WHERE est.codigo = 'CANCELADA')   AS canceladas,
      COUNT(*) AS total_solicitudes,
      COALESCE(SUM(s.precio_estimado) FILTER (WHERE est.codigo IN ('CONFIRMADA','COMPLETADA')), 0) AS ingresos_totales,
      COUNT(DISTINCT s.usuario_id) AS clientes_activos
    FROM eqim_solicitudes.eqim_solicitudes s
    JOIN eqim_solicitudes.estados est ON est.estado_id = s.estado_id
  `);


  const { rows: usuarios } = await pool.query(`
    SELECT COUNT(*) AS total_usuarios
    FROM eqim_seguridad.usuarios u
    JOIN eqim_seguridad.roles r ON r.rol_id = u.rol_id
    WHERE r.rol_codigo = 'CLIENTE'
  `);

  return { ...kpis[0], total_usuarios: usuarios[0].total_usuarios };
};

// ── Tipos de evento más usados ─────────────────────────────────────────────────
const getTiposEventoStats = async () => {
  const { rows } = await pool.query(`
    SELECT te.tipo_nombre AS nombre, COUNT(*) AS total
    FROM eqim_solicitudes.eqim_solicitudes s
    JOIN eqim_catalogo.tipos_evento te ON te.tipo_id = s.tipo_evento_id
    WHERE s.tipo_evento_id IS NOT NULL
    GROUP BY te.tipo_nombre
    ORDER BY total DESC
    LIMIT 8
  `);
  return rows;
};

// ── Tasa de conversión ────────────────────────────────────────────────────────
const getTasaConversion = async () => {
  const { rows } = await pool.query(`
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE est.codigo = 'COMPLETADA') AS completadas,
      CASE WHEN COUNT(*) > 0
        THEN ROUND(COUNT(*) FILTER (WHERE est.codigo = 'COMPLETADA') * 100.0 / COUNT(*), 1)
        ELSE 0
      END AS tasa_conversion
    FROM eqim_solicitudes.eqim_solicitudes s
    JOIN eqim_solicitudes.estados est ON est.estado_id = s.estado_id
  `);
  return rows[0];
};

// ── Próximos 5 eventos del mes ────────────────────────────────────────────────
const getProximosEventos = async () => {
  const { rows } = await pool.query(`
    SELECT
      s.solicitud_id,
      s.numero_solicitud AS numero_cotizacion,
      s.fecha_evento,
      s.num_invitados,
      s.precio_estimado,
      u.nombre_completo AS cliente_nombre,
      te.tipo_nombre,
      p.paquete_nombre,
      est.nombre AS estado_nombre,
      est.color_hex AS estado_color
    FROM eqim_solicitudes.eqim_solicitudes s
    JOIN eqim_solicitudes.estados est ON est.estado_id = s.estado_id
    JOIN eqim_seguridad.usuarios u ON u.usuario_id = s.usuario_id
    LEFT JOIN eqim_catalogo.tipos_evento te ON te.tipo_id = s.tipo_evento_id
    LEFT JOIN eqim_catalogo.paquetes p ON p.paquete_id = s.paquete_id
    WHERE est.codigo IN ('CONFIRMADA', 'PENDIENTE', 'EN_REVISION')
      AND s.fecha_evento >= CURRENT_DATE
      AND s.fecha_evento <= (CURRENT_DATE + INTERVAL '60 days')
    ORDER BY s.fecha_evento ASC
    LIMIT 5
  `);
  return rows;
};

module.exports = {
  getIngresosPorMes, getPaquetesPopulares, getResumen, getTiposEventoStats,
  getTasaConversion, getProximosEventos
};
