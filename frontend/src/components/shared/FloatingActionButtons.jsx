import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send } from 'lucide-react';
import { whatsappUrl, WHATSAPP_NUMERO } from '../../config/contacto';

const RUTAS_OCULTAS = ['/login', '/register', '/auth/callback', '/recuperar-clave', '/nueva-clave', '/verificar-cuenta'];

function WhatsAppIcon({ size = 26, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

export default function FloatingActionButtons() {
  const { pathname } = useLocation();
  const [chatAbierto,   setChatAbierto]   = useState(false);
  const [notifVisible,  setNotifVisible]  = useState(false);

  useEffect(() => {
    if (pathname.startsWith('/admin')) return;
    if (RUTAS_OCULTAS.some((r) => pathname.startsWith(r))) return;
    const timer = setTimeout(() => setNotifVisible(true), 3200);
    return () => clearTimeout(timer);
  }, [pathname]);

  if (pathname.startsWith('/admin')) return null;
  if (RUTAS_OCULTAS.some((r) => pathname.startsWith(r))) return null;

  const enConfigurador = pathname.startsWith('/configurador');
  const mensajeWA = 'Hola Quinta Inés María 👋, me gustaría obtener información sobre los eventos y paquetes disponibles.';
  const urlFinal  = whatsappUrl(mensajeWA);

  const handleAbrirChat  = () => { setChatAbierto(true); setNotifVisible(false); };
  const handleToggleChat = () => { setChatAbierto((v) => !v); setNotifVisible(false); };

  return (
    <div className={`fixed right-5 z-[60] flex flex-col items-end gap-3 ${enConfigurador ? 'bottom-28' : 'bottom-5'}`}>

      {/* Botón Cotizar Evento */}
      {!enConfigurador && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link
            to="/configurador"
            className="animate-glow-gold group flex items-center gap-2 pl-5 pr-6 py-3.5 bg-gradient-to-r from-[#C9A227] via-[#A971D6] to-[#6B3F7A] text-white rounded-full shadow-2xl hover:scale-105 hover:-translate-y-0.5 transition-transform duration-300 focus:outline-none focus:ring-2 focus:ring-[#C9A227] focus:ring-offset-2"
            aria-label="Cotizar o configurar evento"
          >
            <Sparkles size={19} className="text-white group-hover:rotate-12 transition-transform" />
            <span className="font-bold text-sm hidden sm:inline tracking-wide">Cotizar evento</span>
          </Link>
        </motion.div>
      )}

      {/* Panel del Chat WhatsApp */}
      <AnimatePresence>
        {chatAbierto && (
          <motion.div
            initial={{ opacity: 0, scale: 0.82, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.82, y: 24 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="w-80 bg-white dark:bg-[#332247] rounded-3xl overflow-hidden border border-slate-100 dark:border-white/8"
            style={{ boxShadow: '0 28px 64px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.04)' }}
          >
            {/* Header verde */}
            <div className="bg-[#25D366] px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center shrink-0 border-2 border-white/40">
                  <WhatsAppIcon size={24} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-[#2A1238] text-sm leading-tight">Quinta Inés María</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 bg-[#2A1238]/70 rounded-full animate-pulse" />
                    <p className="text-[#3a1f52] text-xs font-semibold">Responde rápidamente</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setChatAbierto(false)}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/28 flex items-center justify-center transition-colors"
                aria-label="Cerrar chat"
              >
                <X size={15} className="text-white" />
              </button>
            </div>

            {/* Fondo estilo chat */}
            <div className="bg-[#E5DDD5] dark:bg-[#2A1C40] px-4 py-5"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cpath fill='%23b2a99a' fill-opacity='0.12' d='M30 0C13.4 0 0 13.4 0 30s13.4 30 30 30 30-13.4 30-30S46.6 0 30 0zm0 55C16.2 55 5 43.8 5 30S16.2 5 30 5s25 11.2 25 25-11.2 25-25 25z'/%3E%3C/svg%3E")` }}
            >
              {[
                '¡Hola! 👋 Soy el equipo de <strong>Quinta Inés María</strong>. ¿En qué puedo ayudarte hoy?',
                'Contamos con paquetes para <strong>bodas, quinceañeras, eventos corporativos</strong> y más. 🎉',
              ].map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className={`flex items-start gap-2.5 ${i > 0 ? 'mt-3' : ''}`}
                >
                  <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <WhatsAppIcon size={15} className="text-white" />
                  </div>
                  <div className="max-w-[210px]">
                    <div className="bg-white dark:bg-[#3E2B57] rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                      <p className="text-[#0D2137] dark:text-white/90 text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: msg }} />
                      <p className="text-[10px] text-slate-400 text-right mt-1.5">
                        {new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })} ✓✓
                      </p>
                    </div>
                    {i === 0 && <p className="text-[10px] text-slate-500 mt-1 ml-1">Equipo QIM</p>}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Botón acción */}
            <div className="px-4 py-4 bg-white dark:bg-[#332247] border-t border-slate-100 dark:border-white/8">
              <a
                href={urlFinal} target="_blank" rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold rounded-2xl transition-all shadow-lg shadow-[#25D366]/35 hover:shadow-[#25D366]/50 hover:-translate-y-0.5 text-sm"
                aria-label="Iniciar conversación en WhatsApp"
              >
                <WhatsAppIcon size={19} className="text-white" />
                Iniciar conversación
                <Send size={14} />
              </a>
              <p className="text-center text-[10px] text-slate-400 dark:text-slate-600 mt-2.5">
                Serás redirigido a WhatsApp
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón flotante WhatsApp */}
      <div className="relative">
        {/* Tooltip notificación */}
        <AnimatePresence>
          {notifVisible && !chatAbierto && (
            <motion.div
              initial={{ opacity: 0, x: 12, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 12, scale: 0.8 }}
              transition={{ ease: [0.22, 1, 0.36, 1] }}
              className="absolute right-18 top-1/2 -translate-y-1/2 bg-white dark:bg-[#332247] rounded-2xl px-3.5 py-2.5 whitespace-nowrap border border-slate-100 dark:border-white/10 flex items-center gap-2 shadow-xl"
            >
              <WhatsAppIcon size={13} className="text-[#25D366] shrink-0" />
              <p className="text-xs font-bold text-[#0D2137] dark:text-white">¿Tienes alguna duda?</p>
              <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-white dark:bg-[#332247] rotate-45 border-r border-t border-slate-100 dark:border-white/10" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Badge contador */}
        {!chatAbierto && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 3.4, type: 'spring', stiffness: 520 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg z-10 border-2 border-white dark:border-[#221634]"
          >
            1
          </motion.span>
        )}

        {/* Botón principal con pulse ring */}
        <motion.button
          onClick={handleToggleChat}
          initial={{ opacity: 0, scale: 0.75 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.93 }}
          transition={{ delay: chatAbierto ? 0 : 0.35, type: 'spring', stiffness: 300 }}
          className={`relative flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full focus:outline-none focus:ring-4 focus:ring-[#25D366]/40 focus:ring-offset-2 ${!chatAbierto ? 'animate-pulse-ring' : ''}`}
          style={{ boxShadow: '0 8px 32px rgba(37, 211, 102, 0.42)' }}
          aria-label="Contactar por WhatsApp"
        >
          <AnimatePresence mode="wait" initial={false}>
            {chatAbierto ? (
              <motion.span key="x"
                initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }}
              >
                <X size={24} />
              </motion.span>
            ) : (
              <motion.span key="wa"
                initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.18 }}
              >
                <WhatsAppIcon size={27} />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  );
}
