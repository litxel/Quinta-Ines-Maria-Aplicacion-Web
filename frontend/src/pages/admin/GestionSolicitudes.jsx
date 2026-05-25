import { useState, useEffect, useCallback } from 'react';
import { 
  getTodasSolicitudes, 
  actualizarEstadoSolicitud, 
  getSolicitudDetalle 
} from '../../services/solicitudes.service';
import BadgeEstado from '../../components/shared/BadgeEstado';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Users, 
  Package, 
  FileText, 
  Download, 
  Palette, 
  GripHorizontal, 
  MessageSquare 
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
  'Bronce': [
    'Uso exclusivo de instalaciones (jardines, glorieta, puente, pileta)', 
    'Decoración básica de mesas y sillas', 
    'Vajilla y cristalería estándar', 
    'Servicio de cocina profesional', 
    'Audio y sonido básico', 
    'Parqueadero vigilado'
  ],
  'Silver': [
    'Todo lo incluido en el Paquete Bronce', 
    'Decoración personalizada con flores naturales', 
    'Centros de mesa premium a elección', 
    'Spots fotográficos temáticos', 
    'Estación de bebidas calientes', 
    'Zona de juegos infantiles'
  ],
  'Gold': [
    'Todo lo incluido en el Paquete Silver', 
    'Decoración de lujo con flores importadas', 
    'Iluminación ambiental profesional', 
    'Menú gourmet a 3 tiempos', 
    'Barra de bebidas sin alcohol ilimitada', 
    'Wedding/Event Planner'
  ],
  'Corporativo': [
    'Proyector HD y pantalla gigante', 
    'Sistema de audio profesional y micrófonos', 
    'Dos (2) Coffee breaks completos', 
    'Decoración corporativa', 
    'Zona de networking'
  ],
  'Alfombra Roja': [
    'Todo lo incluido en el Paquete Gold', 
    'Alfombra roja de bienvenida', 
    'Iluminación espectacular', 
    'Menú de alta cocina de autor', 
    'Fotógrafo y videógrafo profesional', 
    'Coordinador VIP'
  ]
};

export default function GestionSolicitudes() {
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

  const cargar = useCallback(async () => {
    setLoading(true); 
    setError('');
    try {
      const resultado = await getTodasSolicitudes({ 
        ...(filtroEstado ? { estado: filtroEstado } : {}), 
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
  }, [filtroEstado, pagina]);

  useEffect(() => { 
    cargar(); 
  }, [cargar]);

  useEffect(() => { 
    setPagina(1); 
  }, [filtroEstado]);

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

    if (['RECHAZADA', 'CANCELADA'].includes(solicitudDetalle.estado_codigo)) {
      return;
    }
    if (targetIndex <= currentIndex) {
      return;
    }

    setEstadoPendienteConf(nuevoEstado);
    setMensajeAdmin('');
  };

  const confirmarCambioEstado = async () => {
    if (!estadoPendienteConf) return;
    setActualizando(solicitudDetalle.solicitud_id);
    
    try {
      await actualizarEstadoSolicitud(
        solicitudDetalle.solicitud_id, 
        estadoPendienteConf, 
        mensajeAdmin
      );
      
      setSolicitudes((prev) => 
        prev.map((s) => {
          if (s.solicitud_id !== solicitudDetalle.solicitud_id) return s;
          const est = ESTADOS.find((e) => e.codigo === estadoPendienteConf);
          return { 
            ...s, 
            estado_codigo: estadoPendienteConf, 
            estado_nombre: est?.label, 
            estado_color: est?.color 
          };
        })
      );
      
      setSolicitudDetalle(prev => ({ 
        ...prev, 
        estado_codigo: estadoPendienteConf,
        observaciones: mensajeAdmin || prev.observaciones 
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
        return { 
          ...s, 
          estado_codigo: nuevoEstado, 
          estado_nombre: est?.label, 
          estado_color: est?.color 
        };
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

  const handleDescargarPDFAdmin = async () => {
    if (!solicitudDetalle) return;
    setDescargandoPDF(true);
    try {
      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const pW  = doc.internal.pageSize.getWidth();
      
      const NAVY  = [13, 33, 55]; 
      const GOLD  = [183, 149, 11]; 
      const CREAM = [245, 240, 232]; 
      const SLATE = [100, 116, 139];

      doc.setFillColor(...NAVY); 
      doc.rect(0, 0, pW, 52, 'F');
      
      doc.setFillColor(...GOLD); 
      doc.rect(0, 50, pW, 3, 'F');
      
      doc.setFont('helvetica', 'bold'); 
      doc.setFontSize(22); 
      doc.setTextColor(...GOLD); 
      doc.text('QUINTA INÉS MARÍA', pW / 2, 20, { align: 'center' });
      
      doc.setFont('helvetica', 'normal'); 
      doc.setFontSize(9); 
      doc.setTextColor(255, 255, 255); 
      doc.setCharSpace(1.5); 
      doc.text('BED  ·  CATERING  ·  EVENTOS  ·  CANTÓN CHAMBO, CHIMBORAZO', pW / 2, 28, { align: 'center' }); 
      doc.setCharSpace(0);
      
      doc.setDrawColor(255, 255, 255, 0.2); 
      doc.setLineWidth(0.3); 
      doc.line(20, 32, pW - 20, 32);

      doc.setFont('helvetica', 'bold'); 
      doc.setFontSize(10); 
      doc.setTextColor(...GOLD); 
      doc.text(`COTIZACIÓN N.° ${solicitudDetalle.numero_cotizacion}`, 20, 42);
      
      const fechaEmision = solicitudDetalle.creado_en 
        ? new Date(solicitudDetalle.creado_en).toLocaleDateString('es-EC') 
        : new Date().toLocaleDateString('es-EC');
        
      doc.setFont('helvetica', 'normal'); 
      doc.setFontSize(9); 
      doc.setTextColor(200, 200, 200); 
      doc.text(`Fecha de emisión: ${fechaEmision}`, pW - 20, 42, { align: 'right' });

      let y = 63;
      doc.setFillColor(...CREAM); 
      doc.roundedRect(14, y - 5, pW - 28, 28, 3, 3, 'F');
      
      doc.setFont('helvetica', 'bold'); 
      doc.setFontSize(8); 
      doc.setTextColor(...NAVY); 
      doc.text('DATOS DEL CLIENTE', 20, y + 1);
      
      doc.setFont('helvetica', 'normal'); 
      doc.setFontSize(10); 
      doc.setTextColor(30, 30, 30); 
      doc.text(solicitudDetalle.cliente_nombre.toUpperCase(), 20, y + 8);
      
      doc.setFontSize(9); 
      doc.setTextColor(...SLATE); 
      doc.text(`Correo: ${solicitudDetalle.cliente_correo}`, 20, y + 14); 
      doc.text(`Teléfono: ${solicitudDetalle.cliente_telefono || 'No especificado'}`, 20, y + 19);
      
      doc.setFillColor(...NAVY); 
      doc.roundedRect(pW - 75, y, 60, 12, 3, 3, 'F'); 
      doc.setFont('helvetica', 'bold'); 
      doc.setFontSize(9); 
      doc.setTextColor(255, 255, 255); 
      doc.text(solicitudDetalle.tipo_nombre || 'EVENTO', pW - 45, y + 8, { align: 'center' });

      y += 34;
      
      doc.setFont('helvetica', 'bold'); 
      doc.setFontSize(10); 
      doc.setTextColor(...NAVY); 
      doc.text(`LO QUE INCLUYE TU PAQUETE ${solicitudDetalle.paquete_nombre?.toUpperCase() || ''}:`, 14, y);
      
      doc.setFillColor(...GOLD); 
      doc.rect(14, y + 2, 70, 1, 'F'); 
      y += 8;
      
      const paqueteKey = Object.keys(INCLUSIONES_PAQUETES).find(k => 
        solicitudDetalle.paquete_nombre?.includes(k)
      ) || 'Bronce';
      
      doc.setFont('helvetica', 'normal'); 
      doc.setFontSize(9); 
      doc.setTextColor(...SLATE);
      
      // 🚀 BUG FIX: Usamos el guion "-" en lugar del check "✓"
      INCLUSIONES_PAQUETES[paqueteKey].forEach(inc => { 
        doc.text(`- ${inc}`, 16, y); 
        y += 5; 
      }); 
      y += 5;

      doc.setFont('helvetica', 'bold'); 
      doc.setFontSize(10); 
      doc.setTextColor(...NAVY); 
      doc.text('RESUMEN DE SERVICIOS Y COSTOS', 14, y);
      
      doc.setFillColor(...GOLD); 
      doc.rect(14, y + 2, 60, 1, 'F'); 
      y += 7;

      const filas = [ 
        [
          `Paquete: ${solicitudDetalle.paquete_nombre}`, 
          `${solicitudDetalle.num_invitados} invitados`, 
          `$${(solicitudDetalle.num_invitados * parseFloat(solicitudDetalle.precio_persona || 15)).toFixed(2)}`
        ] 
      ];
      
      if (solicitudDetalle.centro_mesa) {
        filas.push([`Centro de mesa: ${solicitudDetalle.centro_mesa}`, 'Mesa asignada', '—']);
      }
      if (solicitudDetalle.estilo_decoracion) {
        filas.push([`Estilo: ${solicitudDetalle.estilo_decoracion}`, 'Decoración', '—']);
      }
      if (solicitudDetalle.extras && solicitudDetalle.extras.length > 0) {
        solicitudDetalle.extras.forEach(ext => { 
          filas.push([
            `Extra: ${ext.nombre}`, 
            `${ext.cantidad} unidad(es)`, 
            `$${(ext.cantidad * parseFloat(ext.precio)).toFixed(2)}`
          ]); 
        });
      }

      autoTable(doc, { 
        startY: y, 
        head: [['Descripción', 'Detalle', 'Subtotal']], 
        body: filas, 
        theme: 'grid', 
        headStyles: { fillColor: NAVY, textColor: GOLD, fontStyle: 'bold', fontSize: 9 }, 
        bodyStyles: { fontSize: 9, textColor: [40, 40, 40] }, 
        columnStyles: { 
          0: { cellWidth: 90 }, 
          1: { cellWidth: 65, halign: 'center' }, 
          2: { cellWidth: 35, halign: 'right', fontStyle: 'bold' } 
        }, 
        margin: { left: 14, right: 14 }
      });
      
      y = doc.lastAutoTable.finalY + 8;

      doc.setFont('helvetica', 'bold'); 
      doc.setFontSize(9); 
      doc.setTextColor(...NAVY); 
      doc.text('COLORES ELEGIDOS:', 14, y);
      
      if (solicitudDetalle.color_primario) {
        doc.setFillColor(solicitudDetalle.color_primario); 
        doc.roundedRect(48, y - 3, 8, 5, 1, 1, 'F');
        
        doc.setFillColor(solicitudDetalle.color_secundario || '#B7950B'); 
        doc.roundedRect(58, y - 3, 8, 5, 1, 1, 'F');
      } else {
        doc.setFont('helvetica', 'normal'); 
        doc.setFontSize(8); 
        doc.setTextColor(...SLATE); 
        doc.text('No definidos por el cliente.', 48, y);
      }

      const cajaH = 24;
      doc.setFillColor(...NAVY); 
      doc.roundedRect(pW - 90, y - 6, 76, cajaH, 4, 4, 'F');
      
      doc.setFillColor(...GOLD); 
      doc.roundedRect(pW - 90, y - 6, 76, 8, 4, 4, 'F'); 
      doc.rect(pW - 90, y - 2, 76, 4, 'F');
      
      doc.setFont('helvetica', 'bold'); 
      doc.setFontSize(8); 
      doc.setTextColor(...NAVY); 
      doc.text('TOTAL ESTIMADO', pW - 52, y - 0.5, { align: 'center' });
      
      doc.setFont('helvetica', 'bold'); 
      doc.setFontSize(18); 
      doc.setTextColor(...GOLD); 
      doc.text(`$${parseFloat(solicitudDetalle.precio_estimado).toFixed(2)}`, pW - 52, y + 12, { align: 'center' });

      const pageH = doc.internal.pageSize.getHeight();
      
      doc.setFillColor(...NAVY); 
      doc.rect(0, pageH - 20, pW, 20, 'F'); 
      
      doc.setFillColor(...GOLD); 
      doc.rect(0, pageH - 20, pW, 2, 'F');
      
      doc.setFont('helvetica', 'normal'); 
      doc.setFontSize(8); 
      doc.setTextColor(200, 200, 200); 
      doc.text('eventplanner.quintainesmaria.ec', pW / 2, pageH - 12, { align: 'center' });
      
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
        <div 
          role="alert" 
          className={`fixed top-5 right-5 z-[60] px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all animate-in fade-in slide-in-from-top-5 ${toast.tipo === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
        >
          {toast.tipo === 'success' ? '✅' : '❌'} {toast.msg}
        </div> 
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0D2137]">
            Gestión de Solicitudes
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Haz clic en una fila para ver el "Rayos X" de la cotización.
          </p>
        </div>
        
        <select 
          value={filtroEstado} 
          onChange={(e) => setFiltroEstado(e.target.value)} 
          className="w-full sm:w-48 px-3 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-bold text-[#0D2137] focus:outline-none focus:border-[#B7950B] bg-white cursor-pointer"
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map((e) => (
            <option key={e.codigo} value={e.codigo}>
              {e.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div role="alert" className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          ⚠ {error} 
          <button onClick={cargar} className="ml-3 underline font-medium">Reintentar</button>
        </div>
      )}

      {/* ── Tabla Principal ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <Th>N.° Cotización</Th>
                <Th>Cliente</Th>
                <Th>Paquete</Th>
                <Th>Invitados</Th>
                <Th>Total</Th>
                <Th>Fecha</Th>
                <Th>Estado actual</Th>
                <Th>Acción</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? ( 
                <tr>
                  <td colSpan="8" className="p-0">
                    <SkeletonTabla filas={10} />
                  </td>
                </tr> 
              ) : solicitudes.length === 0 ? ( 
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-slate-400">
                    No hay solicitudes con este filtro.
                  </td>
                </tr> 
              ) : (
                solicitudes.map((s) => (
                  <tr 
                    key={s.solicitud_id} 
                    onClick={() => abrirDetalle(s.solicitud_id)} 
                    className="hover:bg-[#B7950B]/5 transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="font-mono text-xs text-[#B7950B] font-bold group-hover:underline">
                        {s.numero_cotizacion}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-bold text-[#0D2137] truncate max-w-[160px]">
                        {s.cliente_nombre}
                      </p>
                      <p className="text-xs text-slate-400 truncate max-w-[160px]">
                        {s.cliente_correo}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-bold text-slate-700 truncate max-w-[130px]">
                        {s.paquete_nombre ?? '—'}
                      </p>
                      <p className="text-[10px] uppercase font-bold text-slate-400 truncate max-w-[130px]">
                        {s.tipo_nombre ?? 'Sin especificar'}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
                        {s.num_invitados}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="font-bold text-[#0D2137] text-base">
                        ${parseFloat(s.precio_estimado).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-slate-500 text-xs">
                      {new Date(s.creado_en).toLocaleDateString('es-EC', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </td>
                    <td className="px-4 py-4">
                      <BadgeEstado 
                        estadoColor={s.estado_color} 
                        estadoNombre={s.estado_nombre} 
                        size="sm" 
                      />
                    </td>
                    
                    {/* 🚀 SELECT INTELIGENTE (Deshabilita opciones que rompen la regla) */}
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="relative">
                        <select
                          value={s.estado_codigo}
                          onChange={(e) => handleCambiarEstado(s.solicitud_id, e.target.value)}
                          disabled={actualizando === s.solicitud_id || ['RECHAZADA', 'CANCELADA'].includes(s.estado_codigo)}
                          className={`w-full pl-3 pr-8 py-1.5 text-xs font-bold border-2 rounded-lg focus:outline-none appearance-none cursor-pointer
                            ${['RECHAZADA', 'CANCELADA'].includes(s.estado_codigo) ? 'border-red-200 bg-red-50 text-red-500' : 'border-slate-200 bg-white text-[#0D2137] focus:border-[#B7950B]'}
                          `}
                        >
                          {ESTADOS.map((e) => {
                            const currentIndex = FLUJO_NORMAL.indexOf(s.estado_codigo);
                            const targetIndex = FLUJO_NORMAL.indexOf(e.codigo);
                            const isTerminal = ['RECHAZADA', 'CANCELADA'].includes(s.estado_codigo);
                            
                            let optionDisabled = false;
                            if (isTerminal && e.codigo !== s.estado_codigo) optionDisabled = true; 
                            else if (targetIndex !== -1 && currentIndex !== -1 && targetIndex < currentIndex) optionDisabled = true;

                            return (
                              <option key={e.codigo} value={e.codigo} disabled={optionDisabled}>
                                {e.label} {optionDisabled && e.codigo !== s.estado_codigo ? ' 🚫' : ''}
                              </option>
                            );
                          })}
                        </select>
                        
                        {actualizando === s.solicitud_id ? (
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-[#0D2137] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[10px]">
                            ▼
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {!loading && totalPaginas > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50">
            <p className="text-xs font-bold text-slate-500">
              Página <strong className="text-[#0D2137]">{pagina}</strong> de {totalPaginas}
            </p>
            <div className="flex gap-2">
              <PaginaBtn 
                onClick={() => setPagina((p) => Math.max(1, p - 1))} 
                disabled={pagina === 1}
              >
                ← Anterior
              </PaginaBtn>
              <PaginaBtn 
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} 
                disabled={pagina === totalPaginas}
              >
                Siguiente →
              </PaginaBtn>
            </div>
          </div>
        )}
      </div>

      {/* 🚀 DRAWER ELEGANTE Y ESTADOS CLICKEEABLES */}
      {drawerAbierto && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          
          <div 
            className="absolute inset-0 bg-[#0D2137]/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setDrawerAbierto(false)} 
          />
          
          <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-slate-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-200">
            
            {detalleCargando || !solicitudDetalle ? (
              <div className="flex-1 flex flex-col justify-center items-center">
                <div className="w-10 h-10 border-4 border-[#B7950B] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="font-bold text-slate-500 animate-pulse">
                  Obteniendo Rayos X...
                </p>
              </div>
            ) : (
              <>
                {/* Cabecera Drawer */}
                <div className="px-8 py-6 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm z-10">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Cotización Exclusiva
                    </p>
                    <h2 className="text-2xl font-display font-bold text-[#B7950B]">
                      {solicitudDetalle.numero_cotizacion}
                    </h2>
                  </div>
                  <button 
                    onClick={() => setDrawerAbierto(false)} 
                    className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Contenido del Panel */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                  
                  {/* ── LÍNEA DE TIEMPO INTERACTIVA ── */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                      Estado Operativo
                    </h3>
                    
                    {['RECHAZADA', 'CANCELADA'].includes(solicitudDetalle.estado_codigo) ? (
                      <div className="bg-red-50 text-red-600 p-4 rounded-xl font-bold flex items-center gap-3">
                        <span>❌</span> Esta solicitud fue {solicitudDetalle.estado_codigo.toLowerCase()}. Operación detenida.
                      </div>
                    ) : (
                      <div className="relative flex justify-between items-center w-full px-4">
                        <div className="absolute top-1/2 left-4 right-4 h-1.5 bg-slate-100 -translate-y-1/2 z-0 rounded-full" />
                        
                        {FLUJO_NORMAL.map((estado, index) => {
                          const currentIndex = FLUJO_NORMAL.indexOf(solicitudDetalle.estado_codigo);
                          const isCompleted = index <= currentIndex;
                          const isCurrent = index === currentIndex;
                          const isClickable = index > currentIndex; 
                          
                          return (
                            <div key={estado} className="relative z-10 flex flex-col items-center gap-3">
                              <button 
                                onClick={() => iniciarCambioEstado(estado)}
                                disabled={!isClickable || actualizando === solicitudDetalle.solicitud_id}
                                title={isClickable ? 'Avanzar a este estado' : isCompleted ? 'Estado completado (Irreversible)' : ''}
                                className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 focus:outline-none 
                                  ${isCurrent ? 'bg-[#0D2137] border-[#0D2137] shadow-lg scale-110' : 
                                    isCompleted ? 'bg-[#B7950B] border-[#B7950B]' : 
                                    isClickable ? 'bg-white border-slate-300 hover:border-[#1A6BAC] hover:bg-blue-50 cursor-pointer' : 'bg-white border-slate-200 cursor-not-allowed'}
                                `}
                              >
                                {isCompleted && !isCurrent ? (
                                  <span className="text-white text-lg font-bold">✓</span>
                                ) : (
                                  <span className={`text-xs font-bold ${isCurrent ? 'text-white' : 'text-slate-400'}`}>
                                    {index + 1}
                                  </span>
                                )}
                              </button>
                              <span className={`text-[10px] font-bold uppercase tracking-wider ${isCurrent ? 'text-[#0D2137]' : isCompleted ? 'text-[#B7950B]' : 'text-slate-400'}`}>
                                {estado.replace('_', ' ')}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* 🚀 BUZÓN DE MENSAJE PARA EL CLIENTE */}
                    {estadoPendienteConf && (
                      <div className="mt-8 p-5 bg-blue-50/50 border-2 border-blue-200 rounded-2xl animate-in slide-in-from-top-2">
                        <label className="block text-sm font-bold text-[#0D2137] mb-2 flex items-center gap-2">
                          <MessageSquare size={16} className="text-[#1A6BAC]"/> 
                          Mensaje para el cliente (Opcional)
                        </label>
                        <p className="text-xs text-slate-500 mb-3">
                          Este mensaje aparecerá en el portal "Mis Solicitudes" del cliente al pasar a <strong>{estadoPendienteConf.replace('_', ' ')}</strong>.
                        </p>
                        <textarea 
                          rows={2}
                          value={mensajeAdmin}
                          onChange={(e) => setMensajeAdmin(e.target.value)}
                          placeholder="Ej: Estimado cliente, su fecha ha sido reservada con éxito. Le llamaremos hoy a las 15:00."
                          className="w-full p-3 rounded-xl border border-slate-300 focus:outline-none focus:border-[#1A6BAC] text-sm mb-4"
                        />
                        <div className="flex gap-3">
                           <button 
                             onClick={() => setEstadoPendienteConf(null)} 
                             className="flex-1 py-2.5 bg-white border border-slate-300 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                           >
                             Cancelar
                           </button>
                           <button 
                             onClick={confirmarCambioEstado} 
                             disabled={actualizando === solicitudDetalle.solicitud_id} 
                             className="flex-1 py-2.5 bg-[#1A6BAC] text-white font-bold rounded-xl hover:bg-blue-700 shadow-md transition-all"
                           >
                             {actualizando ? 'Confirmando...' : `Avanzar a ${estadoPendienteConf.replace('_', ' ')}`}
                           </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* ── DATOS DEL CLIENTE ── */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Datos del Cliente
                      </h3>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="bg-slate-100 p-2.5 rounded-xl text-slate-500">
                          <User size={20} />
                        </div>
                        <span className="font-bold text-[#0D2137] text-base">
                          {solicitudDetalle.cliente_nombre}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="bg-slate-100 p-2.5 rounded-xl text-slate-500">
                          <Mail size={20} />
                        </div>
                        <span className="text-slate-600">
                          {solicitudDetalle.cliente_correo}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="bg-slate-100 p-2.5 rounded-xl text-slate-500">
                          <Phone size={20} />
                        </div>
                        <span className="text-slate-600 font-medium">
                          {solicitudDetalle.cliente_telefono || 'No especificado'}
                        </span>
                      </div>
                    </div>

                    {/* ── DETALLES DEL EVENTO ── */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                        Detalle del Evento
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-2 text-slate-500 mb-1.5">
                            <Package size={16} />
                            <span className="text-xs font-bold">Paquete</span>
                          </div>
                          <p className="font-bold text-[#0D2137] text-sm">
                            {solicitudDetalle.paquete_nombre}
                          </p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-2 text-slate-500 mb-1.5">
                            <Users size={16} />
                            <span className="text-xs font-bold">Invitados</span>
                          </div>
                          <p className="font-bold text-[#0D2137] text-sm">
                            {solicitudDetalle.num_invitados} pax
                          </p>
                        </div>
                        <div className="bg-[#0D2137]/5 p-4 rounded-xl border border-[#0D2137]/10 col-span-2">
                          <div className="flex items-center gap-2 text-[#0D2137] mb-1.5">
                            <Calendar size={16} />
                            <span className="text-xs font-bold uppercase tracking-wider">Fecha Reservada</span>
                          </div>
                          <p className="font-bold text-[#0D2137] text-base">
                            {solicitudDetalle.fecha_evento ? new Date(solicitudDetalle.fecha_evento).toLocaleDateString('es-EC', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'No definida'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── CONFIGURACIÓN VISUAL ── */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5">
                      Configuración Estética y Notas
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                      
                      <div className="flex flex-col gap-2">
                        <span className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
                          <Palette size={16}/> Paleta de Colores
                        </span>
                        <div className="flex gap-3 mt-1">
                           {solicitudDetalle.color_primario ? (
                             <>
                               <div 
                                 className="w-8 h-8 rounded-full shadow-md border-2 border-slate-100" 
                                 style={{backgroundColor: solicitudDetalle.color_primario}} 
                                 title="Primario"
                               />
                               <div 
                                 className="w-8 h-8 rounded-full shadow-md border-2 border-slate-100" 
                                 style={{backgroundColor: solicitudDetalle.color_secundario}} 
                                 title="Secundario"
                               />
                             </>
                           ) : ( 
                             <span className="text-sm font-medium text-slate-400 italic">No seleccionados</span> 
                           )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <span className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
                          <GripHorizontal size={16}/> Centro de Mesa
                        </span>
                        <span className="text-sm font-bold text-[#0D2137] mt-1">
                          {solicitudDetalle.centro_mesa || 'Opción Estándar'}
                        </span>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <span className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
                          <Package size={16}/> Extras Seleccionados
                        </span>
                        <span className="text-sm font-bold text-[#B7950B] mt-1">
                          {solicitudDetalle.extras?.length || 0} Servicio(s) adicionales
                        </span>
                      </div>
                    </div>
                    
                    <h4 className="text-xs font-bold text-slate-700 flex items-center gap-2 mb-3 pt-4 border-t border-slate-100">
                      <FileText size={16} /> Observaciones del Cliente
                    </h4>
                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-sm text-amber-800 font-medium">
                      {solicitudDetalle.mensaje_cliente ? (
                        <p>{solicitudDetalle.mensaje_cliente}</p>
                      ) : (
                        <p className="italic opacity-70">
                          El cliente no especificó observaciones adicionales en el formulario.
                        </p>
                      )}
                    </div>
                  </div>

                </div>

                {/* Footer del Drawer - Botón PDF */}
                <div className="p-8 bg-white border-t border-slate-200 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
                  <div className="flex justify-between items-end mb-5">
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                      Costo Total Estimado
                    </span>
                    <span className="text-4xl font-display font-bold text-[#0D2137]">
                      ${parseFloat(solicitudDetalle.precio_estimado).toFixed(2)}
                    </span>
                  </div>
                  <button 
                    onClick={handleDescargarPDFAdmin} 
                    disabled={descargandoPDF} 
                    className="w-full py-4 bg-[#B7950B] text-white rounded-xl font-bold hover:bg-[#9A7D0A] shadow-lg transition-all flex items-center justify-center gap-2 text-lg disabled:opacity-50"
                  >
                    <Download size={22} /> 
                    {descargandoPDF ? 'Generando Documento de Alta Calidad...' : 'Descargar Proforma Formal (PDF)'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Componentes de la Tabla ──
function Th({ children }) { 
  return (
    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
      {children}
    </th>
  ); 
}

function PaginaBtn({ children, onClick, disabled }) { 
  return (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-600 hover:border-[#0D2137] hover:text-[#0D2137] disabled:opacity-30 transition-colors bg-white"
    >
      {children}
    </button>
  ); 
}

function SkeletonTabla({ filas }) { 
  return (
    <div className="divide-y divide-slate-50 animate-pulse">
      {Array.from({ length: filas }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-4">
          <div className="h-4 bg-slate-200 rounded w-28" />
          <div className="h-4 bg-slate-200 rounded flex-1" />
          <div className="h-4 bg-slate-200 rounded w-24" />
          <div className="h-4 bg-slate-200 rounded w-16" />
          <div className="h-4 bg-slate-200 rounded w-20" />
        </div>
      ))}
    </div>
  ); 
}