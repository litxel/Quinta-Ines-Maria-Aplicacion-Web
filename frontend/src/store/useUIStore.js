import { create } from 'zustand';

/**
 * Estado de UI compartido entre componentes que no tienen relación de padre/hijo.
 * Se usa para evitar la colisión visual entre el chat del Asistente IA (dentro del
 * Configurador) y el botón flotante global de WhatsApp (FloatingActionButtons).
 */
export const useUIStore = create((set) => ({
  asistenteAbierto: false,
  setAsistenteAbierto: (valor) => set({ asistenteAbierto: valor }),
  // Mientras el menú del usuario (Navbar) está abierto, los botones flotantes
  // se ocultan para no taparlo.
  menuUsuarioAbierto: false,
  setMenuUsuarioAbierto: (valor) => set({ menuUsuarioAbierto: valor }),
}));
