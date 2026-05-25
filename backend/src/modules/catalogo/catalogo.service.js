'use strict';
const pool = require('../../config/db');

// ============================================================================
//  1. GESTIÓN DE PAQUETES (Intacto de tu versión original)
// ============================================================================
const obtenerPaquetesPublicos = async () => {
  const { rows } = await pool.query(
    `SELECT p.paquete_id, p.paquete_nombre, p.paquete_codigo, p.descripcion, p.precio_persona, p.minimo_invitados, p.color_principal, p.orden_display, COALESCE(json_agg(json_build_object('servicio_id', ps.servicio_id, 'servicio_nombre', ps.nombre_servicio, 'servicio_descripcion', ps.descripcion) ORDER BY ps.orden_display ASC, ps.servicio_id ASC) FILTER (WHERE ps.servicio_id IS NOT NULL), '[]') AS servicios FROM eqim_catalogo.paquetes p LEFT JOIN eqim_catalogo.paquete_servicios ps ON ps.paquete_id = p.paquete_id WHERE p.activo = true GROUP BY p.paquete_id ORDER BY p.orden_display ASC`
  );
  return rows;
};

const obtenerPaquetePorCodigo = async (codigo) => {
  const { rows } = await pool.query(
    `SELECT p.paquete_id, p.paquete_nombre, p.paquete_codigo, p.descripcion, p.precio_persona, p.minimo_invitados, p.color_principal, p.orden_display, COALESCE(json_agg(json_build_object('servicio_id', ps.servicio_id, 'servicio_nombre', ps.nombre_servicio, 'servicio_descripcion', ps.descripcion) ORDER BY ps.orden_display ASC, ps.servicio_id ASC) FILTER (WHERE ps.servicio_id IS NOT NULL), '[]') AS servicios FROM eqim_catalogo.paquetes p LEFT JOIN eqim_catalogo.paquete_servicios ps ON ps.paquete_id = p.paquete_id WHERE p.paquete_codigo = $1 AND p.activo = true GROUP BY p.paquete_id`,
    [codigo.toUpperCase()]
  );
  if (rows.length === 0) { const err = new Error(`Paquete no encontrado.`); err.statusCode = 404; throw err; }
  return rows[0];
};

const obtenerTodosPaquetesAdmin = async () => {
  const { rows } = await pool.query(
    `SELECT p.paquete_id, p.paquete_nombre, p.paquete_codigo, p.descripcion, p.precio_persona, p.minimo_invitados, p.color_principal, p.orden_display, p.activo, COALESCE(json_agg(json_build_object('servicio_id', ps.servicio_id, 'servicio_nombre', ps.nombre_servicio, 'servicio_descripcion', ps.descripcion) ORDER BY ps.orden_display ASC, ps.servicio_id ASC) FILTER (WHERE ps.servicio_id IS NOT NULL), '[]') AS servicios FROM eqim_catalogo.paquetes p LEFT JOIN eqim_catalogo.paquete_servicios ps ON ps.paquete_id = p.paquete_id GROUP BY p.paquete_id ORDER BY p.orden_display ASC`
  );
  return rows;
};

const crearPaquete = async ({ paquete_nombre, paquete_codigo, descripcion, precio_persona, minimo_invitados = 100, color_principal = '#B7950B', orden_display = 99 }) => {
  const existe = await pool.query('SELECT paquete_id FROM eqim_catalogo.paquetes WHERE paquete_codigo = $1', [paquete_codigo.toUpperCase()]);
  if (existe.rows.length > 0) { const err = new Error(`Ya existe un paquete con el código '${paquete_codigo}'.`); err.statusCode = 409; throw err; }
  const { rows } = await pool.query(
    `INSERT INTO eqim_catalogo.paquetes (paquete_nombre, paquete_codigo, descripcion, precio_persona, minimo_invitados, color_principal, orden_display) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [paquete_nombre.trim(), paquete_codigo.toUpperCase(), descripcion, precio_persona, minimo_invitados, color_principal, orden_display]
  );
  return rows[0];
};

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

const desactivarPaquete = async (paqueteId) => {
  const actual = await pool.query('SELECT * FROM eqim_catalogo.paquetes WHERE paquete_id = $1', [paqueteId]);
  if (actual.rows.length === 0) { const err = new Error(`Paquete no encontrado.`); err.statusCode = 404; throw err; }
  await pool.query('UPDATE eqim_catalogo.paquetes SET activo = false WHERE paquete_id = $1', [paqueteId]);
  return actual.rows[0];
};

const obtenerServiciosDePaquete = async (paqueteId) => {
  const { rows } = await pool.query(`SELECT servicio_id, paquete_id, nombre_servicio AS servicio_nombre, descripcion AS servicio_descripcion, orden_display FROM eqim_catalogo.paquete_servicios WHERE paquete_id = $1 ORDER BY orden_display ASC, servicio_id ASC`, [paqueteId]);
  return rows;
};

const agregarServicio = async ({ paqueteId, servicio_nombre, servicio_descripcion }) => {
  const paq = await pool.query('SELECT paquete_id FROM eqim_catalogo.paquetes WHERE paquete_id = $1', [paqueteId]);
  if (paq.rows.length === 0) { const err = new Error(`Paquete no encontrado.`); err.statusCode = 404; throw err; }
  const { rows } = await pool.query(`INSERT INTO eqim_catalogo.paquete_servicios (paquete_id, nombre_servicio, descripcion) VALUES ($1, $2, $3) RETURNING servicio_id, paquete_id, nombre_servicio AS servicio_nombre, descripcion AS servicio_descripcion, orden_display`, [paqueteId, servicio_nombre.trim(), servicio_descripcion]);
  return rows[0];
};

const actualizarServicio = async (servicioId, { servicio_nombre, servicio_descripcion, orden_display }) => {
  const actual = await pool.query('SELECT * FROM eqim_catalogo.paquete_servicios WHERE servicio_id = $1', [servicioId]);
  if (actual.rows.length === 0) { const err = new Error(`Servicio no encontrado.`); err.statusCode = 404; throw err; }
  const { rows } = await pool.query(`UPDATE eqim_catalogo.paquete_servicios SET nombre_servicio = COALESCE($1, nombre_servicio), descripcion = COALESCE($2, descripcion), orden_display = COALESCE($3, orden_display) WHERE servicio_id = $4 RETURNING servicio_id, paquete_id, nombre_servicio AS servicio_nombre, descripcion AS servicio_descripcion, orden_display`, [servicio_nombre ?? null, servicio_descripcion ?? null, orden_display ?? null, servicioId]);
  return { anterior: actual.rows[0], actualizado: rows[0] };
};

const eliminarServicio = async (servicioId) => {
  const actual = await pool.query('SELECT * FROM eqim_catalogo.paquete_servicios WHERE servicio_id = $1', [servicioId]);
  if (actual.rows.length === 0) { const err = new Error(`Servicio no encontrado.`); err.statusCode = 404; throw err; }
  await pool.query('DELETE FROM eqim_catalogo.paquete_servicios WHERE servicio_id = $1', [servicioId]);
  return actual.rows[0];
};

const calcularPrecio = async ({ paqueteCodigo, numPersonas }) => {
  if (numPersonas < 100) { const err = new Error('El mínimo de invitados es 100 personas.'); err.statusCode = 400; throw err; }
  const { rows } = await pool.query(`SELECT paquete_id, paquete_nombre, paquete_codigo, precio_persona, minimo_invitados FROM eqim_catalogo.paquetes WHERE paquete_codigo = $1 AND activo = true`, [paqueteCodigo.toUpperCase()]);
  if (rows.length === 0) { const err = new Error(`Paquete no encontrado.`); err.statusCode = 404; throw err; }
  const p = rows[0];
  const personasEfectivas = Math.max(numPersonas, p.minimo_invitados);
  const subtotal = personasEfectivas * parseFloat(p.precio_persona);
  return { paquete_codigo: p.paquete_codigo, paquete_nombre: p.paquete_nombre, precio_persona: parseFloat(p.precio_persona), num_personas: numPersonas, personas_cobradas: personasEfectivas, subtotal, nota: numPersonas < p.minimo_invitados ? `Se cobra el mínimo de ${p.minimo_invitados} personas.` : null, };
};

// ============================================================================
//  2. NUEVO CRUD: TIPOS DE EVENTO (Paso 1)
// ============================================================================
const obtenerTiposEventoAdmin = async () => {
  const { rows } = await pool.query('SELECT * FROM eqim_catalogo.tipos_evento ORDER BY orden_display ASC');
  return rows;
};
const crearTipoEvento = async ({ tipo_nombre, tipo_codigo, tipo_icono, descripcion, orden_display = 99 }) => {
  const { rows } = await pool.query(
    `INSERT INTO eqim_catalogo.tipos_evento (tipo_nombre, tipo_codigo, tipo_icono, descripcion, orden_display) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [tipo_nombre, tipo_codigo.toUpperCase(), tipo_icono, descripcion, orden_display]
  );
  return rows[0];
};
const actualizarTipoEvento = async (id, datos) => {
  const { tipo_nombre, tipo_codigo, tipo_icono, descripcion, orden_display, activo } = datos;
  const { rows } = await pool.query(
    `UPDATE eqim_catalogo.tipos_evento SET tipo_nombre = COALESCE($1, tipo_nombre), tipo_codigo = COALESCE($2, tipo_codigo), tipo_icono = COALESCE($3, tipo_icono), descripcion = COALESCE($4, descripcion), orden_display = COALESCE($5, orden_display), activo = COALESCE($6, activo) WHERE tipo_id = $7 RETURNING *`,
    [tipo_nombre, tipo_codigo, tipo_icono, descripcion, orden_display, activo, id]
  );
  return rows[0];
};
const desactivarTipoEvento = async (id) => {
  await pool.query('UPDATE eqim_catalogo.tipos_evento SET activo = false WHERE tipo_id = $1', [id]);
};

// ============================================================================
//  3. NUEVO CRUD: ESTILOS DE DECORACIÓN (Paso 6)
// ============================================================================
const obtenerEstilosAdmin = async () => {
  const { rows } = await pool.query('SELECT * FROM eqim_catalogo.estilos_decoracion ORDER BY estilo_id ASC');
  return rows;
};
const crearEstilo = async ({ estilo_codigo, nombre, descripcion, imagen_url, costo_adicional = 0 }) => {
  const { rows } = await pool.query(
    `INSERT INTO eqim_catalogo.estilos_decoracion (estilo_codigo, nombre, descripcion, imagen_url, costo_adicional) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [estilo_codigo.toUpperCase(), nombre, descripcion, imagen_url, costo_adicional]
  );
  return rows[0];
};
const actualizarEstilo = async (id, datos) => {
  const { estilo_codigo, nombre, descripcion, imagen_url, costo_adicional, activo } = datos;
  const { rows } = await pool.query(
    `UPDATE eqim_catalogo.estilos_decoracion SET estilo_codigo = COALESCE($1, estilo_codigo), nombre = COALESCE($2, nombre), descripcion = COALESCE($3, descripcion), imagen_url = COALESCE($4, imagen_url), costo_adicional = COALESCE($5, costo_adicional), activo = COALESCE($6, activo) WHERE estilo_id = $7 RETURNING *`,
    [estilo_codigo, nombre, descripcion, imagen_url, costo_adicional, activo, id]
  );
  return rows[0];
};
const desactivarEstilo = async (id) => {
  await pool.query('UPDATE eqim_catalogo.estilos_decoracion SET activo = false WHERE estilo_id = $1', [id]);
};

// ============================================================================
//  4. NUEVO CRUD: CENTROS DE MESA (Paso 6)
// ============================================================================
const obtenerCentrosAdmin = async () => {
  const { rows } = await pool.query('SELECT * FROM eqim_catalogo.centros_mesa ORDER BY centro_id ASC');
  return rows;
};
const crearCentro = async ({ nombre, descripcion, imagen_url, costo_por_mesa = 0 }) => {
  const { rows } = await pool.query(
    `INSERT INTO eqim_catalogo.centros_mesa (nombre, descripcion, imagen_url, costo_por_mesa) VALUES ($1, $2, $3, $4) RETURNING *`,
    [nombre, descripcion, imagen_url, costo_por_mesa]
  );
  return rows[0];
};
const actualizarCentro = async (id, datos) => {
  const { nombre, descripcion, imagen_url, costo_por_mesa, activo } = datos;
  const { rows } = await pool.query(
    `UPDATE eqim_catalogo.centros_mesa SET nombre = COALESCE($1, nombre), descripcion = COALESCE($2, descripcion), imagen_url = COALESCE($3, imagen_url), costo_por_mesa = COALESCE($4, costo_por_mesa), activo = COALESCE($5, activo) WHERE centro_id = $6 RETURNING *`,
    [nombre, descripcion, imagen_url, costo_por_mesa, activo, id]
  );
  return rows[0];
};
const desactivarCentro = async (id) => {
  await pool.query('UPDATE eqim_catalogo.centros_mesa SET activo = false WHERE centro_id = $1', [id]);
};

// ============================================================================
//  5. NUEVO CRUD: SERVICIOS ADICIONALES / EXTRAS (Paso 7)
// ============================================================================
const obtenerExtrasAdmin = async () => {
  const { rows } = await pool.query('SELECT * FROM eqim_catalogo.servicios_adicionales ORDER BY categoria ASC, adicional_id ASC');
  return rows;
};
const crearExtra = async ({ nombre, descripcion, precio_unitario, unidad = 'unidad', categoria = 'GENERAL', imagen_url }) => {
  const { rows } = await pool.query(
    `INSERT INTO eqim_catalogo.servicios_adicionales (nombre, descripcion, precio_unitario, unidad, categoria, imagen_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [nombre, descripcion, precio_unitario, unidad, categoria, imagen_url]
  );
  return rows[0];
};
const actualizarExtra = async (id, datos) => {
  const { nombre, descripcion, precio_unitario, unidad, categoria, imagen_url, activo } = datos;
  const { rows } = await pool.query(
    `UPDATE eqim_catalogo.servicios_adicionales SET nombre = COALESCE($1, nombre), descripcion = COALESCE($2, descripcion), precio_unitario = COALESCE($3, precio_unitario), unidad = COALESCE($4, unidad), categoria = COALESCE($5, categoria), imagen_url = COALESCE($6, imagen_url), activo = COALESCE($7, activo) WHERE adicional_id = $8 RETURNING *`,
    [nombre, descripcion, precio_unitario, unidad, categoria, imagen_url, activo, id]
  );
  return rows[0];
};
const desactivarExtra = async (id) => {
  await pool.query('UPDATE eqim_catalogo.servicios_adicionales SET activo = false WHERE adicional_id = $1', [id]);
};

module.exports = { 
  obtenerPaquetesPublicos, obtenerPaquetePorCodigo, obtenerTodosPaquetesAdmin, crearPaquete, actualizarPaquete, desactivarPaquete, obtenerServiciosDePaquete, agregarServicio, actualizarServicio, eliminarServicio, calcularPrecio,
  obtenerTiposEventoAdmin, crearTipoEvento, actualizarTipoEvento, desactivarTipoEvento,
  obtenerEstilosAdmin, crearEstilo, actualizarEstilo, desactivarEstilo,
  obtenerCentrosAdmin, crearCentro, actualizarCentro, desactivarCentro,
  obtenerExtrasAdmin, crearExtra, actualizarExtra, desactivarExtra
};