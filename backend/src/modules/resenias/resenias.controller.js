'use strict';
const svc = require('./resenias.service');

// GET /api/resenias — listado público de reseñas de la comunidad.
const listar = async (req, res, next) => {
  try {
    const data = await svc.obtenerResenasPublicas();
    return res.json({ success: true, total: data.length, data });
  } catch (err) { next(err); }
};

// POST /api/resenias — crea una reseña (requiere usuario autenticado).
const crear = async (req, res, next) => {
  try {
    const { calificacion, comentario } = req.body;
    const nueva = await svc.crearResena({ usuarioId: req.user.id, calificacion, comentario });
    return res.status(201).json({ success: true, message: '¡Gracias por tu reseña!', data: nueva });
  } catch (err) { next(err); }
};

// GET /api/resenias/google — reseñas reales de Google Maps (cacheadas).
const googleReviews = async (req, res, next) => {
  try {
    const data = await svc.obtenerResenasGoogle();
    return res.json({ success: true, data });
  } catch (err) { next(err); }
};

module.exports = { listar, crear, googleReviews };
