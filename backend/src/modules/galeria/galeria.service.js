'use strict';
const pool = require('../../config/db');

const obtenerImagenesPublicas = async (categoriaId = null) => {
  let query = `
    SELECT imagen_id, url_original, url_thumbnail, titulo, descripcion, alt_text, categoria_id, orden_display
    FROM eqim_galeria.imagenes
    WHERE activo = true
  `;
  const params = [];
  if (categoriaId) {
    params.push(categoriaId);
    query += ` AND categoria_id = $${params.length}`;
  }
  query += ' ORDER BY orden_display ASC, imagen_id ASC';
  const { rows } = await pool.query(query, params);
  return rows;
};

const obtenerTodasImagenesAdmin = async () => {
  const { rows } = await pool.query(
    `SELECT imagen_id, url_original, titulo, categoria_id, orden_display, activo 
     FROM eqim_galeria.imagenes ORDER BY orden_display ASC`
  );
  return rows;
};

const agregarImagen = async ({ url_original, titulo, alt_text, categoria_id, orden_display = 99 }) => {
  const { rows } = await pool.query(
    // Añadimos url_thumbnail a la consulta y usamos $1 para repetir la url_original
    `INSERT INTO eqim_galeria.imagenes (url_original, url_thumbnail, titulo, alt_text, categoria_id, orden_display)
     VALUES ($1, $1, $2, $3, $4, $5) RETURNING *`,
    [url_original, titulo, alt_text, categoria_id, orden_display]
  );
  return rows[0];
};

const actualizarImagen = async (imagenId, datos) => {
  const actual = await pool.query('SELECT * FROM eqim_galeria.imagenes WHERE imagen_id = $1', [imagenId]);
  if (actual.rows.length === 0) { const err = new Error(`Imagen no encontrada.`); err.statusCode = 404; throw err; }

  const { url_original, titulo, alt_text, categoria_id, orden_display, activo } = datos;
  const { rows } = await pool.query(
    `UPDATE eqim_galeria.imagenes
     SET url_original = COALESCE($1, url_original), titulo = COALESCE($2, titulo), alt_text = COALESCE($3, alt_text), categoria_id = COALESCE($4, categoria_id), orden_display = COALESCE($5, orden_display), activo = COALESCE($6, activo)
     WHERE imagen_id = $7 RETURNING *`,
    [url_original ?? null, titulo ?? null, alt_text ?? null, categoria_id ?? null, orden_display ?? null, activo ?? null, imagenId]
  );
  return { anterior: actual.rows[0], actualizado: rows[0] };
};

const eliminarImagen = async (imagenId) => {
  const actual = await pool.query('SELECT * FROM eqim_galeria.imagenes WHERE imagen_id = $1', [imagenId]);
  if (actual.rows.length === 0) { const err = new Error(`Imagen no encontrada.`); err.statusCode = 404; throw err; }
  await pool.query('DELETE FROM eqim_galeria.imagenes WHERE imagen_id = $1', [imagenId]);
  return actual.rows[0];
};

const obtenerCategorias = async () => {
  const { rows } = await pool.query(`SELECT * FROM eqim_galeria.categorias WHERE activo = true`);
  return rows;
};

const crearCategoria = async ({ nombre, descripcion }) => {
  // Generamos un slug automático (Ej: "Fiestas Infantiles" -> "fiestas-infantiles")
  const slug = nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  
  const { rows } = await pool.query(
    `INSERT INTO eqim_galeria.categorias (nombre, slug, descripcion, orden_display, activo)
     VALUES ($1, $2, $3, 99, true) RETURNING *`,
    [nombre, slug, descripcion]
  );
  return rows[0];
};

module.exports = { obtenerImagenesPublicas, obtenerTodasImagenesAdmin, agregarImagen, actualizarImagen, eliminarImagen, obtenerCategorias, crearCategoria};