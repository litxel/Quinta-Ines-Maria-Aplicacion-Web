import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle2, AlertTriangle, XCircle, Trash2 } from 'lucide-react';
import { useDialogoStore } from '../../store/useDialogoStore';

// Ícono y colores de cada tipo de diálogo
const ESTILOS = {
  info: {
    icono: Sparkles,
    circulo: 'bg-[#B7950B]/10 dark:bg-[#C9A227]/15 text-[#B7950B] dark:text-[#C9A227]',
    halo: 'from-[#C9A227]/40 to-[#A971D6]/30',
    boton: 'btn-primary',
  },
  exito: {
    icono: CheckCircle2,
    circulo: 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    halo: 'from-emerald-400/40 to-[#C9A227]/25',
    boton: 'btn-primary',
  },
  advertencia: {
    icono: AlertTriangle,
    circulo: 'bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400',
    halo: 'from-amber-400/40 to-[#C9A227]/25',
    boton: 'btn-primary',
  },
  error: {
    icono: XCircle,
    circulo: 'bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400',
    halo: 'from-red-400/35 to-[#A971D6]/25',
    boton: 'btn-primary',
  },
  peligro: {
    icono: Trash2,
    circulo: 'bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400',
    halo: 'from-red-400/35 to-[#A971D6]/25',
    boton: 'w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-red-600 to-rose-500 hover:brightness-110 shadow-lg shadow-red-500/25 transition-all',
  },
};

/**
 * Modal único para avisos y confirmaciones (ver utils/dialogos.js).
 * Escape = cancelar · Enter = confirmar · el foco va al botón principal.
 */
export default function DialogoGlobal() {
  const dialogo = useDialogoStore((s) => s.dialogo);
  const cerrar  = useDialogoStore((s) => s.cerrar);
  const botonRef = useRef(null);

  useEffect(() => {
    if (!dialogo) return;
    botonRef.current?.focus();
    const alPresionar = (e) => {
      if (e.key === 'Escape') cerrar(false);
    };
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [dialogo, cerrar]);

  const estilo = ESTILOS[dialogo?.tipo] ?? ESTILOS.info;
  const Icono  = estilo.icono;

  return createPortal(
    <AnimatePresence>
      {dialogo && (
        <motion.div
          key="dialogo"
          className="fixed inset-0 z-[2147483600] flex items-center justify-center p-4 bg-[#0D2137]/55 dark:bg-black/65 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={() => cerrar(false)}
        >
          <motion.div
            role={dialogo.soloAviso ? 'dialog' : 'alertdialog'}
            aria-modal="true"
            aria-labelledby="dialogo-titulo"
            aria-describedby="dialogo-mensaje"
            initial={{ opacity: 0, scale: 0.92, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white dark:bg-[#332247] border border-transparent dark:border-white/8 rounded-3xl p-7 sm:p-8 max-w-md w-full shadow-2xl text-center overflow-hidden"
          >
            {/* Luz decorativa */}
            <span aria-hidden className={`absolute -top-16 left-1/2 -translate-x-1/2 w-56 h-40 rounded-full blur-3xl bg-gradient-to-r ${estilo.halo} opacity-60`} />

            <div className={`relative w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${estilo.circulo}`}>
              <Icono size={30} strokeWidth={1.8} />
            </div>
            <h2 id="dialogo-titulo" className="relative text-2xl font-bold text-[#0D2137] dark:text-white mb-2 font-display">
              {dialogo.titulo}
            </h2>
            {dialogo.mensaje && (
              <p id="dialogo-mensaje" className="relative text-slate-600 dark:text-slate-300 mb-6 leading-relaxed text-sm whitespace-pre-line">
                {dialogo.mensaje}
              </p>
            )}

            <div className={`relative flex gap-3 ${dialogo.soloAviso ? '' : 'flex-col-reverse sm:flex-row'} ${dialogo.mensaje ? '' : 'mt-6'}`}>
              {!dialogo.soloAviso && (
                <button
                  type="button"
                  onClick={() => cerrar(false)}
                  className="w-full px-6 py-3 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-200 bg-slate-100 dark:bg-white/8 hover:bg-slate-200 dark:hover:bg-white/12 transition-colors"
                >
                  {dialogo.textoCancelar}
                </button>
              )}
              <button
                ref={botonRef}
                type="button"
                onClick={() => cerrar(true)}
                className={`w-full justify-center ${estilo.boton}`}
              >
                {dialogo.textoConfirmar}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
