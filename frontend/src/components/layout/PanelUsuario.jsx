import { Link } from 'react-router-dom';
import {
  Crown, Sparkles, LayoutDashboard, ClipboardList, CalendarDays, UserCog,
  UserRound, CalendarHeart, Star, LogOut, ExternalLink, ChevronRight,
} from 'lucide-react';
import AvatarUsuario from '../shared/AvatarUsuario';
import { esRolAdmin } from '../../utils/roles';
import WhatsAppIcon from '../shared/WhatsAppIcon';
import { whatsappUrl } from '../../config/contacto';

// Opciones de cada rol. `contador` indica qué número del resumen mostrar al lado.
const OPCIONES = {
  admin: [
    { to: '/admin',             icono: LayoutDashboard, titulo: 'Panel de administración', detalle: 'Métricas y resumen general' },
    { to: '/admin/solicitudes', icono: ClipboardList,   titulo: 'Solicitudes',             detalle: 'Revisar, confirmar o rechazar', contador: 'a' },
    { to: '/admin/calendario',  icono: CalendarDays,    titulo: 'Calendario',              detalle: 'Eventos y fechas bloqueadas' },
    { to: '/admin/perfil',      icono: UserCog,         titulo: 'Mi perfil',               detalle: 'Foto, datos y contraseña' },
  ],
  cliente: [
    { to: '/mis-solicitudes', icono: CalendarHeart, titulo: 'Mis eventos',      detalle: 'Tus cotizaciones y su estado', contador: 'a' },
    { to: '/configurador',    icono: Sparkles,      titulo: 'Configurar evento', detalle: 'Arma tu evento paso a paso' },
    { to: '/mi-perfil',       icono: UserRound,     titulo: 'Mi perfil',        detalle: 'Foto, datos y contraseña' },
    { to: '/resenias',        icono: Star,          titulo: 'Dejar una reseña', detalle: 'Cuéntanos tu experiencia' },
  ],
};

const ESTADISTICAS = {
  admin:   [{ clave: 'a', etiqueta: 'Pendientes' },  { clave: 'b', etiqueta: 'Confirmadas' }],
  cliente: [{ clave: 'a', etiqueta: 'En curso' },    { clave: 'b', etiqueta: 'Confirmados' }],
};

/**
 * Tarjeta del usuario con sesión iniciada: foto con anillo de luz, rol bien
 * visible, un resumen de sus solicitudes, sus opciones, ayuda por WhatsApp y
 * cerrar sesión.
 *
 * @param {object}   user      usuario del store de auth
 * @param {object}   resumen   { a, b } (ver ESTADISTICAS) o null mientras carga
 * @param {Function} onNavegar se llama al elegir una opción (para cerrar el menú)
 * @param {Function} onLogout
 */
export default function PanelUsuario({ user, resumen, onNavegar, onLogout }) {
  const esAdmin = esRolAdmin(user);
  const rol     = esAdmin ? 'admin' : 'cliente';
  const nombre  = user?.nombre_completo ?? user?.nombre ?? 'Usuario';

  const mensajeAyuda = esAdmin
    ? `Hola, soy ${nombre}, administrador(a) de la web de Quinta Inés María. Necesito soporte con el sistema.`
    : `Hola, soy ${nombre}${user?.correo ? ` (${user.correo})` : ''}. Necesito ayuda con mi cuenta o mis eventos en la web de Quinta Inés María.`;

  return (
    <div className="flex flex-col">
      {/* ── Cabecera con el color del rol ── */}
      <div className={`relative overflow-hidden px-5 pt-5 pb-4 ${
        esAdmin
          ? 'bg-gradient-to-br from-[#0D2137] via-[#1A3A5C] to-[#5C4A1E]'
          : 'bg-gradient-to-br from-[#2E2046] via-[#4A2D63] to-[#1A6BAC]'
      }`}>
        {/* Luces decorativas */}
        <span aria-hidden className={`absolute -top-10 -right-8 w-32 h-32 rounded-full blur-2xl opacity-40 ${esAdmin ? 'bg-[#C9A227]' : 'bg-[#A971D6]'}`} />
        <span aria-hidden className={`absolute -bottom-12 -left-6 w-28 h-28 rounded-full blur-2xl opacity-25 ${esAdmin ? 'bg-[#F0D060]' : 'bg-[#7DD3FC]'}`} />

        <div className="relative flex items-center gap-3.5">
          <AvatarUsuario user={user} tamano="lg" insignia />
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-white leading-tight truncate">{nombre}</p>
            {user?.correo && <p className="text-xs text-white/60 truncate mt-0.5">{user.correo}</p>}
            <span className={`inline-flex items-center gap-1.5 mt-2 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm ${
              esAdmin
                ? 'bg-gradient-to-r from-[#F0D060] to-[#C9A227] text-[#3D2E00]'
                : 'bg-white/15 text-white ring-1 ring-white/25'
            }`}>
              {esAdmin ? <Crown size={11} strokeWidth={2.75} /> : <Sparkles size={11} strokeWidth={2.75} />}
              {esAdmin ? 'Administrador' : 'Cliente'}
            </span>
          </div>
        </div>

        {/* Resumen de lo que tiene el usuario */}
        <div className="relative grid grid-cols-2 gap-2 mt-4">
          {ESTADISTICAS[rol].map(({ clave, etiqueta }) => (
            <div key={clave} className="rounded-xl bg-white/10 ring-1 ring-white/10 px-3 py-2 backdrop-blur-sm">
              <p className="text-lg font-extrabold text-white leading-none tabular-nums">
                {resumen ? resumen[clave] : <span className="inline-block w-5 h-4 rounded bg-white/20 animate-pulse align-middle" />}
              </p>
              <p className="text-[10px] font-semibold text-white/60 uppercase tracking-wider mt-1">{etiqueta}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Opciones del rol ── */}
      <nav className="p-2" aria-label={esAdmin ? 'Opciones de administrador' : 'Opciones de cliente'}>
        {OPCIONES[rol].map(({ to, icono: Icono, titulo, detalle, contador }) => {
          const valor = contador && resumen ? Number(resumen[contador]) : 0;
          return (
            <Link
              key={to}
              to={to}
              onClick={onNavegar}
              className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/6 transition-colors"
            >
              <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                esAdmin
                  ? 'bg-[#C9A227]/12 text-[#8C6A00] dark:bg-[#C9A227]/15 dark:text-[#F0D060]'
                  : 'bg-[#A971D6]/12 text-[#6B3F7A] dark:bg-[#A971D6]/18 dark:text-[#C9A8E6]'
              }`}>
                <Icono size={17} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-[#0D2137] dark:text-white leading-tight">{titulo}</span>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate">{detalle}</span>
              </span>
              {valor > 0 ? (
                <span className={`min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center ${
                  esAdmin ? 'bg-[#C9A227] text-[#3D2E00]' : 'bg-[#A971D6] text-white'
                }`}>
                  {valor}
                </span>
              ) : (
                <ChevronRight size={15} className="text-slate-300 dark:text-slate-600 group-hover:translate-x-0.5 transition-transform" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Ayuda por WhatsApp + cerrar sesión ── */}
      <div className="px-3 pb-3 pt-1 space-y-2 border-t border-slate-100 dark:border-white/8">
        <a
          href={whatsappUrl(mensajeAyuda)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onNavegar}
          className="mt-2 group flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/18 ring-1 ring-[#25D366]/25 transition-colors"
        >
          <span className="w-9 h-9 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#25D366]/30 group-hover:scale-105 transition-transform">
            <WhatsAppIcon size={18} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-[#128C4B] dark:text-[#4ADE80] leading-tight">
              {esAdmin ? 'Soporte por WhatsApp' : '¿Necesitas ayuda?'}
            </span>
            <span className="block text-[11px] text-slate-500 dark:text-slate-400">Escríbenos, te respondemos por WhatsApp</span>
          </span>
          <ExternalLink size={14} className="text-[#128C4B]/60 dark:text-[#4ADE80]/60 shrink-0" />
        </a>

        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/18 transition-colors"
        >
          <LogOut size={15} />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
