import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Store de autenticación — Sprint 5
 *
 * El JWT del backend guarda el ID en la propiedad `id` → req.user.id
 * Usuario almacenado: { id, nombre_completo, correo, rol_codigo, correo_verificado }
 *
 * redirectAfterLogin: guarda la ruta a la que redirigir después del login.
 * Se usa cuando el usuario intenta ir a /solicitar sin estar logueado.
 */
/**
 * Devuelve true si el JWT ya venció (o no se puede leer). Solo lee la fecha
 * de expiración del token: la validez real la sigue decidiendo el backend.
 */
export const tokenExpirado = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
};

export const useAuthStore = create(
  persist(
    (set) => ({
      user:              null,
      token:             null,
      isAuthenticated:   false,
      redirectAfterLogin: null,   // ruta pendiente de visitar

      login: (user, token) => {
        localStorage.setItem('qim_token', token);
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('qim_token');
        set({ user: null, token: null, isAuthenticated: false, redirectAfterLogin: null });
      },

      setRedirectAfterLogin: (ruta) => set({ redirectAfterLogin: ruta }),
      clearRedirect:         ()     => set({ redirectAfterLogin: null }),

      updateUser: (updates) =>
        set((s) => ({ user: { ...s.user, ...updates } })),
    }),
    {
      name: 'qim-auth',
      // Al cargar la app: si el estado dice "con sesión" pero el token falta o ya
      // venció, se limpia todo (evita pantallas a medio cargar y bucles).
      onRehydrateStorage: () => (state) => {
        if (!state?.isAuthenticated) return;
        const token = localStorage.getItem('qim_token');
        if (!token || tokenExpirado(token)) {
          // La página de login muestra "Tu sesión expiró" al ver esta marca
          if (token) { try { sessionStorage.setItem('qim_sesion_expirada', '1'); } catch { /* sin storage */ } }
          state.logout();
        }
      },
      partialize: (s) => ({
        user:             s.user,
        token:            s.token,
        isAuthenticated:  s.isAuthenticated,
        redirectAfterLogin: s.redirectAfterLogin,
      }),
    }
  )
);
