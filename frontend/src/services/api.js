import axios from 'axios';
// Opcional: Si usas Zustand para el estado global (como vi en tu AdminLayout)
// import { useAuthStore } from '../store/useAuthStore';

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

// Variable para evitar bucles de redirección si fallan múltiples peticiones a la vez
let isRedirecting = false;

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
    // Si el error es 401 (No Autorizado) y aún no estamos redirigiendo...
    if (error.response?.status === 401 && !isRedirecting) {
      isRedirecting = true; // Levantamos la bandera para evitar el bucle infinito
      
      console.warn("Sesión expirada o token inválido. Redirigiendo a Login...");
      
      // Limpiar sesión local
      localStorage.removeItem('qim_token');
      localStorage.removeItem('qim_user');
      
      // Forzar la redirección
      window.location.href = '/login';
    }
    
    // Si no es 401 o ya estamos redirigiendo, simplemente rechazamos la promesa
    return Promise.reject(error);
  }
);

export default api;