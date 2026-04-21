import axios from 'axios';

/**
 * Instancia base de Axios para todos los servicios del frontend.
 * En desarrollo el proxy de Vite redirige /api → http://localhost:5000/api
 * En producción cambiar VITE_API_URL en el .env del frontend.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Interceptor de request: adjunta JWT si existe ────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('qim_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Interceptor de response: manejo global de errores ────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado → limpiar sesión y redirigir al login
      localStorage.removeItem('qim_token');
      localStorage.removeItem('qim_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
