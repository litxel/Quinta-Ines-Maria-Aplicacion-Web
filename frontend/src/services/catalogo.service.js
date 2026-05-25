import api from './api';

/**
 * Servicio de Catálogo — Quinta Inés María
 * Incluye funciones para la vitrina pública (Configurador) y Panel Admin.
 */

// =============================================================================
// RUTAS PÚBLICAS (CONFIGURADOR DEL CLIENTE)
// =============================================================================

export const fetchPaquetes = async () => {
  const { data } = await api.get('/catalogo/paquetes');
  return data.data; 
};

export const fetchPaquetePorCodigo = async (codigo) => {
  const { data } = await api.get(`/catalogo/paquetes/${codigo}`);
  return data.data;
};

export const calcularPrecio = async (codigo, numPersonas) => {
  const { data } = await api.get(`/catalogo/paquetes/${codigo}/precio?personas=${numPersonas}`);
  return data.data; 
};

export const fetchTiposEvento = async () => {
  const { data } = await api.get('/catalogo/tipos-evento');
  return data.data;
};

export const fetchServiciosAdicionales = async () => {
  const { data } = await api.get('/catalogo/servicios-adicionales');
  return data.data;
};

// =============================================================================
// RUTAS PRIVADAS (PANEL ADMINISTRADOR)
// =============================================================================

export const getPaquetesAdmin = async () => {
  const { data } = await api.get('/catalogo/admin/paquetes'); 
  return data.data;
};

export const crearPaquete = async (payload) => {
  const { data } = await api.post('/catalogo/admin/paquetes', payload);
  return data.data;
};

export const actualizarPaquete = async (id, payload) => {
  const { data } = await api.put(`/catalogo/admin/paquetes/${id}`, payload);
  return data.data;
};

export const desactivarPaquete = async (id) => {
  const { data } = await api.delete(`/catalogo/admin/paquetes/${id}`);
  return data;
};

// ── GESTIÓN DE SERVICIOS POR PAQUETE ──────────────────────────────────

// Agregar un servicio a un paquete específico
export const agregarServicioPaquete = async (paqueteId, payload) => {
  // payload debe ser: { nombre_servicio: "Vajilla Corona", descripcion: "..." }
  const { data } = await api.post(`/catalogo/admin/paquetes/${paqueteId}/servicios`, payload);
  return data.data;
};

// Eliminar un servicio de un paquete específico
export const eliminarServicioPaquete = async (paqueteId, servicioId) => {
  const { data } = await api.delete(`/catalogo/admin/paquetes/${paqueteId}/servicios/${servicioId}`);
  return data;
};

// Actualizar un servicio específico de un paquete
export const actualizarServicioPaquete = async (paqueteId, servicioId, payload) => {
  const { data } = await api.put(`/catalogo/admin/paquetes/${paqueteId}/servicios/${servicioId}`, payload);
  return data.data;
};

// =============================================================================
// 🚀 NUEVOS CRUDs PARA EL PANEL MULTIPESTAÑAS (FASE 5)
// =============================================================================

// ─── TIPOS DE EVENTO (Paso 1) ─────────────────────────────────────────────
export const getTiposAdmin = async () => { const { data } = await api.get('/catalogo/admin/tipos-evento'); return data.data; };
export const crearTipo = async (payload) => await api.post('/catalogo/admin/tipos-evento', payload);
export const actualizarTipo = async (id, payload) => await api.put(`/catalogo/admin/tipos-evento/${id}`, payload);
export const desactivarTipo = async (id) => await api.delete(`/catalogo/admin/tipos-evento/${id}`);

// ─── ESTILOS DE DECORACIÓN (Paso 6) ───────────────────────────────────────
export const getEstilosAdmin = async () => { const { data } = await api.get('/catalogo/admin/estilos'); return data.data; };
export const crearEstilo = async (payload) => await api.post('/catalogo/admin/estilos', payload);
export const actualizarEstilo = async (id, payload) => await api.put(`/catalogo/admin/estilos/${id}`, payload);
export const desactivarEstilo = async (id) => await api.delete(`/catalogo/admin/estilos/${id}`);

// ─── CENTROS DE MESA (Paso 6) ─────────────────────────────────────────────
export const getCentrosAdmin = async () => { const { data } = await api.get('/catalogo/admin/centros-mesa'); return data.data; };
export const crearCentro = async (payload) => await api.post('/catalogo/admin/centros-mesa', payload);
export const actualizarCentro = async (id, payload) => await api.put(`/catalogo/admin/centros-mesa/${id}`, payload);
export const desactivarCentro = async (id) => await api.delete(`/catalogo/admin/centros-mesa/${id}`);

// ─── SERVICIOS ADICIONALES / EXTRAS (Paso 7) ──────────────────────────────
export const getExtrasAdmin = async () => { const { data } = await api.get('/catalogo/admin/extras'); return data.data; };
export const crearExtra = async (payload) => await api.post('/catalogo/admin/extras', payload);
export const actualizarExtra = async (id, payload) => await api.put(`/catalogo/admin/extras/${id}`, payload);
export const desactivarExtra = async (id) => await api.delete(`/catalogo/admin/extras/${id}`);