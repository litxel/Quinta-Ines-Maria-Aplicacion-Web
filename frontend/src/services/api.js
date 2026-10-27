import axios from 'axios';
import { useAuthStore, tokenExpirado } from '../store/useAuthStore';

/**
 * Instancia base de Axios para todos los servicios del frontend.
 * En desarrollo el proxy de Vite redirige /api → http://localhost:5000/api
 * En producción VITE_API_URL apunta al backend (p. ej. https://qim-api.onrender.com/api).
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  // Render gratis tarda hasta ~50 s en "despertar" si estuvo inactivo
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// Variable para evitar bucles de redirección si fallan múltiples peticiones a la vez
let isRedirecting = false;

// Rutas donde un 401 significa "datos incorrectos", no "sesión vencida"
const RUTAS_AUTH = /\/auth\/(login|register|recuperar-clave|nueva-clave|reenviar-verificacion|verificar)/;

const cerrarSesionYRedirigir = () => {
  if (isRedirecting) return;
  isRedirecting = true;
  // logout() limpia el token Y el estado persistido (qim-auth); si solo se
  // borrara el token, la app seguiría creyendo que hay sesión y rebotaría
  // entre /login y /admin sin parar.
  useAuthStore.getState().logout();
  window.location.replace('/login?sesion=expirada');
};

// ── Interceptor de request: adjunta JWT si existe y sigue vigente ────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('qim_token');
  if (token) {
    if (tokenExpirado(token)) {
      cerrarSesionYRedirigir();
      return Promise.reject(new axios.CanceledError('Sesión expirada'));
    }
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Interceptor de response: manejo global de errores ────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status  = error.response?.status;
    const url     = error.config?.url ?? '';
    const conSesion = !!error.config?.headers?.Authorization;

    // Solo un 401 de una petición que SÍ llevaba sesión significa que expiró o
    // que la cuenta fue desactivada. Un 401 en /auth/login es "clave incorrecta".
    if (status === 401 && conSesion && !RUTAS_AUTH.test(url)) {
      console.warn('Sesión expirada o token inválido. Redirigiendo a Login...');
      cerrarSesionYRedirigir();
    }

    return Promise.reject(error);
  }
);

export default api;
