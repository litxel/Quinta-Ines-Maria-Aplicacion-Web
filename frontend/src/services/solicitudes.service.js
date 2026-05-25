import api from './api';

// =============================================================================
//  SERVICIO DE SOLICITUDES — Frontend EventPlanner QIM
//  Usa el interceptor de axios (api.js) que agrega el Bearer token.
// =============================================================================

// ── Crear solicitud (cliente) ─────────────────────────────────────────────────
export const crearSolicitudRequest = async (payload) => {
  const { data } = await api.post('/solicitudes', payload);
  return data.data;
};

// ── Mis solicitudes (cliente) ─────────────────────────────────────────────────
export const getMisSolicitudes = async () => {
  const { data } = await api.get('/solicitudes/mis-solicitudes');
  return data.data; // array de solicitudes
};

// ── Detalle de una solicitud ──────────────────────────────────────────────────
export const getSolicitudDetalle = async (id) => {
  const { data } = await api.get(`/solicitudes/${id}`);
  return data.data;
};

// ── Todas las solicitudes (admin) ─────────────────────────────────────────────
// Parámetros: { estado?, pagina?, limite? }
export const getTodasSolicitudes = async (params = {}) => {
  const { data } = await api.get('/solicitudes', { params });
  return data; // { solicitudes, total, pagina, totalPaginas }
};

// ── Dashboard (admin) ─────────────────────────────────────────────────────────
export const getDashboardData = async () => {
  const { data } = await api.get('/solicitudes/dashboard');
  return data.data; // { resumen, ultimas }
};

// ── Cambiar estado (admin) ────────────────────────────────────────────────────
export const actualizarEstadoSolicitud = async (id, estado, observaciones = null) => {
  const { data } = await api.put(`/solicitudes/${id}/estado`, { estado, observaciones });
  return data.data;
};
