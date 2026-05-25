import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

// IMPORTAMOS EL LOGO (Asegúrate de que el nombre del archivo sea exacto)
import logoQuinta from "../../assets/FotosQuintaInes/LogosQuinta/logo quinta ines.png";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdown, setDropdown] = useState(false); // Nuevo estado para el dropdown del usuario
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  // ── Lógica de Roles (De Claude) ──
  const rolUsuario = user?.rol_codigo ?? user?.rol ?? '';
  const esAdmin    = rolUsuario === 'ADMIN' || rolUsuario === 'administrador';
  const esCliente  = rolUsuario === 'CLIENTE' || esAdmin;

  const handleLogout = () => {
    logout();
    setDropdown(false);
    navigate('/');
  };

  // ESTILOS TIPO CÁPSULA PARA LOS LINKS (Tuyos)
  const linkClass = ({ isActive }) =>
    `px-5 py-2.5 mx-1 rounded-full text-sm font-semibold transition-all duration-300 ${
      isActive
        ? 'bg-[#B7950B]/10 text-[#B7950B] shadow-sm'
        : 'text-slate-600 hover:bg-slate-100 hover:text-[#B7950B]'
    }`;

  // ESTILOS TIPO CÁPSULA PARA EL MENÚ MÓVIL (Tuyos)
  const mobileLinkClass = ({ isActive }) =>
    `block px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 text-center ${
      isActive
        ? 'bg-[#B7950B]/10 text-[#B7950B]'
        : 'text-slate-600 hover:bg-slate-50 hover:text-[#B7950B]'
    }`;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#FCF9F2]/95 backdrop-blur-md border-b-2 border-[#B7950B]/30 shadow-sm transition-all">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

        {/* ── Logo y Título ──────────────────────────────────────── */}
        <Link to="/" className="flex items-center gap-3 group">
          <img 
            src={logoQuinta} 
            alt="Logo Quinta Inés María" 
            className="h-14 w-auto drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
          />
          <div className="hidden lg:flex flex-col">
            <span className="font-display text-xl font-bold text-[#0D2137] leading-none group-hover:text-[#1A6BAC] transition-colors">
              Quinta Inés María
            </span>
            <span className="text-[9px] text-[#B7950B] font-bold tracking-widest uppercase mt-1">
              Catering & Eventos
            </span>
          </div>
        </Link>

        {/* ── Links de Navegación (Desktop) ──────────────────────── */}
        <div className="hidden md:flex items-center bg-white border border-slate-100 p-1 rounded-full shadow-sm">
          <NavLink to="/" end className={linkClass}>Inicio</NavLink>
          <NavLink to="/paquetes" className={linkClass}>Paquetes</NavLink>
          <NavLink to="/galeria" className={linkClass}>Galería</NavLink>
          <NavLink to="/configurador" className={linkClass}>Configurar Evento</NavLink>
          
          {/* Link Mis Solicitudes — solo clientes */}
          {isAuthenticated && esCliente && !esAdmin && (
            <NavLink to="/mis-solicitudes" className={linkClass}>Mis Eventos</NavLink>
          )}

          {/* Link Panel Admin — solo admin */}
          {isAuthenticated && esAdmin && (
            <NavLink to="/admin" className={linkClass}>⚡ Panel Admin</NavLink>
          )}
        </div>

        {/* ── Botones de Autenticación (Desktop) ─────────────────── */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <div className="relative">
              {/* Botón que abre el Dropdown */}
              <button
                onClick={() => setDropdown(!dropdown)}
                className="flex items-center gap-3 bg-white border border-slate-200 pl-2 pr-4 py-1.5 rounded-full hover:bg-slate-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#B7950B]"
                aria-expanded={dropdown}
              >
                <div className="w-8 h-8 rounded-full bg-[#B7950B] flex items-center justify-center text-white font-bold text-sm">
                  {(user?.nombre_completo ?? user?.nombre ?? 'U')[0].toUpperCase()}
                </div>
                <span className="text-sm text-slate-700 font-medium max-w-[120px] truncate">
                  {user?.nombre_completo?.split(' ')[0] ?? 'Usuario'}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 text-slate-400 transition-transform ${dropdown ? 'rotate-180' : ''}`}>
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </button>

              {/* Dropdown del Usuario */}
              {dropdown && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setDropdown(false)} />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-40 animate-in slide-in-from-top-2">
                    
                    <div className="px-4 py-4 bg-slate-50 border-b border-slate-100">
                      <p className="text-sm font-bold text-[#0D2137] truncate">{user?.nombre_completo ?? user?.nombre}</p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{user?.correo}</p>
                      <span className={`inline-block mt-2 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                        esAdmin ? 'bg-[#B7950B] text-white' : 'bg-[#0D2137]/10 text-[#0D2137]'
                      }`}>
                        {esAdmin ? '⚡ Administrador' : '👤 Cliente'}
                      </span>
                    </div>

                    <nav className="py-2">
                      {esAdmin && (
                        <DropdownLink to="/admin" onClick={() => setDropdown(false)}>
                          📊 Panel de administración
                        </DropdownLink>
                      )}
                      {esCliente && !esAdmin && (
                        <DropdownLink to="/mis-solicitudes" onClick={() => setDropdown(false)}>
                          📋 Mis eventos cotizados
                        </DropdownLink>
                      )}
                      <DropdownLink to="/configurador" onClick={() => setDropdown(false)}>
                        ✨ Configurar nuevo evento
                      </DropdownLink>

                      <div className="border-t border-slate-100 mt-2 pt-2 px-2">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                        >
                          🚪 Cerrar sesión
                        </button>
                      </div>
                    </nav>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <NavLink to="/login" className="text-sm font-bold px-5 py-2.5 rounded-full text-slate-600 hover:bg-slate-100 hover:text-[#0D2137] transition-all">
                Ingresar
              </NavLink>
              <NavLink to="/register" className="text-sm font-bold px-6 py-2.5 bg-[#0D2137] text-white rounded-full hover:bg-[#1A6BAC] hover:shadow-md hover:-translate-y-0.5 transition-all">
                Registrarse
              </NavLink>
            </div>
          )}
        </div>

        {/* ── Botón Menú Hamburguesa (Mobile) ────────────────────── */}
        <button
          aria-label="Abrir menú"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2.5 rounded-xl bg-white text-slate-600 hover:bg-slate-50 hover:text-[#0D2137] transition-colors border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#B7950B] shadow-sm"
        >
          {menuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </nav>

      {/* ── Menú Desplegable (Mobile) ────────────────────────────── */}
      {menuOpen && (
        <div className="md:hidden absolute top-20 left-0 right-0 bg-[#FCF9F2] border-b-2 border-[#B7950B]/30 px-4 py-6 shadow-xl flex flex-col gap-2 origin-top animate-in slide-in-from-top-2">
          <NavLink to="/" end className={mobileLinkClass} onClick={() => setMenuOpen(false)}>Inicio</NavLink>
          <NavLink to="/paquetes" className={mobileLinkClass} onClick={() => setMenuOpen(false)}>Paquetes</NavLink>
          <NavLink to="/galeria" className={mobileLinkClass} onClick={() => setMenuOpen(false)}>Galería</NavLink>
          <NavLink to="/configurador" className={mobileLinkClass} onClick={() => setMenuOpen(false)}>Configurar Evento</NavLink>

          {/* Links según rol en móvil */}
          {isAuthenticated && esCliente && !esAdmin && (
            <NavLink to="/mis-solicitudes" className={mobileLinkClass} onClick={() => setMenuOpen(false)}>📋 Mis Eventos</NavLink>
          )}
          {isAuthenticated && esAdmin && (
            <NavLink to="/admin" className={mobileLinkClass} onClick={() => setMenuOpen(false)}>⚡ Panel Admin</NavLink>
          )}

          <div className="h-px bg-slate-200 my-2" />

          {isAuthenticated ? (
            <>
              <div className="text-center mb-2">
                <p className="text-sm font-bold text-[#0D2137]">{user?.nombre_completo}</p>
                <p className="text-xs text-slate-500">{user?.correo}</p>
              </div>
              <button
                onClick={() => { handleLogout(); setMenuOpen(false); }}
                className="w-full text-sm font-bold px-5 py-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors border border-red-100"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2 mt-2">
              <NavLink to="/login" className="w-full text-sm font-bold px-5 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 text-center hover:bg-slate-50 transition-colors shadow-sm" onClick={() => setMenuOpen(false)}>
                Iniciar sesión
              </NavLink>
              <NavLink to="/register" className="w-full text-sm font-bold px-5 py-3 rounded-xl bg-[#0D2137] text-white text-center hover:bg-[#1A6BAC] transition-colors shadow-md" onClick={() => setMenuOpen(false)}>
                Crear cuenta
              </NavLink>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

// ── Sub-componente ──
function DropdownLink({ to, onClick, children }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-[#0D2137] transition-colors"
    >
      {children}
    </Link>
  );
}