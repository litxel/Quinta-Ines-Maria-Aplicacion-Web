import api from './api';

// ── Sanitización mínima en cliente (OWASP — capa adicional) ──────────────────
const sanitize = (str) =>
  typeof str === 'string' ? str.trim().replace(/[<>"'`]/g, '').slice(0, 255) : '';

// ── POST /api/auth/register ───────────────────────────────────────────────────
export const registerRequest = async ({ nombre_completo, correo, password }) => {
  const { data } = await api.post('/auth/register', {
    nombre_completo: sanitize(nombre_completo),
    correo:          sanitize(correo).toLowerCase(),
    password,        // la contraseña no se sanitiza para no mutilar caracteres especiales
  });
  return data;
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
export const loginRequest = async ({ correo, password }) => {
  const { data } = await api.post('/auth/login', {
    correo:   sanitize(correo).toLowerCase(),
    password,
  });
  return data; // { token, usuario: { id, nombre_completo, correo, rol_codigo } }
};

// ── POST /api/auth/recuperar-clave ────────────────────────────────────────────
export const recuperarClaveRequest = async (correo) => {
  const { data } = await api.post('/auth/recuperar-clave', {
    correo: sanitize(correo).toLowerCase(),
  });
  return data;
};

// ── POST /api/auth/nueva-clave ────────────────────────────────────────────────
export const nuevaClaveRequest = async ({ token, password }) => {
  const { data } = await api.post('/auth/nueva-clave', { token, password });
  return data;
};

// ── GET /api/auth/verificar?token=xxx ────────────────────────────────────────
export const verificarCuentaRequest = async (token) => {
  const { data } = await api.get(`/auth/verificar?token=${token}`);
  return data;
};
