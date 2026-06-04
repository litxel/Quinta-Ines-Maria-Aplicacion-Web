'use strict';
const svc = require('./usuarios.service');

const getClientes = async (req, res, next) => {
  try {
    const { busqueda = '', pagina = 1, limite = 20 } = req.query;
    const data = await svc.listarClientes({ busqueda, pagina: parseInt(pagina), limite: parseInt(limite) });
    res.json({ success: true, ...data });
  } catch (e) { next(e); }
};

const toggleActivo = async (req, res, next) => {
  try {
    const data = await svc.toggleActivoUsuario(parseInt(req.params.id));
    res.json({ success: true, usuario: data });
  } catch (e) { next(e); }
};

const getMiPerfil = async (req, res, next) => {
  try {
    const data = await svc.obtenerPerfil(req.user.id);
    res.json({ success: true, usuario: data });
  } catch (e) { next(e); }
};

const putMiPerfil = async (req, res, next) => {
  try {
    const data = await svc.actualizarPerfil(req.user.id, req.body);
    res.json({ success: true, usuario: data });
  } catch (e) { next(e); }
};

const subirFoto = async (req, res, next) => {
  try {
    const { imagen_base64 } = req.body;
    if (!imagen_base64) {
      return res.status(400).json({ success: false, message: 'No se recibió ninguna imagen.' });
    }
    const data = await svc.subirFotoPerfil(req.user.id, imagen_base64);
    res.json({ success: true, usuario: data, foto_url: data.foto_perfil });
  } catch (e) { next(e); }
};

const cambiarPassword = async (req, res, next) => {
  try {
    await svc.cambiarPassword(req.user.id, req.body);
    res.json({ success: true, message: 'Contraseña actualizada correctamente.' });
  } catch (e) { next(e); }
};

module.exports = { getClientes, toggleActivo, getMiPerfil, putMiPerfil, subirFoto, cambiarPassword };
