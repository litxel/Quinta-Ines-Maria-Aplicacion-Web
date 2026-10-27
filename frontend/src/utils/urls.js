// =============================================================================
//  URLs del backend e imágenes — EventPlanner QIM
//
//  VITE_API_URL apunta a la API (p. ej. https://qim-api.onrender.com/api).
//  En desarrollo, si no está definida, se usa '/api' y el proxy de Vite.
// =============================================================================

const API_URL = import.meta.env.VITE_API_URL ?? '/api';

/** URL del backend sin el sufijo /api (ahí viven /uploads y /api/auth/google). */
export const BACKEND_URL = API_URL.replace(/\/api\/?$/, '');

/**
 * Devuelve la URL lista para usar en <img src> o null si no hay imagen.
 *  - Cloudinary: añade f_auto,q_auto (formato y calidad óptimos para cada
 *    dispositivo) y, si se indica, un ancho máximo → fotos mucho más livianas
 *    en celular.
 *  - Rutas /uploads/...: imágenes antiguas guardadas en el servidor.
 *  - Otros valores (p. ej. nombres de iconos antiguos como "/User") → null.
 *
 * @param {string} url
 * @param {number} [ancho] ancho máximo en píxeles (solo Cloudinary)
 */
export const urlImagen = (url, ancho) => {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    const transformacion = `f_auto,q_auto${ancho ? `,c_limit,w_${ancho}` : ''}`;
    return url.replace('/upload/', `/upload/${transformacion}/`);
  }
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/uploads/')) return `${BACKEND_URL}${url}`;
  // Imágenes propias del frontend (importadas desde src/assets)
  if (/\.(jpe?g|png|webp|gif|svg|avif)(\?.*)?$/i.test(url)) return url;
  return null;
};

/** URL para iniciar sesión con un proveedor OAuth (google, microsoft). */
export const urlOAuth = (proveedor) => `${BACKEND_URL}/api/auth/${proveedor}`;
