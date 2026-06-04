import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore';

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

/**
 * Modal de bienvenida que se muestra una vez por sesión al iniciar sesión.
 * Se guarda en sessionStorage para no repetirse en recargas.
 */
export default function WelcomeModal() {
  const { user, isAuthenticated } = useAuthStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Mostrar solo una vez por sesión (no en cada recarga)
    const key = `qim-welcome-${user.usuario_id ?? user.id ?? user.correo}`;
    const yaVisto = sessionStorage.getItem(key);
    if (yaVisto) return;

    // Mostrar con pequeño delay para dejar que la página cargue
    const timer = setTimeout(() => {
      setVisible(true);
      sessionStorage.setItem(key, '1');
    }, 800);

    return () => clearTimeout(timer);
  }, [isAuthenticated, user]);

  const cerrar = () => setVisible(false);

  if (!user) return null;

  const nombreCorto = user?.nombre_completo?.split(' ')[0] ?? user?.nombre ?? 'amigo/a';
  const esAdmin = (user?.rol_codigo ?? user?.rol) === 'ADMIN';
  const hora = new Date().getHours();
  const saludo = hora < 12 ? '¡Buenos días' : hora < 19 ? '¡Buenas tardes' : '¡Buenas noches';

  const fotoUrl = user?.foto_perfil ? `${BACKEND_URL}${user.foto_perfil}` : null;
  const inicial = (user?.nombre_completo ?? user?.nombre ?? 'U')[0].toUpperCase();

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-[#0D2137]/70 backdrop-blur-sm"
            onClick={cerrar}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            className="fixed inset-0 z-[201] flex items-center justify-center p-4"
          >
            <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">

              {/* Cabecera decorativa */}
              <div className="relative bg-gradient-to-br from-[#0D2137] to-[#1A3A5C] pt-12 pb-16 px-8 text-center overflow-hidden">
                {/* Círculos decorativos */}
                <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-[#B7950B]/20" />
                <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-[#B7950B]/10" />

                {/* Estrella / partículas animadas */}
                {['✨', '🌟', '✨'].map((s, i) => (
                  <motion.span
                    key={i}
                    className="absolute text-2xl"
                    style={{ top: `${15 + i * 20}%`, left: `${10 + i * 35}%` }}
                    animate={{ y: [0, -8, 0], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2 + i * 0.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    {s}
                  </motion.span>
                ))}

                {/* Avatar */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 18 }}
                  className="relative inline-block"
                >
                  <div className="w-24 h-24 rounded-full overflow-hidden mx-auto ring-4 ring-[#B7950B]/60 shadow-2xl">
                    {fotoUrl ? (
                      <img src={fotoUrl} alt={nombreCorto} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#B7950B] to-yellow-600 flex items-center justify-center text-white text-3xl font-bold">
                        {inicial}
                      </div>
                    )}
                  </div>
                  {/* Badge de rol */}
                  <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-sm border-2 border-white shadow ${esAdmin ? 'bg-[#B7950B]' : 'bg-green-500'}`}>
                    {esAdmin ? '👑' : '✓'}
                  </div>
                </motion.div>
              </div>

              {/* Cuerpo del modal */}
              <div className="px-8 pb-8 -mt-6 relative">
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 text-center">
                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="font-display text-2xl font-bold text-[#0D2137] mb-1"
                  >
                    {saludo}, {nombreCorto}!
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-slate-500 text-sm leading-relaxed mt-2"
                  >
                    {esAdmin
                      ? 'Me alegra tenerte de vuelta en el panel de administración de la Quinta Inés María.'
                      : 'Me alegra tenerte de vuelta. ¿Listo para planificar un evento especial?'
                    }
                  </motion.p>

                  <div className="flex items-center gap-2 mt-4 justify-center">
                    <div className="w-2 h-2 rounded-full bg-[#B7950B] animate-pulse" />
                    <span className="text-xs text-slate-400 font-medium">
                      {new Date().toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </span>
                  </div>
                </div>

                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  onClick={cerrar}
                  className="mt-5 w-full py-4 bg-gradient-to-r from-[#0D2137] to-[#1A3A5C] text-white font-bold rounded-2xl hover:from-[#1A6BAC] hover:to-[#1A3A5C] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm"
                >
                  <span>✨</span>
                  Continuar al inicio
                </motion.button>

                <p className="text-center text-xs text-slate-400 mt-3">
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
