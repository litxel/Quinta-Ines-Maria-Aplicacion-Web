import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getClientes, toggleActivoCliente } from '../../services/usuarios.service';
import { Users, Search, UserCheck, UserX, Mail, Phone, Calendar, RefreshCw, ChevronLeft, ChevronRight, Clock, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { telefonoAWa } from '../../config/contacto';

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
const LIMITE = 12;

// ── Ícono oficial de WhatsApp ─────────────────────────────────────────────
function WhatsAppIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.515 5.26l-.999 3.648 3.973-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413z"/>
    </svg>
  );
}

// ── Helper para calcular si está inactivo >1 mes ──────────────────────────
function esInactivoMas1Mes(ultimoLogin) {
  if (!ultimoLogin) return true;
  const diffDias = (Date.now() - new Date(ultimoLogin)) / (1000 * 60 * 60 * 24);
  return diffDias > 30;
}

// ── 4 tonalidades intercaladas (gold · amatista · azul · rosa) ─────────────
const TINTS = [
  { grad: 'from-[#C9A227]/12', border: 'border-[#C9A227]/30 dark:border-[#C9A227]/25', avatar: 'bg-gradient-to-br from-[#C9A227] to-[#B7950B]', accent: '#C9A227' },
  { grad: 'from-[#A971D6]/12', border: 'border-[#A971D6]/30 dark:border-[#A971D6]/30', avatar: 'bg-gradient-to-br from-[#A971D6] to-[#6B3F7A]', accent: '#A971D6' },
  { grad: 'from-[#1A6BAC]/12', border: 'border-[#1A6BAC]/25 dark:border-[#1A6BAC]/30', avatar: 'bg-gradient-to-br from-[#1A6BAC] to-[#0D2137]', accent: '#1A6BAC' },
  { grad: 'from-rose-400/12',  border: 'border-rose-300/40 dark:border-rose-400/25',   avatar: 'bg-gradient-to-br from-rose-400 to-rose-600',   accent: '#FB7185' },
];
const TINT_BLOQUEADO = { grad: 'from-red-500/12', border: 'border-red-300 dark:border-red-500/30', avatar: 'bg-gradient-to-br from-red-500 to-red-700', accent: '#EF4444' };

// ── Badge de estado con color ─────────────────────────────────────────────
function EstadoBadge({ activo, ultimoLogin }) {
  if (!activo) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/25">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Bloqueado
      </span>
    );
  }
  if (esInactivoMas1Mes(ultimoLogin)) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/12">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Inactivo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/25">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Activo
    </span>
  );
}

// ── Tarjeta de Usuario ────────────────────────────────────────────────────
function UserCard({ cliente, onToggle, toggling, index }) {
  const tint = !cliente.activo ? TINT_BLOQUEADO : TINTS[index % TINTS.length];
  const inicial = cliente.nombre_completo?.split(' ').slice(0,2).map(n => n[0]).join('').toUpperCase() || '?';
  const fotoUrl = cliente.foto_perfil ? `${BACKEND_URL}${cliente.foto_perfil}` : null;

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={`relative rounded-2xl border-2 ${tint.border} bg-gradient-to-br ${tint.grad} to-white dark:to-[#332247] p-5 shadow-sm hover:shadow-xl transition-shadow duration-300 overflow-hidden`}
    >
      {/* Decoración de fondo */}
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 -translate-y-6 translate-x-6"
        style={{ backgroundColor: tint.accent }}
      />

      {/* Header de la card */}
      <div className="relative flex items-start gap-3 mb-4">
        <div className={`w-12 h-12 rounded-xl ${tint.avatar} flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden shadow-md`}>
          {fotoUrl ? (
            <img src={fotoUrl} alt={cliente.nombre_completo} className="w-full h-full object-cover" />
          ) : inicial}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#0D2137] dark:text-white text-sm leading-tight truncate">
            {cliente.nombre_completo}
          </p>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5 truncate">{cliente.correo}</p>
        </div>

        <EstadoBadge activo={cliente.activo} ultimoLogin={cliente.ultimo_login} />
      </div>

      {/* Info */}
      <div className="relative space-y-2">
        {cliente.telefono && (
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Phone size={12} className="text-slate-400 shrink-0" />
            <span>{cliente.telefono}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Calendar size={12} className="text-slate-400 shrink-0" />
          <span>Registro: {new Date(cliente.creado_en).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
        {cliente.ultimo_login && (
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Clock size={12} className="text-slate-400 shrink-0" />
            <span>Último acceso: {new Date(cliente.ultimo_login).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs">
          {cliente.correo_verificado ? (
            <><CheckCircle size={12} className="text-green-500 shrink-0" /><span className="text-green-600 dark:text-green-400">Correo verificado</span></>
          ) : (
            <><AlertCircle size={12} className="text-amber-500 shrink-0" /><span className="text-amber-600 dark:text-amber-400">Sin verificar</span></>
          )}
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="relative flex flex-wrap gap-2 mt-4">
        {cliente.telefono && telefonoAWa(cliente.telefono) && (
          <a
            href={telefonoAWa(cliente.telefono)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-w-[100px] flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-[#25D366]/12 text-[#128C7E] dark:text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366] hover:text-white hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
          >
            <WhatsAppIcon size={14} /> WhatsApp
          </a>
        )}
        <a
          href={`mailto:${cliente.correo}`}
          className="flex-1 min-w-[100px] flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-[#0D2137]/6 dark:bg-white/8 text-[#0D2137] dark:text-slate-200 border border-[#0D2137]/15 dark:border-white/12 hover:bg-[#0D2137] dark:hover:bg-[#A971D6] hover:text-white hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
        >
          <Mail size={14} /> Email
        </a>
        <Link
          to={`/admin/solicitudes?usuario_id=${cliente.usuario_id}&cliente=${encodeURIComponent(cliente.nombre_completo)}`}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-[#B7950B]/15 text-[#9A7D0A] dark:text-[#C9A227] border border-[#B7950B]/40 dark:border-[#C9A227]/30 hover:bg-gradient-to-r hover:from-[#C9A227] hover:to-[#B7950B] hover:text-white hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
        >
          <FileText size={14} />
          Ver Solicitudes ({cliente.solicitudes_count ?? 0})
        </Link>
      </div>

      <button
        onClick={() => onToggle(cliente)}
        disabled={toggling === cliente.usuario_id}
        className={`relative mt-3 w-full py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 hover:-translate-y-0.5 hover:shadow-md ${
          cliente.activo
            ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/25 hover:bg-red-500 hover:text-white hover:border-red-500'
            : 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/25 hover:bg-green-500 hover:text-white hover:border-green-500'
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
    </motion.div>
  );
}

// ── Skeleton de carga ─────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="rounded-2xl border-2 border-slate-100 dark:border-white/8 bg-white dark:bg-[#332247] p-5 animate-pulse space-y-3">
      <div className="flex gap-3">
        <div className="w-12 h-12 bg-slate-200 dark:bg-white/8 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-white/8 rounded w-3/4" />
          <div className="h-3 bg-slate-100 dark:bg-white/5 rounded w-full" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-slate-100 dark:bg-white/5 rounded w-2/3" />
        <div className="h-3 bg-slate-100 dark:bg-white/5 rounded w-1/2" />
        <div className="h-3 bg-slate-100 dark:bg-white/5 rounded w-3/4" />
      </div>
      <div className="h-8 bg-slate-100 dark:bg-white/5 rounded-xl mt-2" />
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

  const kpiActivos   = clientes.filter(c => c.activo && !esInactivoMas1Mes(c.ultimo_login)).length;
  const kpiBloqueados = clientes.filter(c => !c.activo).length;
  const kpiInactivos = clientes.filter(c => c.activo && esInactivoMas1Mes(c.ultimo_login)).length;

  return (
    <div className="space-y-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border ${
          toast.tipo === 'ok'
            ? 'bg-green-50 dark:bg-green-500/15 border-green-200 dark:border-green-500/30 text-green-800 dark:text-green-300'
            : 'bg-red-50 dark:bg-red-500/15 border-red-200 dark:border-red-500/30 text-red-800 dark:text-red-300'
        }`}>
          {toast.tipo === 'ok' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span className="font-medium text-sm">{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-[#0D2137] dark:text-white">Gestión de Usuarios</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Administra los clientes registrados en el sistema · {total} total.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Clientes', value: total, color: 'text-[#0D2137] dark:text-white', bg: 'from-[#0D2137]/10 dark:from-[#A971D6]/12', icon: <Users size={20} className="text-[#0D2137] dark:text-[#A971D6]" /> },
          { label: 'Activos', value: kpiActivos, color: 'text-green-600 dark:text-green-400', bg: 'from-green-100 dark:from-green-500/12', icon: <UserCheck size={20} className="text-green-600 dark:text-green-400" /> },
          { label: 'Bloqueados', value: kpiBloqueados, color: 'text-red-500 dark:text-red-400', bg: 'from-red-100 dark:from-red-500/12', icon: <UserX size={20} className="text-red-500 dark:text-red-400" /> },
          { label: 'Inactivos >1 mes', value: kpiInactivos, color: 'text-slate-400 dark:text-slate-300', bg: 'from-slate-100 dark:from-white/8', icon: <Clock size={20} className="text-slate-400" /> },
        ].map((kpi, i) => (
          <div key={i} className={`bg-gradient-to-br ${kpi.bg} to-white dark:to-[#332247] rounded-2xl border border-slate-100 dark:border-white/8 shadow-sm p-5`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{kpi.label}</p>
              {kpi.icon}
            </div>
            <p className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center bg-white dark:bg-[#332247] rounded-2xl border border-slate-100 dark:border-white/8 shadow-sm p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-200 dark:border-white/12 dark:bg-white/5 dark:text-white rounded-xl text-sm focus:border-[#B7950B] focus:outline-none transition-colors"
            aria-label="Buscar cliente"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {FILTROS_ESTADO.map(f => (
            <button
              key={f.key}
              onClick={() => setFiltroEstado(f.key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all duration-200 ${
                filtroEstado === f.key
                  ? 'bg-[#0D2137] dark:bg-gradient-to-r dark:from-[#6B3F7A] dark:to-[#A971D6] text-white border-[#0D2137] dark:border-transparent'
                  : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/12 hover:border-slate-300 dark:hover:border-white/25'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <button
          onClick={cargar}
          className="p-2.5 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/8 rounded-xl transition-colors"
          title="Recargar"
          aria-label="Recargar"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Grid de Tarjetas */}
      <motion.div
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        {loading ? (
          Array.from({ length: LIMITE }).map((_, i) => <CardSkeleton key={i} />)
        ) : clientesFiltrados.length === 0 ? (
          <div className="col-span-full text-center py-20 text-slate-400 dark:text-slate-500">
            <Users size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium">No se encontraron usuarios con este filtro.</p>
          </div>
        ) : (
          clientesFiltrados.map((cliente, i) => (
            <UserCard
              key={cliente.usuario_id}
              cliente={cliente}
              onToggle={handleToggle}
              toggling={toggling}
              index={i}
            />
          ))
        )}
      </motion.div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPagina(p => Math.max(1, p - 1))}
            disabled={pagina === 1}
            className="p-2.5 bg-white dark:bg-[#332247] border border-slate-200 dark:border-white/12 rounded-xl hover:bg-slate-50 dark:hover:bg-white/8 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-600 dark:text-slate-300"
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
                    pagina === pg
                      ? 'bg-[#0D2137] dark:bg-gradient-to-r dark:from-[#6B3F7A] dark:to-[#A971D6] text-white'
                      : 'bg-white dark:bg-[#332247] border border-slate-200 dark:border-white/12 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/8'
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
            className="p-2.5 bg-white dark:bg-[#332247] border border-slate-200 dark:border-white/12 rounded-xl hover:bg-slate-50 dark:hover:bg-white/8 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-600 dark:text-slate-300"
            aria-label="Página siguiente"
          >
            <ChevronRight size={18} />
          </button>

          <span className="text-sm text-slate-500 dark:text-slate-400 ml-2">
            Página {pagina} de {totalPaginas}
          </span>
        </div>
      )}
    </div>
  );
}
