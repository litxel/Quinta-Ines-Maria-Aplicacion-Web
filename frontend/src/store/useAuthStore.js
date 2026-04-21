import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Store de autenticación.
 * El JWT guarda el ID del usuario en la propiedad `id` → req.user.id en el backend.
 *
 * Usuario guardado en store:
 * { id, nombre_completo, correo, rol_codigo }
 */
export const useAuthStore = create(
  persist(
    (set) => ({
      user:            null,
      token:           null,
      isAuthenticated: false,

      login: (user, token) => {
        localStorage.setItem('qim_token', token);
        localStorage.setItem('qim_user', JSON.stringify(user));
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('qim_token');
        localStorage.removeItem('qim_user');
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateUser: (updates) =>
        set((state) => ({ user: { ...state.user, ...updates } })),
    }),
    {
      name:    'qim-auth',
      partialize: (state) => ({
        user:  state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
