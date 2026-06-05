import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send } from 'lucide-react';
import { whatsappUrl, WHATSAPP_NUMERO } from '../../config/contacto';

const RUTAS_OCULTAS = ['/login', '/register', '/auth/callback', '/recuperar-clave', '/nueva-clave', '/verificar-cuenta'];

// Ícono SVG oficial de WhatsApp
function WhatsAppIcon({ size = 26, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

export default function FloatingActionButtons() {
  const { pathname } = useLocation();
  const [chatAbierto, setChatAbierto] = useState(false);
  const [notifVisible, setNotifVisible] = useState(false);

  // Mostrar notificación automática después de 3 segundos para llamar la atención
  useEffect(() => {
    if (pathname.startsWith('/admin')) return;
    if (RUTAS_OCULTAS.some((r) => pathname.startsWith(r))) return;
    const timer = setTimeout(() => setNotifVisible(true), 3000);
    return () => clearTimeout(timer);
  }, [pathname]);

  if (pathname.startsWith('/admin')) return null;
  if (RUTAS_OCULTAS.some((r) => pathname.startsWith(r))) return null;

  const enConfigurador = pathname.startsWith('/configurador');

  const mensajeWhatsApp = 'Hola Quinta Inés María 👋, me gustaría obtener información sobre los eventos y paquetes disponibles.';
  const urlFinal = whatsappUrl(mensajeWhatsApp);

  const handleAbrirChat = () => {
    setChatAbierto(true);
    setNotifVisible(false);
  };

  return (
    <div className={`fixed right-5 z-40 flex flex-col items-end gap-3 ${enConfigurador ? 'bottom-28' : 'bottom-5'}`}>

      {/* Botón Cotizar Evento */}
      {!enConfigurador && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Link
            to="/configurador"
            className="group flex items-center gap-2 pl-4 pr-5 py-3.5 bg-[#0D2137] text-white rounded-full shadow-2xl hover:bg-[#1A6BAC] hover:shadow-[#0D2137]/30 transition-all hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#B7950B] focus:ring-offset-2"
            aria-label="Cotizar o configurar evento"
          >
            <Sparkles size={20} className="text-[#B7950B] group-hover:animate-pulse" />
            <span className="font-bold text-sm hidden sm:inline">Cotizar evento</span>
          </Link>
        </motion.div>
      )}

      {/* Panel del Chat WhatsApp */}
      <AnimatePresence>
        {chatAbierto && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="w-80 bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
            style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.04)' }}
          >
            {/* Header verde WhatsApp */}
            <div className="bg-[#25D366] px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 border-2 border-white/40">
                  <WhatsAppIcon size={24} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm leading-tight">Quinta Inés María</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 bg-white/80 rounded-full animate-pulse" />
                    <p className="text-white/90 text-xs">Responde rápidamente</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setChatAbierto(false)}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
                aria-label="Cerrar chat"
              >
                <X size={16} className="text-white" />
              </button>
            </div>

            {/* Fondo estilo chat de WhatsApp */}
            <div className="bg-[#E5DDD5] px-4 py-5" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cpath fill='%23b2a99a' fill-opacity='0.15' d='M30 0C13.4 0 0 13.4 0 30s13.4 30 30 30 30-13.4 30-30S46.6 0 30 0zm0 55C16.2 55 5 43.8 5 30S16.2 5 30 5s25 11.2 25 25-11.2 25-25 25z'/%3E%3C/svg%3E")`
            }}>
              {/* Burbuja de mensaje de bienvenida */}
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                  <WhatsAppIcon size={16} className="text-white" />
                </div>
                <div className="max-w-[200px]">
                  <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <p className="text-[#0D2137] text-sm leading-relaxed">
                      ¡Hola! 👋 Soy el equipo de <strong>Quinta Inés María</strong>. ¿En qué puedo ayudarte hoy?
                    </p>
                    <p className="text-[10px] text-slate-400 text-right mt-1.5">
                      {new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })} ✓✓
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 ml-1">Equipo QIM</p>
                </div>
              </div>

              {/* Segunda burbuja */}
              <div className="flex items-start gap-2.5 mt-3">
                <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                  <WhatsAppIcon size={16} className="text-white" />
                </div>
                <div className="max-w-[220px]">
                  <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <p className="text-[#0D2137] text-sm leading-relaxed">
                      Contamos con paquetes para <strong>bodas, quince años, eventos corporativos</strong> y más. 🎉
                    </p>
                    <p className="text-[10px] text-slate-400 text-right mt-1.5">
                      {new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })} ✓✓
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Botón de acción */}
            <div className="px-4 py-4 bg-white border-t border-slate-100">
              <a
                href={urlFinal}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-3 py-3.5 bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-[#25D366]/40 hover:-translate-y-0.5 active:translate-y-0 text-sm"
                aria-label="Iniciar conversación en WhatsApp"
              >
                <WhatsAppIcon size={20} className="text-white" />
                Iniciar conversación
                <Send size={15} />
              </a>
              <p className="text-center text-[10px] text-slate-400 mt-2.5">
                Serás redirigido a WhatsApp
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón flotante principal de WhatsApp */}
      <div className="relative">
        {/* Badge de notificación */}
        <AnimatePresence>
          {notifVisible && !chatAbierto && (
            <motion.div
              initial={{ opacity: 0, x: 10, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 10, scale: 0.8 }}
              className="absolute right-16 top-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl px-3.5 py-2.5 whitespace-nowrap border border-slate-100 flex items-center gap-2"
              style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
            >
              <WhatsAppIcon size={14} className="text-[#25D366] flex-shrink-0" />
              <p className="text-xs font-bold text-[#0D2137]">¿Tienes alguna duda?</p>
              {/* Flecha apuntando al botón */}
              <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rotate-45 border-r border-t border-slate-100" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dot de notificación (badge rojo "1") */}
        {!chatAbierto && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 3.2, type: 'spring', stiffness: 500 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg z-10 border-2 border-white"
          >
            1
          </motion.span>
        )}

        <motion.button
          onClick={handleAbrirChat}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          transition={{ delay: chatAbierto ? 0 : 0.3 }}
          className="flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-2xl hover:bg-[#20BD5A] transition-colors focus:outline-none focus:ring-4 focus:ring-[#25D366]/40 focus:ring-offset-2"
          aria-label="Contactar por WhatsApp"
          title="Contactar por WhatsApp"
          style={{ boxShadow: '0 8px 30px rgba(37, 211, 102, 0.45)' }}
        >
          {chatAbierto ? (
            <X size={26} className="text-white" />
          ) : (
            <WhatsAppIcon size={28} className="text-white" />
          )}
        </motion.button>
      </div>
    </div>
  );
}
