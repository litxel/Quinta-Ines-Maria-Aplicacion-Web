'use strict';
const svc     = require('./catalogo.service');
const auditoria = require('../../utils/auditoria.service');

// ─── PAQUETES (PÚBLICO Y ADMIN) ────────────────────────────────────────────────
const listarPaquetesPublicos = async (req, res, next) => {
  try {
    const paquetes = await svc.obtenerPaquetesPublicos();
    return res.json({ success: true, total: paquetes.length, data: paquetes });
  } catch (err) { next(err); }
};

const detallePaquete = async (req, res, next) => {
  try {
    const paquete = await svc.obtenerPaquetePorCodigo(req.params.codigo);
    return res.json({ success: true, data: paquete });
  } catch (err) { next(err); }
};

const calcularPrecioPaquete = async (req, res, next) => {
  try {
    const numPersonas = parseInt(req.query.personas, 10);
    if (!numPersonas || isNaN(numPersonas)) {
      return res.status(400).json({ success: false, message: 'El parámetro "personas" es requerido.' });
    }
    const resultado = await svc.calcularPrecio({ paqueteCodigo: req.params.codigo, numPersonas });
    return res.json({ success: true, data: resultado });
  } catch (err) { next(err); }
};

const listarPaquetesAdmin = async (req, res, next) => {
  try {
    const paquetes = await svc.obtenerTodosPaquetesAdmin();
    return res.json({ success: true, total: paquetes.length, data: paquetes });
  } catch (err) { next(err); }
};

const crearPaquete = async (req, res, next) => {
  try {
    const nuevo = await svc.crearPaquete(req.body);
    await auditoria.registrarLogOperacion({ schemaTabla: 'eqim_catalogo.paquetes', operacion: 'INSERT', usuarioId: req.user.id, datosNuevos: nuevo, ipOrigen: req.ip, userAgent: req.headers['user-agent'], descripcion: `Paquete creado` });
    return res.status(201).json({ success: true, message: 'Paquete creado.', data: nuevo });
  } catch (err) { next(err); }
};

const actualizarPaquete = async (req, res, next) => {
  try {
    const { anterior, actualizado } = await svc.actualizarPaquete(parseInt(req.params.id, 10), req.body);
    await auditoria.registrarLogOperacion({ schemaTabla: 'eqim_catalogo.paquetes', operacion: 'UPDATE', usuarioId: req.user.id, datosAnteriores: anterior, datosNuevos: actualizado, ipOrigen: req.ip, userAgent: req.headers['user-agent'], descripcion: `Paquete actualizado` });
    return res.json({ success: true, message: 'Paquete actualizado.', data: actualizado });
  } catch (err) { next(err); }
};

const desactivarPaquete = async (req, res, next) => {
  try {
    const anterior = await svc.desactivarPaquete(parseInt(req.params.id, 10));
    await auditoria.registrarLogOperacion({ schemaTabla: 'eqim_catalogo.paquetes', operacion: 'UPDATE', usuarioId: req.user.id, datosAnteriores: anterior, datosNuevos: { activo: false }, ipOrigen: req.ip, userAgent: req.headers['user-agent'], descripcion: `Paquete ocultado` });
    return res.json({ success: true, message: `Paquete ocultado.` });
  } catch (err) { next(err); }
};

// ─── SERVICIOS DENTRO DEL PAQUETE ──────────────────────────────────────────────
const listarServiciosDePaquete = async (req, res, next) => {
  try {
    const servicios = await svc.obtenerServiciosDePaquete(parseInt(req.params.id, 10));
    return res.json({ success: true, total: servicios.length, data: servicios });
  } catch (err) { next(err); }
};

const agregarServicio = async (req, res, next) => {
  try {
    const { servicio_nombre, servicio_descripcion } = req.body;
    const nuevo = await svc.agregarServicio({ paqueteId: parseInt(req.params.id, 10), servicio_nombre, servicio_descripcion });
    await auditoria.registrarLogOperacion({ schemaTabla: 'eqim_catalogo.paquete_servicios', operacion: 'INSERT', usuarioId: req.user.id, datosNuevos: nuevo, ipOrigen: req.ip, userAgent: req.headers['user-agent'], descripcion: `Servicio agregado` });
    return res.status(201).json({ success: true, message: 'Servicio agregado.', data: nuevo });
  } catch (err) { next(err); }
};

const actualizarServicio = async (req, res, next) => {
  try {
    const { anterior, actualizado } = await svc.actualizarServicio(parseInt(req.params.servicioId, 10), req.body);
    await auditoria.registrarLogOperacion({ schemaTabla: 'eqim_catalogo.paquete_servicios', operacion: 'UPDATE', usuarioId: req.user.id, datosAnteriores: anterior, datosNuevos: actualizado, ipOrigen: req.ip, userAgent: req.headers['user-agent'], descripcion: `Servicio actualizado` });
    return res.json({ success: true, message: 'Servicio actualizado.', data: actualizado });
  } catch (err) { next(err); }
};

const eliminarServicio = async (req, res, next) => {
  try {
    const eliminado = await svc.eliminarServicio(parseInt(req.params.servicioId, 10));
    await auditoria.registrarLogOperacion({ schemaTabla: 'eqim_catalogo.paquete_servicios', operacion: 'DELETE', usuarioId: req.user.id, datosAnteriores: eliminado, ipOrigen: req.ip, userAgent: req.headers['user-agent'], descripcion: `Servicio eliminado` });
    return res.json({ success: true, message: 'Servicio eliminado.' });
  } catch (err) { next(err); }
};

// ─── TIPOS DE EVENTO (Paso 1) ──────────────────────────────────────────────────
const listarTiposEvento = async (req, res, next) => {
  try { return res.json({ success: true, data: await svc.obtenerTiposEventoAdmin() }); } catch (err) { next(err); }
};
const crearTipoEvento = async (req, res, next) => {
  try { return res.status(201).json({ success: true, message: 'Tipo de Evento creado.', data: await svc.crearTipoEvento(req.body) }); } catch (err) { next(err); }
};
const actualizarTipoEvento = async (req, res, next) => {
  try { return res.json({ success: true, message: 'Actualizado.', data: await svc.actualizarTipoEvento(parseInt(req.params.id, 10), req.body) }); } catch (err) { next(err); }
};
const desactivarTipoEvento = async (req, res, next) => {
  try { await svc.desactivarTipoEvento(parseInt(req.params.id, 10)); return res.json({ success: true, message: 'Desactivado.' }); } catch (err) { next(err); }
};

// ─── ESTILOS DE DECORACIÓN (Paso 6) ────────────────────────────────────────────
const listarEstilos = async (req, res, next) => {
  try { return res.json({ success: true, data: await svc.obtenerEstilosAdmin() }); } catch (err) { next(err); }
};
const crearEstilo = async (req, res, next) => {
  try { return res.status(201).json({ success: true, message: 'Estilo creado.', data: await svc.crearEstilo(req.body) }); } catch (err) { next(err); }
};
const actualizarEstilo = async (req, res, next) => {
  try { return res.json({ success: true, message: 'Actualizado.', data: await svc.actualizarEstilo(parseInt(req.params.id, 10), req.body) }); } catch (err) { next(err); }
};
const desactivarEstilo = async (req, res, next) => {
  try { await svc.desactivarEstilo(parseInt(req.params.id, 10)); return res.json({ success: true, message: 'Desactivado.' }); } catch (err) { next(err); }
};

// ─── CENTROS DE MESA (Paso 6) ──────────────────────────────────────────────────
const listarCentrosMesa = async (req, res, next) => {
  try { return res.json({ success: true, data: await svc.obtenerCentrosAdmin() }); } catch (err) { next(err); }
};
const crearCentroMesa = async (req, res, next) => {
  try { return res.status(201).json({ success: true, message: 'Centro de mesa creado.', data: await svc.crearCentro(req.body) }); } catch (err) { next(err); }
};
const actualizarCentroMesa = async (req, res, next) => {
  try { return res.json({ success: true, message: 'Actualizado.', data: await svc.actualizarCentro(parseInt(req.params.id, 10), req.body) }); } catch (err) { next(err); }
};
const desactivarCentroMesa = async (req, res, next) => {
  try { await svc.desactivarCentro(parseInt(req.params.id, 10)); return res.json({ success: true, message: 'Desactivado.' }); } catch (err) { next(err); }
};

// ─── SERVICIOS ADICIONALES / EXTRAS (Paso 7) ───────────────────────────────────
const listarExtras = async (req, res, next) => {
  try { return res.json({ success: true, data: await svc.obtenerExtrasAdmin() }); } catch (err) { next(err); }
};
const crearExtra = async (req, res, next) => {
  try { return res.status(201).json({ success: true, message: 'Extra creado.', data: await svc.crearExtra(req.body) }); } catch (err) { next(err); }
};
const actualizarExtra = async (req, res, next) => {
  try { return res.json({ success: true, message: 'Actualizado.', data: await svc.actualizarExtra(parseInt(req.params.id, 10), req.body) }); } catch (err) { next(err); }
};
const desactivarExtra = async (req, res, next) => {
  try { await svc.desactivarExtra(parseInt(req.params.id, 10)); return res.json({ success: true, message: 'Desactivado.' }); } catch (err) { next(err); }
};

module.exports = { 
  listarPaquetesPublicos, detallePaquete, calcularPrecioPaquete, listarServiciosDePaquete, listarPaquetesAdmin, crearPaquete, actualizarPaquete, desactivarPaquete, agregarServicio, actualizarServicio, eliminarServicio,
  listarTiposEvento, crearTipoEvento, actualizarTipoEvento, desactivarTipoEvento,
  listarEstilos, crearEstilo, actualizarEstilo, desactivarEstilo,
  listarCentrosMesa, crearCentroMesa, actualizarCentroMesa, desactivarCentroMesa,
  listarExtras, crearExtra, actualizarExtra, desactivarExtra
};