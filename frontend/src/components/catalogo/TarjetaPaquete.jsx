import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Eye, ArrowRight, Star } from 'lucide-react';
import { useConfiguradorStore } from '../../store/useConfiguradorStore';

export default function TarjetaPaquete({ paquete, onVerDetalles }) {
  const navigate        = useNavigate();
  const setPaqueteStore = useConfiguradorStore((s) => s.setPaquete);

  const {
    paquete_nombre,
    descripcion,
    precio_persona,
    minimo_invitados,
    color_principal,
    destacado,
    servicios = [],
  } = paquete;

  const precio          = parseFloat(precio_persona);
  const serviciosPreview = servicios.slice(0, 4);

  const handleSeleccionar = () => {
    setPaqueteStore(paquete);
    navigate('/configurador');
  };

  return (
    <article
      className={`relative bg-white dark:bg-[#0C1829] rounded-3xl overflow-hidden flex flex-col border transition-all duration-300 group
        ${destacado
          ? 'border-transparent shadow-2xl shadow-black/12 dark:shadow-black/40 scale-[1.02]'
          : 'border-slate-100 dark:border-white/8 card-shadow card-shadow-hover'
        }`}
      style={destacado ? { boxShadow: `0 20px 60px ${color_principal}28, 0 0 0 2px ${color_principal}` } : {}}
    >
      {/* ── Encabezado con color del paquete ── */}
      <div className="relative px-6 py-9 text-center overflow-hidden" style={{ backgroundColor: color_principal }}>
        {/* Shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/22 via-transparent to-black/15" />

        {/* Badge "Más popular" */}
        {destacado && (
          <div className="relative z-10 mb-4 flex justify-center">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white/22 text-white text-xs font-bold rounded-full uppercase tracking-wider backdrop-blur-sm border border-white/25 shadow-lg">
              <Star size={11} fill="white" strokeWidth={0} />
              Más popular
            </span>
          </div>
        )}

        <h2 className="relative z-10 font-display text-4xl font-bold text-white mb-2 tracking-wide leading-tight">
          {paquete_nombre}
        </h2>
        <p className="relative z-10 text-white/88 text-sm leading-relaxed min-h-[2.5rem] font-medium">
          {descripcion}
        </p>

        {/* Precio */}
        <div className="relative z-10 mt-7 bg-black/14 mx-6 py-4 rounded-2xl backdrop-blur-sm border border-black/8">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-white/70 text-sm font-semibold">$</span>
            <span className="text-5xl font-bold text-white tracking-tight">{precio.toFixed(2)}</span>
          </div>
          <p className="text-white/65 text-xs mt-1.5 font-semibold uppercase tracking-widest">
            por persona · mín. {minimo_invitados}
          </p>
        </div>
      </div>

      {/* ── Lista de servicios ── */}
      <div className="flex-1 px-7 pt-7 pb-5">
        {servicios.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 italic text-center py-4">Servicios por definir…</p>
        ) : (
          <ul className="space-y-3 mb-5">
            {serviciosPreview.map((svc) => (
              <li key={svc.servicio_id} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300 font-medium">
                <CheckCircle2
                  size={17}
                  className="shrink-0 mt-0.5"
                  style={{ color: color_principal }}
                  strokeWidth={2.5}
                />
                <span className="leading-snug">{svc.servicio_nombre}</span>
              </li>
            ))}
            {servicios.length > 4 && (
              <li className="text-xs text-slate-400 dark:text-slate-500 pl-8 font-medium">
                +{servicios.length - 4} servicios adicionales incluidos
              </li>
            )}
          </ul>
        )}

        {/* Botón "Ver todo" */}
        <button
          onClick={() => onVerDetalles(paquete)}
          className="w-full py-2.5 text-sm font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/4 hover:bg-slate-100 dark:hover:bg-white/8 hover:text-[#0D2137] dark:hover:text-white rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-200 dark:border-white/8 group/btn"
        >
          <Eye size={15} className="group-hover/btn:scale-110 transition-transform" />
          Ver todo lo que incluye
        </button>
      </div>

      {/* ── CTA Principal ── */}
      <div className="px-7 pb-7">
        <button
          onClick={handleSeleccionar}
          className="w-full py-4 rounded-2xl font-bold text-white text-sm transition-all duration-250 hover:-translate-y-1 focus:outline-none flex items-center justify-center gap-2.5 group/cta"
          style={{
            background: `linear-gradient(145deg, ${color_principal}, ${color_principal}dd)`,
            boxShadow: `0 6px 20px ${color_principal}45`,
          }}
        >
          Seleccionar este paquete
          <ArrowRight size={17} className="group-hover/cta:translate-x-1 transition-transform" />
        </button>
      </div>
    </article>
  );
}
