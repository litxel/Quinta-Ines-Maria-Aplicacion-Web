import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sun, Moon, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useDarkMode } from '../../hooks/useDarkMode';
import logoQuinta from '../../assets/FotosQuintaInes/LogosQuinta/logo quinta ines.png';

export default function Navbar() {
  const [menuOpen, setMenuOpen]   = useState(false);
  const [dropdown, setDropdown]   = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();
  const { isDark, toggle: toggleDark } = useDarkMode();
  const navigate = useNavigate();

  const BACKEND_URL  = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
  const fotoUrl      = user?.foto_perfil ? `${BACKEND_URL}${user.foto_perfil}?t=${Date.now()}` : null;
  const inicial      = (user?.nombre_completo ?? user?.nombre ?? 'U')[0].toUpperCase();
  const nombreCorto  = (user?.nombre_completo ?? user?.nombre ?? 'Usuario').split(' ').slice(0, 2).join(' ');

  const rolUsuario = user?.rol_codigo ?? user?.rol ?? '';
  const esAdmin    = rolUsuario === 'ADMIN' || rolUsuario === 'administrador';
  const esCliente  = rolUsuario === 'CLIENTE' || esAdmin;

  const handleLogout = () => { logout(); setDropdown(false); navigate('/'); };

  /* ── Estilos de links ── */
  const linkClass = ({ isActive }) =>
    `px-4 py-2.5 mx-0.5 rounded-full text-sm font-semibold transition-all duration-200 ${
      isActive
        ? 'bg-[#C9A227]/12 text-[#C9A227]'
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/8 hover:text-[#C9A227]'
    }`;

  const mobileLinkClass = ({ isActive }) =>
    `block px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 text-center ${
      isActive
        ? 'bg-[#C9A227]/12 text-[#C9A227]'
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/6 hover:text-[#C9A227]'
    }`;

  /* ── Animaciones de dropdown ── */
  const dropdownVariants = {
    hidden:  { opacity: 0, scale: 0.95, y: -8 },
    visible: { opacity: 1, scale: 1,    y: 0  },
    exit:    { opacity: 0, scale: 0.95, y: -8 },
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#FCF9F2]/92 dark:bg-[#060D18]/92 backdrop-blur-xl border-b border-[#C9A227]/20 dark:border-[#C9A227]/12 shadow-sm transition-colors duration-300">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

        {/* ── Logo ── */}
        <Link to="/" className="flex items-center gap-3 group shrink-0">
          <img
            src={logoQuinta}
            alt="Logo Quinta Inés María"
            className="h-13 w-auto drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
          />
          <div className="hidden lg:flex flex-col">
            <span className="font-display text-xl font-bold text-[#0D2137] dark:text-white leading-none group-hover:text-[#C9A227] transition-colors duration-200">
              Quinta Inés María
            </span>
            <span className="text-[9px] text-[#C9A227] font-bold tracking-[0.22em] uppercase mt-1">
              Catering &amp; Eventos
            </span>
          </div>
        </Link>

        {/* ── Links Desktop (píldora) ── */}
        <div className="hidden md:flex items-center bg-white/80 dark:bg-white/5 border border-slate-100 dark:border-white/8 p-1 rounded-full shadow-sm backdrop-blur-sm">
          <NavLink to="/" end className={linkClass}>Inicio</NavLink>
          <NavLink to="/paquetes" className={linkClass}>Paquetes</NavLink>
          <NavLink to="/galeria" className={linkClass}>Galería</NavLink>
          <NavLink to="/resenias" className={linkClass}>Reseñas</NavLink>
          <NavLink to="/configurador" className={linkClass}>Configurar Evento</NavLink>
          {isAuthenticated && esCliente && !esAdmin && (
            <NavLink to="/mis-solicitudes" className={linkClass}>Mis Eventos</NavLink>
          )}
          {isAuthenticated && esAdmin && (
            <NavLink to="/admin" className={linkClass}>⚡ Panel Admin</NavLink>
          )}
        </div>

        {/* ── Acciones Desktop ── */}
        <div className="hidden md:flex items-center gap-2 shrink-0">

          {/* Toggle Dark Mode */}
          <button
            onClick={toggleDark}
            aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-200"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isDark ? (
                <motion.span key="sun"
                  initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}
                >
                  <Sun size={17} />
                </motion.span>
              ) : (
                <motion.span key="moon"
                  initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}
                >
                  <Moon size={17} />
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {isAuthenticated ? (
            <div className="relative">
              {/* Botón usuario */}
              <button
                onClick={() => setDropdown(!dropdown)}
                className="flex items-center gap-2.5 bg-white dark:bg-white/7 border border-slate-200 dark:border-white/10 pl-2 pr-3.5 py-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-white/10 transition-all shadow-sm focus:outline-none"
                aria-expanded={dropdown}
              >
                <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-br from-[#C9A227] to-[#B7950B] flex items-center justify-center text-white font-bold text-xs shrink-0">
                  {fotoUrl ? <img src={fotoUrl} alt="" className="w-full h-full object-cover" /> : inicial}
                </div>
                <span className="text-sm text-slate-700 dark:text-slate-200 font-semibold max-w-[120px] truncate">
                  {nombreCorto}
                </span>
                <motion.div animate={{ rotate: dropdown ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={14} className="text-slate-400 dark:text-slate-500" />
                </motion.div>
              </button>

              <AnimatePresence>
                {dropdown && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setDropdown(false)} />
                    <motion.div
                      variants={dropdownVariants}
                      initial="hidden" animate="visible" exit="exit"
                      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute right-0 top-full mt-2.5 w-64 bg-white dark:bg-[#0C1829] rounded-2xl shadow-2xl border border-slate-100 dark:border-white/8 overflow-hidden z-40"
                    >
                      {/* Cabecera dropdown */}
                      <div className="px-4 py-4 bg-slate-50/80 dark:bg-white/4 border-b border-slate-100 dark:border-white/8">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#C9A227] to-[#B7950B] flex items-center justify-center text-white font-bold shrink-0">
                            {fotoUrl ? <img src={fotoUrl} alt="" className="w-full h-full object-cover" /> : inicial}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-[#0D2137] dark:text-white truncate">{user?.nombre_completo ?? user?.nombre}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.correo}</p>
                          </div>
                        </div>
                        <span className={`inline-block mt-3 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full tracking-wide ${
                          esAdmin
                            ? 'bg-gradient-to-r from-[#B7950B] to-[#D4AF37] text-white'
                            : 'bg-[#0D2137]/8 dark:bg-white/8 text-[#0D2137] dark:text-white'
                        }`}>
                          {esAdmin ? '⚡ Administrador' : '👤 Cliente'}
                        </span>
                      </div>

                      {/* Items */}
                      <nav className="py-1.5">
                        {esAdmin && <DropdownLink to="/admin" onClick={() => setDropdown(false)}>📊 Panel de administración</DropdownLink>}
                        {esCliente && !esAdmin && <DropdownLink to="/mis-solicitudes" onClick={() => setDropdown(false)}>📋 Mis eventos cotizados</DropdownLink>}
                        {esCliente && !esAdmin && <DropdownLink to="/mi-perfil" onClick={() => setDropdown(false)}>👤 Mi perfil</DropdownLink>}
                        <DropdownLink to="/configurador" onClick={() => setDropdown(false)}>✨ Configurar nuevo evento</DropdownLink>
                        <div className="border-t border-slate-100 dark:border-white/8 mt-1.5 pt-1.5 px-2 pb-1.5">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/18 transition-colors"
                          >
                            🚪 Cerrar sesión
                          </button>
                        </div>
                      </nav>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <NavLink to="/login" className="text-sm font-semibold px-5 py-2.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/8 hover:text-[#0D2137] dark:hover:text-white transition-all duration-200">
                Ingresar
              </NavLink>
              <NavLink to="/register" className="text-sm font-bold px-5 py-2.5 bg-[#0D2137] dark:bg-[#C9A227] text-white dark:text-[#0D2137] rounded-full hover:bg-[#1A6BAC] dark:hover:opacity-90 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                Registrarse
              </NavLink>
            </div>
          )}
        </div>

        {/* ── Mobile: toggle + hamburger ── */}
        <div className="md:hidden flex items-center gap-1.5">
          <button
            onClick={toggleDark}
            aria-label={isDark ? 'Modo claro' : 'Modo oscuro'}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button
            aria-label="Abrir menú"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2.5 rounded-xl bg-white dark:bg-white/7 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/12 transition-all border border-slate-200 dark:border-white/10 shadow-sm"
          >
            <AnimatePresence mode="wait" initial={false}>
              {menuOpen ? (
                <motion.span key="x"
                  initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}
                >
                  <X size={20} />
                </motion.span>
              ) : (
                <motion.span key="menu"
                  initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}
                >
                  <Menu size={20} />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </nav>

      {/* ── Menú Mobile animado ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden overflow-hidden border-b border-[#C9A227]/15 dark:border-[#C9A227]/10"
          >
            <div className="bg-[#FCF9F2]/98 dark:bg-[#060D18]/98 backdrop-blur-xl px-4 py-5 flex flex-col gap-1.5">
              <NavLink to="/" end className={mobileLinkClass} onClick={() => setMenuOpen(false)}>Inicio</NavLink>
              <NavLink to="/paquetes" className={mobileLinkClass} onClick={() => setMenuOpen(false)}>Paquetes</NavLink>
              <NavLink to="/galeria" className={mobileLinkClass} onClick={() => setMenuOpen(false)}>Galería</NavLink>
              <NavLink to="/resenias" className={mobileLinkClass} onClick={() => setMenuOpen(false)}>Reseñas ⭐</NavLink>
              <NavLink to="/configurador" className={mobileLinkClass} onClick={() => setMenuOpen(false)}>Configurar Evento</NavLink>
              {isAuthenticated && esCliente && !esAdmin && (
                <NavLink to="/mis-solicitudes" className={mobileLinkClass} onClick={() => setMenuOpen(false)}>📋 Mis Eventos</NavLink>
              )}
              {isAuthenticated && esCliente && !esAdmin && (
                <NavLink to="/mi-perfil" className={mobileLinkClass} onClick={() => setMenuOpen(false)}>👤 Mi Perfil</NavLink>
              )}
              {isAuthenticated && esAdmin && (
                <NavLink to="/admin" className={mobileLinkClass} onClick={() => setMenuOpen(false)}>⚡ Panel Admin</NavLink>
              )}

              <div className="h-px bg-slate-200 dark:bg-white/8 my-1.5" />

              {isAuthenticated ? (
                <>
                  <div className="text-center mb-1">
                    <p className="text-sm font-bold text-[#0D2137] dark:text-white">{user?.nombre_completo}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{user?.correo}</p>
                  </div>
                  <button
                    onClick={() => { handleLogout(); setMenuOpen(false); }}
                    className="w-full text-sm font-bold px-5 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/18 transition-colors border border-red-100 dark:border-red-500/15"
                  >
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 pt-1">
                  <NavLink
                    to="/login"
                    className="w-full text-sm font-bold px-5 py-3 rounded-xl bg-white dark:bg-white/7 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-center hover:bg-slate-50 dark:hover:bg-white/10 transition-all shadow-sm"
                    onClick={() => setMenuOpen(false)}
                  >
                    Iniciar sesión
                  </NavLink>
                  <NavLink
                    to="/register"
                    className="w-full text-sm font-bold px-5 py-3 rounded-xl bg-[#0D2137] dark:bg-[#C9A227] text-white dark:text-[#0D2137] text-center hover:bg-[#1A6BAC] dark:hover:opacity-90 transition-all shadow-md"
                    onClick={() => setMenuOpen(false)}
                  >
                    Crear cuenta
                  </NavLink>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function DropdownLink({ to, onClick, children }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/6 hover:text-[#0D2137] dark:hover:text-white transition-colors"
    >
      {children}
    </Link>
  );
}
