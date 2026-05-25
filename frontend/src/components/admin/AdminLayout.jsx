import { useState, useEffect } from 'react';
import { NavLink, Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Calendar, 
  Package, 
  Image as ImageIcon, 
  LogOut, 
  ChevronDown,
  Menu,
  Settings,
  ChevronLeft
} from 'lucide-react';

// ── ESTRUCTURA DEL MENÚ TIPO ACORDEÓN ──
const MENU_GROUPS = [
  {
    title: 'INICIO',
    items: [
      { to: '/admin', label: 'Panel General', icon: <LayoutDashboard size={20} />, exact: true }
    ]
  },
  {
    title: 'OPERACIONES',
    icon: <ClipboardList size={20} />,
    items: [
      { to: '/admin/solicitudes', label: 'Facturación y Solicitudes', icon: <ClipboardList size={18} /> },
      { to: '/admin/calendario', label: 'Calendario de Eventos', icon: <Calendar size={18} /> }
    ]
  },
  {
    title: 'SISTEMA Y CATÁLOGO',
    icon: <Settings size={20} />,
    items: [
      { to: '/admin/catalogo', label: 'Servicios y Precios', icon: <Package size={18} /> },
      { to: '/admin/galeria', label: 'Galería Visual', icon: <ImageIcon size={18} /> }
    ]
  }
];

export default function AdminLayout() {
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Estados para animaciones
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState({});

  // Abrir automáticamente el grupo si estamos en una de sus rutas
  useEffect(() => {
    const currentGroupIndex = MENU_GROUPS.findIndex(group => 
      group.items.some(item => location.pathname.startsWith(item.to) && item.to !== '/admin')
    );
    if (currentGroupIndex !== -1) {
      setOpenGroups(prev => ({ ...prev, [currentGroupIndex]: true }));
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleGroup = (index) => {
    if (isCollapsed) setIsCollapsed(false); // Si está colapsado, expandirlo al hacer clic
    setOpenGroups(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans overflow-hidden">
      
      {/* ── SIDEBAR ELEGANTE (Animado) ── */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 bg-[#0D2137] text-white flex flex-col shadow-2xl transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-72'
        }`}
      >
        {/* Botón Flotante para Colapsar */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-8 bg-[#B7950B] text-white p-1 rounded-full shadow-lg hover:bg-yellow-600 transition-transform z-50"
        >
          <ChevronLeft size={16} className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>

        {/* Header Sidebar */}
        <div className={`p-6 border-b border-white/10 flex items-center transition-all ${isCollapsed ? 'justify-center px-0' : 'gap-4'}`}>
          <Link to="/" className="flex items-center group shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#B7950B] to-yellow-600 flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-105 transition-transform">
              Q
            </div>
          </Link>
          {!isCollapsed && (
            <div className="flex flex-col animate-in fade-in duration-300 whitespace-nowrap overflow-hidden">
              <span className="font-display font-bold text-lg leading-tight tracking-wide">Event Planner QIM</span>
              <span className="text-[9px] text-[#B7950B] font-bold tracking-[0.2em] uppercase">Gestión Empresarial</span>
            </div>
          )}
        </div>

        {/* Navegación tipo Acordeón */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-6 space-y-2 custom-scrollbar">
          {MENU_GROUPS.map((group, idx) => {
            const isOpen = openGroups[idx];
            // Si es grupo simple (solo 1 item que actúa como padre)
            if (!group.icon) {
              return (
                <div key={idx} className="px-3 mb-2">
                  {!isCollapsed && <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{group.title}</p>}
                  {group.items.map(item => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.exact}
                      title={isCollapsed ? item.label : ''}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                          isActive
                            ? 'bg-gradient-to-r from-[#B7950B] to-yellow-600 text-white shadow-lg shadow-yellow-600/20'
                            : 'text-slate-300 hover:text-white hover:bg-white/5'
                        } ${isCollapsed ? 'justify-center' : ''}`
                      }
                    >
                      <span className={`${isCollapsed ? 'scale-110' : ''}`}>{item.icon}</span>
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </NavLink>
                  ))}
                </div>
              );
            }

            // Si es grupo con acordeón
            const isAnyChildActive = group.items.some(item => location.pathname.startsWith(item.to));

            return (
              <div key={idx} className="px-3 mb-1">
                <button
                  onClick={() => toggleGroup(idx)}
                  title={isCollapsed ? group.title : ''}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isAnyChildActive && !isOpen 
                      ? 'bg-white/10 text-white shadow-inner' 
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`${isCollapsed ? 'scale-110' : ''} ${isAnyChildActive ? 'text-[#B7950B]' : ''}`}>{group.icon}</span>
                    {!isCollapsed && <span className={`truncate ${isAnyChildActive ? 'font-bold' : ''}`}>{group.title}</span>}
                  </div>
                  {!isCollapsed && (
                    <ChevronDown size={16} className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#B7950B]' : 'text-slate-500'}`} />
                  )}
                </button>

                {/* Submenú Animado */}
                <div 
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen && !isCollapsed ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden flex flex-col gap-1 pl-11 pr-2">
                    {group.items.map(item => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 relative ${
                            isActive
                              ? 'text-white font-bold bg-white/5'
                              : 'text-slate-400 font-medium hover:text-white hover:bg-white/5'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {/* Puntito indicador */}
                            <span className={`absolute left-0 w-1.5 h-1.5 rounded-full transition-all duration-300 ${isActive ? 'bg-[#B7950B] scale-100' : 'bg-slate-600 scale-50'}`} />
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

        {/* Footer Sidebar (Usuario) */}
        <div className={`p-4 border-t border-white/10 bg-black/20 transition-all ${isCollapsed ? 'items-center' : ''}`}>
          {!isCollapsed && (
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 flex items-center justify-center font-bold text-white shadow-inner">
                {(user?.nombre_completo ?? 'A')[0]}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold text-white truncate">{user?.nombre_completo?.split(' ')[0]}</span>
                <span className="text-[10px] text-[#B7950B] uppercase tracking-wider truncate">Administrador</span>
              </div>
            </div>
          )}
          
          <button
            onClick={handleLogout}
            title={isCollapsed ? "Cerrar Sesión" : ""}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500 hover:text-white transition-all border border-red-500/20 w-full`}
          >
            <LogOut size={16} />
            {!isCollapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* ── CONTENIDO PRINCIPAL ── */}
      <main className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${isCollapsed ? 'ml-20' : 'ml-72'}`}>
        
        {/* Header Superior Topbar */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-slate-400 text-xs font-bold uppercase tracking-widest hidden sm:block flex-wrap">
              Quinta Inés María <span className="mx-2">/</span> <span className="text-[#0D2137]">{window.location.pathname.split('/').pop() || 'Dashboard'}</span>
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Sistema en línea
             </div>
             <Link to="/" className="text-xs font-bold text-white bg-[#0D2137] px-4 py-2 rounded-lg hover:bg-[#1A6BAC] shadow-md transition-colors">
               Ver sitio público
             </Link>
          </div>
        </header>

        {/* Zona del contenido (Outlet) */}
        <div className="p-4 sm:p-8 flex-1 overflow-x-hidden">
          <Outlet />
        </div>
      </main>

      {/* CSS para la barra de scroll bonita del sidebar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}