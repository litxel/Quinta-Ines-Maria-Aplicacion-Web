import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardData } from '../../services/solicitudes.service';
import BadgeEstado from '../../components/shared/BadgeEstado';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, 
  PieChart, Pie, Legend
} from 'recharts';
import { 
  FileText, Clock, CheckCircle2, DollarSign, ArrowRight, TrendingUp, AlertCircle 
} from 'lucide-react';

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
    { name: 'Ingresos Potenciales', value: parseFloat(resumen.ingresos_potenciales || 0), color: '#8B5CF6' }
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0D2137] text-white p-3 rounded-lg shadow-xl border border-white/10 text-xs">
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
        <div className="bg-[#0D2137] text-white p-3 rounded-lg shadow-xl border border-white/10 text-xs">
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
      <div>
        <h1 className="text-3xl font-display font-bold text-[#0D2137]">Panel Gerencial</h1>
        <p className="text-slate-500 text-sm mt-1">Visión general y métricas de la Quinta Inés María</p>
      </div>

      {/* ── Tarjetas de métricas principales (Diseño Financiero) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        
        {/* Total Solicitudes */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-slate-50 rounded-full group-hover:scale-110 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center"><FileText size={24} /></div>
              <span className="text-3xl font-bold text-[#0D2137]">{resumen.total_solicitudes}</span>
            </div>
            <p className="text-sm font-bold text-slate-500">Total Solicitudes</p>
          </div>
        </div>

        {/* Pendientes */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/40 rounded-full group-hover:scale-110 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/60 text-amber-600 rounded-xl flex items-center justify-center shadow-sm"><Clock size={24} /></div>
              <span className="text-3xl font-bold text-amber-700">{resumen.pendientes}</span>
            </div>
            <p className="text-sm font-bold text-amber-700/70 uppercase tracking-wider">Pendientes</p>
          </div>
        </div>

        {/* Confirmadas */}
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-100 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/40 rounded-full group-hover:scale-110 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/60 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm"><CheckCircle2 size={24} /></div>
              <span className="text-3xl font-bold text-emerald-700">{resumen.confirmadas}</span>
            </div>
            <p className="text-sm font-bold text-emerald-700/70 uppercase tracking-wider">Confirmadas</p>
          </div>
        </div>

        {/* Ingresos Confirmados */}
        <div className="bg-[#0D2137] rounded-2xl p-6 border border-[#0D2137] shadow-xl relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/5 rounded-full group-hover:scale-110 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#B7950B] text-white rounded-xl flex items-center justify-center shadow-md"><DollarSign size={24} /></div>
              <span className="text-2xl font-bold text-white">${parseFloat(resumen.ingresos_confirmados).toLocaleString('es-EC', { minimumFractionDigits: 2 })}</span>
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Ingresos Seguros</p>
          </div>
        </div>

      </div>

      {/* ── Desglose de Alertas Rápidas ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <DesgloseStat label="En revisión (Atendiendo)" valor={resumen.en_revision} icon={<TrendingUp size={20}/>} color="blue" />
        <DesgloseStat label="Rechazadas / Canceladas" valor={resumen.rechazadas} icon={<AlertCircle size={20}/>} color="red" />
        <DesgloseStat label="Dinero Potencial (En espera)" valor={`$${parseFloat(resumen.ingresos_potenciales).toLocaleString('es-EC', { minimumFractionDigits: 2 })}`} icon={<DollarSign size={20}/>} color="purple" />
      </div>

      {/* ── GRÁFICOS GERENCIALES (Recharts) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico 1: Embudo de Conversión */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-bold text-[#0D2137] mb-6 flex items-center gap-2">
            <TrendingUp size={18} className="text-[#B7950B]"/> Embudo de Conversión (Estado)
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: '#F1F5F9'}} />
                <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={60}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Proyección de Ingresos */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-bold text-[#0D2137] mb-2 flex items-center gap-2">
            <DollarSign size={18} className="text-[#B7950B]"/> Proyección Financiera
          </h2>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#64748B' }}/>
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
        </div>

      </div>

      {/* ── Últimas solicitudes ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="font-bold text-[#0D2137] flex items-center gap-2">
            <Clock size={18} className="text-slate-400"/> Últimos Movimientos
          </h2>
          <Link to="/admin/solicitudes" className="text-xs text-[#1A6BAC] hover:text-[#0D2137] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors">
            Ver todas <ArrowRight size={14}/>
          </Link>
        </div>

        <div className="divide-y divide-slate-50">
          {ultimas.length === 0 && (
            <p className="px-6 py-10 text-center text-slate-400 text-sm font-medium">
              No hay solicitudes registradas aún en el sistema.
            </p>
          )}
          {ultimas.map((s) => (
            <div key={s.solicitud_id} className="px-6 py-4 flex items-center gap-4 hover:bg-[#B7950B]/5 transition-colors group">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xs text-[#B7950B] font-bold group-hover:underline cursor-pointer">{s.numero_cotizacion}</p>
                <p className="text-sm font-bold text-[#0D2137] truncate">{s.cliente_nombre}</p>
                <p className="text-xs text-slate-400 font-medium">
                  {s.paquete_nombre ?? 'Personalizado'} ·{' '}
                  {new Date(s.creado_en).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>

              <div className="text-right shrink-0">
                <p className="font-bold text-[#0D2137] text-sm">${parseFloat(s.precio_estimado).toFixed(2)}</p>
              </div>

              <div className="shrink-0 w-28 text-right">
                <BadgeEstado estadoColor={s.estado_color} estadoNombre={s.estado_nombre} size="sm" />
              </div>

              <Link to={`/admin/solicitudes`} className="shrink-0 w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center group-hover:bg-[#1A6BAC] group-hover:text-white transition-all shadow-sm" aria-label={`Ver ${s.numero_cotizacion}`}>
                <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function DesgloseStat({ label, valor, icon, color }) {
  const colores = {
    blue:   'text-blue-700 bg-blue-50 border-blue-200',
    red:    'text-red-700 bg-red-50 border-red-200',
    purple: 'text-purple-700 bg-purple-50 border-purple-200',
  };
  return (
    <div className={`rounded-xl border px-6 py-5 flex items-center justify-between shadow-sm transition-transform hover:-translate-y-1 ${colores[color]}`}>
      <div className="flex items-center gap-3">
        <div className="opacity-70">{icon}</div>
        <span className="text-sm font-bold opacity-90 tracking-wide">{label}</span>
      </div>
      <span className="text-2xl font-black">{valor}</span>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-slate-200 rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {[1,2,3,4].map((n) => <div key={n} className="h-32 bg-slate-200 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {[1,2,3].map((n) => <div key={n} className="h-20 bg-slate-200 rounded-xl" />)}
      </div>
      <div className="h-96 bg-slate-200 rounded-2xl" />
    </div>
  );
}

function ErrorCard({ mensaje }) {
  return (
    <div className="rounded-2xl bg-red-50 border border-red-200 p-10 text-center shadow-sm">
      <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
      <p className="text-red-800 text-xl font-bold mb-2">Error al cargar el panel gerencial</p>
      <p className="text-red-600 text-sm font-medium">{mensaje}</p>
    </div>
  );
}