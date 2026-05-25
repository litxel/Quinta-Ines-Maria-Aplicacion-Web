import { useNavigate } from 'react-router-dom';
import { useConfiguradorStore } from '../../store/useConfiguradorStore';

export default function TarjetaPaquete({ paquete, onVerDetalles }) {
  const navigate          = useNavigate();
  const setPaqueteStore   = useConfiguradorStore((s) => s.setPaquete);

  const {
    paquete_nombre,
    descripcion,
    precio_persona,
    minimo_invitados,
    color_principal,
    destacado,
    servicios = [],
  } = paquete;

  const precio = parseFloat(precio_persona);

  const handleSeleccionar = () => {
    setPaqueteStore(paquete);
    navigate('/configurador');
  };

  // Solo mostramos los primeros 4 servicios en la tarjeta para no saturar
  const serviciosPreview = servicios.slice(0, 4);

  return (
    <article
      className={`relative bg-white rounded-3xl overflow-hidden card-shadow card-shadow-hover flex flex-col border border-slate-100 ${
        destacado ? 'ring-2 ring-offset-2' : ''
      }`}
      style={destacado ? { '--tw-ring-color': color_principal } : {}}
    >
      {/* ── Encabezado ── */}
      <div className="px-6 py-8 text-center relative overflow-hidden" style={{ backgroundColor: color_principal }}>
        {/* Un brillo sutil de fondo */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-50" />
        
        {destacado && (
          <span className="relative z-10 inline-block mb-3 px-4 py-1 bg-white/25 text-white text-xs font-bold rounded-full uppercase tracking-wider backdrop-blur-sm border border-white/20">
            🌟 Más popular
          </span>
        )}
        <h2 className="relative z-10 font-display text-3xl font-bold text-white mb-2">
          {paquete_nombre}
        </h2>
        <p className="relative z-10 text-white/90 text-sm leading-relaxed min-h-[2.5rem]">
          {descripcion}
        </p>

        {/* Precio */}
        <div className="relative z-10 mt-6 bg-black/10 mx-4 py-3 rounded-2xl backdrop-blur-sm border border-black/5">
          <span className="text-4xl font-bold text-white">${precio.toFixed(2)}</span>
          <span className="text-white/80 text-sm ml-1">/ persona</span>
          <p className="text-white/60 text-[10px] mt-1 uppercase tracking-wider font-semibold">
            Mínimo {minimo_invitados} invitados
          </p>
        </div>
      </div>

      {/* ── Lista de servicios (Preview) ── */}
      <div className="flex-1 px-8 py-6">
        {servicios.length === 0 ? (
          <p className="text-sm text-slate-400 italic text-center py-4">Servicios por definir...</p>
        ) : (
          <ul className="space-y-3 mb-6">
            {serviciosPreview.map((svc) => (
              <li key={svc.servicio_id} className="flex items-start gap-3 text-sm text-slate-700 font-medium">
                <span className="mt-0.5 shrink-0" style={{ color: color_principal }}>✅</span>
                <span className="leading-snug">{svc.servicio_nombre}</span>
              </li>
            ))}
          </ul>
        )}

        {/* ── BOTÓN NUEVO: VER QUÉ INCLUYE ── */}
        <button 
          onClick={() => onVerDetalles(paquete)}
          className="w-full py-2.5 text-sm font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 hover:text-[#0D2137] rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-200"
        >
          <span>👁️</span> Ver todo lo que incluye
        </button>
      </div>

      {/* ── CTA Principal ── */}
      <div className="px-6 pb-6 mt-auto">
        <button
          onClick={handleSeleccionar}
          className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all hover:scale-[1.02] shadow-lg focus:outline-none"
          style={{ backgroundColor: color_principal, boxShadow: `0 4px 14px ${color_principal}40` }}
        >
          Seleccionar y configurar evento
        </button>
      </div>
    </article>
  );
}