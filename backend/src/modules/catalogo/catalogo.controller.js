'use strict';
const svc     = require('./catalogo.service');
const auditoria = require('../../utils/auditoria.service');

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
    const { paquete_nombre, paquete_codigo, descripcion, precio_persona, minimo_invitados, color_principal, orden_display } = req.body;
    const nuevo = await svc.crearPaquete({ paquete_nombre, paquete_codigo, descripcion, precio_persona, minimo_invitados, color_principal, orden_display });

    await auditoria.registrarLogOperacion({
      schemaTabla: 'eqim_catalogo.paquetes',
      operacion: 'INSERT',
      usuarioId: req.user.id,
      datosNuevos: nuevo,
      ipOrigen: req.ip,
      userAgent: req.headers['user-agent'],
      descripcion: `Paquete creado: ${nuevo.paquete_codigo}`,
    });

    return res.status(201).json({ success: true, message: 'Paquete creado.', data: nuevo });
  } catch (err) { next(err); }
};

const actualizarPaquete = async (req, res, next) => {
  try {
    const paqueteId = parseInt(req.params.id, 10);
    const { anterior, actualizado } = await svc.actualizarPaquete(paqueteId, req.body);

    await auditoria.registrarLogOperacion({
      schemaTabla: 'eqim_catalogo.paquetes',
      operacion: 'UPDATE',
      usuarioId: req.user.id,
      datosAnteriores: anterior,
      datosNuevos: actualizado,
      ipOrigen: req.ip,
      userAgent: req.headers['user-agent'],
      descripcion: `Paquete actualizado: ${actualizado.paquete_codigo}`,
    });

    return res.json({ success: true, message: 'Paquete actualizado.', data: actualizado });
  } catch (err) { next(err); }
};

const desactivarPaquete = async (req, res, next) => {
  try {
    const paqueteId = parseInt(req.params.id, 10);
    const anterior = await svc.desactivarPaquete(paqueteId);

    await auditoria.registrarLogOperacion({
      schemaTabla: 'eqim_catalogo.paquetes',
      operacion: 'UPDATE',
      usuarioId: req.user.id,
      datosAnteriores: anterior,
      datosNuevos: { activo: false },
      ipOrigen: req.ip,
      userAgent: req.headers['user-agent'],
      descripcion: `Paquete desactivado: ${anterior.paquete_codigo}`,
    });

    return res.json({ success: true, message: `Paquete desactivado.` });
  } catch (err) { next(err); }
};

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

    await auditoria.registrarLogOperacion({
      schemaTabla: 'eqim_catalogo.paquete_servicios',
      operacion: 'INSERT',
      usuarioId: req.user.id,
      datosNuevos: nuevo,
      ipOrigen: req.ip,
      userAgent: req.headers['user-agent'],
      descripcion: `Servicio agregado`,
    });

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

module.exports = { listarPaquetesPublicos, detallePaquete, calcularPrecioPaquete, listarServiciosDePaquete, listarPaquetesAdmin, crearPaquete, actualizarPaquete, desactivarPaquete, agregarServicio, actualizarServicio, eliminarServicio };