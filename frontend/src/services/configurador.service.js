import api from './api';

/**
 * Servicio del Configurador — Sprint 4
 *
 * Columnas reales usadas de la API (verificadas en el .sql):
 *
 * GET /api/configurador/datos devuelve:
 * {
 *   tipos_evento: [{
 *     tipo_id, tipo_codigo, tipo_nombre, tipo_icono, descripcion
 *   }],
 *   estilos_decoracion: [{
 *     estilo_id, estilo_codigo, nombre, descripcion,
 *     imagen_url, costo_adicional
 *   }],
 *   centros_mesa: [{
 *     centro_id, nombre, descripcion, imagen_url, costo_por_mesa
 *   }],
 *   servicios_adicionales: [{
 *     adicional_id, nombre, descripcion,
 *     precio_unitario, unidad, categoria, imagen_url
 *   }]
 * }
 */

// GET /api/configurador/datos — todos los catálogos en una llamada
export const fetchDatosConfiguracion = async () => {
  const { data } = await api.get('/configurador/datos');
  return data.data;
};

// POST /api/configurador/sesion — crear sesión nueva
export const crearSesion = async (payload) => {
  const { data } = await api.post('/configurador/sesion', payload);
  return data.data; // sesion_id, precio_estimado, etc.
};

// PUT /api/configurador/sesion/:sesionId — actualizar sesión existente
export const actualizarSesion = async (sesionId, payload) => {
  const { data } = await api.put(`/configurador/sesion/${sesionId}`, payload);
  return data.data;
};

// GET /api/configurador/sesion/:sesionId — recuperar sesión
export const getSesion = async (sesionId) => {
  const { data } = await api.get(`/configurador/sesion/${sesionId}`);
  return data.data;
};

// POST /api/configurador/calcular-precio — precio calculado en el servidor
export const calcularPrecioServidor = async ({ paquete_id, num_invitados, centro_mesa_id, servicios }) => {
  const { data } = await api.post('/configurador/calcular-precio', {
    paquete_id, num_invitados, centro_mesa_id, servicios,
  });
  return data.data; // { total, subtotal_paquete, subtotal_mesas, subtotal_adicionales, num_mesas, num_meseros }
};

// ── GET Fechas Ocupadas ──────────────────────────────────────────────────────
export const fetchFechasOcupadas = async () => {
  const { data } = await api.get('/configurador/fechas-ocupadas');
  return data.data; // Devuelve un array de strings: ['2026-08-15', '2026-10-20']
};