import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getResumenReportes, getIngresosReportes, getPaquetesReportes,
  getTiposReportes, getTasaConversion, getProximosEventos
} from '../../services/reportes.service';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, Users, CalendarCheck, DollarSign, Download,
  FileBarChart, PackageCheck, Percent, Calendar, RefreshCw,
  ArrowUpRight, Clock, X, Check, Receipt, Sparkles
} from 'lucide-react';
import logoQuinta from '../../assets/FotosQuintaInes/LogosQuinta/logo quinta ines.png';

// ─── Colores de marca (gráficas) ──────────────────────────────────────────────
const PLUM   = '#6B3F7A';
const GOLD   = '#C9A227';
const AMETH  = '#A971D6';
const PIE_COLORS = ['#6B3F7A', '#C9A227', '#A971D6', '#1A6BAC', '#B7950B', '#4A235A', '#145A32', '#C0392B'];

// ─── Tooltips ──────────────────────────────────────────────────────────────────
const CustomTooltipArea = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#3E2B57] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl p-3 text-sm">
      <p className="font-bold text-[#0D2137] dark:text-white mb-1">{label}</p>
      <p className="text-[#B7950B] dark:text-[#C9A227] font-bold">
        ${parseFloat(payload[0]?.value || 0).toLocaleString('es-EC', { minimumFractionDigits: 0 })}
      </p>
      {payload[1] && <p className="text-slate-500 dark:text-slate-400">{payload[1].value} eventos</p>}
    </div>
  );
};

const CustomTooltipPie = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#3E2B57] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl p-3 text-sm">
      <p className="font-bold text-[#0D2137] dark:text-white">{payload[0].name}</p>
      <p className="text-slate-600 dark:text-slate-300">{payload[0].value} solicitudes</p>
    </div>
  );
};

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({ label, value, icon: Icon, color, sub, trend }) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
      whileHover={{ y: -4 }}
      className="bg-white dark:bg-[#332247] rounded-2xl border border-slate-100 dark:border-white/8 shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-shadow"
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-xl sm:text-2xl font-bold text-[#0D2137] dark:text-white mt-0.5 truncate">{value}</p>
        {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sub}</p>}
      </div>
      {trend !== undefined && (
        <div className="ml-auto shrink-0">
          <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trend >= 0 ? 'bg-green-50 dark:bg-green-500/15 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400'}`}>
            <ArrowUpRight size={12} className={trend < 0 ? 'rotate-180' : ''} />
            {Math.abs(trend)}%
          </span>
        </div>
      )}
    </motion.div>
  );
}

// ─── Carga del logo para el PDF ────────────────────────────────────────────────
const cargarLogo = () => new Promise((resolve) => {
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = logoQuinta;
  } catch { resolve(null); }
});

// ─── Opciones de exportación PDF ───────────────────────────────────────────────
const SECCIONES_PDF = [
  { key: 'indicadores', label: 'Resumen de indicadores',   desc: 'KPIs generales (solicitudes, clientes, ingresos)' },
  { key: 'ingresos',    label: 'Ingresos por mes',          desc: 'Detalle mensual de ingresos y eventos' },
  { key: 'paquetes',    label: 'Paquetes más solicitados',  desc: 'Ranking de paquetes' },
  { key: 'tipos',       label: 'Tipos de evento',           desc: 'Distribución por categoría' },
  { key: 'proximos',    label: 'Próximos eventos',          desc: 'Agenda de los siguientes 60 días' },
  { key: 'estados',     label: 'Distribución de estados',   desc: 'Conteo por estado de solicitud' },
];

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

  const [modalPDF, setModalPDF] = useState(false);
  const [opciones, setOpciones] = useState({
    indicadores: true, ingresos: true, paquetes: true, tipos: true, proximos: false, estados: true,
  });

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

  const toggleOpcion = (key) => setOpciones(o => ({ ...o, [key]: !o[key] }));

  // ─── Exportar PDF institucional (paleta púrpura + logo) ─────────────────────
  const exportarPDF = async () => {
    if (!resumen) return;
    setExportando(true);
    try {
      const { jsPDF }        = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pW  = doc.internal.pageSize.getWidth();

      // Paleta púrpura corporativa
      const PLUMRG  = [42, 24, 56];     // #2A1838 aubergine header
      const PLUM2RG = [107, 63, 122];   // #6B3F7A acento
      const GOLDRG  = [201, 162, 39];   // #C9A227
      const LAVRG   = [243, 238, 248];  // lavanda muy claro (filas alternas)
      const SLATRG  = [120, 110, 130];

      // ── Header con logo ──
      doc.setFillColor(...PLUMRG); doc.rect(0, 0, pW, 46, 'F');
      doc.setFillColor(...GOLDRG); doc.rect(0, 44, pW, 3, 'F');

      const logo = await cargarLogo();
      if (logo) { try { doc.addImage(logo, 'PNG', 14, 8, 30, 30); } catch { /* sin logo */ } }

      doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(...GOLDRG);
      doc.text('QUINTA INES MARIA', pW / 2 + 8, 17, { align: 'center' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(235, 225, 245); doc.setCharSpace(1.2);
      doc.text('BED  -  CATERING  -  EVENTOS  -  CANTON CHAMBO', pW / 2 + 8, 24, { align: 'center' }); doc.setCharSpace(0);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...GOLDRG);
      doc.text('REPORTE DE ANALITICA', pW / 2 + 8, 34, { align: 'center' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(235, 225, 245);
      doc.text(`Generado el: ${new Date().toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })}`, pW - 15, 41, { align: 'right' });

      const tablaComun = {
        headStyles: { fillColor: PLUMRG, textColor: GOLDRG, fontStyle: 'bold', fontSize: 9 },
        alternateRowStyles: { fillColor: LAVRG },
        styles: { fontSize: 9, cellPadding: 3 },
        margin: { left: 15, right: 15 },
      };
      const seccionTitulo = (txt, y, w = 35) => {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...PLUMRG);
        doc.text(txt, 15, y);
        doc.setFillColor(...GOLDRG); doc.rect(15, y + 2, w, 1, 'F');
      };

      let y = 54;

      if (opciones.indicadores) {
        seccionTitulo('RESUMEN DE INDICADORES', y, 40);
        autoTable(doc, {
          startY: y + 6,
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
          ...tablaComun,
          columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
        });
        y = doc.lastAutoTable.finalY + 12;
      }

      if (opciones.ingresos && ingresos.length > 0) {
        seccionTitulo('INGRESOS POR MES', y, 30);
        autoTable(doc, {
          startY: y + 6,
          head: [['Mes', 'Total Eventos', 'Ingresos (USD)']],
          body: ingresos.map(d => [d.mes_label, String(d.total_eventos), `$ ${d.ingresos.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`]),
          ...tablaComun,
          columnStyles: { 2: { halign: 'right', fontStyle: 'bold' } },
        });
        y = doc.lastAutoTable.finalY + 12;
      }

      if (opciones.paquetes && paquetes.length > 0) {
        if (y > 230) { doc.addPage(); y = 20; }
        seccionTitulo('PAQUETES MAS SOLICITADOS', y, 42);
        autoTable(doc, {
          startY: y + 6,
          head: [['Paquete', 'Total Solicitudes']],
          body: paquetes.map(d => [d.nombre, String(d.total)]),
          ...tablaComun,
          columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
        });
        y = doc.lastAutoTable.finalY + 12;
      }

      if (opciones.tipos && tipos.length > 0) {
        if (y > 230) { doc.addPage(); y = 20; }
        seccionTitulo('TIPOS DE EVENTO', y, 28);
        autoTable(doc, {
          startY: y + 6,
          head: [['Tipo de Evento', 'Total']],
          body: tipos.map(d => [d.nombre, String(d.total)]),
          ...tablaComun,
          columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
        });
        y = doc.lastAutoTable.finalY + 12;
      }

      if (opciones.estados && resumen) {
        if (y > 230) { doc.addPage(); y = 20; }
        seccionTitulo('DISTRIBUCION DE ESTADOS', y, 40);
        autoTable(doc, {
          startY: y + 6,
          head: [['Estado', 'Cantidad']],
          body: [
            ['Pendientes', String(resumen.pendientes || 0)],
            ['En Revision', String(resumen.en_revision || 0)],
            ['Confirmadas', String(resumen.confirmadas || 0)],
            ['Completadas', String(resumen.completadas || 0)],
            ['Rechazadas', String(resumen.rechazadas || 0)],
            ['Canceladas', String(resumen.canceladas || 0)],
          ],
          ...tablaComun,
          columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
        });
        y = doc.lastAutoTable.finalY + 12;
      }

      if (opciones.proximos && proximos.length > 0) {
        if (y > 220) { doc.addPage(); y = 20; }
        seccionTitulo('PROXIMOS EVENTOS (60 DIAS)', y, 48);
        autoTable(doc, {
          startY: y + 6,
          head: [['Cliente', 'Tipo / Paquete', 'Fecha', 'Invitados']],
          body: proximos.map(ev => [
            ev.cliente_nombre,
            ev.tipo_nombre || ev.paquete_nombre || '—',
            fmtFecha(ev.fecha_evento),
            String(ev.num_invitados ?? '—'),
          ]),
          ...tablaComun,
          columnStyles: { 3: { halign: 'center', fontStyle: 'bold' } },
        });
      }

      // Footer en todas las páginas
      const totalPages = doc.internal.getNumberOfPages();
      const pageH = doc.internal.pageSize.getHeight();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFillColor(...PLUMRG); doc.rect(0, pageH - 13, pW, 13, 'F');
        doc.setFillColor(...GOLDRG); doc.rect(0, pageH - 13, pW, 1.5, 'F');
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(210, 200, 220);
        doc.text('(c) 2026 Quinta Ines Maria  -  Canton Chambo, Chimborazo, Ecuador', pW / 2, pageH - 6, { align: 'center' });
        doc.text(`Pagina ${i} de ${totalPages}`, pW - 15, pageH - 6, { align: 'right' });
      }

      doc.save(`Reporte-QIM-${new Date().toISOString().split('T')[0]}.pdf`);
      setModalPDF(false);
    } catch (e) {
      console.error('Error generando PDF:', e);
      alert('Error al generar el PDF. Intenta nuevamente.');
    } finally {
      setExportando(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <div className="spinner" />
      <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Cargando datos del dashboard...</p>
    </div>
  );

  const ingresosTotal = parseFloat(resumen?.ingresos_totales || 0);
  const eventosCerrados = (parseInt(resumen?.confirmadas || 0) + parseInt(resumen?.completadas || 0));
  const ticketPromedio = eventosCerrados > 0 ? ingresosTotal / eventosCerrados : 0;
  const totalEventosMes = ingresos.reduce((a, d) => a + (d.total_eventos || 0), 0);

  return (
    <div className="space-y-8">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-gradient-to-br from-[#0D2137] to-[#1A6BAC] dark:from-[#6B3F7A] dark:to-[#A971D6] rounded-2xl flex items-center justify-center shadow-lg">
              <FileBarChart size={20} className="text-[#C9A227]" />
            </div>
            <h1 className="text-3xl font-display font-bold text-[#0D2137] dark:text-white">Reportes y Analítica</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 ml-[52px]">Métricas en tiempo real · Solo solicitudes Confirmadas y Completadas</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={cargar} className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#332247] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-white/8 transition-colors text-sm font-medium shadow-sm">
            <RefreshCw size={15} /> Actualizar
          </button>
          <button
            onClick={() => setModalPDF(true)}
            id="btn-exportar-pdf"
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#B7950B] to-[#C9A227] text-white font-bold rounded-xl hover:opacity-90 hover:-translate-y-0.5 transition-all shadow-lg text-sm"
          >
            <Download size={16} /> Exportar PDF
          </button>
        </div>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────────────── */}
      <motion.div variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Ingresos Totales" value={fmt(ingresosTotal)} icon={DollarSign} color="bg-gradient-to-br from-[#B7950B] to-[#C9A227]" sub="Confirmadas + Completadas" />
        <KpiCard label="Tasa de Conversión" value={`${tasa?.tasa_conversion || 0}%`} icon={Percent} color="bg-gradient-to-br from-emerald-500 to-emerald-700" sub={`${tasa?.completadas || 0} completadas de ${tasa?.total || 0}`} />
        <KpiCard label="Clientes Activos" value={resumen?.clientes_activos || 0} icon={Users} color="bg-gradient-to-br from-[#6B3F7A] to-[#A971D6]" sub={`${resumen?.total_usuarios || 0} registrados en total`} />
        <KpiCard label="Confirmadas" value={resumen?.confirmadas || 0} icon={CalendarCheck} color="bg-gradient-to-br from-[#0D2137] to-slate-700" sub={`${resumen?.completadas || 0} completadas · ${resumen?.pendientes || 0} pendientes`} />
      </motion.div>

      {/* ── Métricas derivadas (más métricas visuales) ───────────────────────── */}
      <motion.div variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Ticket Promedio" value={fmt(ticketPromedio)} icon={Receipt} color="bg-gradient-to-br from-[#1A6BAC] to-blue-700" sub="Ingreso medio por evento cerrado" />
        <KpiCard label="Eventos (6 meses)" value={totalEventosMes} icon={TrendingUp} color="bg-gradient-to-br from-[#A971D6] to-[#6B3F7A]" sub="Total de eventos con ingreso" />
        <KpiCard label="Próximos Eventos" value={proximos.length} icon={Calendar} color="bg-gradient-to-br from-amber-500 to-[#B7950B]" sub="Agenda de los siguientes 60 días" />
        <KpiCard label="Eventos Cerrados" value={eventosCerrados} icon={Sparkles} color="bg-gradient-to-br from-[#6B3F7A] to-[#4A235A]" sub="Confirmadas + completadas" />
      </motion.div>

      {/* ── Gráfico de Ingresos + Próximos eventos ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 bg-white dark:bg-[#332247] rounded-2xl border border-slate-100 dark:border-white/8 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-bold text-[#0D2137] dark:text-white text-lg">Ingresos por Mes</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Últimos 6 meses · Solo estados Confirmada y Completada</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-500/25">
              <TrendingUp size={12} /> Ingresos reales
            </div>
          </div>
          {ingresos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
              <TrendingUp size={40} className="text-slate-200 dark:text-white/10 mb-3" />
              <p className="text-sm font-medium">Sin datos de ingresos para mostrar</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={ingresos} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradIngreso" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={GOLD}  stopOpacity={0.35} />
                    <stop offset="95%" stopColor={GOLD}  stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.18} />
                <XAxis dataKey="mes_label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltipArea />} />
                <Area type="monotone" dataKey="ingresos" stroke={GOLD} strokeWidth={2.5} fill="url(#gradIngreso)" dot={{ fill: GOLD, r: 4, strokeWidth: 2, stroke: '#fff' }} name="Ingresos" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white dark:bg-[#332247] rounded-2xl border border-slate-100 dark:border-white/8 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-[#0D2137] dark:text-white text-lg">Próximos Eventos</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Siguientes 60 días</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#0D2137]/5 dark:bg-[#A971D6]/15 flex items-center justify-center">
              <Calendar size={16} className="text-[#0D2137] dark:text-[#A971D6]" />
            </div>
          </div>

          {proximos.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-8">
              <Calendar size={36} className="text-slate-200 dark:text-white/10 mb-3" />
              <p className="text-sm font-medium">Sin eventos próximos</p>
            </div>
          ) : (
            <div className="flex-1 space-y-3 overflow-y-auto">
              {proximos.map((ev, i) => (
                <div key={ev.solicitud_id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-[#B7950B]/5 dark:hover:bg-[#A971D6]/10 transition-colors group">
                  <div className="w-8 h-8 rounded-xl bg-[#0D2137] dark:bg-gradient-to-br dark:from-[#6B3F7A] dark:to-[#A971D6] flex items-center justify-center text-white font-bold text-xs shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#0D2137] dark:text-white text-sm truncate">{ev.cliente_nombre}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{ev.tipo_nombre || ev.paquete_nombre || 'Sin tipo'}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="flex items-center gap-1 text-[10px] font-bold text-[#B7950B] dark:text-[#C9A227]">
                        <Clock size={10} /> {fmtFecha(ev.fecha_evento)}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">·</span>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{ev.num_invitados} invitados</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-1 rounded-full shrink-0 self-start" style={{ background: ev.estado_color + '22', color: ev.estado_color }}>
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
        {[
          { titulo: 'Paquetes Más Solicitados', desc: 'Distribución por tipo de paquete', data: paquetes, icon: PackageCheck, offset: 0 },
          { titulo: 'Tipos de Evento', desc: 'Categorías más populares', data: tipos, icon: CalendarCheck, offset: 2 },
        ].map((g) => (
          <div key={g.titulo} className="bg-white dark:bg-[#332247] rounded-2xl border border-slate-100 dark:border-white/8 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-[#0D2137] dark:text-white text-lg">{g.titulo}</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{g.desc}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#0D2137]/5 dark:bg-[#A971D6]/15 flex items-center justify-center">
                <g.icon size={16} className="text-[#0D2137] dark:text-[#A971D6]" />
              </div>
            </div>
            {g.data.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500">
                <g.icon size={40} className="text-slate-200 dark:text-white/10 mb-3" />
                <p className="text-sm">Sin datos disponibles</p>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="55%" height={220}>
                  <PieChart>
                    <Pie data={g.data} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="total" nameKey="nombre">
                      {g.data.map((_, index) => (<Cell key={index} fill={PIE_COLORS[(index + g.offset) % PIE_COLORS.length]} />))}
                    </Pie>
                    <Tooltip content={<CustomTooltipPie />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {g.data.slice(0, 6).map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: PIE_COLORS[(i + g.offset) % PIE_COLORS.length] }} />
                      <span className="text-xs text-slate-600 dark:text-slate-300 flex-1 truncate">{p.nombre}</span>
                      <span className="text-xs font-bold text-[#0D2137] dark:text-white">{p.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Resumen de estados ──────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#332247] rounded-2xl border border-slate-100 dark:border-white/8 shadow-sm p-6">
        <h2 className="font-bold text-[#0D2137] dark:text-white text-lg mb-5">Distribución de Estados</h2>
        {resumen && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Pendientes',   value: resumen.pendientes,   color: 'bg-amber-400',  text: 'text-amber-700 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-500/10' },
              { label: 'En Revisión',  value: resumen.en_revision,  color: 'bg-blue-500',   text: 'text-blue-700 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-500/10' },
              { label: 'Confirmadas',  value: resumen.confirmadas,  color: 'bg-green-500',  text: 'text-green-700 dark:text-green-400',   bg: 'bg-green-50 dark:bg-green-500/10' },
              { label: 'Completadas',  value: resumen.completadas,  color: 'bg-purple-500', text: 'text-purple-700 dark:text-purple-400',  bg: 'bg-purple-50 dark:bg-purple-500/10' },
              { label: 'Rechazadas',   value: resumen.rechazadas,   color: 'bg-red-500',    text: 'text-red-700 dark:text-red-400',     bg: 'bg-red-50 dark:bg-red-500/10' },
              { label: 'Canceladas',   value: resumen.canceladas,   color: 'bg-slate-400',  text: 'text-slate-600 dark:text-slate-300',   bg: 'bg-slate-50 dark:bg-white/5' },
            ].map((item) => (
              <div key={item.label} className={`${item.bg} rounded-2xl p-4 flex flex-col items-center text-center transition-transform hover:-translate-y-1`}>
                <span className={`text-3xl font-bold ${item.text}`}>{item.value || 0}</span>
                <span className={`text-xs font-bold ${item.text} mt-1`}>{item.label}</span>
                <div className={`w-full h-1.5 rounded-full ${item.color} mt-3 opacity-40`} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ MODAL EXPORTAR PDF (checkboxes) ═══════════════════════════════════ */}
      <AnimatePresence>
        {modalPDF && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#221634]/70 backdrop-blur-sm"
              onClick={() => !exportando && setModalPDF(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              className="relative bg-white dark:bg-[#332247] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-transparent dark:border-white/8"
            >
              {/* Header */}
              <div className="px-7 py-6 bg-gradient-to-r from-[#6B3F7A] to-[#A971D6] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center">
                    <FileBarChart size={22} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">Exportar Reporte PDF</h3>
                    <p className="text-white/80 text-xs mt-0.5">Selecciona las secciones a incluir</p>
                  </div>
                </div>
                <button onClick={() => !exportando && setModalPDF(false)} className="p-2.5 bg-white/15 hover:bg-white/25 text-white rounded-full transition-colors"><X size={20} /></button>
              </div>

              {/* Checkboxes */}
              <div className="p-6 space-y-2.5 max-h-[55vh] overflow-y-auto">
                {SECCIONES_PDF.map((s) => {
                  const checked = opciones[s.key];
                  return (
                    <button
                      key={s.key}
                      onClick={() => toggleOpcion(s.key)}
                      className={`w-full flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                        checked
                          ? 'border-[#A971D6] bg-[#A971D6]/8 dark:bg-[#A971D6]/12'
                          : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                        checked ? 'bg-gradient-to-br from-[#6B3F7A] to-[#A971D6] text-white' : 'bg-slate-100 dark:bg-white/10 text-transparent'
                      }`}>
                        <Check size={15} strokeWidth={3} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-[#0D2137] dark:text-white">{s.label}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-6 py-5 border-t border-slate-100 dark:border-white/8 flex items-center justify-between gap-3 bg-slate-50/60 dark:bg-white/5">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {Object.values(opciones).filter(Boolean).length} de {SECCIONES_PDF.length} secciones
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setModalPDF(false)} disabled={exportando} className="px-5 py-2.5 border-2 border-slate-200 dark:border-white/12 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-white/8 transition-colors text-sm disabled:opacity-50">
                    Cancelar
                  </button>
                  <button
                    onClick={exportarPDF}
                    disabled={exportando || !Object.values(opciones).some(Boolean)}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#B7950B] to-[#C9A227] text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-md text-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    {exportando ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
                    {exportando ? 'Generando...' : 'Descargar PDF'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
