import api from './api';

export const getResumenReportes   = async () => { const { data } = await api.get('/reportes/resumen');           return data; };
export const getIngresosReportes  = async () => { const { data } = await api.get('/reportes/ingresos');          return data; };
export const getPaquetesReportes  = async () => { const { data } = await api.get('/reportes/paquetes');          return data; };
export const getTiposReportes     = async () => { const { data } = await api.get('/reportes/tipos-evento');      return data; };
export const getTasaConversion    = async () => { const { data } = await api.get('/reportes/tasa-conversion');   return data; };
export const getProximosEventos   = async () => { const { data } = await api.get('/reportes/proximos-eventos');  return data; };
