'use strict';
const path   = require('path');
const fs     = require('fs');
const crypto = require('crypto');

// =============================================================================
//  ALMACENAMIENTO DE IMÁGENES — EventPlanner QIM
//
//  PRODUCCIÓN: Cloudinary (variable CLOUDINARY_URL). El disco de los hostings
//  gratuitos se borra en cada reinicio, así que las imágenes no pueden vivir ahí.
//  LOCAL: si no hay CLOUDINARY_URL se guardan en backend/public/uploads.
//
//  Todas las subidas pasan por aquí: valida el tipo real del archivo (por sus
//  primeros bytes, no por lo que diga el navegador), limita el tamaño y genera
//  el nombre del archivo en el servidor.
// =============================================================================

const UPLOADS_DIR = path.join(__dirname, '../../public/uploads');
const MAX_BYTES   = 5 * 1024 * 1024;  // 5 MB
const CARPETAS    = new Set(['galeria', 'paquetes', 'tipos', 'estilos', 'centros', 'extras', 'perfiles']);

const usarCloudinary = () => !!process.env.CLOUDINARY_URL;

let cloudinary = null;
const getCloudinary = () => {
  if (!cloudinary) cloudinary = require('cloudinary').v2;  // lee CLOUDINARY_URL solo
  return cloudinary;
};

const errorValidacion = (msg) => Object.assign(new Error(msg), { statusCode: 400 });

// Firma de los primeros bytes de cada formato permitido
const detectarFormato = (buf) => {
  if (buf.length < 12) return null;
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return 'jpg';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return 'png';
  if (buf.toString('ascii', 0, 3) === 'GIF') return 'gif';
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
};

/**
 * Valida una imagen en formato data URI (data:image/...;base64,...).
 * @returns {{ formato: string, buffer: Buffer }}
 */
const validarImagenBase64 = (dataUri) => {
  if (typeof dataUri !== 'string' || !/^data:image\/[a-z0-9.+-]+;base64,/i.test(dataUri.slice(0, 40))) {
    throw errorValidacion('Formato de imagen inválido.');
  }
  const buffer = Buffer.from(dataUri.slice(dataUri.indexOf(',') + 1), 'base64');

  if (buffer.length > MAX_BYTES) throw errorValidacion('La imagen no puede superar 5 MB.');

  const formato = detectarFormato(buffer);
  if (!formato) throw errorValidacion('Tipo de imagen no permitido. Usa JPG, PNG, WebP o GIF.');

  return { formato, buffer };
};

/**
 * Guarda una imagen y devuelve su URL pública.
 * @param {string} dataUri  imagen en base64 (data URI)
 * @param {string} carpeta  una de: galeria, paquetes, tipos, estilos, centros, extras, perfiles
 * @returns {Promise<string>} URL absoluta (Cloudinary) o relativa /uploads/... (local)
 */
const guardarImagen = async (dataUri, carpeta) => {
  if (!CARPETAS.has(carpeta)) throw new Error(`Carpeta de imágenes no permitida: ${carpeta}`);
  const { formato, buffer } = validarImagenBase64(dataUri);

  if (usarCloudinary()) {
    const resultado = await getCloudinary().uploader.upload(
      `data:image/${formato === 'jpg' ? 'jpeg' : formato};base64,${buffer.toString('base64')}`,
      { folder: `qim/${carpeta}`, resource_type: 'image' }
    );
    return resultado.secure_url;
  }

  const dir = path.join(UPLOADS_DIR, carpeta);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const nombre = `${carpeta}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${formato}`;
  await fs.promises.writeFile(path.join(dir, nombre), buffer);
  return `/uploads/${carpeta}/${nombre}`;
};

/**
 * Elimina una imagen guardada antes (Cloudinary o disco local).
 * Nunca lanza error: si no se puede borrar, solo lo registra.
 */
const eliminarImagen = async (url) => {
  if (!url || typeof url !== 'string') return;
  try {
    if (url.includes('res.cloudinary.com')) {
      // https://res.cloudinary.com/<cloud>/image/upload/v123/qim/galeria/abc.jpg → qim/galeria/abc
      const m = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z0-9]+$/i);
      if (m && usarCloudinary()) await getCloudinary().uploader.destroy(m[1]);
      return;
    }
    if (!url.startsWith('/uploads/')) return;

    const absoluta = path.resolve(UPLOADS_DIR, url.replace(/^\/uploads\//, ''));
    // Protección: nunca borrar nada fuera de la carpeta de uploads
    if (!absoluta.startsWith(UPLOADS_DIR + path.sep)) return;
    if (fs.existsSync(absoluta)) await fs.promises.unlink(absoluta);
  } catch (err) {
    console.warn('⚠️  No se pudo eliminar la imagen anterior:', err.message);
  }
};

module.exports = { guardarImagen, eliminarImagen, validarImagenBase64, usarCloudinary, UPLOADS_DIR };
