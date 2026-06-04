import { useState, useEffect } from 'react';
import {
  getResumenReportes, getIngresosReportes, getPaquetesReportes,
  getTiposReportes, getTasaConversion, getProximosEventos
} from '../../services/reportes.service';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  TrendingUp, Users, CalendarCheck, DollarSign, Download,
  FileBarChart, PackageCheck, Percent, Calendar, RefreshCw,
  ArrowUpRight, Clock, ChevronRight
} from 'lucide-react';

// ─── Colores de marca ────────────────────────────────────────────────────────
const NAVY   = '#0D2137';
const GOLD   = '#B7950B';
const CREAM  = '#F5F0E8';
const PIE_COLORS = ['#0D2137', '#B7950B', '#1A6BAC', '#4A235A', '#145A32', '#784212', '#C0392B', '#1A5276'];

// ─── Tooltip personalizado ───────────────────────────────────────────────────
const CustomTooltipArea = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 text-sm">
      <p className="font-bold text-[#0D2137] mb-1">{label}</p>
      <p className="text-[#B7950B] font-bold">
        ${parseFloat(payload[0]?.value || 0).toLocaleString('es-EC', { minimumFractionDigits: 0 })}
      </p>
      {payload[1] && <p className="text-slate-500">{payload[1].value} eventos</p>}
    </div>
  );
};

const CustomTooltipPie = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 text-sm">
      <p className="font-bold text-[#0D2137]">{payload[0].name}</p>
      <p className="text-slate-600">{payload[0].value} solicitudes</p>
    </div>
  );
};

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({ label, value, icon: Icon, color, sub, trend }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-shadow`}>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-[#0D2137] mt-0.5 truncate">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
      {trend !== undefined && (
        <div className="ml-auto shrink-0">
          <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trend >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            <ArrowUpRight size={12} className={trend < 0 ? 'rotate-180' : ''} />
            {Math.abs(trend)}%
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Componente Principal ────────────────────────────────────────────────────
export default function Reportes() {
  const [resumen,    setResumen]    = useState(null);
  const [ingresos,   setIngresos]   = useState([]);
  const [paquetes,   setPaquetes]   = useState([]);
  const [tipos,      setTipos]      = useState([]);
  const [tasa,       setTasa]       = useState(null);
  const [proximos,   setProximos]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [exportando, setExportando] = useState(false);

  const cargar = async () => {
    setLoading(true);
    try {
      const [r, ing, paq, tip, tas, prox] = await Promise.all([
        getResumenReportes(),
        getIngresosReportes(),
        getPaquetesReportes(),
        getTiposReportes(),
        getTasaConversion(),
        getProximosEventos(),
      ]);
      setResumen(r.data);
      setIngresos((ing.data || []).map(d => ({ ...d, ingresos: parseFloat(d.ingresos), total_eventos: parseInt(d.total_eventos) })));
      setPaquetes((paq.data || []).map(d => ({ ...d, total: parseInt(d.total) })));
      setTipos((tip.data || []).map(d => ({ ...d, total: parseInt(d.total) })));
      setTasa(tas.data);
      setProximos(prox.data || []);
    } catch (e) {
      console.error('Error cargando reportes:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const fmt = (n) => new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);
  const fmtFecha = (d) => d ? new Date(d).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  // ─── Exportar PDF institucional ────────────────────────────────────────────
  const exportarPDF = async () => {
    if (!resumen) return;
    setExportando(true);
    try {
      const { jsPDF }        = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pW  = doc.internal.pageSize.getWidth();

      const NAVARRG  = [13, 33, 55];
      const GOLDRG   = [183, 149, 11];
      const CREAMRG  = [245, 240, 232];
      const SLATRG   = [100, 116, 139];

      // Header
      doc.setFillColor(...NAVARRG); doc.rect(0, 0, pW, 44, 'F');
      doc.setFillColor(...GOLDRG);  doc.rect(0, 42, pW, 3, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(...GOLDRG);
      doc.text('QUINTA INES MARIA', pW / 2, 17, { align: 'center' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(255, 255, 255); doc.setCharSpace(1.2);
      doc.text('BED  -  CATERING  -  EVENTOS  -  CANTON CHAMBO', pW / 2, 24, { align: 'center' }); doc.setCharSpace(0);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...GOLDRG);
      doc.text('REPORTE DE ANALITICA', pW / 2, 34, { align: 'center' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(255, 255, 255);
      doc.text(`Generado el: ${new Date().toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })}`, pW - 15, 38, { align: 'right' });

      // KPIs
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...NAVARRG);
      doc.text('RESUMEN DE INDICADORES', 15, 54);
      doc.setFillColor(...GOLDRG); doc.rect(15, 56, 35, 1, 'F');

      autoTable(doc, {
        startY: 60,
        head: [['Indicador', 'Valor']],
        body: [
          ['Total de Solicitudes',    String(resumen.total_solicitudes || 0)],
          ['Solicitudes Confirmadas', String(resumen.confirmadas || 0)],
          ['Solicitudes Completadas', String(resumen.completadas || 0)],
          ['Solicitudes Pendientes',  String(resumen.pendientes || 0)],
          ['Solicitudes Rechazadas',  String(resumen.rechazadas || 0)],
          ['Clientes Activos',        String(resumen.clientes_activos || 0)],
          ['Total Usuarios Registrados', String(resumen.total_usuarios || 0)],
          ['Ingresos Totales (Confirmadas + Completadas)', `$ ${parseFloat(resumen.ingresos_totales || 0).toLocaleString('es-EC', { minimumFractionDigits: 2 })}`],
          ['Tasa de Conversion',      `${tasa?.tasa_conversion || 0}%`],
        ],
        headStyles: { fillColor: NAVARRG, textColor: GOLDRG, fontStyle: 'bold', fontSize: 9 },
        alternateRowStyles: { fillColor: CREAMRG },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
        margin: { left: 15, right: 15 },
      });

      // Tabla ingresos por mes
      if (ingresos.length > 0) {
        const y2 = doc.lastAutoTable.finalY + 12;
        doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...NAVARRG);
        doc.text('INGRESOS POR MES', 15, y2);
        doc.setFillColor(...GOLDRG); doc.rect(15, y2 + 2, 30, 1, 'F');

        autoTable(doc, {
          startY: y2 + 6,
          head: [['Mes', 'Total Eventos', 'Ingresos (USD)']],
          body: ingresos.map(d => [
            d.mes_label,
            String(d.total_eventos),
            `$ ${d.ingresos.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`,
          ]),
          headStyles: { fillColor: NAVARRG, textColor: GOLDRG, fontStyle: 'bold', fontSize: 9 },
          alternateRowStyles: { fillColor: CREAMRG },
          styles: { fontSize: 9, cellPadding: 3 },
          columnStyles: { 2: { halign: 'right', fontStyle: 'bold' } },
          margin: { left: 15, right: 15 },
        });
      }

      // Tabla paquetes (si hay espacio)
      if (paquetes.length > 0 && doc.lastAutoTable.finalY < 220) {
        const y3 = doc.lastAutoTable.finalY + 12;
        doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...NAVARRG);
        doc.text('PAQUETES MAS SOLICITADOS', 15, y3);
        doc.setFillColor(...GOLDRG); doc.rect(15, y3 + 2, 38, 1, 'F');

        autoTable(doc, {
          startY: y3 + 6,
          head: [['Paquete', 'Total Solicitudes']],
          body: paquetes.map(d => [d.nombre, String(d.total)]),
          headStyles: { fillColor: NAVARRG, textColor: GOLDRG, fontStyle: 'bold', fontSize: 9 },
          alternateRowStyles: { fillColor: CREAMRG },
          styles: { fontSize: 9, cellPadding: 3 },
          columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
          margin: { left: 15, right: 15 },
        });
      }

      // Footer
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFillColor(...NAVARRG);
        doc.rect(0, 284, pW, 13, 'F');
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...SLATRG);
        doc.setTextColor(200, 200, 200);
        doc.text('(c) 2026 Quinta Ines Maria  -  Canton Chambo, Chimborazo, Ecuador', pW / 2, 291, { align: 'center' });
        doc.text(`Pagina ${i} de ${totalPages}`, pW - 15, 291, { align: 'right' });
      }

      const fecha = new Date().toISOString().split('T')[0];
      doc.save(`Reporte-QIM-${fecha}.pdf`);
    } catch (e) {
      console.error('Error generando PDF:', e);
      alert('Error al generar el PDF. Intenta nuevamente.');
    } finally {
      setExportando(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <div className="w-12 h-12 border-4 border-[#B7950B] border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-500 font-medium animate-pulse">Cargando datos del dashboard...</p>
    </div>
  );

  const ingresosTotal = parseFloat(resumen?.ingresos_totales || 0);

  return (
    <div className="space-y-8">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-gradient-to-br from-[#0D2137] to-[#1A6BAC] rounded-2xl flex items-center justify-center shadow-lg">
              <FileBarChart size={20} className="text-[#B7950B]" />
            </div>
            <h1 className="text-3xl font-display font-bold text-[#0D2137]">Reportes y Analítica</h1>
          </div>
          <p className="text-sm text-slate-500 ml-[52px]">Métricas en tiempo real · Solo solicitudes Confirmadas y Completadas</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={cargar} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm">
            <RefreshCw size={15} /> Actualizar
          </button>
          <button
            onClick={exportarPDF}
            disabled={exportando}
            id="btn-exportar-pdf"
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#B7950B] to-yellow-600 text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg text-sm disabled:opacity-60"
          >
            {exportando ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
            {exportando ? 'Generando...' : 'Exportar PDF'}
          </button>
        </div>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Ingresos Totales"
          value={fmt(ingresosTotal)}
          icon={DollarSign}
          color="bg-gradient-to-br from-[#B7950B] to-yellow-600"
          sub="Confirmadas + Completadas"
        />
        <KpiCard
          label="Tasa de Conversión"
          value={`${tasa?.tasa_conversion || 0}%`}
          icon={Percent}
          color="bg-gradient-to-br from-emerald-500 to-emerald-700"
          sub={`${tasa?.completadas || 0} completadas de ${tasa?.total || 0}`}
        />
        <KpiCard
          label="Clientes Activos"
          value={resumen?.clientes_activos || 0}
          icon={Users}
          color="bg-gradient-to-br from-[#1A6BAC] to-blue-700"
          sub={`${resumen?.total_usuarios || 0} registrados en total`}
        />
        <KpiCard
          label="Confirmadas"
          value={resumen?.confirmadas || 0}
          icon={CalendarCheck}
          color="bg-gradient-to-br from-[#0D2137] to-slate-700"
          sub={`${resumen?.completadas || 0} completadas · ${resumen?.pendientes || 0} pendientes`}
        />
      </div>

      {/* ── Gráfico de Ingresos + Próximos eventos ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Área de Ingresos por Mes */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-bold text-[#0D2137] text-lg">Ingresos por Mes</h2>
              <p className="text-xs text-slate-400 mt-0.5">Últimos 6 meses · Solo estados Confirmada y Completada</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full border border-amber-200">
              <TrendingUp size={12} />
              Ingresos reales
            </div>
          </div>
          {ingresos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <TrendingUp size={40} className="text-slate-200 mb-3" />
              <p className="text-sm font-medium">Sin datos de ingresos para mostrar</p>
              <p className="text-xs mt-1">Los datos aparecen cuando hay solicitudes confirmadas/completadas</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={ingresos} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradIngreso" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={GOLD}  stopOpacity={0.3} />
                    <stop offset="95%" stopColor={GOLD}  stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradEventos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={NAVY}  stopOpacity={0.2} />
                    <stop offset="95%" stopColor={NAVY}  stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes_label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip content={<CustomTooltipArea />} />
                <Area type="monotone" dataKey="ingresos"      stroke={GOLD} strokeWidth={2.5} fill="url(#gradIngreso)"  dot={{ fill: GOLD, r: 4, strokeWidth: 2, stroke: '#fff' }} name="Ingresos" />
                <Area type="monotone" dataKey="total_eventos" stroke={NAVY} strokeWidth={2}   fill="url(#gradEventos)" dot={{ fill: NAVY, r: 3, strokeWidth: 2, stroke: '#fff' }} name="Eventos" yAxisId={1} hide />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Próximos 5 eventos */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-[#0D2137] text-lg">Próximos Eventos</h2>
              <p className="text-xs text-slate-400 mt-0.5">Siguientes 60 días</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#0D2137]/5 flex items-center justify-center">
              <Calendar size={16} className="text-[#0D2137]" />
            </div>
          </div>

          {proximos.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-8">
              <Calendar size={36} className="text-slate-200 mb-3" />
              <p className="text-sm font-medium">Sin eventos próximos</p>
              <p className="text-xs mt-1">No hay eventos en los próximos 60 días</p>
            </div>
          ) : (
            <div className="flex-1 space-y-3 overflow-y-auto">
              {proximos.map((ev, i) => (
                <div key={ev.solicitud_id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-[#B7950B]/5 transition-colors group">
                  <div className="w-8 h-8 rounded-xl bg-[#0D2137] flex items-center justify-center text-white font-bold text-xs shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#0D2137] text-sm truncate">{ev.cliente_nombre}</p>
                    <p className="text-xs text-slate-500 truncate">{ev.tipo_nombre || ev.paquete_nombre || 'Sin tipo'}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="flex items-center gap-1 text-[10px] font-bold text-[#B7950B]">
                        <Clock size={10} />
                        {fmtFecha(ev.fecha_evento)}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">·</span>
                      <span className="text-[10px] font-bold text-slate-500">{ev.num_invitados} invitados</span>
                    </div>
                  </div>
                  <span
                    className="text-[9px] font-bold px-2 py-1 rounded-full shrink-0 self-start"
                    style={{ background: ev.estado_color + '22', color: ev.estado_color }}
                  >
                    {ev.estado_nombre}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Gráficos de Dona ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Paquetes más solicitados */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-[#0D2137] text-lg">Paquetes Más Solicitados</h2>
              <p className="text-xs text-slate-400 mt-0.5">Distribución por tipo de paquete</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#0D2137]/5 flex items-center justify-center">
              <PackageCheck size={16} className="text-[#0D2137]" />
            </div>
          </div>
          {paquetes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <PackageCheck size={40} className="text-slate-200 mb-3" />
              <p className="text-sm">Sin datos de paquetes</p>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={220}>
                <PieChart>
                  <Pie
                    data={paquetes}
                    cx="50%" cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="total"
                    nameKey="nombre"
                  >
                    {paquetes.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltipPie />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {paquetes.slice(0, 6).map((p, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-xs text-slate-600 flex-1 truncate">{p.nombre}</span>
                    <span className="text-xs font-bold text-[#0D2137]">{p.total}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tipos de evento */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-[#0D2137] text-lg">Tipos de Evento</h2>
              <p className="text-xs text-slate-400 mt-0.5">Categorías más populares</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#0D2137]/5 flex items-center justify-center">
              <CalendarCheck size={16} className="text-[#0D2137]" />
            </div>
          </div>
          {tipos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <CalendarCheck size={40} className="text-slate-200 mb-3" />
              <p className="text-sm">Sin datos de tipos de evento</p>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={220}>
                <PieChart>
                  <Pie
                    data={tipos}
                    cx="50%" cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="total"
                    nameKey="nombre"
                  >
                    {tipos.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[(index + 2) % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltipPie />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {tipos.slice(0, 6).map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: PIE_COLORS[(i + 2) % PIE_COLORS.length] }} />
                    <span className="text-xs text-slate-600 flex-1 truncate">{t.nombre}</span>
                    <span className="text-xs font-bold text-[#0D2137]">{t.total}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Resumen de estados ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="font-bold text-[#0D2137] text-lg mb-5">Distribución de Estados</h2>
        {resumen && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Pendientes',   value: resumen.pendientes,   color: 'bg-amber-400',  text: 'text-amber-700',   bg: 'bg-amber-50' },
              { label: 'En Revisión',  value: resumen.en_revision,  color: 'bg-blue-500',   text: 'text-blue-700',    bg: 'bg-blue-50' },
              { label: 'Confirmadas',  value: resumen.confirmadas,  color: 'bg-green-500',  text: 'text-green-700',   bg: 'bg-green-50' },
              { label: 'Completadas',  value: resumen.completadas,  color: 'bg-purple-500', text: 'text-purple-700',  bg: 'bg-purple-50' },
              { label: 'Rechazadas',   value: resumen.rechazadas,   color: 'bg-red-500',    text: 'text-red-700',     bg: 'bg-red-50' },
              { label: 'Canceladas',   value: resumen.canceladas,   color: 'bg-slate-400',  text: 'text-slate-600',   bg: 'bg-slate-50' },
            ].map((item) => (
              <div key={item.label} className={`${item.bg} rounded-2xl p-4 flex flex-col items-center text-center`}>
                <span className={`text-3xl font-bold ${item.text}`}>{item.value || 0}</span>
                <span className={`text-xs font-bold ${item.text} mt-1`}>{item.label}</span>
                <div className={`w-full h-1.5 rounded-full ${item.color} mt-3 opacity-40`} />
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
