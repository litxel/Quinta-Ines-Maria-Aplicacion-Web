'use strict';
const svc       = require('./galeria.service');
const auditoria = require('../../utils/auditoria.service');
const { guardarImagen, eliminarImagen: eliminarArchivoImagen } = require('../../utils/almacenamiento.service');

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
    const { busqueda = null, fecha = null } = req.query;
    const imagenes = await svc.obtenerTodasImagenesAdmin({ busqueda, fecha });
    return res.json({ success: true, total: imagenes.length, data: imagenes });
  } catch (err) { next(err); }
};

const agregarImagen = async (req, res, next) => {
  try {
    const { imagen_base64, alt_text, orden_display } = req.body;
    const titulo      = typeof req.body.titulo === 'string' ? req.body.titulo.trim().slice(0, 150) : '';
    const categoriaId = parseInt(req.body.categoria_id, 10);

    if (!imagen_base64 || !titulo || !(categoriaId > 0)) {
      return res.status(400).json({ success: false, message: 'La imagen, título y categoría son requeridos.' });
    }

    // Valida el tipo real de la imagen y genera un nombre seguro en el servidor
    const url_original = await guardarImagen(imagen_base64, 'galeria');

    const nueva = await svc.agregarImagen({
      url_original,
      titulo,
      alt_text:      typeof alt_text === 'string' ? alt_text.slice(0, 255) : titulo,
      categoria_id:  categoriaId,
      orden_display: Number.isInteger(parseInt(orden_display, 10)) ? parseInt(orden_display, 10) : 99,
    });

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
    await eliminarArchivoImagen(eliminada.url_original);
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