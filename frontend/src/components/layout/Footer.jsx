import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, ChevronRight, Star, Heart, Mail, Phone, MapPin, ExternalLink } from 'lucide-react';
import logoQuinta from '../../assets/FotosQuintaInes/LogosQuinta/logo quinta ines.png';

const LINKS = [
  { to: '/',           label: 'Inicio' },
  { to: '/paquetes',   label: 'Ver Paquetes' },
  { to: '/galeria',    label: 'Nuestra Galería' },
  { to: '/resenias',   label: 'Reseñas' },
  { to: '/configurador', label: 'Cotizar Evento' },
];

export default function Footer() {
  const anioActual = new Date().getFullYear();
  const [hoveredLink, setHoveredLink] = useState(null);

  return (
    <footer className="bg-[#0D2137] text-white relative overflow-hidden">

      {/* Decoración de fondo */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-[#B7950B]/5" />
        <div className="absolute bottom-0 left-0 w-96 h-64 rounded-full bg-[#B7950B]/5 -translate-x-1/3 translate-y-1/2" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23B7950B' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Banda dorada superior */}
      <div className="h-1 bg-gradient-to-r from-transparent via-[#B7950B] to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 lg:gap-8">

          {/* ── Columna 1: Logo Animado (más grande) ────────────────────── */}
          <div className="lg:col-span-1 flex flex-col items-center lg:items-start gap-4">
            <motion.div
              className="relative"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              {/* Halo dorado detrás del logo */}
              <motion.div
                className="absolute inset-0 rounded-full blur-2xl"
                style={{ backgroundColor: '#B7950B' }}
                animate={{ opacity: [0.15, 0.35, 0.15], scale: [0.9, 1.1, 0.9] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              />
              <img
                src={logoQuinta}
                alt="Logo Quinta Inés María"
                className="relative h-28 w-auto drop-shadow-2xl"
              />
            </motion.div>

            <div className="text-center lg:text-left">
              <h2
                className="font-display text-2xl font-black leading-tight"
                style={{
                  background: 'linear-gradient(135deg, #B7950B 0%, #F5D060 40%, #B7950B 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Quinta Inés María
              </h2>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.25em] mt-1">
                BED · Catering · Eventos
              </p>
            </div>

            <p className="text-white/50 leading-relaxed text-xs max-w-[220px] text-center lg:text-left">
              Creamos eventos únicos e irrepetibles con el calor del campo ecuatoriano.
            </p>

            {/* Estrellas de calificación */}
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map(i => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
                >
                  <Star size={14} fill="#B7950B" stroke="none" />
                </motion.div>
              ))}
              <span className="text-white/40 text-xs ml-1">5.0</span>
            </div>
          </div>

          {/* ── Columna 2: Navegación ──────────────────────────────────── */}
          <div className="lg:col-span-1">
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#B7950B] mb-5 flex items-center gap-2">
              <div className="w-4 h-0.5 bg-[#B7950B]" />
              Navegación
            </h4>
            <ul className="space-y-2">
              {LINKS.map(link => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    onMouseEnter={() => setHoveredLink(link.to)}
                    onMouseLeave={() => setHoveredLink(null)}
                    className="group flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all duration-200"
                  >
                    <motion.div
                      animate={{ x: hoveredLink === link.to ? 4 : 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <ChevronRight size={14} className="text-[#B7950B] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Columna 3: Contacto ────────────────────────────────────── */}
          <div className="lg:col-span-1">
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#B7950B] mb-5 flex items-center gap-2">
              <div className="w-4 h-0.5 bg-[#B7950B]" />
              Contacto
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#B7950B]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin size={14} className="text-[#B7950B]" />
                </div>
                <div>
                  <p className="text-white/80 text-sm font-medium">Chambo, Chimborazo</p>
                  <p className="text-white/40 text-xs mt-0.5">Ecuador</p>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#B7950B]/10 flex items-center justify-center shrink-0">
                  <Phone size={14} className="text-[#B7950B]" />
                </div>
                <a href="tel:+593985488891" className="text-white/80 text-sm font-medium hover:text-[#B7950B] transition-colors">
                  +593 98 548 8891
                </a>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#B7950B]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Mail size={14} className="text-[#B7950B]" />
                </div>
                <a href="mailto:hosteriainesmariabedyeventos@gmail.com" className="text-white/60 text-xs hover:text-white/90 transition-colors leading-relaxed break-all">
                  hosteriainesmariabedyeventos@gmail.com
                </a>
              </li>
            </ul>
          </div>

          {/* ── Columna 4: Social y CTA ────────────────────────────────── */}
          <div className="lg:col-span-1">
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#B7950B] mb-5 flex items-center gap-2">
              <div className="w-4 h-0.5 bg-[#B7950B]" />
              Síguenos
            </h4>

            <div className="flex gap-3 mb-6">
              {/* Facebook */}
              <a
                href="https://www.facebook.com/profile.php?id=61570945827294"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-[#1877F2]/20 border border-[#1877F2]/30 flex items-center justify-center hover:bg-[#1877F2] transition-all duration-200 hover:scale-110"
                aria-label="Facebook"
              >
                <svg className="w-4 h-4 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              {/* google mpas */}
              <a
                href="https://www.google.com/maps/search/quinta+ines+maria+chambo"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-[#EA4335]/20 border border-[#EA4335]/30 flex items-center justify-center hover:bg-[#EA4335] transition-all duration-200 hover:scale-110"
                aria-label="Google Maps"
              >
                <MapPin size={16} className="text-[#EA4335]" />
              </a>
              {/* Instagram */}
              <a
                href="https://www.instagram.com/quinta_ines_maria_bed_eventos/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-[#E4405F]/20 border border-[#E4405F]/30 flex items-center justify-center hover:bg-[#E4405F] transition-all duration-200 hover:scale-110"
                aria-label="Instagram"
              >
                <svg
                  className="w-4 h-4 text-[#E4405F]"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M7.75 2C4.57 2 2 4.57 2 7.75v8.5C2 19.43 4.57 22 7.75 22h8.5C19.43 22 22 19.43 22 16.25v-8.5C22 4.57 19.43 2 16.25 2h-8.5zm0 2h8.5A3.75 3.75 0 0 1 20 7.75v8.5A3.75 3.75 0 0 1 16.25 20h-8.5A3.75 3.75 0 0 1 4 16.25v-8.5A3.75 3.75 0 0 1 7.75 4zm8.75 1a1.25 1.25 0 1 0 0 2.5A1.25 1.25 0 0 0 16.5 5zM12 7a5 5 0 1 0 0 10a5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6a3 3 0 0 1 0-6z"/>
                </svg>
              </a>

              {/* TikTok */}
              <a
                href="https://www.tiktok.com/@quinta.ins.mara8"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all duration-200 hover:scale-110"
                aria-label="TikTok"
              >
                <svg
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25h-3.13v12.98a2.67 2.67 0 1 1-2.67-2.67c.21 0 .42.03.62.08V9.64a5.8 5.8 0 0 0-.62-.03A5.81 5.81 0 1 0 15.83 15V8.45a7.96 7.96 0 0 0 4.76 1.58V6.69z"/>
                </svg>
              </a>
            </div>

            {/* CTA Cotizar */}
            <Link
              to="/configurador"
              className="group flex items-center gap-3 w-full px-5 py-3.5 bg-gradient-to-r from-[#B7950B] to-[#D4AF37] text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-[#B7950B]/25 hover:-translate-y-0.5 transition-all duration-200 text-sm"
            >
              <Heart size={16} className="group-hover:scale-110 transition-transform" fill="white" stroke="none" />
              <span>Cotizar mi evento</span>
              <ChevronRight size={14} className="ml-auto group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* ── Línea divisoria y Copyright ──────────────────────────────── */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-white/30 text-xs font-medium">
            &copy; {anioActual} Quinta Inés María · Todos los derechos reservados.
          </p>
          <p className="text-white/20 text-xs font-medium">
            Desarrollado por Gerardo Barreno · ESPOCH
          </p>
        </div>
      </div>
    </footer>
  );
}