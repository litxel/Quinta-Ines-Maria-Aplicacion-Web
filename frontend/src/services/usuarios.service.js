import api from './api';

// ── Admin: gestión de usuarios ───────────────────────────────────────────────
export const getClientes = async ({ busqueda = '', pagina = 1, limite = 20 } = {}) => {
  const { data } = await api.get('/usuarios', { params: { busqueda, pagina, limite } });
  return data;
};

export const toggleActivoCliente = async (id) => {
  const { data } = await api.patch(`/usuarios/${id}/toggle`);
  return data;
};

// ── Mi Perfil (cliente / admin) ──────────────────────────────────────────────
export const getMiPerfil = async () => {
  const { data } = await api.get('/usuarios/me');
  return data;
};

export const actualizarMiPerfil = async (payload) => {
  const { data } = await api.put('/usuarios/me', payload);
  return data;
};

export const subirFotoPerfil = async (imagen_base64) => {
  const { data } = await api.post('/usuarios/me/foto', { imagen_base64 });
  return data;
};

export const cambiarMiPassword = async (payload) => {
  const { data } = await api.post('/usuarios/me/cambiar-clave', payload);
  return data;
};
