'use strict';
const pool = require('../../config/db');

// ── GET todos los paquetes activos (público — vitrina) ─────────────────────────
const obtenerPaquetesPublicos = async () => {
  const { rows } = await pool.query(
    `SELECT
       p.paquete_id,
       p.paquete_nombre,
       p.paquete_codigo,
       p.descripcion,
       p.precio_persona,
       p.minimo_invitados,
       p.color_principal,
       p.orden_display,
       COALESCE(
         json_agg(
           json_build_object(
             'servicio_id',          ps.servicio_id,
             'servicio_nombre',      ps.nombre_servicio,
             'servicio_descripcion', ps.descripcion
           )
           ORDER BY ps.orden_display ASC, ps.servicio_id ASC
         ) FILTER (WHERE ps.servicio_id IS NOT NULL),
         '[]'
       ) AS servicios
     FROM eqim_catalogo.paquetes p
     LEFT JOIN eqim_catalogo.paquete_servicios ps
            ON ps.paquete_id = p.paquete_id
     WHERE p.activo = true
     GROUP BY p.paquete_id
     ORDER BY p.orden_display ASC`
  );
  return rows;
};

// ── GET un paquete por codigo (público) ───────────────────────────────────────
const obtenerPaquetePorCodigo = async (codigo) => {
  const { rows } = await pool.query(
    `SELECT
       p.paquete_id,
       p.paquete_nombre,
       p.paquete_codigo,
       p.descripcion,
       p.precio_persona,
       p.minimo_invitados,
       p.color_principal,
       p.orden_display,
       COALESCE(
         json_agg(
           json_build_object(
             'servicio_id',          ps.servicio_id,
             'servicio_nombre',      ps.nombre_servicio,
             'servicio_descripcion', ps.descripcion
           )
           ORDER BY ps.orden_display ASC, ps.servicio_id ASC
         ) FILTER (WHERE ps.servicio_id IS NOT NULL),
         '[]'
       ) AS servicios
     FROM eqim_catalogo.paquetes p
     LEFT JOIN eqim_catalogo.paquete_servicios ps
            ON ps.paquete_id = p.paquete_id
     WHERE p.paquete_codigo = $1 AND p.activo = true
     GROUP BY p.paquete_id`,
    [codigo.toUpperCase()]
  );

  if (rows.length === 0) {
    const err = new Error(`Paquete no encontrado.`);
    err.statusCode = 404;
    throw err;
  }
  return rows[0];
};

// ── GET todos los paquetes (admin — incluye inactivos) ────────────────────────
const obtenerTodosPaquetesAdmin = async () => {
  const { rows } = await pool.query(
    `SELECT
       p.paquete_id,
       p.paquete_nombre,
       p.paquete_codigo,
       p.descripcion,
       p.precio_persona,
       p.minimo_invitados,
       p.color_principal,
       p.orden_display,
       p.activo,
       COALESCE(
         json_agg(
           json_build_object(
             'servicio_id',          ps.servicio_id,
             'servicio_nombre',      ps.nombre_servicio,
             'servicio_descripcion', ps.descripcion
           )
           ORDER BY ps.orden_display ASC, ps.servicio_id ASC
         ) FILTER (WHERE ps.servicio_id IS NOT NULL),
         '[]'
       ) AS servicios
     FROM eqim_catalogo.paquetes p
     LEFT JOIN eqim_catalogo.paquete_servicios ps
            ON ps.paquete_id = p.paquete_id
     GROUP BY p.paquete_id
     ORDER BY p.orden_display ASC`
  );
  return rows;
};

// ── POST crear paquete (admin) ─────────────────────────────────────────────────
const crearPaquete = async ({
  paquete_nombre, paquete_codigo, descripcion, precio_persona,
  minimo_invitados = 100, color_principal = '#B7950B', orden_display = 99,
}) => {
  const existe = await pool.query('SELECT paquete_id FROM eqim_catalogo.paquetes WHERE paquete_codigo = $1', [paquete_codigo.toUpperCase()]);
  if (existe.rows.length > 0) {
    const err = new Error(`Ya existe un paquete con el código '${paquete_codigo}'.`);
    err.statusCode = 409; throw err;
  }
  const { rows } = await pool.query(
    `INSERT INTO eqim_catalogo.paquetes (paquete_nombre, paquete_codigo, descripcion, precio_persona, minimo_invitados, color_principal, orden_display)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [paquete_nombre.trim(), paquete_codigo.toUpperCase(), descripcion, precio_persona, minimo_invitados, color_principal, orden_display]
  );
  return rows[0];
};

// ── PUT actualizar paquete (admin) ─────────────────────────────────────────────
const actualizarPaquete = async (paqueteId, datos) => {
  const actual = await pool.query('SELECT * FROM eqim_catalogo.paquetes WHERE paquete_id = $1', [paqueteId]);
  if (actual.rows.length === 0) { const err = new Error(`Paquete no encontrado.`); err.statusCode = 404; throw err; }

  const { paquete_nombre, descripcion, precio_persona, minimo_invitados, color_principal, orden_display, activo } = datos;
  const { rows } = await pool.query(
    `UPDATE eqim_catalogo.paquetes SET paquete_nombre = COALESCE($1, paquete_nombre), descripcion = COALESCE($2, descripcion), precio_persona = COALESCE($3, precio_persona), minimo_invitados = COALESCE($4, minimo_invitados), color_principal = COALESCE($5, color_principal), orden_display = COALESCE($6, orden_display), activo = COALESCE($7, activo) WHERE paquete_id = $8 RETURNING *`,
    [paquete_nombre ?? null, descripcion ?? null, precio_persona ?? null, minimo_invitados ?? null, color_principal ?? null, orden_display ?? null, activo ?? null, paqueteId]
  );
  return { anterior: actual.rows[0], actualizado: rows[0] };
};

// ── DELETE (desactivar) paquete (admin) ────────────────────────────────────────
const desactivarPaquete = async (paqueteId) => {
  const actual = await pool.query('SELECT * FROM eqim_catalogo.paquetes WHERE paquete_id = $1', [paqueteId]);
  if (actual.rows.length === 0) { const err = new Error(`Paquete no encontrado.`); err.statusCode = 404; throw err; }
  await pool.query('UPDATE eqim_catalogo.paquetes SET activo = false WHERE paquete_id = $1', [paqueteId]);
  return actual.rows[0];
};

// ── GET servicios de un paquete ───────────────────────────────────────────────
const obtenerServiciosDePaquete = async (paqueteId) => {
  const { rows } = await pool.query(
    `SELECT servicio_id, paquete_id, nombre_servicio AS servicio_nombre, descripcion AS servicio_descripcion, orden_display
     FROM eqim_catalogo.paquete_servicios WHERE paquete_id = $1 ORDER BY orden_display ASC, servicio_id ASC`,
    [paqueteId]
  );
  return rows;
};

// ── POST agregar servicio a un paquete (admin) ────────────────────────────────
const agregarServicio = async ({ paqueteId, servicio_nombre, servicio_descripcion }) => {
  const paq = await pool.query('SELECT paquete_id FROM eqim_catalogo.paquetes WHERE paquete_id = $1', [paqueteId]);
  if (paq.rows.length === 0) { const err = new Error(`Paquete no encontrado.`); err.statusCode = 404; throw err; }

  const { rows } = await pool.query(
    `INSERT INTO eqim_catalogo.paquete_servicios (paquete_id, nombre_servicio, descripcion)
     VALUES ($1, $2, $3) RETURNING servicio_id, paquete_id, nombre_servicio AS servicio_nombre, descripcion AS servicio_descripcion, orden_display`,
    [paqueteId, servicio_nombre.trim(), servicio_descripcion]
  );
  return rows[0];
};

// ── PUT actualizar servicio (admin) ───────────────────────────────────────────
const actualizarServicio = async (servicioId, { servicio_nombre, servicio_descripcion, orden_display }) => {
  const actual = await pool.query('SELECT * FROM eqim_catalogo.paquete_servicios WHERE servicio_id = $1', [servicioId]);
  if (actual.rows.length === 0) { const err = new Error(`Servicio no encontrado.`); err.statusCode = 404; throw err; }

  const { rows } = await pool.query(
    `UPDATE eqim_catalogo.paquete_servicios SET nombre_servicio = COALESCE($1, nombre_servicio), descripcion = COALESCE($2, descripcion), orden_display = COALESCE($3, orden_display) WHERE servicio_id = $4 RETURNING servicio_id, paquete_id, nombre_servicio AS servicio_nombre, descripcion AS servicio_descripcion, orden_display`,
    [servicio_nombre ?? null, servicio_descripcion ?? null, orden_display ?? null, servicioId]
  );
  return { anterior: actual.rows[0], actualizado: rows[0] };
};

// ── DELETE servicio (admin) ────────────────────────────────────────────────────
const eliminarServicio = async (servicioId) => {
  const actual = await pool.query('SELECT * FROM eqim_catalogo.paquete_servicios WHERE servicio_id = $1', [servicioId]);
  if (actual.rows.length === 0) { const err = new Error(`Servicio no encontrado.`); err.statusCode = 404; throw err; }
  await pool.query('DELETE FROM eqim_catalogo.paquete_servicios WHERE servicio_id = $1', [servicioId]);
  return actual.rows[0];
};

// ── Calcular precio total según paquete y número de personas ──────────────────
const calcularPrecio = async ({ paqueteCodigo, numPersonas }) => {
  if (numPersonas < 100) { const err = new Error('El mínimo de invitados es 100 personas.'); err.statusCode = 400; throw err; }
  const { rows } = await pool.query(
    `SELECT paquete_id, paquete_nombre, paquete_codigo, precio_persona, minimo_invitados
     FROM eqim_catalogo.paquetes WHERE paquete_codigo = $1 AND activo = true`, [paqueteCodigo.toUpperCase()]
  );
  if (rows.length === 0) { const err = new Error(`Paquete no encontrado.`); err.statusCode = 404; throw err; }
  
  const p = rows[0];
  const personasEfectivas = Math.max(numPersonas, p.minimo_invitados);
  const subtotal          = personasEfectivas * parseFloat(p.precio_persona);

  return {
    paquete_codigo: p.paquete_codigo, paquete_nombre: p.paquete_nombre, precio_persona: parseFloat(p.precio_persona),
    num_personas: numPersonas, personas_cobradas: personasEfectivas, subtotal,
    nota: numPersonas < p.minimo_invitados ? `Se cobra el mínimo de ${p.minimo_invitados} personas.` : null,
  };
};

module.exports = { obtenerPaquetesPublicos, obtenerPaquetePorCodigo, obtenerTodosPaquetesAdmin, crearPaquete, actualizarPaquete, desactivarPaquete, obtenerServiciosDePaquete, agregarServicio, actualizarServicio, eliminarServicio, calcularPrecio };