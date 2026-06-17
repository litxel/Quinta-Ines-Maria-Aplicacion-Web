import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getDashboardData } from '../../services/solicitudes.service';
import BadgeEstado from '../../components/shared/BadgeEstado';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from 'recharts';
import {
  FileText, Clock, CheckCircle2, DollarSign, ArrowRight, TrendingUp, AlertCircle
} from 'lucide-react';

// ── Variantes de animación de entrada ──────────────────────────────────────────
const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const item = {
  hidden:  { opacity: 0, y: 24, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export default function Dashboard() {
  const [datos,   setDatos]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    let isMounted = true;

    const cargarDashboard = async () => {
      try {
        setLoading(true);
        const data = await getDashboardData();
        if (isMounted) setDatos(data);
      } catch (e) {
        if (isMounted) {
          setError(e.response?.data?.message ?? e.message);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    cargarDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) return <Skeleton />;
  if (error)   return <ErrorCard mensaje={error} />;

  const { resumen, ultimas } = datos;

  // ── DATOS PARA LOS GRÁFICOS (Recharts) ──
  const funnelData = [
    { name: 'Pendientes', total: parseInt(resumen.pendientes || 0), color: '#F59E0B' },
    { name: 'En Revisión', total: parseInt(resumen.en_revision || 0), color: '#3B82F6' },
    { name: 'Confirmadas', total: parseInt(resumen.confirmadas || 0), color: '#10B981' }
  ];

  const incomeData = [
    { name: 'Ingresos Confirmados', value: parseFloat(resumen.ingresos_confirmados || 0), color: '#10B981' },
    { name: 'Ingresos Potenciales', value: parseFloat(resumen.ingresos_potenciales || 0), color: '#A971D6' }
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#332247] text-white p-3 rounded-lg shadow-xl border border-[#A971D6]/30 text-xs">
          <p className="font-bold mb-1">{payload[0].payload.name}</p>
          <p>{`Total: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#332247] text-white p-3 rounded-lg shadow-xl border border-[#A971D6]/30 text-xs">
          <p className="font-bold mb-1">{payload[0].name}</p>
          <p>{`$${payload[0].value.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">

      {/* ── Cabecera ── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-3xl font-display font-bold text-[#0D2137] dark:text-white">Panel Gerencial</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Visión general y métricas de la Quinta Inés María</p>
      </motion.div>

      {/* ── Tarjetas de métricas principales ── */}
      <motion.div variants={container} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

        {/* Total Solicitudes */}
        <motion.div variants={item} whileHover={{ y: -5 }} className="bg-white dark:bg-[#332247] rounded-2xl p-6 border border-slate-100 dark:border-white/8 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-slate-50 dark:bg-white/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-slate-100 dark:bg-white/8 text-slate-600 dark:text-slate-300 rounded-xl flex items-center justify-center"><FileText size={24} /></div>
              <span className="text-3xl font-bold text-[#0D2137] dark:text-white">{resumen.total_solicitudes}</span>
            </div>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Total Solicitudes</p>
          </div>
        </motion.div>

        {/* Pendientes */}
        <motion.div variants={item} whileHover={{ y: -5 }} className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/5 rounded-2xl p-6 border border-amber-100 dark:border-amber-500/20 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/40 dark:bg-amber-500/10 rounded-full group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/60 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center shadow-sm"><Clock size={24} /></div>
              <span className="text-3xl font-bold text-amber-700 dark:text-amber-400">{resumen.pendientes}</span>
            </div>
            <p className="text-sm font-bold text-amber-700/70 dark:text-amber-400/80 uppercase tracking-wider">Pendientes</p>
          </div>
        </motion.div>

        {/* Confirmadas */}
        <motion.div variants={item} whileHover={{ y: -5 }} className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-500/10 dark:to-green-500/5 rounded-2xl p-6 border border-emerald-100 dark:border-emerald-500/20 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/40 dark:bg-emerald-500/10 rounded-full group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/60 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center shadow-sm"><CheckCircle2 size={24} /></div>
              <span className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">{resumen.confirmadas}</span>
            </div>
            <p className="text-sm font-bold text-emerald-700/70 dark:text-emerald-400/80 uppercase tracking-wider">Confirmadas</p>
          </div>
        </motion.div>

        {/* Ingresos Confirmados */}
        <motion.div variants={item} whileHover={{ y: -5 }} className="bg-[#0D2137] dark:bg-gradient-to-br dark:from-[#6B3F7A] dark:to-[#3E2B57] rounded-2xl p-6 border border-[#0D2137] dark:border-[#A971D6]/30 shadow-xl relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#B7950B] text-white rounded-xl flex items-center justify-center shadow-md shrink-0"><DollarSign size={24} /></div>
              <span className="text-xl sm:text-2xl font-bold text-white min-w-0 truncate text-right ml-2">${parseFloat(resumen.ingresos_confirmados).toLocaleString('es-EC', { minimumFractionDigits: 2 })}</span>
            </div>
            <p className="text-sm font-bold text-slate-300 dark:text-[#E8C84A]/90 uppercase tracking-wider">Ingresos Seguros</p>
          </div>
        </motion.div>

      </motion.div>

      {/* ── Desglose de Alertas Rápidas ── */}
      <motion.div variants={container} initial="hidden" animate="visible" className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <DesgloseStat label="En revisión (Atendiendo)" valor={resumen.en_revision} icon={<TrendingUp size={20}/>} color="blue" />
        <DesgloseStat label="Rechazadas / Canceladas" valor={resumen.rechazadas} icon={<AlertCircle size={20}/>} color="red" />
        <DesgloseStat label="Dinero Potencial (En espera)" valor={`$${parseFloat(resumen.ingresos_potenciales).toLocaleString('es-EC', { minimumFractionDigits: 2 })}`} icon={<DollarSign size={20}/>} color="purple" />
      </motion.div>

      {/* ── GRÁFICOS GERENCIALES (Recharts) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Gráfico 1: Embudo de Conversión */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.15 }} className="bg-white dark:bg-[#332247] rounded-2xl border border-slate-100 dark:border-white/8 shadow-sm p-6">
          <h2 className="font-bold text-[#0D2137] dark:text-white mb-6 flex items-center gap-2">
            <TrendingUp size={18} className="text-[#B7950B] dark:text-[#C9A227]"/> Embudo de Conversión (Estado)
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" strokeOpacity={0.25} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(169,113,214,0.08)'}} />
                <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={60}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Gráfico 2: Proyección de Ingresos */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.22 }} className="bg-white dark:bg-[#332247] rounded-2xl border border-slate-100 dark:border-white/8 shadow-sm p-6">
          <h2 className="font-bold text-[#0D2137] dark:text-white mb-2 flex items-center gap-2">
            <DollarSign size={18} className="text-[#B7950B] dark:text-[#C9A227]"/> Proyección Financiera
          </h2>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#94A3B8' }}/>
                <Pie
                  data={incomeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {incomeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

      </div>

      {/* ── Últimas solicitudes ── */}
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="bg-white dark:bg-[#332247] rounded-2xl border border-slate-100 dark:border-white/8 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-white/8 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
          <h2 className="font-bold text-[#0D2137] dark:text-white flex items-center gap-2">
            <Clock size={18} className="text-slate-400"/> Últimos Movimientos
          </h2>
          <Link to="/admin/solicitudes" className="text-xs text-[#1A6BAC] dark:text-[#C9A227] hover:text-[#0D2137] dark:hover:text-[#E8C84A] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors">
            Ver todas <ArrowRight size={14}/>
          </Link>
        </div>

        <div className="divide-y divide-slate-50 dark:divide-white/6">
          {ultimas.length === 0 && (
            <p className="px-6 py-10 text-center text-slate-400 dark:text-slate-500 text-sm font-medium">
              No hay solicitudes registradas aún en el sistema.
            </p>
          )}
          {ultimas.map((s) => (
            <div key={s.solicitud_id} className="px-6 py-4 flex items-center gap-4 hover:bg-[#B7950B]/5 dark:hover:bg-[#A971D6]/8 transition-colors group">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xs text-[#B7950B] dark:text-[#C9A227] font-bold group-hover:underline cursor-pointer">{s.numero_cotizacion}</p>
                <p className="text-sm font-bold text-[#0D2137] dark:text-white truncate">{s.cliente_nombre}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  {s.paquete_nombre ?? 'Personalizado'} ·{' '}
                  {new Date(s.creado_en).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>

              <div className="text-right shrink-0">
                <p className="font-bold text-[#0D2137] dark:text-white text-sm">${parseFloat(s.precio_estimado).toFixed(2)}</p>
              </div>

              <div className="shrink-0 w-28 text-right">
                <BadgeEstado estadoColor={s.estado_color} estadoNombre={s.estado_nombre} size="sm" />
              </div>

              <Link to={`/admin/solicitudes`} className="shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-white/8 text-slate-400 dark:text-slate-300 flex items-center justify-center group-hover:bg-[#1A6BAC] dark:group-hover:bg-[#A971D6] group-hover:text-white transition-all shadow-sm" aria-label={`Ver ${s.numero_cotizacion}`}>
                <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function DesgloseStat({ label, valor, icon, color }) {
  const colores = {
    blue:   'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20',
    red:    'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20',
    purple: 'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-500/12 border-purple-200 dark:border-purple-500/25',
  };
  return (
    <motion.div variants={item} className={`rounded-xl border px-5 sm:px-6 py-5 flex items-center justify-between gap-3 shadow-sm transition-transform hover:-translate-y-1 ${colores[color]}`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="opacity-70 shrink-0">{icon}</div>
        <span className="text-xs sm:text-sm font-bold opacity-90 tracking-wide truncate">{label}</span>
      </div>
      <span className="text-xl sm:text-2xl font-black shrink-0 whitespace-nowrap">{valor}</span>
    </motion.div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-slate-200 dark:bg-white/8 rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {[1,2,3,4].map((n) => <div key={n} className="h-32 bg-slate-200 dark:bg-white/8 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {[1,2,3].map((n) => <div key={n} className="h-20 bg-slate-200 dark:bg-white/8 rounded-xl" />)}
      </div>
      <div className="h-96 bg-slate-200 dark:bg-white/8 rounded-2xl" />
    </div>
  );
}

function ErrorCard({ mensaje }) {
  return (
    <div className="rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/25 p-10 text-center shadow-sm">
      <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
      <p className="text-red-800 dark:text-red-300 text-xl font-bold mb-2">Error al cargar el panel gerencial</p>
      <p className="text-red-600 dark:text-red-400 text-sm font-medium">{mensaje}</p>
    </div>
  );
}
