import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors duration-200 ${
      isActive
        ? 'text-[#B7950B]'
        : 'text-slate-700 hover:text-[#1A6BAC]'
    }`;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-xl font-bold text-[#0D2137]">
            Quinta Inés María
          </span>
          <span className="hidden sm:inline text-xs text-slate-400 font-medium tracking-wider uppercase">
            BED · Catering · Eventos
          </span>
        </Link>

        {/* Links desktop */}
        <div className="hidden md:flex items-center gap-8">
          <NavLink to="/"        end className={linkClass}>Inicio</NavLink>
          <NavLink to="/paquetes"    className={linkClass}>Paquetes</NavLink>
          <NavLink to="/galeria"     className={linkClass}>Galería</NavLink>
          <NavLink to="/configurador" className={linkClass}>Configurar Evento</NavLink>
        </div>

        {/* Auth desktop */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-slate-600">
                Hola, <strong>{user?.nombre_completo?.split(' ')[0]}</strong>
              </span>
              <button
                onClick={handleLogout}
                className="text-sm px-4 py-1.5 rounded-full border border-slate-300 text-slate-600 hover:border-red-400 hover:text-red-500 transition-colors"
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className="text-sm font-medium text-slate-700 hover:text-[#1A6BAC] transition-colors"
              >
                Iniciar sesión
              </NavLink>
              <NavLink
                to="/register"
                className="text-sm font-semibold px-5 py-2 bg-[#0D2137] text-white rounded-full hover:bg-[#1A6BAC] transition-colors"
              >
                Registrarse
              </NavLink>
            </>
          )}
        </div>

        {/* Hamburger mobile */}
        <button
          aria-label="Abrir menú"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100"
        >
          <span className="block w-5 h-0.5 bg-current mb-1" />
          <span className="block w-5 h-0.5 bg-current mb-1" />
          <span className="block w-5 h-0.5 bg-current" />
        </button>
      </nav>

      {/* Menú mobile */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-4 py-4 flex flex-col gap-4">
          <NavLink to="/"           end className={linkClass} onClick={() => setMenuOpen(false)}>Inicio</NavLink>
          <NavLink to="/paquetes"       className={linkClass} onClick={() => setMenuOpen(false)}>Paquetes</NavLink>
          <NavLink to="/galeria"        className={linkClass} onClick={() => setMenuOpen(false)}>Galería</NavLink>
          <NavLink to="/configurador"   className={linkClass} onClick={() => setMenuOpen(false)}>Configurar Evento</NavLink>

          {isAuthenticated ? (
            <button
              onClick={() => { handleLogout(); setMenuOpen(false); }}
              className="text-left text-sm text-red-500 font-medium"
            >
              Cerrar sesión
            </button>
          ) : (
            <NavLink
              to="/login"
              className="text-sm font-semibold px-5 py-2 bg-[#0D2137] text-white rounded-full text-center hover:bg-[#1A6BAC] transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Iniciar sesión
            </NavLink>
          )}
        </div>
      )}
    </header>
  );
}
