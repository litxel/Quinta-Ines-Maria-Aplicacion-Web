import api from './api';
/**
 * Servicio de Galería — Sprint 3
 *
 * JSON de eqim_galeria.imagenes (columnas reales):
 * {
 *   imagen_id:      number,
 *   categoria_id:   number,       ← FK a eqim_galeria.categorias
 *   titulo:         string,
 *   descripcion:    string | null,
 *   url_original:   string,       ← URL completa para lightbox
 *   url_thumbnail:  string,       ← URL miniatura para la grid
 *   url_webp:       string | null,← Versión WebP optimizada
 *   alt_text:       string,       ← WCAG 2.1 - texto alternativo
 *   destacada:      boolean,
 *   orden_display:  number,
 * }
 *
 * JSON de eqim_galeria.categorias:
 * {
 *   categoria_id:  number,
 *   nombre:        string,   // "Matrimonios"
 *   slug:          string,   // "matrimonios"
 *   descripcion:   string | null,
 *   orden_display: number,
 *   activo:        boolean,
 * }
 */

// =============================================================================
// RUTAS PÚBLICAS (PÁGINA WEB)
// =============================================================================

// GET /api/galeria  → todas las imágenes activas
// Query param opcional: ?categoria_id=2
export const fetchImagenes = async (categoriaId = null) => {
  const url = categoriaId && categoriaId !== 0
    ? `/galeria?categoria_id=${categoriaId}`
    : '/galeria';
  const { data } = await api.get(url);
  return data.data;
};

// GET /api/galeria/categorias  → lista de categorías con conteo
export const fetchCategorias = async () => {
  const { data } = await api.get('/galeria/categorias');
  return data.data;
};


// =============================================================================
// RUTAS PRIVADAS (PANEL ADMINISTRADOR)
// =============================================================================

// Obtener todas las imágenes (activas e inactivas) para la tabla del admin
export const getImagenesAdmin = async () => {
  const { data } = await api.get('/galeria/admin');
  return data.data;
};

// Subir una nueva imagen (envía Base64)
export const subirImagen = async (payload) => {
  const { data } = await api.post('/galeria/admin', payload);
  return data.data;
};

// Actualizar detalles (título, descripción, ocultar imagen)
export const actualizarDetallesImagen = async (id, payload) => {
  const { data } = await api.put(`/galeria/admin/${id}`, payload);
  return data.data;
};

// Eliminar imagen de la base de datos
export const eliminarImagen = async (id) => {
  const { data } = await api.delete(`/galeria/admin/${id}`);
  return data;
};

export const crearCategoria = async (payload) => {
  const { data } = await api.post('/galeria/admin/categorias', payload);
  return data.data;
};