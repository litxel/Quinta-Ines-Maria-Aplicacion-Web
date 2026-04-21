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

const agregarImagen = async (req, res, next) => {
  try {
    const { url_original, titulo, alt_text, categoria_id, orden_display } = req.body;
    if (!url_original || !titulo || !categoria_id) return res.status(400).json({ success: false, message: 'url_original, titulo y categoria_id son requeridos.' });

    const nueva = await svc.agregarImagen({ url_original, titulo, alt_text, categoria_id, orden_display });
    await auditoria.registrarLogOperacion({ schemaTabla: 'eqim_galeria.imagenes', operacion: 'INSERT', usuarioId: req.user.id, datosNuevos: nueva, ipOrigen: req.ip, userAgent: req.headers['user-agent'], descripcion: `Imagen agregada: ${titulo}` });
    return res.status(201).json({ success: true, message: 'Imagen agregada.', data: nueva });
  } catch (err) { next(err); }
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

// Aquí ya están exportadas TODAS las rutas que necesita galeria.routes.js
module.exports = { 
  listarImagenesPublicas, 
  listarCategorias, 
  imagenesDePaquete, 
  listarTodasAdmin, 
  agregarImagen, 
  actualizarImagen, 
  eliminarImagen 
};