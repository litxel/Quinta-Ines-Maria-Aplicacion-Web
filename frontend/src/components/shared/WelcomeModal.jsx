import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CalendarDays } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function WelcomeModal() {
  const { user, isAuthenticated } = useAuthStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const key = `qim-welcome-${user.usuario_id ?? user.id ?? user.correo}`;
    if (sessionStorage.getItem(key)) return;
    const timer = setTimeout(() => {
      setVisible(true);
      sessionStorage.setItem(key, '1');
    }, 800);
    return () => clearTimeout(timer);
  }, [isAuthenticated, user]);

  const cerrar = () => setVisible(false);
  if (!user) return null;

  const nombreCorto = user?.nombre_completo?.split(' ')[0] ?? user?.nombre ?? 'amigo/a';
  const esAdmin     = (user?.rol_codigo ?? user?.rol) === 'ADMIN';
  const hora        = new Date().getHours();
  const saludo      = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';
  const fotoUrl     = user?.foto_perfil ? `${BACKEND_URL}${user.foto_perfil}` : null;
  const inicial     = (user?.nombre_completo ?? user?.nombre ?? 'U')[0].toUpperCase();

  const fechaHoy = new Date().toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-[#0D2137]/65 dark:bg-black/75 backdrop-blur-sm"
            onClick={cerrar}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 36 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 290, damping: 24 }}
            className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="pointer-events-auto bg-white dark:bg-[#0C1829] rounded-3xl shadow-2xl dark:shadow-black/60 max-w-sm w-full overflow-hidden border border-slate-100 dark:border-white/8">

              {/* Header */}
              <div className="relative bg-gradient-to-br from-[#0D2137] via-[#1A3A5C] to-[#0D2137] pt-12 pb-16 px-8 text-center overflow-hidden">
                <div className="absolute -top-12 -right-12 w-52 h-52 rounded-full bg-[#C9A227]/18 blur-2xl" />
                <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-[#C9A227]/10 blur-xl" />

                {/* Partículas */}
                {[
                  { emoji: '✨', top: '18%', left: '12%', delay: 0 },
                  { emoji: '🌟', top: '10%', left: '50%', delay: 0.4 },
                  { emoji: '✨', top: '22%', left: '82%', delay: 0.8 },
                ].map((p, i) => (
                  <motion.span
                    key={i}
                    className="absolute text-xl select-none"
                    style={{ top: p.top, left: p.left }}
                    animate={{ y: [0, -10, 0], opacity: [0.55, 1, 0.55] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
                  >
                    {p.emoji}
                  </motion.span>
                ))}

                {/* Avatar */}
                <motion.div
                  initial={{ scale: 0, rotate: -12 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.18, type: 'spring', stiffness: 280, damping: 18 }}
                  className="relative inline-block"
                >
                  <div className="w-24 h-24 rounded-full overflow-hidden mx-auto ring-4 ring-[#C9A227]/55 shadow-2xl">
                    {fotoUrl ? (
                      <img src={fotoUrl} alt={nombreCorto} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#C9A227] to-[#B7950B] flex items-center justify-center text-white text-4xl font-bold">
                        {inicial}
                      </div>
                    )}
                  </div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.38, type: 'spring' }}
                    className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-xs border-2 border-white dark:border-[#0C1829] shadow-lg font-bold ${esAdmin ? 'bg-gradient-to-br from-[#C9A227] to-[#B7950B] text-white' : 'bg-green-500 text-white'}`}
                  >
                    {esAdmin ? '⚡' : '✓'}
                  </motion.div>
                </motion.div>
              </div>

              {/* Body */}
              <div className="px-7 pb-7 -mt-8 relative">
                <div className="bg-white dark:bg-white/4 rounded-2xl shadow-lg dark:shadow-black/20 border border-slate-100 dark:border-white/8 p-6 text-center">
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.28 }}
                    className="text-xs font-bold uppercase tracking-widest text-[#C9A227] mb-1"
                  >
                    {saludo}
                  </motion.p>
                  <motion.h2
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.36 }}
                    className="font-display text-3xl font-bold text-[#0D2137] dark:text-white"
                  >
                    {nombreCorto}
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.44 }}
                    className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mt-2.5"
                  >
                    {esAdmin
                      ? 'Bienvenido al panel de administración de la Quinta Inés María.'
                      : 'Me alegra tenerte de vuelta. ¿Listo para planificar tu evento?'}
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.52 }}
                    className="flex items-center gap-2 mt-4 justify-center"
                  >
                    <CalendarDays size={13} className="text-[#C9A227]" />
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium capitalize">{fechaHoy}</span>
                  </motion.div>
                </div>

                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.56 }}
                  onClick={cerrar}
                  className="mt-4 w-full py-3.5 bg-gradient-to-r from-[#0D2137] to-[#1A3A5C] dark:from-[#C9A227] dark:to-[#D4AF37] text-white dark:text-[#0D2137] font-bold rounded-2xl hover:opacity-90 hover:-translate-y-0.5 transition-all shadow-lg flex items-center justify-center gap-2 text-sm"
                >
                  <Sparkles size={16} />
                  Continuar al inicio
                </motion.button>

                <p className="text-center text-[11px] text-slate-400 dark:text-slate-600 mt-3">
                  Quinta Inés María · Chambo, Chimborazo
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
