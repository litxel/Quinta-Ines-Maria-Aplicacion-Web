import { useState, useEffect } from 'react';
import { fetchPaquetes } from '../services/catalogo.service';
import TarjetaPaquete from '../components/catalogo/TarjetaPaquete';
import { useConfiguradorStore } from '../store/useConfiguradorStore';
import { X, CheckCircle2 } from 'lucide-react'; 

export default function Paquetes() {
  const [paquetes, setPaquetes] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  // ESTADO PARA EL MODAL DE DETALLES
  const [paqueteModal, setPaqueteModal] = useState(null);

  useEffect(() => {
    fetchPaquetes()
      .then(setPaquetes)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Bloquear el scroll del fondo cuando el modal está abierto
  useEffect(() => {
    if (paqueteModal) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
  }, [paqueteModal]);

  return (
    <main className="min-h-screen pt-24 pb-16 bg-[#FDF8F0] relative">
      
      {/* ── Hero de sección ── */}
      <section className="text-center px-4 mb-14">
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#0D2137] section-line">
          Nuestros Paquetes
        </h1>
        <p className="mt-6 text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Elige el paquete que mejor se ajuste a tu evento. Todos incluyen el uso
          de nuestras instalaciones con un mínimo de 100 invitados.
        </p>
      </section>

      {/* ── Estado de carga y Errores ── */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="spinner" />
        </div>
      )}

      {error && (
        <div className="max-w-md mx-auto px-4 text-center text-red-500 font-bold py-10">
          Error al cargar los paquetes: {error}
        </div>
      )}

      {/* ── Grid de paquetes ── */}
      {!loading && !error && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {paquetes.map((paquete) => (
            <TarjetaPaquete 
              key={paquete.paquete_id} 
              paquete={paquete} 
              onVerDetalles={(paq) => setPaqueteModal(paq)} 
            />
          ))}
        </section>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE DETALLES DEL PAQUETE (FASE 1) */}
      {/* ========================================================================= */}
      {paqueteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#0D2137]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()} 
          >
            {/* Cabecera del Modal */}
            <div 
              className="px-8 py-6 flex justify-between items-center relative"
              style={{ backgroundColor: paqueteModal.color_principal || '#B7950B' }}
            >
              <div className="absolute inset-0 bg-black/10" />
              <div className="relative z-10">
                <p className="text-white/80 text-xs uppercase tracking-widest font-bold mb-1">Detalle del Paquete</p>
                <h2 className="text-3xl font-display font-bold text-white">{paqueteModal.paquete_nombre}</h2>
              </div>
              <button 
                onClick={() => setPaqueteModal(null)}
                className="relative z-10 bg-black/20 hover:bg-black/40 text-white rounded-full p-2 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Cuerpo del Modal (Scrollable) */}
            <div className="p-8 overflow-y-auto flex-1 bg-slate-50">
              
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6 flex justify-between items-center">
                <div>
                  <p className="text-sm text-slate-500 font-medium">Inversión por invitado</p>
                  <p className="text-3xl font-bold text-[#0D2137]">${parseFloat(paqueteModal.precio_persona).toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500 font-medium">Capacidad requerida</p>
                  <p className="text-lg font-bold text-[#B7950B]">Desde {paqueteModal.minimo_invitados} pax</p>
                </div>
              </div>

              <h3 className="text-xl font-bold text-[#0D2137] mb-4 flex items-center gap-2">
                <span>✨</span> ¿Qué incluye este paquete?
              </h3>
              
              {paqueteModal.servicios.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-300">
                  <p className="text-slate-500">Aún no se han detallado los servicios de este paquete.</p>
                </div>
              ) : (
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  {paqueteModal.servicios.map((svc) => (
                    <li key={svc.servicio_id} className="flex items-start gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                      <CheckCircle2 className="shrink-0 mt-0.5" size={20} color={paqueteModal.color_principal || '#B7950B'} />
                      <div>
                      <span className="font-bold text-slate-800 text-sm block">{svc.servicio_nombre}</span>
                      {svc.servicio_descripcion && <span className="text-xs text-slate-500 mt-1 block">{svc.servicio_descripcion}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Pie del Modal */}
            <div className="p-6 bg-white border-t border-slate-100">
              <button
                onClick={() => {
                  useConfiguradorStore.getState().setPaquete(paqueteModal);
                  window.location.href = '/configurador';
                }}
                className="w-full py-4 rounded-xl font-bold text-white text-lg transition-transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2"
                style={{ backgroundColor: paqueteModal.color_principal || '#B7950B' }}
              >
                ¡Me encanta! Empezar a configurar 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}