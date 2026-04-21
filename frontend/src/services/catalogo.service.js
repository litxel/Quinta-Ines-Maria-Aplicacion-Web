import api from './api';

/**
 * Servicio de Catálogo — Sprint 3
 *
 * JSON que devuelve la API (columnas reales de eqim_catalogo.paquetes):
 * {
 *   paquete_id:        number,
 *   paquete_codigo:    string,   // "BRONCE" | "SILVER" | "GOLD" | "CORPORATIVO" | "ALFOMBRA"
 *   paquete_nombre:    string,   // "Bronce", "Silver", etc.
 *   descripcion:       string,
 *   precio_persona:    string,   // viene como string desde PostgreSQL DECIMAL
 *   minimo_invitados:  number,   // siempre 100
 *   maximo_invitados:  number | null,
 *   color_principal:   string,   // hex: "#CD7F32"  ← columna real
 *   imagen_url:        string | null,
 *   destacado:         boolean,
 *   orden_display:     number,
 *   servicios: [
 *     {
 *       servicio_id:    number,
 *       nombre_servicio: string,  ← columna real (NO servicio_nombre)
 *       descripcion:    string,
 *       icono:          string | null,
 *       orden_display:  number,
 *     }
 *   ]
 * }
 */

// GET /api/catalogo/paquetes  → lista de paquetes activos con sus servicios
export const fetchPaquetes = async () => {
  const { data } = await api.get('/catalogo/paquetes');
  return data.data; // array de paquetes
};

// GET /api/catalogo/paquetes/:codigo  → detalle de un paquete
export const fetchPaquetePorCodigo = async (codigo) => {
  const { data } = await api.get(`/catalogo/paquetes/${codigo}`);
  return data.data;
};

// GET /api/catalogo/paquetes/:codigo/precio?personas=N
export const calcularPrecio = async (codigo, numPersonas) => {
  const { data } = await api.get(
    `/catalogo/paquetes/${codigo}/precio?personas=${numPersonas}`
  );
  return data.data; // { subtotal, precio_persona, num_personas, ... }
};

// GET /api/catalogo/tipos-evento  → lista de los 12 tipos de evento
export const fetchTiposEvento = async () => {
  const { data } = await api.get('/catalogo/tipos-evento');
  return data.data;
};

// GET /api/catalogo/servicios-adicionales
export const fetchServiciosAdicionales = async () => {
  const { data } = await api.get('/catalogo/servicios-adicionales');
  return data.data;
};
