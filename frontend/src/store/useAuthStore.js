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
      partialize: (s) => ({
        user:             s.user,
        token:            s.token,
        isAuthenticated:  s.isAuthenticated,
        redirectAfterLogin: s.redirectAfterLogin,
      }),
    }
  )
);
