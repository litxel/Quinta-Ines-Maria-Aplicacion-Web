// =============================================================================
//  Imágenes — EventPlanner QIM
//
//  Las fotos de celular pesan 3–10 MB y miden 4000 px o más. Antes de subirlas
//  se reducen en el navegador (máx. 1920 px, buena calidad): pasan a pesar
//  unos 200–500 KB, suben rápido aunque la señal sea mala y nunca chocan con
//  el límite de 5 MB del servidor.
// =============================================================================

const MAX_ARCHIVO_ORIGINAL = 25 * 1024 * 1024;   // fotos más grandes no se intentan procesar

const leerComoDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload  = () => resolve(reader.result);
  reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
  reader.readAsDataURL(file);
});

/**
 * Lee un archivo de imagen y lo devuelve como data URI (base64) ya reducido.
 * - JPG → JPG de calidad 0.85
 * - PNG/WebP (pueden tener transparencia) → WebP de calidad 0.9 (o PNG si el
 *   navegador no sabe generar WebP)
 * - GIF → sin cambios (para no perder la animación)
 *
 * @param {File} file
 * @param {{ maxLado?: number, calidad?: number }} [opciones]
 * @returns {Promise<string>} data URI listo para enviar como imagen_base64
 */
export const leerImagenComprimida = async (file, { maxLado = 1920, calidad = 0.85 } = {}) => {
  if (!file?.type?.startsWith('image/')) throw new Error('El archivo seleccionado no es una imagen.');
  if (file.size > MAX_ARCHIVO_ORIGINAL)  throw new Error('La imagen es demasiado grande (máximo 25 MB).');
  if (file.type === 'image/gif')         return leerComoDataUrl(file);

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload  = () => resolve(i);
      i.onerror = () => reject(new Error('El formato de la imagen no es compatible. Usa JPG, PNG o WebP.'));
      i.src = url;
    });

    const escala = Math.min(1, maxLado / Math.max(img.naturalWidth, img.naturalHeight));
    const ancho  = Math.round(img.naturalWidth * escala);
    const alto   = Math.round(img.naturalHeight * escala);

    const canvas = document.createElement('canvas');
    canvas.width = ancho;
    canvas.height = alto;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, ancho, alto);

    const puedeTenerTransparencia = file.type === 'image/png' || file.type === 'image/webp';
    if (puedeTenerTransparencia) {
      const webp = canvas.toDataURL('image/webp', 0.9);
      return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/png');
    }
    return canvas.toDataURL('image/jpeg', calidad);
  } finally {
    URL.revokeObjectURL(url);
  }
};
