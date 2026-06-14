import { useState, useEffect } from 'react';
import { NavLink, Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore';
import { useDarkMode } from '../../hooks/useDarkMode';
import LogoQuinta from '../shared/LogoQuinta';
import {
  LayoutDashboard, ClipboardList, Calendar, Package,
  Image as ImageIcon, LogOut, ChevronDown, Menu,
  Settings, ChevronLeft, Users, BarChart2, UserCircle, Archive,
  Sun, Moon,
} from 'lucide-react';

const MENU_GROUPS = [
  {
    title: 'INICIO',
    items: [
      { to: '/admin', label: 'Panel General', icon: <LayoutDashboard size={19} />, exact: true },
    ],
  },
  {
    title: 'OPERACIONES',
    icon: <ClipboardList size={19} />,
    items: [
      { to: '/admin/solicitudes', label: 'Facturación y Solicitudes', icon: <ClipboardList size={17} /> },
      { to: '/admin/archivadas',  label: 'Solicitudes Archivadas',   icon: <Archive size={17} /> },
      { to: '/admin/calendario',  label: 'Calendario de Eventos',    icon: <Calendar size={17} /> },
    ],
  },
  {
    title: 'SISTEMA Y CATÁLOGO',
    icon: <Settings size={19} />,
    items: [
      { to: '/admin/catalogo', label: 'Servicios y Precios', icon: <Package size={17} /> },
      { to: '/admin/galeria',  label: 'Galería Visual',      icon: <ImageIcon size={17} /> },
    ],
  },
  {
    title: 'CLIENTES Y REPORTES',
    icon: <Users size={19} />,
    items: [
      { to: '/admin/usuarios', label: 'Gestión de Usuarios',  icon: <Users size={17} /> },
      { to: '/admin/reportes', label: 'Reportes y Analítica', icon: <BarChart2 size={17} /> },
      { to: '/admin/perfil',   label: 'Mi Perfil',            icon: <UserCircle size={17} /> },
    ],
  },
];

export default function AdminLayout() {
  const { logout, user } = useAuthStore();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openGroups,  setOpenGroups]  = useState({});
  const { isDark, toggle: toggleDark } = useDarkMode();

  useEffect(() => {
    const idx = MENU_GROUPS.findIndex((g) =>
      g.items.some((item) => location.pathname.startsWith(item.to) && item.to !== '/admin')
    );
    if (idx !== -1) setOpenGroups((prev) => ({ ...prev, [idx]: true }));
  }, [location.pathname]);

  const handleLogout  = () => { logout(); navigate('/login'); };
  const toggleGroup   = (idx) => {
    if (isCollapsed) setIsCollapsed(false);
    setOpenGroups((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="flex min-h-screen bg-[#E8DCC4] dark:bg-[#221634] font-sans overflow-hidden transition-colors duration-300">

      {/* ── SIDEBAR ──
         Claro: beige oscuro/taupe elegante (contrasta con el dashboard crema).
         Oscuro: púrpura más luminoso que el fondo general (#221634) para mejor
         visibilidad de los iconos. */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-[#473A28] dark:bg-[#2E2046] text-white flex flex-col shadow-2xl transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-[72px]' : 'w-[272px]'
        }`}
      >
        {/* Botón colapsar */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3.5 top-8 bg-[#C9A227] text-white w-7 h-7 rounded-full shadow-lg hover:bg-[#D4AF37] transition-all z-50 flex items-center justify-center"
        >
          <ChevronLeft size={15} className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>

        {/* Header sidebar */}
        <div className={`border-b border-white/8 transition-all duration-300 ${isCollapsed ? 'px-4 py-5' : 'p-5'}`}>
          <Link to="/" className={`flex items-center group ${isCollapsed ? 'justify-center' : 'gap-3'}`} title="Quinta Inés María">
            <LogoQuinta
              glowClassName="-inset-3"
              imgClassName={`object-contain drop-shadow-lg group-hover:scale-105 transition-transform ${isCollapsed ? 'h-9 w-9' : 'h-13 w-auto max-w-[170px]'}`}
            />
          </Link>
          {!isCollapsed && (
            <div className="mt-1 overflow-hidden">
              <span className="font-display font-bold text-[15px] text-white leading-tight block">Quinta Inés María</span>
              <span className="text-[9px] text-[#C9A227] font-bold tracking-[0.2em] uppercase">Panel Administrador</span>
            </div>
          )}
        </div>

        {/* Navegación acordeón */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-5 space-y-1 custom-scrollbar">
          {MENU_GROUPS.map((group, idx) => {
            const isOpen = openGroups[idx];

            if (!group.icon) {
              return (
                <div key={idx} className="px-3">
                  {!isCollapsed && (
                    <p className="px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 mt-1">
                      {group.title}
                    </p>
                  )}
                  {group.items.map((item) => (
                    <NavLink
                      key={item.to} to={item.to} end={item.exact}
                      title={isCollapsed ? item.label : ''}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-r from-[#C9A227] to-[#D4AF37] text-white shadow-lg shadow-[#C9A227]/22'
                            : 'text-slate-400 hover:text-white hover:bg-white/8'
                        } ${isCollapsed ? 'justify-center' : ''}`
                      }
                    >
                      <span className={isCollapsed ? 'scale-110' : ''}>{item.icon}</span>
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </NavLink>
                  ))}
                </div>
              );
            }

            const isAnyChildActive = group.items.some((item) => location.pathname.startsWith(item.to));

            return (
              <div key={idx} className="px-3">
                <button
                  onClick={() => toggleGroup(idx)}
                  title={isCollapsed ? group.title : ''}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isAnyChildActive && !isOpen
                      ? 'bg-white/8 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/7'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`${isCollapsed ? 'scale-110' : ''} ${isAnyChildActive ? 'text-[#C9A227]' : ''} transition-colors`}>
                      {group.icon}
                    </span>
                    {!isCollapsed && (
                      <span className={isAnyChildActive ? 'font-bold text-white' : ''}>{group.title}</span>
                    )}
                  </div>
                  {!isCollapsed && (
                    <ChevronDown
                      size={15}
                      className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#C9A227]' : 'text-slate-600'}`}
                    />
                  )}
                </button>

                {/* Submenú animado */}
                <div className={`grid transition-all duration-300 ease-in-out ${
                  isOpen && !isCollapsed ? 'grid-rows-[1fr] opacity-100 mt-0.5' : 'grid-rows-[0fr] opacity-0'
                }`}>
                  <div className="overflow-hidden flex flex-col gap-0.5 pl-10 pr-1">
                    {group.items.map((item) => (
                      <NavLink
                        key={item.to} to={item.to}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200 relative ${
                            isActive
                              ? 'text-white font-bold bg-white/6'
                              : 'text-slate-500 font-medium hover:text-white hover:bg-white/6 hover:pl-4'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <span className={`absolute left-0 w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                              isActive ? 'bg-[#C9A227] scale-100' : 'bg-white/35 scale-50'
                            }`} />
                            {item.icon}
                            <span className="truncate">{item.label}</span>
                          </>
                        )}
                      </NavLink>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer sidebar — usuario */}
        <div className={`border-t border-white/8 bg-black/25 transition-all duration-300 ${isCollapsed ? 'p-3' : 'p-4'}`}>
          {!isCollapsed && (
            <Link
              to="/admin/perfil"
              className="flex items-center gap-3 mb-3 px-2 py-2 hover:bg-white/6 rounded-xl transition-colors group"
            >
              <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-700 shrink-0">
                {user?.foto_perfil ? (
                  <img
                    src={`${import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000'}${user.foto_perfil}`}
                    alt="" className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#C9A227] to-[#B7950B] flex items-center justify-center font-bold text-white text-sm">
                    {(user?.nombre_completo ?? 'A')[0]}
                  </div>
                )}
              </div>
              <div className="overflow-hidden">
                <span className="text-sm font-bold text-white truncate block group-hover:text-[#C9A227] transition-colors">
                  {user?.nombre_completo?.split(' ')[0]}
                </span>
                <span className="text-[10px] text-[#C9A227] uppercase tracking-wider">Administrador</span>
              </div>
            </Link>
          )}
          <button
            onClick={handleLogout}
            title={isCollapsed ? 'Cerrar Sesión' : ''}
            className={`flex items-center gap-2 py-2.5 rounded-xl bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500 hover:text-white transition-all border border-red-500/18 w-full ${isCollapsed ? 'justify-center' : 'justify-center'}`}
          >
            <LogOut size={15} />
            {!isCollapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* ── CONTENIDO PRINCIPAL ── */}
      <main className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${isCollapsed ? 'ml-[72px]' : 'ml-[272px]'}`}>

        {/* Topbar */}
        <header className="h-16 bg-white/85 dark:bg-[#221634]/85 backdrop-blur-md border-b border-slate-200 dark:border-white/8 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="lg:hidden p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/8 rounded-lg transition-colors"
            >
              <Menu size={19} />
            </button>
            <div className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest hidden sm:flex items-center gap-2">
              Quinta Inés María
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <span className="text-[#0D2137] dark:text-slate-200 capitalize">
                {location.pathname.split('/').pop() || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/8">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Sistema en línea
            </div>

            {/* Toggle Dark Mode */}
            <button
              onClick={toggleDark}
              aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
              title={isDark ? 'Modo claro' : 'Modo oscuro'}
              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 dark:text-[#C9A227] bg-slate-100 dark:bg-white/8 hover:bg-slate-200 dark:hover:bg-white/14 transition-all"
            >
              <AnimatePresence mode="wait" initial={false}>
                {isDark ? (
                  <motion.span key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <Sun size={17} />
                  </motion.span>
                ) : (
                  <motion.span key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <Moon size={17} />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <Link
              to="/"
              className="text-xs font-bold text-white bg-[#0D2137] dark:bg-[#C9A227] dark:text-[#0D2137] px-4 py-2 rounded-lg hover:bg-[#1A6BAC] dark:hover:opacity-90 shadow-md transition-all"
            >
              Ver sitio público
            </Link>
          </div>
        </header>

        {/* Outlet */}
        <div className="p-4 sm:p-7 flex-1 overflow-x-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
