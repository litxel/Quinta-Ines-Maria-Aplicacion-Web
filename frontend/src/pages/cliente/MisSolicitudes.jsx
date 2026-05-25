import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { getMisSolicitudes } from '../../services/solicitudes.service';
import BadgeEstado from '../../components/shared/BadgeEstado';

// Mensajes de estado
const MENSAJES_ESTADO = {
  PENDIENTE:   'Tu solicitud está en cola. Puedes cancelarla o descargar tu proforma.',
  EN_REVISION: 'Nuestro equipo está revisando tu solicitud.',
  CONFIRMADA:  '¡Genial! Tu evento ha sido confirmado. Espera contacto.',
  RECHAZADA:   'No pudimos procesar tu solicitud. Contáctanos.',
  CANCELADA:   'Esta solicitud fue cancelada.',
  COMPLETADA:  '¡Evento completado con éxito! Gracias por confiar en nosotros.',
};

// Diccionario para el PDF
const INCLUSIONES_PAQUETES = {
  'Bronce': ['Uso exclusivo de instalaciones (jardines, glorieta, puente, pileta)', 'Decoración básica de mesas y sillas', 'Vajilla y cristalería estándar', 'Servicio de cocina profesional', 'Audio y sonido básico', 'Parqueadero vigilado'],
  'Silver': ['Todo lo incluido en el Paquete Bronce', 'Decoración personalizada con flores naturales', 'Centros de mesa premium a elección', 'Spots fotográficos temáticos', 'Estación de bebidas calientes', 'Zona de juegos infantiles'],
  'Gold': ['Todo lo incluido en el Paquete Silver', 'Decoración de lujo con flores importadas', 'Iluminación ambiental profesional', 'Menú gourmet a 3 tiempos', 'Barra de bebidas sin alcohol ilimitada', 'Wedding/Event Planner'],
  'Corporativo': ['Proyector HD y pantalla gigante', 'Sistema de audio profesional y micrófonos', 'Dos (2) Coffee breaks completos', 'Decoración corporativa', 'Zona de networking'],
  'Alfombra Roja': ['Todo lo incluido en el Paquete Gold', 'Alfombra roja de bienvenida', 'Iluminación espectacular', 'Menú de alta cocina de autor', 'Fotógrafo y videógrafo profesional', 'Coordinador VIP']
};

export default function MisSolicitudes() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  
  // Estados para procesamientos
  const [cancelando, setCancelando] = useState(null);
  const [descargando, setDescargando] = useState(null);

  const cargar = () => {
    setLoading(true);
    getMisSolicitudes()
      .then(setSolicitudes)
      .catch((e) => setError(e.response?.data?.message ?? e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  // 🚀 FUNCIÓN: CANCELAR SOLICITUD
  const handleCancelar = async (id) => {
    if (!window.confirm('¿Estás totalmente seguro de cancelar esta cotización? Esta acción no se puede deshacer.')) return;
    setCancelando(id);
    try {
      await api.put(`/solicitudes/${id}/cancelar`);
      alert('Cotización cancelada exitosamente.');
      cargar(); // Recargamos para que asome cancelada
    } catch (e) {
      alert('Error al cancelar: ' + (e.response?.data?.message || e.message));
    } finally {
      setCancelando(null);
    }
  };

  // 🚀 FUNCIÓN: DESCARGAR SÚPER-PDF
  const handleDescargarPDF = async (solicitudId) => {
    setDescargando(solicitudId);
    try {
      const { data } = await api.get(`/solicitudes/${solicitudId}`);
      const sol = data.data;

      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const pW  = doc.internal.pageSize.getWidth();
      const NAVY = [13, 33, 55]; const GOLD = [183, 149, 11]; const SLATE = [100, 116, 139];

      // Header
      doc.setFillColor(...NAVY); doc.rect(0, 0, pW, 52, 'F');
      doc.setFillColor(...GOLD); doc.rect(0, 50, pW, 3, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(...GOLD); doc.text('QUINTA INÉS MARÍA', pW / 2, 20, { align: 'center' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(255, 255, 255); doc.text('BED  ·  CATERING  ·  EVENTOS  ·  CANTÓN CHAMBO', pW / 2, 28, { align: 'center' });
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...GOLD); doc.text(`COTIZACIÓN N.° ${sol.numero_cotizacion}`, 20, 42);
      
      const fechaE = sol.creado_en ? new Date(sol.creado_en).toLocaleDateString('es-EC') : new Date().toLocaleDateString('es-EC');
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(200, 200, 200); doc.text(`Fecha: ${fechaE}`, pW - 20, 42, { align: 'right' });

      // Datos Cliente
      let y = 63;
      doc.setFillColor(245, 240, 232); doc.roundedRect(14, y - 5, pW - 28, 28, 3, 3, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...NAVY); doc.text('DATOS DEL CLIENTE', 20, y + 1);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(30, 30, 30); doc.text(sol.cliente_nombre.toUpperCase(), 20, y + 8);
      doc.setFontSize(9); doc.setTextColor(...SLATE); doc.text(`Correo: ${sol.cliente_correo}`, 20, y + 14); doc.text(`Teléfono: ${sol.cliente_telefono || 'No especificado'}`, 20, y + 19);
      doc.setFillColor(...NAVY); doc.roundedRect(pW - 65, y, 50, 12, 3, 3, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(255, 255, 255); doc.text(sol.tipo_nombre || 'EVENTO', pW - 40, y + 8, { align: 'center' });

      y += 34;

      // Lista de beneficios
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...NAVY); doc.text(`LO QUE INCLUYE TU PAQUETE ${sol.paquete_nombre?.toUpperCase() || ''}:`, 14, y);
      doc.setFillColor(...GOLD); doc.rect(14, y + 2, 70, 1, 'F'); y += 8;
      
      const pKey = Object.keys(INCLUSIONES_PAQUETES).find(k => sol.paquete_nombre?.includes(k)) || 'Bronce';
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...SLATE);
      
      // 🚀 BUG FIX: Usamos el guion "-" en lugar del check "✓" para evitar errores de Encoding en jsPDF
      INCLUSIONES_PAQUETES[pKey].forEach(inc => { 
        doc.text(`- ${inc}`, 16, y); 
        y += 5; 
      });
      y += 5;

      // Tabla Desglose
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...NAVY); doc.text('RESUMEN DE SERVICIOS Y COSTOS', 14, y);
      doc.setFillColor(...GOLD); doc.rect(14, y + 2, 60, 1, 'F'); y += 7;

      const filas = [ [`Paquete: ${sol.paquete_nombre}`, `${sol.num_invitados} invitados`, `$${(sol.num_invitados * parseFloat(sol.precio_persona || 15)).toFixed(2)}`] ];
      if (sol.centro_mesa) filas.push([`Centro de mesa: ${sol.centro_mesa}`, 'Mesa asignada', '—']);
      if (sol.estilo_decoracion) filas.push([`Estilo: ${sol.estilo_decoracion}`, 'Decoración', '—']);
      
      if (sol.extras && sol.extras.length > 0) {
        sol.extras.forEach(e => filas.push([`Extra: ${e.nombre}`, `${e.cantidad} unid.`, `$${(e.cantidad * parseFloat(e.precio)).toFixed(2)}`]));
      }

      autoTable(doc, {
        startY: y, head: [['Descripción', 'Detalle', 'Subtotal']], body: filas, theme: 'grid',
        headStyles: { fillColor: NAVY, textColor: GOLD, fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 9, textColor: [40, 40, 40] },
        columnStyles: { 0: { cellWidth: 90 }, 1: { cellWidth: 65, halign: 'center' }, 2: { cellWidth: 35, halign: 'right', fontStyle: 'bold' } },
        margin: { left: 14, right: 14 }
      });
      y = doc.lastAutoTable.finalY + 8;

      // 🚀 BUG FIX: Colores seguros
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...NAVY); doc.text('COLORES ELEGIDOS:', 14, y);
      if (sol.color_primario) {
        doc.setFillColor(sol.color_primario); doc.roundedRect(48, y - 3, 8, 5, 1, 1, 'F');
        doc.setFillColor(sol.color_secundario || '#B7950B'); doc.roundedRect(58, y - 3, 8, 5, 1, 1, 'F');
      } else {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...SLATE);
        doc.text('No definidos por el cliente.', 48, y);
      }

      // Total
      const cajaH = 24;
      doc.setFillColor(...NAVY); doc.roundedRect(pW - 90, y - 6, 76, cajaH, 4, 4, 'F');
      doc.setFillColor(...GOLD); doc.roundedRect(pW - 90, y - 6, 76, 8, 4, 4, 'F'); doc.rect(pW - 90, y - 2, 76, 4, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...NAVY); doc.text('TOTAL ESTIMADO', pW - 52, y - 0.5, { align: 'center' });
      doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(...GOLD); doc.text(`$${parseFloat(sol.precio_estimado).toFixed(2)}`, pW - 52, y + 12, { align: 'center' });

      // Footer
      const pageH = doc.internal.pageSize.getHeight();
      doc.setFillColor(...NAVY); doc.rect(0, pageH - 20, pW, 20, 'F'); doc.setFillColor(...GOLD); doc.rect(0, pageH - 20, pW, 2, 'F');
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(200, 200, 200); doc.text('eventplanner.quintainesmaria.ec', pW / 2, pageH - 12, { align: 'center' });
      
      doc.save(`Cotizacion-${sol.numero_cotizacion}.pdf`);
    } catch (error) {
      alert('Error al generar PDF: ' + error.message);
    } finally {
      setDescargando(null);
    }
  };

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen bg-[#F5F0E8] pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="h-8 w-56 bg-slate-200 rounded-lg animate-pulse mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-32 bg-white rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F0E8] pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4">

        {/* ── Cabecera ─────────────────────────────────────────────────────── */}
        <div className="mb-7">
          <h1 className="font-display text-3xl font-bold text-[#0D2137]">
            Mis Solicitudes
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Aquí puedes ver el estado de todos tus eventos cotizados.
          </p>
        </div>

        {/* ── Error ────────────────────────────────────────────────────────── */}
        {error && (
          <div role="alert" className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            ⚠ {error}
          </div>
        )}

        {/* ── Sin solicitudes ───────────────────────────────────────────────── */}
        {!error && solicitudes.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
            <p className="text-5xl mb-4">📋</p>
            <h2 className="font-display text-xl font-bold text-[#0D2137] mb-2">
              Aún no tienes solicitudes
            </h2>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              Usa el configurador para personalizar tu evento y enviar una
              solicitud de cotización. ¡Es gratis!
            </p>
            <Link
              to="/configurador"
              className="inline-block px-7 py-3 bg-[#0D2137] text-white font-bold rounded-xl hover:bg-[#1A6BAC] transition-colors text-sm"
            >
              Ir al configurador →
            </Link>
          </div>
        )}

        {/* ── Lista de solicitudes ──────────────────────────────────────────── */}
        <div className="space-y-4">
          {solicitudes.map((s) => (
            <article
              key={s.solicitud_id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
            >
              {/* Barra superior de color según estado */}
              <BarraEstado color={s.estado_color} />

              <div className="p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">

                  {/* Información principal */}
                  <div className="min-w-0 flex-1">
                    {/* Número de cotización */}
                    <p className="font-mono text-xs text-[#B7950B] font-bold mb-1">
                      {s.numero_cotizacion}
                    </p>

                    {/* Paquete + evento */}
                    <h2 className="font-display font-bold text-[#0D2137] text-lg leading-tight">
                      {s.paquete_nombre ?? 'Paquete no especificado'}
                    </h2>
                    <p className="text-slate-400 text-sm mt-0.5">
                      {s.tipo_nombre ?? '—'} · {s.num_invitados} invitados
                    </p>

                    {/* Mensaje del estado */}
                    <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                      {MENSAJES_ESTADO[s.estado_codigo] ?? ''}
                    </p>
                  </div>

                  {/* Badge + precio */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <BadgeEstado
                      estadoColor={s.estado_color}
                      estadoNombre={s.estado_nombre}
                    />
                    <p className="font-bold text-[#0D2137] text-xl">
                      ${parseFloat(s.precio_estimado).toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-400">Total estimado</p>
                  </div>
                </div>

                {/* ── Línea de tiempo del estado (TUS COMPONENTES INTACTOS) ── */}
                <TimelineEstado estadoCodigo={s.estado_codigo} />

                {/* ── Footer: fechas y BOTONES DE ACCIÓN ────────────────────── */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
                  <div className="flex flex-col gap-1">
                    <span>
                      Solicitada el{' '}
                      <strong className="text-slate-600">
                        {new Date(s.creado_en).toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </strong>
                    </span>
                  </div>

                  {/* 🚀 BOTONES CLIENTE */}
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleDescargarPDF(s.solicitud_id)}
                      disabled={descargando === s.solicitud_id}
                      className="px-4 py-2 bg-blue-50 text-[#1A6BAC] border border-blue-200 font-bold rounded-lg hover:bg-[#1A6BAC] hover:text-white transition-all disabled:opacity-50"
                    >
                      {descargando === s.solicitud_id ? 'Generando PDF...' : '📄 Descargar Proforma'}
                    </button>

                    {s.estado_codigo === 'PENDIENTE' && (
                      <button 
                        onClick={() => handleCancelar(s.solicitud_id)}
                        disabled={cancelando === s.solicitud_id}
                        className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 font-bold rounded-lg hover:bg-red-600 hover:text-white transition-all disabled:opacity-50"
                      >
                        {cancelando === s.solicitud_id ? 'Cancelando...' : '✖ Cancelar'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Observaciones del admin (si existen) */}
                {s.observaciones && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                    <p className="text-xs font-semibold text-blue-700 mb-1">
                      📝 Mensaje de nuestro equipo:
                    </p>
                    <p className="text-xs text-blue-600 leading-relaxed">
                      {s.observaciones}
                    </p>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>

        {/* CTA para crear nueva solicitud */}
        {solicitudes.length > 0 && (
          <div className="mt-8 text-center">
            <Link
              to="/configurador"
              className="inline-block px-7 py-3 border-2 border-[#0D2137] text-[#0D2137] font-bold rounded-xl hover:bg-[#0D2137] hover:text-white transition-colors text-sm"
            >
              + Crear nueva solicitud
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

// ── Sub-componentes (TUS COMPONENTES INTACTOS) ────────────────────────────────

function BarraEstado({ color }) {
  const colores = {
    amber:  'bg-amber-400',
    blue:   'bg-blue-500',
    green:  'bg-green-500',
    red:    'bg-red-500',
    slate:  'bg-slate-400',
    purple: 'bg-purple-500',
  };
  return <div className={`h-1 w-full ${colores[color] ?? 'bg-slate-300'}`} />;
}

const PASOS_TIMELINE = ['PENDIENTE', 'EN_REVISION', 'CONFIRMADA', 'COMPLETADA'];

function TimelineEstado({ estadoCodigo }) {
  if (['CANCELADA', 'RECHAZADA'].includes(estadoCodigo)) {
    return (
      <div className="mt-4 flex items-center gap-2">
        <span className="text-red-500 text-xs font-medium">
          {estadoCodigo === 'RECHAZADA' ? '❌ Solicitud rechazada' : '⊘ Solicitud cancelada'}
        </span>
      </div>
    );
  }

  const indiceActual = PASOS_TIMELINE.indexOf(estadoCodigo);

  return (
    <div className="mt-4 flex items-center gap-0">
      {PASOS_TIMELINE.map((paso, i) => {
        const completado = i <= indiceActual;
        const esActual   = i === indiceActual;
        const labels     = ['Pendiente', 'En revisión', 'Confirmada', 'Completada'];

        return (
          <div key={paso} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                esActual
                  ? 'bg-[#0D2137] border-[#0D2137] text-white scale-110'
                  : completado
                  ? 'bg-[#B7950B] border-[#B7950B] text-white'
                  : 'bg-white border-slate-300 text-slate-300'
              }`}>
                {completado ? '✓' : i + 1}
              </div>
              <span className={`text-[9px] mt-1 text-center whitespace-nowrap ${
                esActual ? 'text-[#0D2137] font-bold' : completado ? 'text-[#B7950B]' : 'text-slate-300'
              }`}>
                {labels[i]}
              </span>
            </div>
            {i < PASOS_TIMELINE.length - 1 && (
              <div className={`flex-1 h-0.5 mb-4 transition-colors ${
                i < indiceActual ? 'bg-[#B7950B]' : 'bg-slate-200'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}