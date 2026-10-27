import { create } from 'zustand';

/**
 * Diálogo global (reemplaza a window.alert / window.confirm del navegador).
 * Solo hay un diálogo visible a la vez; si se abre otro, el anterior se
 * resuelve como "cancelado".
 *
 * Se usa a través de utils/dialogos.js → confirmar() y avisar().
 */
export const useDialogoStore = create((set, get) => ({
  dialogo: null,   // { tipo, titulo, mensaje, textoConfirmar, textoCancelar, soloAviso, resolver }

  abrir: (opciones) => new Promise((resolver) => {
    get().dialogo?.resolver(false);
    set({ dialogo: { ...opciones, resolver } });
  }),

  cerrar: (resultado) => {
    const actual = get().dialogo;
    if (!actual) return;
    set({ dialogo: null });
    actual.resolver(resultado);
  },
}));
