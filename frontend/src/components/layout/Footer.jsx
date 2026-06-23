import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, ChevronRight, Star, Heart, Mail, Phone, MapPin } from 'lucide-react';
import LogoQuinta from '../shared/LogoQuinta';

const LINKS = [
  { to: '/',            label: 'Inicio'         },
  { to: '/paquetes',    label: 'Ver Paquetes'   },
  { to: '/galeria',     label: 'Nuestra Galería' },
  { to: '/resenias',    label: 'Reseñas'        },
  { to: '/configurador', label: 'Cotizar Evento' },
];

/* ── Iluminación ARGB contenida para los ítems de contacto ───────────────────── */
const ICONO_CONTACTO =
  'w-8 h-8 rounded-xl bg-[#C9A227]/10 border border-[#C9A227]/15 flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200 group-hover:bg-gradient-to-br group-hover:from-[#6B3F7A] group-hover:via-[#A971D6] group-hover:to-[#C9A227] group-hover:border-transparent group-hover:shadow-inner group-hover:shadow-white/25';
const TEXTO_CONTACTO =
  'text-[#3a3128] dark:text-white/75 transition-colors duration-200 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-[#6B3F7A] group-hover:via-[#A971D6] group-hover:to-[#C9A227] dark:group-hover:from-[#C9A8E6] dark:group-hover:via-[#F0A8E4] dark:group-hover:to-[#F0D060] group-hover:bg-clip-text';

export default function Footer() {
  const anioActual  = new Date().getFullYear();
  const [hoveredLink, setHoveredLink] = useState(null);

  return (
    <footer className="bg-[#E7D8BD] dark:bg-[#2E2046] text-[#3a3128] dark:text-white relative overflow-hidden border-t border-[#0D2137]/10 dark:border-white/5 transition-colors duration-300">

      {/* Decoraciones de fondo */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-[#C9A227]/6 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-64 rounded-full bg-[#1A6BAC]/5 blur-3xl -translate-x-1/3 translate-y-1/2" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C9A227' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Banda dorada superior */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#C9A227]/50 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 lg:gap-8">

          {/* ── Col 1: Logo Animado ── */}
          <div className="lg:col-span-1 flex flex-col items-center lg:items-start gap-4">
            <motion.div
              className="relative"
              animate={{ y: [0, -7, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <LogoQuinta imgClassName="h-28 w-auto drop-shadow-2xl" glowClassName="-inset-8" />
            </motion.div>

            <div className="text-center lg:text-left">
              <h2 className="font-display text-2xl font-bold leading-tight gradient-text">
                Quinta Inés María
              </h2>
              <p className="text-[10px] text-[#7a6f60] dark:text-white/35 font-bold uppercase tracking-[0.28em] mt-1">
                BED · Catering &amp; Eventos
              </p>
            </div>

            <p className="text-[#6b6053] dark:text-white/45 leading-relaxed text-xs max-w-[220px] text-center lg:text-left">
              Creamos eventos únicos e irrepetibles con el calor del campo ecuatoriano.
            </p>

            {/* Estrellas */}
            <div className="flex items-center gap-1.5">
              {[1,2,3,4,5].map((i) => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.22, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.16, ease: 'easeInOut' }}
                >
                  <Star size={13} fill="#C9A227" stroke="none" />
                </motion.div>
              ))}
              <span className="text-[#7a6f60] dark:text-white/35 text-xs ml-1 font-medium">5.0</span>
            </div>
          </div>

          {/* ── Col 2: Navegación ── */}
          <div className="lg:col-span-1">
            <h4 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#C9A227] mb-5 flex items-center gap-2">
              <div className="w-4 h-px bg-[#C9A227]" />
              Navegación
            </h4>
            <ul className="space-y-1">
              {LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    onMouseEnter={() => setHoveredLink(link.to)}
                    onMouseLeave={() => setHoveredLink(null)}
                    className="group flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-[#5a4f43] dark:text-white/55 transition-all duration-200 hover:bg-gradient-to-r hover:from-[#6B3F7A]/12 hover:via-[#A971D6]/14 hover:to-[#C9A227]/12 hover:shadow-inner hover:shadow-[#A971D6]/15"
                  >
                    <motion.div animate={{ x: hoveredLink === link.to ? 5 : 0 }} transition={{ duration: 0.15 }}>
                      <ChevronRight size={13} className="text-[#C9A227] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                    <span className="transition-colors duration-200 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-[#6B3F7A] group-hover:via-[#A971D6] group-hover:to-[#C9A227] dark:group-hover:from-[#C9A8E6] dark:group-hover:via-[#F0A8E4] dark:group-hover:to-[#F0D060] group-hover:bg-clip-text">
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Col 3: Contacto ── */}
          <div className="lg:col-span-1">
            <h4 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#C9A227] mb-5 flex items-center gap-2">
              <div className="w-4 h-px bg-[#C9A227]" />
              Contacto
            </h4>
            <ul className="space-y-3">
              {/* Dirección → Google Maps (nueva pestaña) */}
              <li>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Quinta+In%C3%A9s+Mar%C3%ADa+Chambo+Chimborazo"
                  target="_blank" rel="noopener noreferrer"
                  className="group flex items-start gap-3 rounded-xl p-1.5 -m-1.5 transition-all duration-200 hover:bg-gradient-to-r hover:from-[#6B3F7A]/8 hover:via-[#A971D6]/10 hover:to-[#C9A227]/8 hover:shadow-inner hover:shadow-[#A971D6]/15"
                >
                  <span className={ICONO_CONTACTO}>
                    <MapPin size={13} className="text-[#C9A227] group-hover:text-white transition-colors" />
                  </span>
                  <span>
                    <span className={`block text-sm font-semibold ${TEXTO_CONTACTO}`}>Chambo, Chimborazo</span>
                    <span className="block text-[#7a6f60] dark:text-white/38 text-xs mt-0.5">Ecuador · Ver en Google Maps</span>
                  </span>
                </a>
              </li>

              {/* Teléfono → WhatsApp directo (wa.me) */}
              <li>
                <a
                  href="https://wa.me/593985488891"
                  target="_blank" rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-xl p-1.5 -m-1.5 transition-all duration-200 hover:bg-gradient-to-r hover:from-[#6B3F7A]/8 hover:via-[#A971D6]/10 hover:to-[#C9A227]/8 hover:shadow-inner hover:shadow-[#A971D6]/15"
                >
                  <span className={ICONO_CONTACTO}>
                    <Phone size={13} className="text-[#C9A227] group-hover:text-white transition-colors" />
                  </span>
                  <span>
                    <span className={`block text-sm font-semibold ${TEXTO_CONTACTO}`}>+593 98 548 8891</span>
                    <span className="block text-[#7a6f60] dark:text-white/38 text-xs mt-0.5">Escríbenos por WhatsApp</span>
                  </span>
                </a>
              </li>

              {/* Email */}
              <li>
                <a
                  href="mailto:hosteriainesmariabedyeventos@gmail.com"
                  className="group flex items-start gap-3 rounded-xl p-1.5 -m-1.5 transition-all duration-200 hover:bg-gradient-to-r hover:from-[#6B3F7A]/8 hover:via-[#A971D6]/10 hover:to-[#C9A227]/8 hover:shadow-inner hover:shadow-[#A971D6]/15"
                >
                  <span className={ICONO_CONTACTO}>
                    <Mail size={13} className="text-[#C9A227] group-hover:text-white transition-colors" />
                  </span>
                  <span className={`text-xs leading-relaxed break-all font-medium self-center ${TEXTO_CONTACTO}`}>
                    hosteriainesmariabedyeventos@gmail.com
                  </span>
                </a>
              </li>
            </ul>
          </div>

          {/* ── Col 4: Social y CTA ── */}
          <div className="lg:col-span-1">
            <h4 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#C9A227] mb-5 flex items-center gap-2">
              <div className="w-4 h-px bg-[#C9A227]" />
              Síguenos
            </h4>

            <div className="flex gap-2.5 mb-7">
              <SocialIcon href="https://www.facebook.com/profile.php?id=61570945827294" label="Facebook" color="#1877F2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </SocialIcon>

              <SocialIcon href="https://www.google.com/maps/search/quinta+ines+maria+chambo" label="Google Maps" color="#EA4335">
                <MapPin size={15} />
              </SocialIcon>

              <SocialIcon href="https://www.instagram.com/quinta_ines_maria_bed_eventos/" label="Instagram" color="#E4405F">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7.75 2C4.57 2 2 4.57 2 7.75v8.5C2 19.43 4.57 22 7.75 22h8.5C19.43 22 22 19.43 22 16.25v-8.5C22 4.57 19.43 2 16.25 2h-8.5zm0 2h8.5A3.75 3.75 0 0 1 20 7.75v8.5A3.75 3.75 0 0 1 16.25 20h-8.5A3.75 3.75 0 0 1 4 16.25v-8.5A3.75 3.75 0 0 1 7.75 4zm8.75 1a1.25 1.25 0 1 0 0 2.5A1.25 1.25 0 0 0 16.5 5zM12 7a5 5 0 1 0 0 10A5 5 0 0 0 12 7zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"/>
                </svg>
              </SocialIcon>

              <SocialIcon href="https://www.tiktok.com/@quinta.ins.mara8" label="TikTok" color="#ffffff">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25h-3.13v12.98a2.67 2.67 0 1 1-2.67-2.67c.21 0 .42.03.62.08V9.64a5.8 5.8 0 0 0-.62-.03A5.81 5.81 0 1 0 15.83 15V8.45a7.96 7.96 0 0 0 4.76 1.58V6.69z"/>
                </svg>
              </SocialIcon>
            </div>

            {/* CTA Cotizar */}
            <Link
              to="/configurador"
              className="group flex items-center gap-3 w-full px-5 py-4 bg-gradient-to-r from-[#6B3F7A] via-[#A971D6] to-[#C9A227] text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-[#A971D6]/30 hover:-translate-y-0.5 transition-all duration-250 text-sm"
            >
              <Heart size={15} className="group-hover:scale-110 transition-transform shrink-0" fill="white" stroke="none" />
              <span>Cotizar mi evento</span>
              <ChevronRight size={14} className="ml-auto group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-14 pt-6 border-t border-white/8 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-[#8a7e6d] dark:text-white/28 text-xs font-medium">
            &copy; {anioActual} Quinta Inés María · Todos los derechos reservados.
          </p>
          <p className="text-[#9a8e7c] dark:text-white/18 text-xs font-medium">
            Desarrollado por Gerardo Barreno · ESPOCH
          </p>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ href, label, children }) {
  // Reposo: tinte ámbar discreto. Hover: iluminación ARGB contenida (púrpura →
  // fucsia → ámbar) con shadow-inner, para integrarse al ecosistema del Navbar.
  return (
    <a
      href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
      className="group w-10 h-10 rounded-xl flex items-center justify-center bg-[#C9A227]/10 border border-[#C9A227]/20 text-[#C9A227] transition-all duration-200 hover:scale-110 hover:-translate-y-0.5 hover:text-white hover:border-transparent hover:bg-gradient-to-br hover:from-[#6B3F7A] hover:via-[#A971D6] hover:to-[#C9A227] hover:shadow-inner hover:shadow-white/25"
    >
      {children}
    </a>
  );
}
