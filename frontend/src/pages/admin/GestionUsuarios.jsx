import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getClientes, toggleActivoCliente } from '../../services/usuarios.service';
import { Users, Search, UserCheck, UserX, Mail, Phone, Calendar, RefreshCw, ChevronLeft, ChevronRight, Clock, AlertCircle, CheckCircle, MessageCircle, FileText } from 'lucide-react';
import { telefonoAWa } from '../../config/contacto';

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
const LIMITE = 12;

// ── Helper para calcular si está inactivo >1 mes ──────────────────────────
function esInactivoMas1Mes(ultimoLogin) {
  if (!ultimoLogin) return true;
  const diffDias = (Date.now() - new Date(ultimoLogin)) / (1000 * 60 * 60 * 24);
  return diffDias > 30;
}

// ── Badge de estado con color ─────────────────────────────────────────────
function EstadoBadge({ activo, ultimoLogin }) {
  if (!activo) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Bloqueado
      </span>
    );
  }
  if (esInactivoMas1Mes(ultimoLogin)) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Inactivo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Activo
    </span>
  );
}

// ── Colores de la card según estado ──────────────────────────────────────
function getCardStyle(cliente) {
  if (!cliente.activo) {
    return {
      border: 'border-red-200',
      bg: 'bg-gradient-to-br from-red-50 to-white',
      avatarBg: 'bg-red-500',
      accent: '#EF4444',
    };
  }
  if (esInactivoMas1Mes(cliente.ultimo_login)) {
    return {
      border: 'border-slate-200',
      bg: 'bg-gradient-to-br from-slate-50 to-white',
      avatarBg: 'bg-slate-400',
      accent: '#94A3B8',
    };
  }
  return {
    border: 'border-blue-200',
    bg: 'bg-gradient-to-br from-[#0D2137]/5 to-white',
    avatarBg: 'bg-[#0D2137]',
    accent: '#0D2137',
  };
}

// ── Tarjeta de Usuario ────────────────────────────────────────────────────
function UserCard({ cliente, onToggle, toggling }) {
  const style = getCardStyle(cliente);
  const inicial = cliente.nombre_completo?.split(' ').slice(0,2).map(n => n[0]).join('').toUpperCase() || '?';
  const fotoUrl = cliente.foto_perfil ? `${BACKEND_URL}${cliente.foto_perfil}` : null;
  const [hover, setHover] = useState(false);

  return (
    <div
      className={`relative rounded-2xl border-2 ${style.border} ${style.bg} p-5 transition-all duration-300 ${hover ? 'shadow-xl -translate-y-1' : 'shadow-sm'} overflow-hidden`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Decoración de fondo */}
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5 -translate-y-6 translate-x-6"
        style={{ backgroundColor: style.accent }}
      />

      {/* Header de la card */}
      <div className="flex items-start gap-3 mb-4">
        {/* Avatar */}
        <div className={`w-12 h-12 rounded-xl ${style.avatarBg} flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden shadow-md`}>
          {fotoUrl ? (
            <img src={fotoUrl} alt={cliente.nombre_completo} className="w-full h-full object-cover" />
          ) : inicial}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#0D2137] text-sm leading-tight truncate">
            {cliente.nombre_completo}
          </p>
          <p className="text-slate-400 text-xs mt-0.5 truncate">{cliente.correo}</p>
        </div>

        {/* Estado */}
        <EstadoBadge activo={cliente.activo} ultimoLogin={cliente.ultimo_login} />
      </div>

      {/* Info */}
      <div className="space-y-2">
        {cliente.telefono && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Phone size={12} className="text-slate-400 shrink-0" />
            <span>{cliente.telefono}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Calendar size={12} className="text-slate-400 shrink-0" />
          <span>Registro: {new Date(cliente.creado_en).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
        {cliente.ultimo_login && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock size={12} className="text-slate-400 shrink-0" />
            <span>Último acceso: {new Date(cliente.ultimo_login).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs">
          {cliente.correo_verificado ? (
            <><CheckCircle size={12} className="text-green-500 shrink-0" /><span className="text-green-600">Correo verificado</span></>
          ) : (
            <><AlertCircle size={12} className="text-amber-500 shrink-0" /><span className="text-amber-600">Sin verificar</span></>
          )}
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="flex flex-wrap gap-2 mt-4">
        {cliente.telefono && telefonoAWa(cliente.telefono) && (
          <a
            href={telefonoAWa(cliente.telefono)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-w-[100px] flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-[#25D366]/10 text-[#128C7E] border border-[#25D366]/30 hover:bg-[#25D366]/20 transition-colors"
          >
            <MessageCircle size={14} /> WhatsApp
          </a>
        )}
        <a
          href={`mailto:${cliente.correo}`}
          className="flex-1 min-w-[100px] flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-[#0D2137]/5 text-[#0D2137] border border-[#0D2137]/15 hover:bg-[#0D2137]/10 transition-colors"
        >
          <Mail size={14} /> Email
        </a>
        <Link
          to={`/admin/solicitudes?usuario_id=${cliente.usuario_id}&cliente=${encodeURIComponent(cliente.nombre_completo)}`}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-[#B7950B]/15 text-[#9A7D0A] border border-[#B7950B]/40 hover:bg-[#B7950B]/25 transition-colors"
        >
          <FileText size={14} />
          Ver Solicitudes ({cliente.solicitudes_count ?? 0})
        </Link>
      </div>

      <button
        onClick={() => onToggle(cliente)}
        disabled={toggling === cliente.usuario_id}
        className={`mt-3 w-full py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
          cliente.activo
            ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
            : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
        } disabled:opacity-50`}
        aria-label={cliente.activo ? 'Bloquear usuario' : 'Activar usuario'}
      >
        {toggling === cliente.usuario_id ? (
          <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : cliente.activo ? (
          <><UserX size={14} /> Bloquear cuenta</>
        ) : (
          <><UserCheck size={14} /> Activar cuenta</>
        )}
      </button>
    </div>
  );
}

// ── Skeleton de carga ─────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="rounded-2xl border-2 border-slate-100 bg-white p-5 animate-pulse space-y-3">
      <div className="flex gap-3">
        <div className="w-12 h-12 bg-slate-200 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 rounded w-3/4" />
          <div className="h-3 bg-slate-100 rounded w-full" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-slate-100 rounded w-2/3" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
        <div className="h-3 bg-slate-100 rounded w-3/4" />
      </div>
      <div className="h-8 bg-slate-100 rounded-xl mt-2" />
    </div>
  );
}

// ── Filtro activo por mes ────────────────────────────────────────────────
const FILTROS_ESTADO = [
  { key: 'todos',     label: 'Todos' },
  { key: 'activos',   label: 'Activos' },
  { key: 'bloqueados', label: 'Bloqueados' },
  { key: 'inactivos', label: 'Inactivos >1 mes' },
];

// =============================================================================
export default function GestionUsuarios() {
  const [clientes,   setClientes]   = useState([]);
  const [total,      setTotal]      = useState(0);
  const [pagina,     setPagina]     = useState(1);
  const [busqueda,   setBusqueda]   = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [loading,    setLoading]    = useState(true);
  const [toggling,   setToggling]   = useState(null);
  const [toast,      setToast]      = useState(null);

  const mostrarToast = (tipo, msg) => {
    setToast({ tipo, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getClientes({ busqueda, pagina, limite: LIMITE });
      setClientes(res.clientes ?? []);
      setTotal(res.total ?? 0);
    } catch {
      mostrarToast('error', 'Error al cargar usuarios.');
    } finally {
      setLoading(false);
    }
  }, [busqueda, pagina]);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => { setPagina(1); }, [busqueda, filtroEstado]);

  const handleToggle = async (usuario) => {
    setToggling(usuario.usuario_id);
    try {
      await toggleActivoCliente(usuario.usuario_id);
      mostrarToast('ok', `Usuario ${usuario.activo ? 'bloqueado' : 'activado'} correctamente.`);
      cargar();
    } catch {
      mostrarToast('error', 'Error al cambiar el estado.');
    } finally {
      setToggling(null);
    }
  };

  // Filtrar en frontend (por estado)
  const clientesFiltrados = clientes.filter(c => {
    if (filtroEstado === 'activos')    return c.activo && !esInactivoMas1Mes(c.ultimo_login);
    if (filtroEstado === 'bloqueados') return !c.activo;
    if (filtroEstado === 'inactivos')  return c.activo && esInactivoMas1Mes(c.ultimo_login);
    return true;
  });

  const totalPaginas = Math.ceil(total / LIMITE);

  // KPIs calculadas de los clientes cargados (de todas las páginas no, solo la actual)
  const kpiActivos   = clientes.filter(c => c.activo && !esInactivoMas1Mes(c.ultimo_login)).length;
  const kpiBloqueados = clientes.filter(c => !c.activo).length;
  const kpiInactivos = clientes.filter(c => c.activo && esInactivoMas1Mes(c.ultimo_login)).length;

  return (
    <div className="space-y-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border ${
          toast.tipo === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {toast.tipo === 'ok' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span className="font-medium text-sm">{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-[#0D2137]">Gestión de Usuarios</h1>
        <p className="text-sm text-slate-500 mt-1">Administra los clientes registrados en el sistema · {total} total.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Clientes', value: total, color: 'text-[#0D2137]', bg: 'from-[#0D2137]/10', icon: <Users size={20} className="text-[#0D2137]" /> },
          { label: 'Activos', value: kpiActivos, color: 'text-green-600', bg: 'from-green-100', icon: <UserCheck size={20} className="text-green-600" /> },
          { label: 'Bloqueados', value: kpiBloqueados, color: 'text-red-500', bg: 'from-red-100', icon: <UserX size={20} className="text-red-500" /> },
          { label: 'Inactivos >1 mes', value: kpiInactivos, color: 'text-slate-400', bg: 'from-slate-100', icon: <Clock size={20} className="text-slate-400" /> },
        ].map((kpi, i) => (
          <div key={i} className={`bg-gradient-to-br ${kpi.bg} to-white rounded-2xl border border-slate-100 shadow-sm p-5`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{kpi.label}</p>
              {kpi.icon}
            </div>
            <p className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        {/* Búsqueda */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:border-[#B7950B] focus:outline-none transition-colors"
            aria-label="Buscar cliente"
          />
        </div>

        {/* Filtros de estado */}
        <div className="flex gap-2 flex-wrap">
          {FILTROS_ESTADO.map(f => (
            <button
              key={f.key}
              onClick={() => setFiltroEstado(f.key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all duration-200 ${
                filtroEstado === f.key
                  ? 'bg-[#0D2137] text-white border-[#0D2137]'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <button
          onClick={cargar}
          className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
          title="Recargar"
          aria-label="Recargar"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Grid de Tarjetas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: LIMITE }).map((_, i) => <CardSkeleton key={i} />)
        ) : clientesFiltrados.length === 0 ? (
          <div className="col-span-full text-center py-20 text-slate-400">
            <Users size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium">No se encontraron usuarios con este filtro.</p>
          </div>
        ) : (
          clientesFiltrados.map(cliente => (
            <UserCard
              key={cliente.usuario_id}
              cliente={cliente}
              onToggle={handleToggle}
              toggling={toggling}
            />
          ))
        )}
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPagina(p => Math.max(1, p - 1))}
            disabled={pagina === 1}
            className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Página anterior"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex gap-1">
            {Array.from({ length: Math.min(totalPaginas, 5) }, (_, i) => {
              const pg = i + 1;
              return (
                <button
                  key={pg}
                  onClick={() => setPagina(pg)}
                  className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${
                    pagina === pg ? 'bg-[#0D2137] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {pg}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
            disabled={pagina === totalPaginas}
            className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Página siguiente"
          >
            <ChevronRight size={18} />
          </button>

          <span className="text-sm text-slate-500 ml-2">
            Página {pagina} de {totalPaginas}
          </span>
        </div>
      )}
    </div>
  );
}
