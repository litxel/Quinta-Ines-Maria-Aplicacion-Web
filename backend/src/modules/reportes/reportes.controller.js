'use strict';
const svc = require('./reportes.service');

const getIngresos    = async (req, res, next) => { try { res.json({ success: true, data: await svc.getIngresosPorMes() });    } catch(e){ next(e); } };
const getPaquetes    = async (req, res, next) => { try { res.json({ success: true, data: await svc.getPaquetesPopulares() }); } catch(e){ next(e); } };
const getResumen     = async (req, res, next) => { try { res.json({ success: true, data: await svc.getResumen() });           } catch(e){ next(e); } };
const getTiposEvento = async (req, res, next) => { try { res.json({ success: true, data: await svc.getTiposEventoStats() }); } catch(e){ next(e); } };
const getTasa        = async (req, res, next) => { try { res.json({ success: true, data: await svc.getTasaConversion() });    } catch(e){ next(e); } };
const getProximos    = async (req, res, next) => { try { res.json({ success: true, data: await svc.getProximosEventos() });  } catch(e){ next(e); } };

module.exports = { getIngresos, getPaquetes, getResumen, getTiposEvento, getTasa, getProximos };
