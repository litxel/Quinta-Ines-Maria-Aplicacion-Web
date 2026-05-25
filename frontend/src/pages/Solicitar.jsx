import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore'; 
import { useConfiguradorStore } from '../store/useConfiguradorStore';
import api from '../services/api';
import { crearSolicitudRequest } from '../services/solicitudes.service';

const INCLUSIONES_PAQUETES = {
  'Bronce': ['Uso exclusivo de instalaciones (jardines, glorieta, puente, pileta)', 'Decoración básica de mesas y sillas', 'Vajilla y cristalería estándar', 'Servicio de cocina profesional', 'Audio y sonido básico', 'Parqueadero vigilado'],
  'Silver': ['Todo lo incluido en el Paquete Bronce', 'Decoración personalizada con flores naturales', 'Centros de mesa premium a elección', 'Spots fotográficos temáticos', 'Estación de bebidas calientes', 'Zona de juegos infantiles'],
  'Gold': ['Todo lo incluido en el Paquete Silver', 'Decoración de lujo con flores importadas', 'Iluminación ambiental profesional', 'Menú gourmet a 3 tiempos', 'Barra de bebidas sin alcohol ilimitada', 'Wedding/Event Planner'],
  'Corporativo': ['Proyector HD y pantalla gigante', 'Sistema de audio profesional y micrófonos', 'Dos (2) Coffee breaks completos', 'Decoración corporativa', 'Zona de networking'],
  'Alfombra Roja': ['Todo lo incluido en el Paquete Gold', 'Alfombra roja de bienvenida', 'Iluminación espectacular', 'Menú de alta cocina de autor', 'Fotógrafo y videógrafo profesional', 'Coordinador VIP']
};

const generarPDF = async (datos, soloDevolverBase64 = false) => {
  const { jsPDF }      = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pW  = doc.internal.pageSize.getWidth();

  const NAVY   = [13,  33, 55];   
  const GOLD   = [183, 149, 11];  
  const CREAM  = [245, 240, 232]; 
  const SLATE  = [100, 116, 139]; 

  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pW, 52, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(0, 50, pW, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(183, 149, 11);
  doc.text('QUINTA INÉS MARÍA', pW / 2, 20, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.setCharSpace(1.5);
  doc.text('BED  ·  CATERING  ·  EVENTOS  ·  CANTÓN CHAMBO', pW / 2, 28, { align: 'center' });
  doc.setCharSpace(0);

  doc.setDrawColor(255, 255, 255, 0.2);
  doc.setLineWidth(0.3);
  doc.line(20, 32, pW - 20, 32);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(183, 149, 11);
  doc.text(`PROFORMA DE SERVICIOS N.° ${datos.numero}`, 20, 42);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(200, 200, 200);
  doc.text(`Fecha de emisión: ${datos.fecha}`, pW - 20, 42, { align: 'right' });
  doc.text(`Válida por 30 días hábiles`, pW - 20, 47, { align: 'right' });

  let y = 63;
  doc.setFillColor(...CREAM);
  doc.roundedRect(14, y - 5, pW - 28, 28, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...NAVY);
  doc.text('DATOS DEL CLIENTE', 20, y + 1);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text(datos.cliente.nombre.toUpperCase(), 20, y + 8);

  doc.setFontSize(9);
  doc.setTextColor(...SLATE);
  doc.text(`Correo: ${datos.cliente.correo}`, 20, y + 14);
  if (datos.cliente.telefono) doc.text(`Teléfono: ${datos.cliente.telefono}`, 20, y + 19);

  doc.setFillColor(...NAVY);
  doc.roundedRect(pW - 75, y, 60, 12, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(datos.tipoEvento.toUpperCase(), pW - 45, y + 8, { align: 'center' });

  y += 34;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text(`LO QUE INCLUYE TU PAQUETE ${datos.paquete.nombre?.toUpperCase() || ''}:`, 14, y);
  
  doc.setFillColor(...GOLD);
  doc.rect(14, y + 2, 70, 1, 'F');
  y += 8;

  const pKey = Object.keys(INCLUSIONES_PAQUETES).find(k => datos.paquete.nombre?.includes(k)) || 'Bronce';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...SLATE);
  
  INCLUSIONES_PAQUETES[pKey].forEach(inc => {
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
    ['Paquete Contratado: ' + datos.paquete.nombre, `${datos.invitados} personas × $${datos.paquete.precioPorPersona}`, `$${datos.subtotalPaquete.toFixed(2)}`],
  ];

  if (datos.centroMesa && datos.subtotalMesas > 0) {
    filas.push([`Centro de mesa: ${datos.centroMesa}`, `${datos.numMesas} mesas × $${datos.costoPorMesa}`, `$${datos.subtotalMesas.toFixed(2)}`]);
  }

  if (datos.estiloDecoracion) {
    filas.push([`Estilo de decoración: ${datos.estiloDecoracion}`, 'Incluido en paquete', '—']);
  }

  datos.servicios.forEach((s) => {
    filas.push([s.nombre, `${s.cantidad} unidad(es) × $${parseFloat(s.precio_snapshot).toFixed(2)}`, `$${(s.cantidad * parseFloat(s.precio_snapshot)).toFixed(2)}`]);
  });

  autoTable(doc, {
    startY: y,
    head:   [['Descripción del Servicio', 'Detalle', 'Subtotal']],
    body:   filas,
    theme:  'grid',
    headStyles: { fillColor: NAVY, textColor: GOLD, fontStyle: 'bold', fontSize: 9, halign: 'left' },
    bodyStyles: { fontSize: 9, textColor: [40, 40, 40] },
    alternateRowStyles: { fillColor: [248, 245, 240] },
    columnStyles: { 0: { cellWidth: 90 }, 1: { cellWidth: 65, halign: 'center' }, 2: { cellWidth: 35, halign: 'right', fontStyle: 'bold' } },
    margin: { left: 14, right: 14 },
    styles: { lineColor: [220, 214, 200], lineWidth: 0.3 },
  });

  y = doc.lastAutoTable.finalY + 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...NAVY);
  doc.text('COLORES ELEGIDOS:', 14, y);
  
  if (datos.colorPrimario) {
    doc.setFillColor(datos.colorPrimario);
    doc.roundedRect(48, y - 3, 8, 5, 1, 1, 'F');
    doc.setFillColor(datos.colorSecundario || '#B7950B');
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
  doc.setTextColor(183, 149, 11);
  doc.text(`$${datos.total.toFixed(2)}`, pW - 52, y + 12, { align: 'center' });

  y += cajaH + 12;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...NAVY);
  doc.text('TÉRMINOS Y CONDICIONES DE RESERVA', 14, y);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...SLATE);
  doc.text('1. Esta cotización tiene una validez de 30 días hábiles desde su fecha de emisión.', 14, y + 6);
  doc.text('2. Para confirmar y separar la fecha del evento, se requiere el abono del 30% del valor total estimado.', 14, y + 11);
  doc.text('3. El valor restante (70%) deberá ser cancelado en su totalidad hasta 7 días antes del evento.', 14, y + 16);
  doc.text('4. En caso de cancelación por parte del cliente, el abono inicial no es reembolsable.', 14, y + 21);

  y += 38;

  doc.setDrawColor(...SLATE);
  doc.setLineWidth(0.4);
  doc.line(30, y, 80, y);
  doc.line(pW - 80, y, pW - 30, y);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...NAVY);
  doc.text('Firma del Cliente', 55, y + 5, { align: 'center' });
  doc.text('Ing. Yessenia Barreno', pW - 55, y + 5, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...SLATE);
  doc.text(datos.cliente.nombre, 55, y + 9, { align: 'center' });
  doc.text('Quinta Inés María', pW - 55, y + 9, { align: 'center' });

  const pageH = doc.internal.pageSize.getHeight();
  doc.setFillColor(...NAVY);
  doc.rect(0, pageH - 20, pW, 20, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(0, pageH - 20, pW, 2, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(200, 200, 200);
  doc.text('Cantón Chambo, Chimborazo, Ecuador  ·  eventplanner.quintainesmaria.ec', pW / 2, pageH - 12, { align: 'center' });

  doc.setTextColor(183, 149, 11);
  doc.setFont('helvetica', 'bold');
  doc.text('© 2026 Quinta Inés María — Todos los derechos reservados', pW / 2, pageH - 6, { align: 'center' });

  if (soloDevolverBase64) {
    return doc.output('datauristring');
  } else {
    doc.save(`Proforma-QIM-${datos.numero}.pdf`);
  }
};

export default function Solicitar() {
  const navigate = useNavigate();
  const { isAuthenticated, user, setRedirectAfterLogin } = useAuthStore();
  const store = useConfiguradorStore();

  const [modalVisible, setModalVisible] = useState(!isAuthenticated);
  const [loading,      setLoading]      = useState(false);
  const [enviado,      setEnviado]      = useState(false);
  const [numSolicitud, setNumSolicitud] = useState('');
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [error,        setError]        = useState('');

  const handleIrLogin = () => {
    setRedirectAfterLogin('/solicitar');
    navigate('/login');
  };

  const generarNumero = () => {
    const rand = Math.floor(100000 + Math.random() * 900000);
    return `QIM-${new Date().getFullYear()}-${rand}`;
  };

  const handleEnviar = async () => {
    if (!store.paquete_id) { setError('Debes completar el configurador antes de solicitar.'); return; }
    
    setLoading(true);
    setError('');
    
    try {
      const numero = generarNumero();

      const datosCotizacion = {
        numero:             numero,
        fecha:              new Date().toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' }),
        cliente: {
          nombre:   user?.nombre_completo ?? 'Cliente',
          correo:   user?.correo          ?? '',
          telefono: user?.telefono        ?? '',
        },
        tipoEvento:         store.tipoEventoSeleccionado?.tipo_nombre      ?? 'Evento',
        paquete: {
          nombre:           store.paqueteSeleccionado?.paquete_nombre      ?? 'Paquete',
          precioPorPersona: parseFloat(store.paqueteSeleccionado?.precio_persona ?? 0).toFixed(2),
        },
        invitados:          store.num_invitados,
        numMesas:           store.num_mesas,
        numMeseros:         store.num_meseros,
        centroMesa:         store.centroMesaSeleccionado?.nombre           ?? '',
        costoPorMesa:       parseFloat(store.centroMesaSeleccionado?.costo_por_mesa ?? 0).toFixed(2),
        estiloDecoracion:   store.estiloSeleccionado?.nombre              ?? '',
        colorPrimario:      store.color_primario,
        colorSecundario:    store.color_secundario,
        servicios:          store.servicios,
        subtotalPaquete:    store.precioServidor?.subtotal_paquete ?? (parseFloat(store.paqueteSeleccionado?.precio_persona ?? 0) * store.num_invitados),
        subtotalMesas:      store.precioServidor?.subtotal_mesas   ?? 0,
        total:              store.precioServidor?.total             ?? store.precio_estimado,
      };

      const pdfBaseURI = await generarPDF(datosCotizacion, true);
      const pdfBase64Limpio = pdfBaseURI.includes('base64,') ? pdfBaseURI.split('base64,')[1] : pdfBaseURI;

      // 🚀 SOLUCIÓN DEFINITIVA: 
      // Quitamos eqim_cotizacion_id y sesion_id para que la BD NO rompa por llave foránea.
      // A cambio, guardamos los colores y extras en observaciones para que el Admin los lea.
      const coloresTexto = store.color_primario ? `Colores: ${store.color_primario}, ${store.color_secundario}` : 'Sin colores';
      
      const payloadBD = {
        numero_cotizacion: numero,
        tipo_evento_id:    store.tipoEventoSeleccionado?.tipo_id,
        paquete_id:        store.paquete_id,
        num_invitados:     store.num_invitados,
        precio_estimado:   datosCotizacion.total,
        telefono_contacto: user?.telefono,
        observaciones:     `Cotización finalizada. | ${coloresTexto} | Extras seleccionados: ${store.servicios.length}`,
      };

      await crearSolicitudRequest(payloadBD); 

      const endpoint = api.defaults.baseURL?.endsWith('/api') 
                       ? '/configurador/enviar-solicitud' 
                       : '/api/configurador/enviar-solicitud';

      await api.post(endpoint, {
        correo_cliente: user.correo,
        nombre_cliente: user.nombre_completo,
        total_estimado: datosCotizacion.total,
        pdf_base64: pdfBase64Limpio
      });

      setNumSolicitud(numero);
      setEnviado(true);
      
    } catch (e) {
      setError(`Error de conexión con el servidor. Intenta nuevamente.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDescargarPDF = async () => {
    setGenerandoPDF(true);
    try {
      await generarPDF({
        numero:             numSolicitud || generarNumero(),
        fecha:              new Date().toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' }),
        cliente: {
          nombre:   user?.nombre_completo ?? 'Cliente',
          correo:   user?.correo          ?? '',
          telefono: user?.telefono        ?? '',
        },
        tipoEvento:         store.tipoEventoSeleccionado?.tipo_nombre      ?? 'Evento',
        paquete: {
          nombre:           store.paqueteSeleccionado?.paquete_nombre      ?? 'Paquete',
          precioPorPersona: parseFloat(store.paqueteSeleccionado?.precio_persona ?? 0).toFixed(2),
        },
        invitados:          store.num_invitados,
        numMesas:           store.num_mesas,
        numMeseros:         store.num_meseros,
        centroMesa:         store.centroMesaSeleccionado?.nombre           ?? '',
        costoPorMesa:       parseFloat(store.centroMesaSeleccionado?.costo_por_mesa ?? 0).toFixed(2),
        estiloDecoracion:   store.estiloSeleccionado?.nombre              ?? '',
        colorPrimario:      store.color_primario,
        colorSecundario:    store.color_secundario,
        servicios:          store.servicios,
        subtotalPaquete:    store.precioServidor?.subtotal_paquete ?? (parseFloat(store.paqueteSeleccionado?.precio_persona ?? 0) * store.num_invitados),
        subtotalMesas:      store.precioServidor?.subtotal_mesas   ?? 0,
        total:              store.precioServidor?.total             ?? store.precio_estimado,
      });
    } catch (e) {
      setError('Error al generar el PDF. Intenta de nuevo.');
    } finally {
      setGenerandoPDF(false);
    }
  };

  if (modalVisible && !isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#F5F0E8] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-[#0D2137] via-[#1A6BAC] to-[#B7950B]" />

          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-[#0D2137]/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <span className="text-3xl">🔐</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-[#0D2137] mb-2">
              Inicia sesión para continuar
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              Tu configuración de evento está guardada.<br />
              Necesitas una cuenta para enviar la solicitud y recibir tu cotización formal.
            </p>

            {store.paqueteSeleccionado && (
              <div className="bg-[#F5F0E8] rounded-xl p-4 mb-6 text-left">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tu configuración</p>
                <div className="space-y-1">
                  <InfoRow label="Paquete"     valor={store.paqueteSeleccionado.paquete_nombre} />
                  <InfoRow label="Invitados"   valor={`${store.num_invitados} personas`} />
                  <InfoRow label="Total est."  valor={`$${store.precio_estimado.toFixed(2)}`} dorado />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={handleIrLogin}
                className="w-full py-3.5 bg-[#0D2137] text-white font-bold rounded-xl hover:bg-[#1A6BAC] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A6BAC] focus:ring-offset-2"
              >
                Iniciar sesión
              </button>
              <Link
                to="/register"
                className="w-full py-3.5 border-2 border-[#0D2137] text-[#0D2137] font-bold rounded-xl hover:bg-[#0D2137]/5 transition-colors text-center text-sm"
              >
                Crear cuenta gratis
              </Link>
              <button
                onClick={() => navigate('/configurador')}
                className="text-xs text-slate-400 hover:text-slate-600 underline"
              >
                ← Volver al configurador
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (enviado) {
    return (
      <main className="min-h-screen bg-[#F5F0E8] flex items-center justify-center px-4">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-[#0D2137] via-[#1A6BAC] to-[#B7950B]" />

          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <span className="text-5xl">🎊</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-[#0D2137] mb-2">
              ¡Solicitud enviada!
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-4">
              Hola, <strong>{user?.nombre_completo}</strong>. Hemos recibido tu solicitud y te
              contactaremos en las próximas <strong>24 horas hábiles</strong>.
            </p>

            <div className="inline-block bg-[#0D2137] rounded-xl px-6 py-3 mb-6">
              <p className="text-white/60 text-xs uppercase tracking-wider">N.° de cotización</p>
              <p className="text-[#B7950B] font-bold text-lg font-mono">{numSolicitud}</p>
            </div>

            <div className="bg-[#F5F0E8] rounded-xl p-4 mb-6 text-left">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Resumen</p>
              <div className="space-y-1.5">
                <InfoRow label="Paquete"    valor={store.paqueteSeleccionado?.paquete_nombre ?? '—'} />
                <InfoRow label="Invitados"  valor={`${store.num_invitados} personas`} />
                <InfoRow label="Mesas"      valor={`${store.num_mesas} mesas · ${store.num_meseros} meseros`} />
                {store.estiloSeleccionado && (
                  <InfoRow label="Decoración" valor={store.estiloSeleccionado.nombre} />
                )}
                <div className="border-t border-slate-200 pt-2 mt-2">
                  <InfoRow label="Total estimado" valor={`$${(store.precioServidor?.total ?? store.precio_estimado).toFixed(2)}`} dorado />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleDescargarPDF}
                disabled={generandoPDF}
                className="w-full py-3.5 bg-[#B7950B] text-white font-bold rounded-xl hover:bg-[#9A7D0A] transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#B7950B] focus:ring-offset-2 flex items-center justify-center gap-2"
              >
                <span>{generandoPDF ? '⏳' : '📄'}</span>
                {generandoPDF ? 'Generando PDF…' : 'Descargar cotización PDF'}
              </button>
              <Link
                to="/paquetes"
                className="text-sm text-[#1A6BAC] hover:underline font-medium"
              >
                Ver otros paquetes
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F0E8] pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4">

        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold text-[#0D2137]">Enviar Solicitud</h1>
          <p className="text-slate-500 text-sm mt-2">
            Revisa los detalles y envía tu solicitud de cotización formal.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-5">
          <div className="h-1 bg-gradient-to-r from-[#0D2137] via-[#1A6BAC] to-[#B7950B]" />

          <div className="p-6">
            <h2 className="font-display text-xl font-semibold text-[#0D2137] mb-4">
              Resumen de tu evento
            </h2>

            <div className="space-y-2 text-sm">
              <InfoRow label="Cliente"        valor={user?.nombre_completo ?? '—'} />
              <InfoRow label="Tipo de evento" valor={store.tipoEventoSeleccionado?.tipo_nombre ?? '—'} />
              <InfoRow label="Paquete"        valor={store.paqueteSeleccionado?.paquete_nombre ?? '—'} />
              <InfoRow label="Invitados"      valor={`${store.num_invitados} personas`} />
              <InfoRow label="Mesas"          valor={`${store.num_mesas} mesas · ${store.num_meseros} meseros`} />
              {store.estiloSeleccionado   && <InfoRow label="Decoración"   valor={store.estiloSeleccionado.nombre} />}
              {store.centroMesaSeleccionado && <InfoRow label="Centro mesa" valor={store.centroMesaSeleccionado.nombre} />}

              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Colores</span>
                <div className="flex gap-2 items-center">
                  <ColorDot hex={store.color_primario}   />
                  <ColorDot hex={store.color_secundario} />
                </div>
              </div>

              {store.servicios.length > 0 && (
                <div className="py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Extras</span>
                  <div className="mt-1 space-y-1">
                    {store.servicios.map((s) => (
                      <div key={s.adicional_id} className="flex justify-between text-xs text-slate-600">
                        <span>{s.nombre} ×{s.cantidad}</span>
                        <span>${(s.precio_snapshot * s.cantidad).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-3">
                <span className="font-bold text-[#0D2137]">TOTAL ESTIMADO</span>
                <span className="text-2xl font-bold text-[#B7950B]">
                  ${(store.precioServidor?.total ?? store.precio_estimado).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
          <strong>⚠ Nota:</strong> El precio es estimado. La cotización definitiva se enviará
          a <strong>{user?.correo}</strong> tras la revisión de nuestro equipo.
        </div>

        {error && (
          <div role="alert" className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            ⚠ {error}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={handleEnviar}
            disabled={loading || !store.paquete_id}
            className="w-full py-4 bg-[#0D2137] text-white font-bold text-base rounded-xl hover:bg-[#1A6BAC] transition-colors disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-[#1A6BAC] focus:ring-offset-2"
          >
            {loading ? 'Enviando solicitud…' : '✉ Enviar solicitud de cotización'}
          </button>

          <button
            onClick={handleDescargarPDF}
            disabled={generandoPDF || !store.paquete_id}
            className="w-full py-3.5 border-2 border-[#B7950B] text-[#B7950B] font-bold rounded-xl hover:bg-[#B7950B]/5 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <span>{generandoPDF ? '⏳' : '📄'}</span>
            {generandoPDF ? 'Generando PDF…' : 'Descargar cotización PDF (sin enviar)'}
          </button>

          <button
            onClick={() => navigate('/configurador')}
            className="text-sm text-slate-400 hover:text-slate-600 underline text-center"
          >
            ← Volver al configurador
          </button>
        </div>
      </div>
    </main>
  );
}

function InfoRow({ label, valor, dorado = false }) {
  return (
    <div className="flex justify-between items-start py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-slate-500 font-medium text-sm">{label}</span>
      <span className={`font-semibold text-sm text-right max-w-[55%] ${dorado ? 'text-[#B7950B] text-base' : 'text-[#0D2137]'}`}>
        {valor}
      </span>
    </div>
  );
}

function ColorDot({ hex }) {
  return (
    <span
      className="w-6 h-6 rounded-full border-2 border-white shadow"
      style={{ backgroundColor: hex || '#eeeeee' }}
      title={hex}
      aria-label={`Color ${hex}`}
    />
  );
}