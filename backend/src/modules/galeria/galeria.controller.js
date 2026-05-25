'use strict';
const svc       = require('./galeria.service');
const auditoria = require('../../utils/auditoria.service');

const listarImagenesPublicas = async (req, res, next) => {
  try {
    const { categoria_id } = req.query;
    const imagenes = await svc.obtenerImagenesPublicas(categoria_id || null);
    return res.json({ success: true, total: imagenes.length, data: imagenes });
  } catch (err) { next(err); }
};

const listarCategorias = async (req, res, next) => {
  try {
    const categorias = await svc.obtenerCategorias();
    return res.json({ success: true, data: categorias });
  } catch (err) { next(err); }
};

// Esta fue la función que se me olvidó ponerte en el controlador anterior
const imagenesDePaquete = async (req, res, next) => {
  try {
    const paqueteId = parseInt(req.params.paqueteId, 10);
    if (isNaN(paqueteId)) return res.status(400).json({ success: false, message: 'ID de paquete inválido.' });
    return res.json({ success: true, data: [] });
  } catch (err) { next(err); }
};

const listarTodasAdmin = async (req, res, next) => {
  try {
    const imagenes = await svc.obtenerTodasImagenesAdmin();
    return res.json({ success: true, total: imagenes.length, data: imagenes });
  } catch (err) { next(err); }
};

const fs = require('fs');
const path = require('path');

const agregarImagen = async (req, res, next) => {
  try {
    const { imagen_base64, titulo, alt_text, categoria_id, orden_display } = req.body;
    
    if (!imagen_base64 || !titulo || !categoria_id) {
      return res.status(400).json({ success: false, message: 'La imagen, título y categoría son requeridos.' });
    }

    // 1. Extraer los datos puros del Base64 (quitar "data:image/jpeg;base64,")
    const base64Data = imagen_base64.replace(/^data:image\/\w+;base64,/, "");
    
    // 2. Generar un nombre único para no sobreescribir fotos (Ej: 1715462529-15-años.jpg)
    const extension = imagen_base64.split(';')[0].split('/')[1] || 'jpg';
    const nombreArchivo = `${Date.now()}-${titulo.replace(/\s+/g, '-').toLowerCase()}.${extension}`;
    
    // 3. Crear la ruta absoluta donde se guardará (backend/public/uploads/galeria/)
    const rutaDirectorio = path.join(__dirname, '../../../public/uploads/galeria');
    const rutaArchivoFisico = path.join(rutaDirectorio, nombreArchivo);

    // Si la carpeta no existe, la crea automáticamente
    if (!fs.existsSync(rutaDirectorio)) {
      fs.mkdirSync(rutaDirectorio, { recursive: true });
    }

    // 4. Guardar el archivo físicamente en el disco duro del servidor
    fs.writeFileSync(rutaArchivoFisico, base64Data, { encoding: 'base64' });

    // 5. La URL que guardaremos en la base de datos (Ej: /uploads/galeria/1715462529-15-años.jpg)
    const url_original = `/uploads/galeria/${nombreArchivo}`;

    // 6. Guardar el registro en PostgreSQL
    const nueva = await svc.agregarImagen({ url_original, titulo, alt_text, categoria_id, orden_display });
    
    await auditoria.registrarLogOperacion({ 
      schemaTabla: 'eqim_galeria.imagenes', operacion: 'INSERT', usuarioId: req.user.id, 
      datosNuevos: nueva, ipOrigen: req.ip, userAgent: req.headers['user-agent'], 
      descripcion: `Imagen agregada: ${titulo}` 
    });
    
    return res.status(201).json({ success: true, message: 'Imagen subida exitosamente.', data: nueva });
  } catch (err) { 
    next(err); 
  }
};

const actualizarImagen = async (req, res, next) => {
  try {
    const imagenId = parseInt(req.params.id, 10);
    const { anterior, actualizado } = await svc.actualizarImagen(imagenId, req.body);
    await auditoria.registrarLogOperacion({ schemaTabla: 'eqim_galeria.imagenes', operacion: 'UPDATE', usuarioId: req.user.id, datosAnteriores: anterior, datosNuevos: actualizado, ipOrigen: req.ip, userAgent: req.headers['user-agent'], descripcion: `Imagen actualizada` });
    return res.json({ success: true, message: 'Imagen actualizada.', data: actualizado });
  } catch (err) { next(err); }
};

const eliminarImagen = async (req, res, next) => {
  try {
    const imagenId = parseInt(req.params.id, 10);
    const eliminada = await svc.eliminarImagen(imagenId);
    await auditoria.registrarLogOperacion({ schemaTabla: 'eqim_galeria.imagenes', operacion: 'DELETE', usuarioId: req.user.id, datosAnteriores: eliminada, ipOrigen: req.ip, userAgent: req.headers['user-agent'], descripcion: `Imagen eliminada` });
    return res.json({ success: true, message: 'Imagen eliminada.' });
  } catch (err) { next(err); }
};
const agregarCategoria = async (req, res, next) => {
  try {
    const { nombre, descripcion } = req.body;
    if (!nombre) return res.status(400).json({ success: false, message: 'El nombre es requerido.' });
    
    // Aquí llamamos a la función que acabas de pegar en el service
    const nueva = await svc.crearCategoria({ nombre, descripcion });
    return res.status(201).json({ success: true, message: 'Categoría creada.', data: nueva });
  } catch (err) { next(err); }
};
// Aquí ya están exportadas TODAS las rutas que necesita galeria.routes.js
module.exports = { 
  listarImagenesPublicas, 
  listarCategorias, 
  imagenesDePaquete, 
  listarTodasAdmin, 
  agregarImagen, 
  actualizarImagen, 
  eliminarImagen,
  agregarCategoria 
};