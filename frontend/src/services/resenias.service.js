import api from './api';

/**
 * Servicio de Reseñas — Quinta Inés María
 * Reseñas propias de la app (guardadas en la base de datos) +
 * estrategia/cascarón para traer reseñas reales de Google Maps y Facebook.
 */

// =============================================================================
//  RESEÑAS PROPIAS (BASE DE DATOS)
// =============================================================================

// Listado público de reseñas de la comunidad QIM.
export const fetchResenias = async () => {
  const { data } = await api.get('/resenias');
  return data.data;
};

// Crea una reseña del usuario autenticado. Devuelve la reseña ya lista.
export const crearResenia = async ({ calificacion, comentario }) => {
  const { data } = await api.post('/resenias', { calificacion, comentario });
  return data.data;
};

// =============================================================================
//  ⭐ ESTRATEGIA GOOGLE / FACEBOOK REVIEWS  (cascarón + plan técnico)
// =============================================================================
/*
  CONTEXTO
  --------
  La "Places API" oficial de Google SÍ permite leer reseñas del negocio
  (campo `reviews` del endpoint Place Details), PERO:
    · Requiere una API Key con facturación activada (tarjeta de crédito).
    · Tiene capa gratuita mensual, pero igualmente exige cuenta de pago.
    · Solo devuelve un máximo de 5 reseñas y no permite republicar/almacenar
      el texto de forma permanente según sus Términos de Servicio.
  Facebook expone las reseñas/recomendaciones vía Graph API, pero está aún
  más restringido: exige una App revisada por Meta y permisos avanzados sobre
  la página. Para un proyecto gratuito no es viable a corto plazo.

  PLAN RECOMENDADO (gratis, por fases)
  ------------------------------------
  FASE 1 — (actual) Reseñas curadas + reseñas propias en DB.
    · Mostramos reseñas reales transcritas manualmente (REVIEWS_GOOGLE /
      REVIEWS_FACEBOOK en Resenias.jsx) + las que dejan los usuarios en la app.
    · CTA con enlaces directos a Google Maps y Facebook para reseñar allí.
    · Mapa embebido de Google (iframe gratuito, sin API Key) que ya muestra
      la calificación pública real del negocio.

  FASE 2 — Widget de terceros (sin programar backend, gratis/freemium).
    · Servicios como Elfsight, Trustindex, Featurable o EmbedSocial generan
      un <script> que incrusta las reseñas REALES de Google/Facebook.
    · Pega el snippet en un componente y listo. Plan gratuito = nº limitado
      de reseñas, suficiente para una PYME.

  FASE 3 — Backend propio con Places API (cuando haya presupuesto/tarjeta).
    · Crear endpoint backend  GET /api/resenias/google  que:
        1) Llama a Place Details con la API Key (guardada en el .env del
           BACKEND, nunca en el frontend) y el place_id de la Quinta.
        2) Cachea la respuesta (p. ej. 12–24 h en DB o memoria) para no
           gastar cuota ni exceder el rate limit en cada visita.
        3) Devuelve { rating, total, reviews[] } normalizado.
    · El frontend solo consume ese endpoint => la API Key queda protegida.

  FASE 4 — Scraping (último recurso, NO recomendado).
    · Técnicamente posible (Puppeteer sobre el perfil público), pero viola
      los ToS de Google/Facebook y es frágil. Evitar salvo prototipo interno.

  CÓMO OBTENER EL place_id (gratis):
    https://developers.google.com/maps/documentation/places/web-service/place-id

  Variables de entorno previstas (FASE 3, en el .env del BACKEND):
    GOOGLE_PLACES_API_KEY=...
    GOOGLE_PLACE_ID=...
*/

// Trae las reseñas REALES de Google a través del proxy del backend
// (GET /api/resenias/google). El backend protege la API Key y cachea la
// respuesta 12h. Devuelve { configurado, rating, total, reviews }.
// Si las credenciales no están configuradas, `configurado` será false y la UI
// usará automáticamente las reseñas curadas como respaldo.
export const fetchGoogleReviews = async () => {
  try {
    const { data } = await api.get('/resenias/google');
    return data.data;
  } catch (err) {
    console.warn('[fetchGoogleReviews] sin conexión / no configurado:', err?.message);
    return { configurado: false, rating: null, total: 0, reviews: [] };
  }
};
