'use strict';
const pool = require('../../config/db');

// =============================================================================
//  SERVICIO DE RESEÑAS — EventPlanner QIM
//  Tabla: eqim_catalogo.resenias  (ver migración migrate_resenias.js)
//  Las reseñas las dejan usuarios autenticados; se publican al instante
//  (aprobada = true) y se muestran en la vista pública de Reseñas.
// =============================================================================

// Listado público: reseñas aprobadas + activas, con datos del autor.
const obtenerResenasPublicas = async () => {
  const { rows } = await pool.query(`
    SELECT r.resenia_id, r.calificacion, r.comentario, r.creado_en,
           u.nombre_completo, u.foto_perfil
    FROM eqim_catalogo.resenias r
    JOIN eqim_seguridad.usuarios u ON u.usuario_id = r.usuario_id
    WHERE r.aprobada = true AND r.activo = true
    ORDER BY r.creado_en DESC
  `);
  return rows;
};

// Crea una reseña para el usuario autenticado y la devuelve lista para pintar.
const crearResena = async ({ usuarioId, calificacion, comentario }) => {
  const cal = parseInt(calificacion, 10);
  if (!cal || cal < 1 || cal > 5) {
    const e = new Error('La calificación debe estar entre 1 y 5 estrellas.'); e.statusCode = 400; throw e;
  }
  if (!comentario || !comentario.trim()) {
    const e = new Error('El comentario no puede estar vacío.'); e.statusCode = 400; throw e;
  }
  const texto = comentario.trim().slice(0, 1000);

  const { rows } = await pool.query(
    `INSERT INTO eqim_catalogo.resenias (usuario_id, calificacion, comentario)
     VALUES ($1, $2, $3)
     RETURNING resenia_id, calificacion, comentario, creado_en`,
    [usuarioId, cal, texto]
  );

  // Adjuntamos los datos del autor para devolver la tarjeta lista al frontend.
  const autor = await pool.query(
    'SELECT nombre_completo, foto_perfil FROM eqim_seguridad.usuarios WHERE usuario_id = $1',
    [usuarioId]
  );
  return { ...rows[0], ...autor.rows[0] };
};

// =============================================================================
//  ⭐ RESEÑAS REALES DE GOOGLE (Places API)  — con caché en memoria
//  Lee rating + reseñas del negocio usando Place Details. La API Key vive SOLO
//  aquí (backend, .env); el frontend nunca la ve. Si no hay credenciales
//  configuradas, devuelve { configurado:false } y la UI usa las curadas.
//  Variables .env:  GOOGLE_PLACES_API_KEY  y  GOOGLE_PLACE_ID
// =============================================================================
let _googleCache = { data: null, expira: 0 };
const GOOGLE_TTL_MS = 12 * 60 * 60 * 1000; // 12 horas

const obtenerResenasGoogle = async () => {
  const apiKey  = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  // Sin credenciales → respondemos "no configurado" sin romper nada.
  if (!apiKey || !placeId) {
    return { configurado: false, rating: null, total: 0, reviews: [] };
  }

  // Servir de caché para no gastar cuota ni exceder el rate-limit.
  if (_googleCache.data && Date.now() < _googleCache.expira) {
    return _googleCache.data;
  }

  const url = 'https://maps.googleapis.com/maps/api/place/details/json'
    + `?place_id=${encodeURIComponent(placeId)}`
    + '&fields=rating,user_ratings_total,reviews'
    + '&reviews_sort=newest&language=es'
    + `&key=${apiKey}`;

  const resp = await fetch(url);
  const json = await resp.json();

  if (json.status !== 'OK') {
    const e = new Error(`Google Places respondió: ${json.status}${json.error_message ? ' — ' + json.error_message : ''}`);
    e.statusCode = 502;
    throw e;
  }

  const r = json.result || {};
  const reviews = (r.reviews || []).map((rv, i) => ({
    id: `google-${i}`,
    nombre: rv.author_name || 'Usuario de Google',
    inicial: (rv.author_name?.trim()?.[0] || 'G').toUpperCase(),
    color: '#4285F4',
    calificacion: rv.rating,
    fecha: rv.relative_time_description || '',
    ts: rv.time ? rv.time * 1000 : null, // marca de tiempo real (para ordenar por recientes)
    texto: rv.text || '',
    foto: rv.profile_photo_url || null,
    fuente: 'google',
  }));

  const data = { configurado: true, rating: r.rating ?? null, total: r.user_ratings_total ?? 0, reviews };
  _googleCache = { data, expira: Date.now() + GOOGLE_TTL_MS };
  return data;
};

module.exports = { obtenerResenasPublicas, crearResena, obtenerResenasGoogle };
