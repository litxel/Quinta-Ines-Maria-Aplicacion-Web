import { useState, useEffect, useCallback } from 'react';
import { getSolicitudesArchivadas, desarchivarSolicitud } from '../../services/solicitudes.service';
import { Archive, ArchiveRestore, RefreshCw, Search, ChevronLeft, ChevronRight, Calendar, Users, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const ESTADOS_COLOR = {
  PENDIENTE:   'bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-500/25',
  EN_REVISION: 'bg-blue-100 dark:bg-blue-500/15 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-500/25',
  CONFIRMADA:  'bg-green-100 dark:bg-green-500/15 text-green-800 dark:text-green-400 border-green-200 dark:border-green-500/25',
  RECHAZADA:   'bg-red-100 dark:bg-red-500/15 text-red-800 dark:text-red-400 border-red-200 dark:border-red-500/25',
  CANCELADA:   'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 dark:text-slate-300 border-slate-200 dark:border-white/12 dark:border-white/15',
  COMPLETADA:  'bg-purple-100 dark:bg-purple-500/15 text-purple-800 dark:text-purple-400 border-purple-200 dark:border-purple-500/25',
};

export default function SolicitudesArchivadas() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [total, setTotal]             = useState(0);
  const [pagina, setPagina]           = useState(1);
  const [busqueda, setBusqueda]       = useState('');
  const [loading, setLoading]         = useState(true);
  const [procesando, setProcesando]   = useState(null);
  const [toast, setToast]             = useState(null);
  const LIMITE = 15;

  const mostrarToast = (tipo, msg) => {
    setToast({ tipo, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSolicitudesArchivadas({ pagina, limite: LIMITE });
      setSolicitudes(res.solicitudes || []);
      setTotal(res.total || 0);
    } catch (e) {
      mostrarToast('error', 'Error al cargar las solicitudes archivadas.');
    } finally {
      setLoading(false);
    }
  }, [pagina]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleDesarchivar = async (sol) => {
    setProcesando(sol.solicitud_id);
    try {
      await desarchivarSolicitud(sol.solicitud_id);
      mostrarToast('ok', `Solicitud ${sol.numero_cotizacion} restaurada a la vista principal.`);
      cargar();
    } catch (e) {
      mostrarToast('error', e.response?.data?.message || 'Error al desarchivar.');
    } finally {
      setProcesando(null);
    }
  };

  // Filtrado local por búsqueda
  const solicitudesFiltradas = solicitudes.filter(s =>
    !busqueda ||
    s.numero_cotizacion?.toLowerCase().includes(busqueda.toLowerCase()) ||
    s.cliente_nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    s.cliente_correo?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalPaginas = Math.ceil(total / LIMITE);

  const fmt = (n) => new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n || 0);
  const fmtFecha = (d) => d ? new Date(d).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-right duration-300 ${
          toast.tipo === 'ok' ? 'bg-green-50 dark:bg-green-500/15 border-green-200 dark:border-green-500/30 text-green-800 dark:text-green-300' : 'bg-red-50 dark:bg-red-500/15 border-red-200 dark:border-red-500/30 text-red-800 dark:text-red-300'
        }`}>
          {toast.tipo === 'ok' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="font-medium text-sm">{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-slate-100 dark:bg-white/8 rounded-2xl flex items-center justify-center">
              <Archive size={20} className="text-slate-600 dark:text-slate-300" />
            </div>
            <h1 className="text-3xl font-display font-bold text-[#0D2137] dark:text-white">Solicitudes Archivadas</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 ml-13">Registros archivados para mantener limpia la vista principal.</p>
        </div>
        <button
          onClick={cargar}
          className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#332247] border border-slate-200 dark:border-white/12 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-white/8 transition-colors text-sm font-medium shadow-sm"
          title="Recargar"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* Stats bar */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-2xl p-5 flex items-center gap-6 text-white shadow-lg">
        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
          <Archive size={24} />
        </div>
        <div>
          <p className="text-white/60 text-xs font-bold uppercase tracking-wider">Total archivadas</p>
          <p className="text-3xl font-bold">{total}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-white/60 text-xs">Página {pagina} de {totalPaginas || 1}</p>
          <p className="text-white/80 text-sm font-medium mt-0.5">{LIMITE} por página</p>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-[#332247] rounded-2xl border border-slate-100 dark:border-white/8 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-slate-100 dark:border-white/8 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-slate-50/50 dark:bg-white/5">
          <h2 className="font-bold text-[#0D2137] dark:text-white text-lg">Registro de Archivados</h2>
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por número o cliente..."
              className="w-full pl-9 pr-4 py-2.5 border-2 border-slate-200 dark:border-white/12 dark:bg-white/5 dark:text-white rounded-xl text-sm focus:border-[#B7950B] focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[700px]">
            <thead className="bg-gradient-to-r from-[#0D2137] to-[#1A3A5C] dark:from-[#3E2B57] dark:to-[#332247] text-white/80 text-xs uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4">N.° Solicitud</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Evento</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Valor</th>
                <th className="px-6 py-4">Creada</th>
                <th className="px-6 py-4 text-right">Restaurar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/8">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : solicitudesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <Archive size={40} className="text-slate-300" />
                      <p className="text-slate-400 font-medium">No hay solicitudes archivadas</p>
                      <p className="text-slate-400 text-xs">Las solicitudes que archives aparecerán aquí</p>
                    </div>
                  </td>
                </tr>
              ) : (
                solicitudesFiltradas.map((sol, idx) => (
                  <tr key={sol.solicitud_id} className={`transition-colors group hover:bg-[#B7950B]/8 dark:hover:bg-[#A971D6]/10 ${idx % 2 === 0 ? 'bg-white dark:bg-[#332247]' : 'bg-slate-50/50 dark:bg-white/[0.02]'}`}>
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-[#0D2137] dark:text-white text-xs">{sol.numero_cotizacion}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{sol.cliente_nombre}</p>
                        <p className="text-slate-400 text-xs truncate max-w-[180px]">{sol.cliente_correo}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-slate-700 dark:text-slate-200 font-medium text-xs">{sol.tipo_nombre || '—'}</p>
                        <p className="text-slate-400 text-xs">{sol.paquete_nombre || '—'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${ESTADOS_COLOR[sol.estado_codigo] || 'bg-slate-100 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/12'}`}>
                        {sol.estado_nombre}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{fmt(sol.precio_estimado)}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
                      {fmtFecha(sol.creado_en)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDesarchivar(sol)}
                        disabled={procesando === sol.solicitud_id}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-[#0D2137] dark:bg-gradient-to-r dark:from-[#6B3F7A] dark:to-[#A971D6] text-white rounded-lg hover:bg-[#1A6BAC] transition-colors disabled:opacity-50 shadow-sm"
                        title="Restaurar a vista principal"
                      >
                        {procesando === sol.solicitud_id ? (
                          <RefreshCw size={14} className="animate-spin" />
                        ) : (
                          <ArchiveRestore size={14} />
                        )}
                        Restaurar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-white/8 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Mostrando {Math.min((pagina - 1) * LIMITE + 1, total)}–{Math.min(pagina * LIMITE, total)} de {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagina(p => Math.max(1, p - 1))}
                disabled={pagina === 1}
                className="p-2 rounded-lg border border-slate-200 dark:border-white/12 hover:bg-slate-100 dark:hover:bg-white/8 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(5, totalPaginas) }).map((_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => setPagina(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-bold transition-colors ${
                      pagina === p ? 'bg-[#0D2137] dark:bg-gradient-to-r dark:from-[#6B3F7A] dark:to-[#A971D6] text-white' : 'border border-slate-200 dark:border-white/12 hover:bg-slate-100 dark:hover:bg-white/8 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                disabled={pagina === totalPaginas}
                className="p-2 rounded-lg border border-slate-200 dark:border-white/12 hover:bg-slate-100 dark:hover:bg-white/8 disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
