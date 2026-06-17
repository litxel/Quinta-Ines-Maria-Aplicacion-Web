import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getTodasSolicitudes, 
  actualizarEstadoSolicitud, 
  getSolicitudDetalle,
  archivarSolicitud,
  eliminarSolicitudPermanente
} from '../../services/solicitudes.service';
import BadgeEstado from '../../components/shared/BadgeEstado';
import logoQuinta from '../../assets/FotosQuintaInes/LogosQuinta/logo quinta ines.png';
import { 
  X, User, Phone, Mail, Calendar, Users, Package, FileText, Download,
  Palette, GripHorizontal, MessageSquare, Flower2, ShoppingBag,
  Archive, Trash2, AlertTriangle
} from 'lucide-react';

const ESTADOS = [
  { codigo: 'PENDIENTE',   label: 'Pendiente',    color: 'amber'  },
  { codigo: 'EN_REVISION', label: 'En revisión',  color: 'blue'   },
  { codigo: 'CONFIRMADA',  label: 'Confirmada',   color: 'green'  },
  { codigo: 'RECHAZADA',   label: 'Rechazada',    color: 'red'    },
  { codigo: 'CANCELADA',   label: 'Cancelada',    color: 'slate'  },
  { codigo: 'COMPLETADA',  label: 'Completada',   color: 'purple' },
];

const FLUJO_NORMAL = ['PENDIENTE', 'EN_REVISION', 'CONFIRMADA', 'COMPLETADA'];
const LIMITE = 15;

const INCLUSIONES_PAQUETES = {
  'Bronce': ['Uso exclusivo de instalaciones (jardines, glorieta, puente, pileta)', 'Decoración básica de mesas y sillas', 'Vajilla y cristalería estándar', 'Servicio de cocina profesional', 'Audio y sonido básico', 'Parqueadero vigilado'],
  'Silver': ['Todo lo incluido en el Paquete Bronce', 'Decoración personalizada con flores naturales', 'Centros de mesa premium a elección', 'Spots fotográficos temáticos', 'Estación de bebidas calientes', 'Zona de juegos infantiles'],
  'Gold': ['Todo lo incluido en el Paquete Silver', 'Decoración de lujo con flores importadas', 'Iluminación ambiental profesional', 'Menú gourmet a 3 tiempos', 'Barra de bebidas sin alcohol ilimitada', 'Wedding/Event Planner'],
  'Corporativo': ['Proyector HD y pantalla gigante', 'Sistema de audio profesional y micrófonos', 'Dos (2) Coffee breaks completos', 'Decoración corporativa', 'Zona de networking'],
  'Alfombra Roja': ['Todo lo incluido en el Paquete Gold', 'Alfombra roja de bienvenida', 'Iluminación espectacular', 'Menú de alta cocina de autor', 'Fotógrafo y videógrafo profesional', 'Coordinador VIP']
};

export default function GestionSolicitudes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filtroUsuarioId = searchParams.get('usuario_id') || '';
  const filtroClienteNombre = searchParams.get('cliente') || '';

  const [solicitudes,   setSolicitudes]   = useState([]);
  const [total,         setTotal]         = useState(0);
  const [totalPaginas,  setTotalPaginas]  = useState(1);
  const [pagina,        setPagina]        = useState(1);
  const [filtroEstado,  setFiltroEstado]  = useState('');
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [actualizando,  setActualizando]  = useState(null);
  const [toast,         setToast]         = useState(null);

  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [detalleCargando, setDetalleCargando] = useState(false);
  const [solicitudDetalle, setSolicitudDetalle] = useState(null);
  const [descargandoPDF, setDescargandoPDF] = useState(false);

  const [estadoPendienteConf, setEstadoPendienteConf] = useState(null);
  const [mensajeAdmin, setMensajeAdmin] = useState('');

  // Estado para modal de eliminación permanente
  const [modalEliminar, setModalEliminar] = useState(null); // { solicitud_id, numero_cotizacion, cliente_nombre }
  const [motivoEliminar, setMotivoEliminar] = useState('');
  const [eliminando, setEliminando] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true); 
    setError('');
    try {
      const resultado = await getTodasSolicitudes({ 
        ...(filtroEstado ? { estado: filtroEstado } : {}), 
        ...(filtroUsuarioId ? { usuario_id: filtroUsuarioId } : {}),
        pagina, 
        limite: LIMITE 
      });
      setSolicitudes(resultado.solicitudes);
      setTotal(resultado.total || 0);
      setTotalPaginas(resultado.totalPaginas);
    } catch (e) { 
      setError(e.response?.data?.message ?? e.message); 
    } finally { 
      setLoading(false); 
    }
  }, [filtroEstado, pagina, filtroUsuarioId]);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => { setPagina(1); }, [filtroEstado, filtroUsuarioId]);

  const limpiarFiltroCliente = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('usuario_id');
    next.delete('cliente');
    setSearchParams(next);
  };

  const abrirDetalle = async (id) => {
    setDrawerAbierto(true); 
    setDetalleCargando(true); 
    setSolicitudDetalle(null);
    setEstadoPendienteConf(null); 
    setMensajeAdmin(''); 
    try {
      const data = await getSolicitudDetalle(id);
      setSolicitudDetalle(data);
    } catch (error) { 
      mostrarToast('error', 'No se pudo cargar el detalle.'); 
      setDrawerAbierto(false); 
    } finally { 
      setDetalleCargando(false); 
    }
  };

  const mostrarToast = (tipo, msg) => { 
    setToast({ tipo, msg }); 
    setTimeout(() => setToast(null), 3500); 
  };

  const iniciarCambioEstado = (nuevoEstado) => {
    const currentIndex = FLUJO_NORMAL.indexOf(solicitudDetalle.estado_codigo);
    const targetIndex  = FLUJO_NORMAL.indexOf(nuevoEstado);
    if (['RECHAZADA', 'CANCELADA'].includes(solicitudDetalle.estado_codigo)) return;
    if (targetIndex <= currentIndex) return;

    setEstadoPendienteConf(nuevoEstado);
    setMensajeAdmin('');
  };

  const confirmarCambioEstado = async () => {
    if (!estadoPendienteConf) return;
    setActualizando(solicitudDetalle.solicitud_id);
    try {
      await actualizarEstadoSolicitud(solicitudDetalle.solicitud_id, estadoPendienteConf, mensajeAdmin);
      setSolicitudes((prev) => 
        prev.map((s) => {
          if (s.solicitud_id !== solicitudDetalle.solicitud_id) return s;
          const est = ESTADOS.find((e) => e.codigo === estadoPendienteConf);
          return { ...s, estado_codigo: estadoPendienteConf, estado_nombre: est?.label, estado_color: est?.color };
        })
      );
      setSolicitudDetalle(prev => ({ 
        ...prev, estado_codigo: estadoPendienteConf, observaciones: mensajeAdmin || prev.observaciones 
      }));
      mostrarToast('success', `Estado actualizado a "${estadoPendienteConf}".`);
      setEstadoPendienteConf(null);
      setMensajeAdmin('');
    } catch (e) {
      mostrarToast('error', e.response?.data?.message ?? 'Error al actualizar.');
    } finally {
      setActualizando(null);
    }
  };

  const handleCambiarEstado = async (solicitudId, nuevoEstado) => {
    setActualizando(solicitudId);
    try {
      await actualizarEstadoSolicitud(solicitudId, nuevoEstado);
      setSolicitudes((prev) => prev.map((s) => {
        if (s.solicitud_id !== solicitudId) return s;
        const est = ESTADOS.find((e) => e.codigo === nuevoEstado);
        return { ...s, estado_codigo: nuevoEstado, estado_nombre: est?.label, estado_color: est?.color };
      }));
      if (solicitudDetalle && solicitudDetalle.solicitud_id === solicitudId) {
        setSolicitudDetalle(prev => ({ ...prev, estado_codigo: nuevoEstado }));
      }
      mostrarToast('success', `Estado actualizado.`);
    } catch (e) { 
      mostrarToast('error', e.response?.data?.message ?? 'Error.'); 
    } finally { 
      setActualizando(null); 
    }
  };

  const handleArchivar = async (sol, e) => {
    e.stopPropagation();
    setActualizando(sol.solicitud_id);
    try {
      await archivarSolicitud(sol.solicitud_id);
      setSolicitudes(prev => prev.filter(s => s.solicitud_id !== sol.solicitud_id));
      setTotal(prev => prev - 1);
      mostrarToast('success', `"${sol.numero_cotizacion}" archivada correctamente.`);
      if (drawerAbierto && solicitudDetalle?.solicitud_id === sol.solicitud_id) setDrawerAbierto(false);
    } catch (e) {
      mostrarToast('error', e.response?.data?.message || 'Error al archivar.');
    } finally {
      setActualizando(null);
    }
  };

  const abrirModalEliminar = (sol, e) => {
    e.stopPropagation();
    setModalEliminar(sol);
    setMotivoEliminar('');
  };

  const handleEliminarPermanente = async () => {
    if (!motivoEliminar.trim()) return;
    setEliminando(true);
    try {
      await eliminarSolicitudPermanente(modalEliminar.solicitud_id, motivoEliminar.trim());
      setSolicitudes(prev => prev.filter(s => s.solicitud_id !== modalEliminar.solicitud_id));
      setTotal(prev => prev - 1);
      mostrarToast('success', `Solicitud eliminada. Se notificó al cliente por email.`);
      setModalEliminar(null);
      if (drawerAbierto && solicitudDetalle?.solicitud_id === modalEliminar.solicitud_id) setDrawerAbierto(false);
    } catch (e) {
      mostrarToast('error', e.response?.data?.message || 'Error al eliminar.');
    } finally {
      setEliminando(false);
    }
  };

  const handleDescargarPDFAdmin = async () => {
    if (!solicitudDetalle) return;
    setDescargandoPDF(true);
    try {
      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const pW  = doc.internal.pageSize.getWidth();
      // Paleta púrpura corporativa (aubergine + gold)
      const NAVY  = [42, 24, 56]; const GOLD  = [201, 162, 39]; const CREAM = [243, 238, 248]; const SLATE = [110, 100, 120];

      doc.setFillColor(...NAVY); doc.rect(0, 0, pW, 52, 'F');
      doc.setFillColor(...GOLD); doc.rect(0, 50, pW, 3, 'F');

      // Logotipo oficial
      try {
        const logo = await new Promise((res) => { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => res(im); im.onerror = () => res(null); im.src = logoQuinta; });
        if (logo) doc.addImage(logo, 'PNG', 14, 9, 28, 28);
      } catch { /* sin logo */ }

      doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(...GOLD); doc.text('QUINTA INÉS MARÍA', pW / 2, 20, { align: 'center' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(255, 255, 255); doc.setCharSpace(1.5); doc.text('BED  ·  CATERING  ·  EVENTOS  ·  CANTÓN CHAMBO', pW / 2, 28, { align: 'center' }); doc.setCharSpace(0);
      doc.setDrawColor(255, 255, 255, 0.2); doc.setLineWidth(0.3); doc.line(20, 32, pW - 20, 32);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...GOLD); doc.text(`COTIZACIÓN N.° ${solicitudDetalle.numero_cotizacion}`, 20, 42);
      
      const fechaEmision = solicitudDetalle.creado_en ? new Date(solicitudDetalle.creado_en).toLocaleDateString('es-EC') : new Date().toLocaleDateString('es-EC');
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(200, 200, 200); doc.text(`Fecha de emisión: ${fechaEmision}`, pW - 20, 42, { align: 'right' });

      let y = 63;
      doc.setFillColor(...CREAM); doc.roundedRect(14, y - 5, pW - 28, 28, 3, 3, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...NAVY); doc.text('DATOS DEL CLIENTE', 20, y + 1);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(30, 30, 30); doc.text(solicitudDetalle.cliente_nombre.toUpperCase(), 20, y + 8);
      doc.setFontSize(9); doc.setTextColor(...SLATE); doc.text(`Correo: ${solicitudDetalle.cliente_correo}`, 20, y + 14); doc.text(`Teléfono: ${solicitudDetalle.cliente_telefono || 'No especificado'}`, 20, y + 19);
      doc.setFillColor(...NAVY); doc.roundedRect(pW - 75, y, 60, 12, 3, 3, 'F'); doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(255, 255, 255); doc.text(solicitudDetalle.tipo_nombre || 'EVENTO', pW - 45, y + 8, { align: 'center' });

      y += 34;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...NAVY); doc.text(`LO QUE INCLUYE TU PAQUETE ${solicitudDetalle.paquete_nombre?.toUpperCase() || ''}:`, 14, y);
      doc.setFillColor(...GOLD); doc.rect(14, y + 2, 70, 1, 'F'); y += 8;
      
      const paqueteKey = Object.keys(INCLUSIONES_PAQUETES).find(k => solicitudDetalle.paquete_nombre?.includes(k)) || 'Bronce';
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...SLATE);
      INCLUSIONES_PAQUETES[paqueteKey].forEach(inc => { doc.text(`- ${inc}`, 16, y); y += 5; }); y += 5;

      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...NAVY); doc.text('RESUMEN DE SERVICIOS Y COSTOS', 14, y);
      doc.setFillColor(...GOLD); doc.rect(14, y + 2, 60, 1, 'F'); y += 7;

      const filas = [ [`Paquete: ${solicitudDetalle.paquete_nombre}`, `${solicitudDetalle.num_invitados} invitados`, `$${(solicitudDetalle.num_invitados * parseFloat(solicitudDetalle.precio_persona || 15)).toFixed(2)}`] ];
      if (solicitudDetalle.centro_mesa) filas.push([`Centro de mesa: ${solicitudDetalle.centro_mesa}`, 'Mesa asignada', '—']);
      if (solicitudDetalle.estilo_decoracion) filas.push([`Estilo: ${solicitudDetalle.estilo_decoracion}`, 'Decoración', '—']);
      if (solicitudDetalle.extras && solicitudDetalle.extras.length > 0) {
        solicitudDetalle.extras.forEach(ext => { filas.push([`Extra: ${ext.nombre}`, `${ext.cantidad} unidad(es)`, `$${(ext.cantidad * parseFloat(ext.precio)).toFixed(2)}`]); });
      }

      autoTable(doc, { 
        startY: y, head: [['Descripción', 'Detalle', 'Subtotal']], body: filas, theme: 'grid', 
        headStyles: { fillColor: NAVY, textColor: GOLD, fontStyle: 'bold', fontSize: 9 }, 
        bodyStyles: { fontSize: 9, textColor: [40, 40, 40] }, 
        columnStyles: { 0: { cellWidth: 90 }, 1: { cellWidth: 65, halign: 'center' }, 2: { cellWidth: 35, halign: 'right', fontStyle: 'bold' } }, margin: { left: 14, right: 14 }
      });
      y = doc.lastAutoTable.finalY + 8;

      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...NAVY); doc.text('COLORES ELEGIDOS:', 14, y);
      if (solicitudDetalle.color_primario) {
        // Render color swatches using hex colors
        const hexToRgb = (hex) => {
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [183, 149, 11];
        };
        const rgb1 = hexToRgb(solicitudDetalle.color_primario);
        const rgb2 = hexToRgb(solicitudDetalle.color_secundario || solicitudDetalle.color_primario);
        doc.setFillColor(...rgb1); doc.roundedRect(52, y - 4, 8, 7, 1.5, 1.5, 'F');
        doc.setDrawColor(200,200,200); doc.setLineWidth(0.3); doc.roundedRect(52, y - 4, 8, 7, 1.5, 1.5, 'S');
        doc.setFontSize(7); doc.setTextColor(...SLATE); doc.text(solicitudDetalle.color_primario, 52, y + 5);
        doc.setFillColor(...rgb2); doc.roundedRect(66, y - 4, 8, 7, 1.5, 1.5, 'F');
        doc.roundedRect(66, y - 4, 8, 7, 1.5, 1.5, 'S');
        doc.text(solicitudDetalle.color_secundario || solicitudDetalle.color_primario, 66, y + 5);
        doc.setFontSize(9);
      } else {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...SLATE); doc.text('No definidos por el cliente.', 52, y);
      }
      // Centro de mesa
      if (solicitudDetalle.centro_mesa) {
        y += 12;
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...NAVY); doc.text('CENTRO DE MESA:', 14, y);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...SLATE); doc.text(solicitudDetalle.centro_mesa, 52, y);
      }

      const cajaH = 24;
      doc.setFillColor(...NAVY); doc.roundedRect(pW - 90, y - 6, 76, cajaH, 4, 4, 'F');
      doc.setFillColor(...GOLD); doc.roundedRect(pW - 90, y - 6, 76, 8, 4, 4, 'F'); doc.rect(pW - 90, y - 2, 76, 4, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...NAVY); doc.text('TOTAL ESTIMADO', pW - 52, y - 0.5, { align: 'center' });
      doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(...GOLD); doc.text(`$${parseFloat(solicitudDetalle.precio_estimado).toFixed(2)}`, pW - 52, y + 12, { align: 'center' });

      const pageH = doc.internal.pageSize.getHeight();
      doc.setFillColor(...NAVY); doc.rect(0, pageH - 20, pW, 20, 'F'); doc.setFillColor(...GOLD); doc.rect(0, pageH - 20, pW, 2, 'F');
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(200, 200, 200); doc.text('eventplanner.quintainesmaria.ec', pW / 2, pageH - 12, { align: 'center' });
      
      doc.save(`Cotizacion-${solicitudDetalle.numero_cotizacion}.pdf`);
      mostrarToast('success', 'PDF descargado exitosamente.');
    } catch (error) { 
      mostrarToast('error', 'Error al generar el PDF.'); 
    } finally { 
      setDescargandoPDF(false); 
    }
  };

  return (
    <div className="space-y-5 relative">
      {toast && ( 
        <div role="alert" className={`fixed top-5 right-5 z-[60] px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all animate-in fade-in slide-in-from-top-5 ${toast.tipo === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.tipo === 'success' ? '✅' : '❌'} {toast.msg}
        </div> 
      )}

      {filtroUsuarioId && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#B7950B]/10 dark:bg-[#C9A227]/10 border border-[#B7950B]/30 dark:border-[#C9A227]/25 rounded-2xl">
          <p className="text-sm text-[#0D2137] dark:text-white font-medium">
            Filtrando solicitudes de: <strong>{decodeURIComponent(filtroClienteNombre || 'Cliente')}</strong>
          </p>
          <button
            type="button"
            onClick={limpiarFiltroCliente}
            className="text-xs font-bold text-[#0D2137] dark:text-white px-4 py-2 bg-white dark:bg-[#332247] rounded-xl border border-[#B7950B]/40 dark:border-[#C9A227]/30 hover:bg-[#B7950B]/10 dark:hover:bg-[#C9A227]/15 transition-colors"
          >
            ✕ Quitar filtro
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0D2137] dark:text-white">Gestión de Solicitudes</h1>
          <p className="text-slate-400 text-sm mt-0.5">Haz clic en una fila para ver el detalle de la cotización.</p>
        </div>
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="w-full sm:w-48 px-3 py-2.5 border-2 border-slate-200 dark:border-white/12 rounded-xl text-sm font-bold text-[#0D2137] dark:text-white focus:outline-none focus:border-[#B7950B] bg-white dark:bg-[#332247] cursor-pointer">
          <option value="">Todos los estados</option>
          {ESTADOS.map((e) => (<option key={e.codigo} value={e.codigo}>{e.label}</option>))}
        </select>
      </div>

      {error && (<div role="alert" className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">⚠ {error} <button onClick={cargar} className="ml-3 underline font-medium">Reintentar</button></div>)}

      {/* ── Tabla Principal ── */}
      <div className="bg-white dark:bg-[#332247] rounded-2xl border border-slate-100 dark:border-white/8 shadow-md overflow-hidden flex flex-col min-h-[500px]">
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-sm min-w-[820px]">
            <thead>
              <tr className="bg-gradient-to-r from-[#0D2137] to-[#1A3A5C]">
                <Th>N.° Cotización</Th>
                <Th>Cliente</Th>
                <Th>Paquete / Tipo</Th>
                <Th>Invitados</Th>
                <Th>Total</Th>
                <Th>Fecha sol.</Th>
                <Th>Estado</Th>
                <Th>Cambiar estado</Th>
                <Th>Acciones</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/8">
              {loading ? ( <tr><td colSpan="9" className="p-0"><SkeletonTabla filas={10} /></td></tr> ) 
              : solicitudes.length === 0 ? ( 
                <tr><td colSpan="9" className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <span className="text-4xl">📋</span>
                    <p className="font-bold">No hay solicitudes con este filtro.</p>
                  </div>
                </td></tr> 
              ) : (
                solicitudes.map((s, idx) => (
                  <tr 
                    key={s.solicitud_id} 
                    onClick={() => abrirDetalle(s.solicitud_id)} 
                    className={`cursor-pointer group transition-all duration-150 hover:bg-[#B7950B]/8 dark:hover:bg-[#A971D6]/10 hover:shadow-sm ${
                      idx % 2 === 0 ? 'bg-white dark:bg-[#332247]' : 'bg-slate-50/50 dark:bg-white/[0.02]'
                    }`}
                  >
                    {/* N° Cotización */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-[#B7950B] bg-[#B7950B]/10 px-2.5 py-1.5 rounded-lg group-hover:bg-[#B7950B]/20 transition-colors">
                        {s.numero_cotizacion}
                      </span>
                    </td>
                    
                    {/* Cliente */}
                    <td className="px-4 py-3.5 max-w-[190px]">
                      <p className="font-bold text-[#0D2137] dark:text-white truncate text-sm">{s.cliente_nombre}</p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5" title={s.cliente_correo}>{s.cliente_correo}</p>
                    </td>

                    {/* Paquete */}
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-[#0D2137] dark:text-white truncate max-w-[140px] text-sm">{s.paquete_nombre ?? '—'}</p>
                      <span className="inline-block mt-0.5 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-white/8 px-2 py-0.5 rounded-full truncate max-w-[140px]">
                        {s.tipo_nombre ?? 'Sin tipo'}
                      </span>
                    </td>

                    {/* Invitados */}
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center w-10 h-7 font-bold text-sm text-[#0D2137] dark:text-white bg-[#0D2137]/8 dark:bg-[#A971D6]/15 rounded-lg">
                        {s.num_invitados}
                      </span>
                    </td>

                    {/* Total */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-bold text-[#0D2137] dark:text-white text-base">${parseFloat(s.precio_estimado).toFixed(2)}</span>
                    </td>

                    {/* Fecha */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-300">
                        {new Date(s.creado_en).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </td>

                    {/* Estado actual — badge grande */}
                    <td className="px-4 py-3.5">
                      <BadgeEstadoTabla codigo={s.estado_codigo} nombre={s.estado_nombre} />
                    </td>
                    
                    {/* Cambiar estado */}
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="relative">
                        <select
                          value={s.estado_codigo}
                          onChange={(e) => handleCambiarEstado(s.solicitud_id, e.target.value)}
                          disabled={actualizando === s.solicitud_id || ['RECHAZADA', 'CANCELADA'].includes(s.estado_codigo)}
                          className={`w-full pl-3 pr-7 py-2 text-xs font-bold border-2 rounded-lg focus:outline-none appearance-none cursor-pointer transition-colors ${
                            ['RECHAZADA', 'CANCELADA'].includes(s.estado_codigo) 
                              ? 'border-red-200 dark:border-red-500/25 bg-red-50/80 dark:bg-red-500/10 text-red-500 dark:text-red-400 cursor-not-allowed'
                              : 'border-slate-200 dark:border-white/12 bg-white dark:bg-[#3E2B57] text-[#0D2137] dark:text-white focus:border-[#B7950B] hover:border-slate-300 dark:hover:border-white/25'
                          }`}
                        >
                          {ESTADOS.map((e) => {
                            const currentIndex = FLUJO_NORMAL.indexOf(s.estado_codigo);
                            const targetIndex = FLUJO_NORMAL.indexOf(e.codigo);
                            const isTerminal = ['RECHAZADA', 'CANCELADA'].includes(s.estado_codigo);
                            let optionDisabled = false;
                            if (isTerminal && e.codigo !== s.estado_codigo) optionDisabled = true; 
                            else if (targetIndex !== -1 && currentIndex !== -1 && targetIndex < currentIndex) optionDisabled = true;
                            return (<option key={e.codigo} value={e.codigo} disabled={optionDisabled}>{e.label}{optionDisabled && e.codigo !== s.estado_codigo ? ' 🚫' : ''}</option>);
                          })}
                        </select>
                        {actualizando === s.solicitud_id 
                          ? (<span className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-[#0D2137] border-t-transparent rounded-full animate-spin" />) 
                          : (<span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[9px]">▼</span>)
                        }
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="px-3 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleArchivar(s, e)}
                          disabled={actualizando === s.solicitud_id}
                          title="Archivar solicitud"
                          className="group/btn flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-500 hover:text-white rounded-lg transition-all disabled:opacity-40 border border-amber-100 hover:border-amber-500"
                        >
                          <Archive size={13} />
                          <span className="hidden lg:inline">Archivar</span>
                        </button>
                        <button
                          onClick={(e) => abrirModalEliminar(s, e)}
                          disabled={actualizando === s.solicitud_id}
                          title="Eliminar permanentemente"
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-500 hover:text-white rounded-lg transition-all disabled:opacity-40 border border-red-100 hover:border-red-500"
                        >
                          <Trash2 size={13} />
                          <span className="hidden lg:inline">Eliminar</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && totalPaginas > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 dark:border-white/8 flex items-center justify-between bg-slate-50 dark:bg-white/5">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-300">Página <strong className="text-[#0D2137] dark:text-white">{pagina}</strong> de {totalPaginas}</p>
            <div className="flex gap-2">
              <PaginaBtn onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagina === 1}>← Anterior</PaginaBtn>
              <PaginaBtn onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}>Siguiente →</PaginaBtn>
            </div>
          </div>
        )}
      </div>

      {drawerAbierto && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-[#0D2137]/40 backdrop-blur-sm transition-opacity" onClick={() => setDrawerAbierto(false)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-slate-50 dark:bg-[#2A1C40] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-200 dark:border-white/12 dark:border-white/10">
            {detalleCargando || !solicitudDetalle ? (
              <div className="flex-1 flex flex-col justify-center items-center">
                <div className="w-10 h-10 border-4 border-[#B7950B] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="font-bold text-slate-500 dark:text-slate-300 animate-pulse">Obteniendo Rayos X...</p>
              </div>
            ) : (
              <>
                <div className="px-8 py-6 bg-gradient-to-r from-[#0D2137] to-[#1A3A5C] dark:from-[#332247] dark:to-[#3E2B57] border-b border-slate-200 dark:border-white/12 dark:border-white/10 flex justify-between items-center shadow-sm z-10">
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Foto / iniciales del cliente */}
                    <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 ring-2 ring-[#C9A227]/50 shadow-lg bg-gradient-to-br from-[#C9A227] to-[#B7950B] flex items-center justify-center text-white font-bold text-lg">
                      {solicitudDetalle.cliente_foto ? (
                        <img
                          src={`${import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000'}${solicitudDetalle.cliente_foto}`}
                          alt={solicitudDetalle.cliente_nombre}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (solicitudDetalle.cliente_nombre || '?').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-[#C9A227] uppercase tracking-widest mb-0.5">Cotización Exclusiva</p>
                      <h2 className="text-lg font-display font-bold text-white truncate leading-tight">{solicitudDetalle.cliente_nombre}</h2>
                      <p className="font-mono text-xs text-slate-300 dark:text-slate-400 mt-0.5">{solicitudDetalle.numero_cotizacion}</p>
                    </div>
                  </div>
                  <button onClick={() => setDrawerAbierto(false)} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors shrink-0"><X size={22} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                  
                  <div className="bg-white dark:bg-[#332247] p-6 rounded-2xl border border-slate-100 dark:border-white/8 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">Estado Operativo</h3>
                    {['RECHAZADA', 'CANCELADA'].includes(solicitudDetalle.estado_codigo) ? (
                      <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-xl font-bold flex items-center gap-3"><span>❌</span> Esta solicitud fue {solicitudDetalle.estado_codigo.toLowerCase()}. Operación detenida.</div>
                    ) : (
                      <div className="relative flex justify-between items-center w-full px-4">
                        <div className="absolute top-1/2 left-4 right-4 h-1.5 bg-slate-100 dark:bg-white/10 -translate-y-1/2 z-0 rounded-full" />
                        {/* Relleno dorado animado */}
                        <motion.div
                          className="absolute top-1/2 left-4 h-1.5 bg-gradient-to-r from-[#B7950B] to-[#C9A227] -translate-y-1/2 z-0 rounded-full"
                          style={{ right: 16 }}
                          initial={false}
                          animate={{ width: `${(FLUJO_NORMAL.indexOf(solicitudDetalle.estado_codigo) / (FLUJO_NORMAL.length - 1)) * 100}%` }}
                          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        />
                        {FLUJO_NORMAL.map((estado, index) => {
                          const currentIndex = FLUJO_NORMAL.indexOf(solicitudDetalle.estado_codigo);
                          const isCompleted = index <= currentIndex;
                          const isCurrent = index === currentIndex;
                          const isClickable = index > currentIndex;
                          return (
                            <div key={estado} className="relative z-10 flex flex-col items-center gap-3">
                              <motion.button
                                onClick={() => iniciarCambioEstado(estado)}
                                disabled={!isClickable || actualizando === solicitudDetalle.solicitud_id}
                                title={isClickable ? 'Avanzar a este estado' : isCompleted ? 'Estado completado (Irreversible)' : ''}
                                animate={isCurrent ? { scale: [1, 1.18, 1.1] } : { scale: 1 }}
                                transition={{ duration: 0.4 }}
                                whileHover={isClickable ? { scale: 1.12 } : {}}
                                whileTap={isClickable ? { scale: 0.94 } : {}}
                                className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-colors duration-300 focus:outline-none ${isCurrent ? 'bg-[#0D2137] dark:bg-[#A971D6] border-[#0D2137] dark:border-[#A971D6] shadow-lg' : isCompleted ? 'bg-[#B7950B] border-[#B7950B]' : isClickable ? 'bg-white dark:bg-[#3E2B57] border-slate-300 dark:border-white/20 hover:border-[#1A6BAC] dark:hover:border-[#A971D6] hover:bg-blue-50 dark:hover:bg-[#A971D6]/15 cursor-pointer' : 'bg-white dark:bg-[#3E2B57] border-slate-200 dark:border-white/12 dark:border-white/12 cursor-not-allowed'}`}
                              >
                                {isCompleted && !isCurrent ? (<span className="text-white text-lg font-bold">✓</span>) : (<span className={`text-xs font-bold ${isCurrent ? 'text-white' : 'text-slate-400 dark:text-slate-500 dark:text-slate-300'}`}>{index + 1}</span>)}
                              </motion.button>
                              <span className={`text-[10px] font-bold uppercase tracking-wider ${isCurrent ? 'text-[#1A3A5C] dark:text-[#C9A227]' : isCompleted ? 'text-[#B7950B] dark:text-[#C9A227]' : 'text-slate-400 dark:text-slate-500 dark:text-slate-300'}`}>{estado.replace('_', ' ')}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    {estadoPendienteConf && (
                      <div className="mt-8 p-5 bg-blue-50/50 dark:bg-blue-500/10 border-2 border-blue-200 dark:border-blue-500/25 rounded-2xl animate-in slide-in-from-top-2">
                        <label className="block text-sm font-bold text-[#0D2137] dark:text-white mb-2 flex items-center gap-2"><MessageSquare size={16} className="text-[#1A6BAC]"/> Mensaje para el cliente (Opcional)</label>
                        <p className="text-xs text-slate-500 dark:text-slate-300 mb-3">Este mensaje aparecerá en el portal "Mis Solicitudes" del cliente al pasar a <strong>{estadoPendienteConf.replace('_', ' ')}</strong>.</p>
                        <textarea rows={2} value={mensajeAdmin} onChange={(e) => setMensajeAdmin(e.target.value)} placeholder="Ej: Estimado cliente, su fecha ha sido reservada con éxito. Le llamaremos hoy a las 15:00." className="w-full p-3 rounded-xl border border-slate-300 dark:border-white/12 dark:bg-white/5 dark:text-white focus:outline-none focus:border-[#1A6BAC] text-sm mb-4" />
                        <div className="flex gap-3">
                           <button onClick={() => setEstadoPendienteConf(null)} className="flex-1 py-2.5 bg-white dark:bg-[#3E2B57] border border-slate-300 dark:border-white/12 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-white/8 transition-colors">Cancelar</button>
                           <button onClick={confirmarCambioEstado} disabled={actualizando === solicitudDetalle.solicitud_id} className="flex-1 py-2.5 bg-[#1A6BAC] text-white font-bold rounded-xl hover:bg-blue-700 shadow-md transition-all">{actualizando ? 'Confirmando...' : `Avanzar a ${estadoPendienteConf.replace('_', ' ')}`}</button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-[#332247] p-6 rounded-2xl border border-slate-100 dark:border-white/8 shadow-sm space-y-5">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Datos del Cliente</h3>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="bg-slate-100 dark:bg-white/8 p-2.5 rounded-xl text-slate-500 dark:text-slate-300 flex-shrink-0"><User size={20} /></div>
                        <span className="font-bold text-[#0D2137] dark:text-white text-base break-words min-w-0">{solicitudDetalle.cliente_nombre}</span>
                      </div>
                      <div className="flex items-start gap-4 text-sm">
                        <div className="bg-slate-100 dark:bg-white/8 p-2.5 rounded-xl text-slate-500 dark:text-slate-300 flex-shrink-0"><Mail size={20} /></div>
                        <a href={`mailto:${solicitudDetalle.cliente_correo}`} className="text-slate-600 dark:text-slate-300 break-all min-w-0 hover:text-[#1A6BAC] hover:underline transition-colors" title={solicitudDetalle.cliente_correo}>{solicitudDetalle.cliente_correo}</a>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="bg-slate-100 dark:bg-white/8 p-2.5 rounded-xl text-slate-500 dark:text-slate-300 flex-shrink-0"><Phone size={20} /></div>
                        {solicitudDetalle.cliente_telefono && solicitudDetalle.cliente_telefono !== 'No especificado' 
                          ? <a href={`tel:${solicitudDetalle.cliente_telefono}`} className="text-slate-600 dark:text-slate-300 font-medium hover:text-[#1A6BAC] hover:underline transition-colors flex items-center gap-1">{solicitudDetalle.cliente_telefono} <span className="text-[10px] text-[#B7950B] font-bold">📞 Llamar</span></a>
                          : <span className="text-slate-400 italic text-xs">No especificado</span>
                        }
                      </div>
                    </div>

                    <div className="bg-white dark:bg-[#332247] p-6 rounded-2xl border border-slate-100 dark:border-white/8 shadow-sm flex flex-col justify-between">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Detalle del Evento</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-100 dark:border-white/8 transition-all hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-center gap-2 text-slate-500 dark:text-slate-300 mb-1.5"><Package size={16} /><span className="text-xs font-bold">Paquete</span></div><p className="font-bold text-[#0D2137] dark:text-white text-sm">{solicitudDetalle.paquete_nombre}</p></div>
                        <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-100 dark:border-white/8 transition-all hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-center gap-2 text-slate-500 dark:text-slate-300 mb-1.5"><Users size={16} /><span className="text-xs font-bold">Invitados</span></div><p className="font-bold text-[#0D2137] dark:text-white text-sm">{solicitudDetalle.num_invitados} pax</p></div>
                        <div className="bg-[#0D2137]/5 dark:bg-[#A971D6]/10 p-4 rounded-xl border border-[#0D2137]/10 dark:border-[#A971D6]/20 col-span-2 transition-all hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-center gap-2 text-[#0D2137] dark:text-white mb-1.5"><Calendar size={16} /><span className="text-xs font-bold uppercase tracking-wider">Fecha Reservada</span></div><p className="font-bold text-[#0D2137] dark:text-white text-base">{solicitudDetalle.fecha_evento ? new Date(solicitudDetalle.fecha_evento).toLocaleDateString('es-EC', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'No definida'}</p></div>
                      </div>
                    </div>
                  </div>

                  {/* ── Configuración Estética y Notas del Cliente ── */}
                  <div className="bg-white dark:bg-[#332247] p-6 rounded-2xl border border-slate-100 dark:border-white/8 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                      Configuración Estética y Notas del Cliente
                    </h3>

                    {/* Paleta de colores */}
                    <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 p-5 rounded-xl mb-4 transition-transform hover:-translate-y-0.5">
                      <h4 className="text-[10px] font-bold text-[#1A6BAC] uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Palette size={14}/> Paleta de Colores Elegida
                      </h4>
                      {solicitudDetalle.color_primario ? (
                        <div className="flex items-center gap-6">
                          <div className="flex flex-col items-center gap-1.5">
                            <div 
                              className="w-14 h-14 rounded-xl border-2 border-white shadow-md" 
                              style={{ backgroundColor: solicitudDetalle.color_primario }}
                            />
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase">Color Principal</span>
                            <span className="font-mono text-[10px] text-slate-400">{solicitudDetalle.color_primario}</span>
                          </div>
                          {solicitudDetalle.color_secundario && (
                            <div className="flex flex-col items-center gap-1.5">
                              <div 
                                className="w-14 h-14 rounded-xl border-2 border-white shadow-md" 
                                style={{ backgroundColor: solicitudDetalle.color_secundario }}
                              />
                              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase">Color Secundario</span>
                              <span className="font-mono text-[10px] text-slate-400">{solicitudDetalle.color_secundario}</span>
                            </div>
                          )}
                          <div className="ml-2 flex items-center gap-3">
                            <div className="w-20 h-8 rounded-lg shadow-inner border border-white/50" style={{ background: `linear-gradient(135deg, ${solicitudDetalle.color_primario} 50%, ${solicitudDetalle.color_secundario || solicitudDetalle.color_primario} 50%)` }} />
                            <span className="text-xs text-slate-500 dark:text-slate-300 italic">Vista previa</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400 italic">El cliente no seleccionó colores en el configurador.</p>
                      )}
                    </div>

                    {/* Centro de mesa y tipo de evento */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-purple-50 dark:bg-purple-500/12 border border-purple-100 dark:border-purple-500/25 p-4 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-md">
                        <h4 className="text-[10px] font-bold text-purple-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <Flower2 size={13}/> Centro de Mesa
                        </h4>
                        <p className="text-sm font-bold text-[#0D2137] dark:text-white">
                          {solicitudDetalle.centro_mesa || <span className="text-slate-400 italic font-normal text-xs">No especificado</span>}
                        </p>
                      </div>
                      <div className="bg-indigo-50 dark:bg-indigo-500/12 border border-indigo-100 dark:border-indigo-500/25 p-4 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-md">
                        <h4 className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <GripHorizontal size={13}/> Tipo de Evento
                        </h4>
                        <p className="text-sm font-bold text-[#0D2137] dark:text-white">
                          {solicitudDetalle.tipo_nombre || <span className="text-slate-400 italic font-normal text-xs">No especificado</span>}
                        </p>
                      </div>
                    </div>

                    {/* Extras seleccionados */}
                    {solicitudDetalle.extras && solicitudDetalle.extras.length > 0 ? (
                      <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 p-4 rounded-xl mb-4">
                        <h4 className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                          <ShoppingBag size={13}/> Extras Seleccionados ({solicitudDetalle.extras.length})
                        </h4>
                        <div className="space-y-2">
                          {solicitudDetalle.extras.map((ext, i) => (
                            <div key={i} className="flex items-center justify-between bg-white dark:bg-[#3E2B57] rounded-lg px-3 py-2 border border-amber-100 dark:border-amber-500/15 shadow-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-amber-500 text-xs">✦</span>
                                <span className="text-sm font-medium text-[#0D2137] dark:text-white">{ext.nombre}</span>
                                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">×{ext.cantidad}</span>
                              </div>
                              <span className="text-sm font-bold text-[#B7950B]">${(ext.cantidad * parseFloat(ext.precio)).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/8 p-4 rounded-xl mb-4">
                        <p className="text-xs text-slate-400 dark:text-slate-500 dark:text-slate-300 italic flex items-center gap-2"><ShoppingBag size={13}/> El cliente no seleccionó extras adicionales.</p>
                      </div>
                    )}

                    {/* Mensaje adicional del cliente */}
                    {solicitudDetalle.mensaje_cliente && (
                      <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 p-5 rounded-xl">
                        <h4 className="text-[10px] font-bold text-amber-800 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <MessageSquare size={14}/> Mensaje Adicional del Cliente
                        </h4>
                        <p className="text-sm text-amber-900 italic font-medium">
                          &ldquo;{solicitudDetalle.mensaje_cliente}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>

                </div>

                <div className="p-8 bg-white dark:bg-[#332247] border-t border-slate-200 dark:border-white/12 dark:border-white/10 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
                  <div className="flex justify-between items-end mb-5">
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest">Costo Total Estimado</span>
                    <span className="text-4xl font-display font-bold text-[#0D2137] dark:text-white">${parseFloat(solicitudDetalle.precio_estimado).toFixed(2)}</span>
                  </div>
                  <button onClick={handleDescargarPDFAdmin} disabled={descargandoPDF} className="w-full py-4 bg-[#B7950B] text-white rounded-xl font-bold hover:bg-[#9A7D0A] shadow-lg transition-all flex items-center justify-center gap-2 text-lg disabled:opacity-50">
                    <Download size={22} /> {descargandoPDF ? 'Generando Documento...' : 'Descargar Proforma Formal (PDF)'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ═══ MODAL ELIMINAR PERMANENTEMENTE ══════════════════════════════════ */}
      {modalEliminar && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#221634]/70 backdrop-blur-sm" onClick={() => !eliminando && setModalEliminar(null)} />
          <div className="relative bg-white dark:bg-[#332247] rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
            {/* Header rojo */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Trash2 size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Eliminar Permanentemente</h3>
                  <p className="text-red-100 text-xs mt-0.5">Esta acción no se puede deshacer</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Info de la solicitud */}
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/25 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-800 font-bold text-sm">{modalEliminar.numero_cotizacion}</p>
                    <p className="text-red-600 text-xs mt-0.5">Cliente: {modalEliminar.cliente_nombre}</p>
                    <p className="text-red-600 text-xs mt-1">Se enviara un correo de notificacion al cliente con el motivo ingresado.</p>
                  </div>
                </div>
              </div>

              {/* Campo de motivo OBLIGATORIO */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Motivo de eliminacion <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={motivoEliminar}
                  onChange={e => setMotivoEliminar(e.target.value)}
                  placeholder="Describe el motivo de la cancelacion (ej. solicitud duplicada, cliente no contactable, etc.)"
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-slate-200 dark:border-white/12 dark:bg-white/5 dark:text-white rounded-xl text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 dark:focus:ring-red-500/20 transition-all resize-none"
                  disabled={eliminando}
                />
                {motivoEliminar.trim().length === 0 && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle size={12} /> El motivo es obligatorio para continuar
                  </p>
                )}
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setModalEliminar(null)}
                  disabled={eliminando}
                  className="flex-1 py-3 border-2 border-slate-200 dark:border-white/12 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-white/8 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEliminarPermanente}
                  disabled={!motivoEliminar.trim() || eliminando}
                  className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {eliminando ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Eliminando...</>
                  ) : (
                    <><Trash2 size={16} /> Eliminar y Notificar</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Th({ children }) { 
  return (
    <th className="px-4 py-3.5 text-left text-[11px] font-bold text-white/80 uppercase tracking-widest whitespace-nowrap">
      {children}
    </th>
  );
}

function PaginaBtn({ children, onClick, disabled }) { 
  return (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className="px-4 py-2 text-xs font-bold rounded-xl border-2 border-slate-200 dark:border-white/12 text-slate-600 dark:text-slate-300 hover:border-[#0D2137] hover:text-[#0D2137] dark:text-white hover:bg-[#0D2137]/5 disabled:opacity-30 transition-all bg-white shadow-sm"
    >
      {children}
    </button>
  );
}

const ESTADO_ESTILOS = {
  PENDIENTE:   { bg: 'bg-amber-100',  text: 'text-amber-800',  border: 'border-amber-200',  dot: 'bg-amber-500',  icon: '⏳' },
  EN_REVISION: { bg: 'bg-blue-100',   text: 'text-blue-800',   border: 'border-blue-200',   dot: 'bg-blue-500',   icon: '🔍' },
  CONFIRMADA:  { bg: 'bg-green-100',  text: 'text-green-800',  border: 'border-green-200',  dot: 'bg-green-500',  icon: '✅' },
  RECHAZADA:   { bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-red-200',    dot: 'bg-red-500',    icon: '❌' },
  CANCELADA:   { bg: 'bg-slate-100',  text: 'text-slate-600 dark:text-slate-300',  border: 'border-slate-200 dark:border-white/12',  dot: 'bg-slate-400',  icon: '🚫' },
  COMPLETADA:  { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200', dot: 'bg-purple-500', icon: '🏆' },
};

function BadgeEstadoTabla({ codigo, nombre }) {
  const estilos = ESTADO_ESTILOS[codigo] || { bg: 'bg-slate-100', text: 'text-slate-600 dark:text-slate-300', border: 'border-slate-200 dark:border-white/12', dot: 'bg-slate-400', icon: '•' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${estilos.bg} ${estilos.text} ${estilos.border} whitespace-nowrap shadow-sm`}>
      <span className="text-sm leading-none">{estilos.icon}</span>
      {nombre}
    </span>
  );
}

function SkeletonTabla({ filas }) { 
  return (
    <div className="divide-y divide-slate-100 dark:divide-white/8 animate-pulse">
      {Array.from({ length: filas }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-4 items-center">
          <div className="h-6 bg-slate-200 rounded-lg w-28" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-slate-200 rounded w-36" />
            <div className="h-2.5 bg-slate-100 rounded w-44" />
          </div>
          <div className="h-3.5 bg-slate-200 rounded w-20" />
          <div className="h-5 bg-slate-200 rounded-full w-8" />
          <div className="h-3.5 bg-slate-200 rounded w-16" />
          <div className="h-3.5 bg-slate-200 rounded w-20" />
          <div className="h-6 bg-slate-200 rounded-full w-24" />
        </div>
      ))}
    </div>
  );
}