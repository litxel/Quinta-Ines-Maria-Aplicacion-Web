import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Eye, ArrowRight, Star, Image as ImageIcon } from 'lucide-react';
import { useConfiguradorStore } from '../../store/useConfiguradorStore';

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function TarjetaPaquete({ paquete, onVerDetalles }) {
  const navigate        = useNavigate();
  const setPaqueteStore = useConfiguradorStore((s) => s.setPaquete);
  const imagenUrl       = paquete.imagen_url ? `${BACKEND_URL}${paquete.imagen_url}` : null;

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
      className={`relative bg-white dark:bg-[#332247] rounded-3xl overflow-hidden flex flex-col-reverse md:flex-row h-full border transition-all duration-300
        ${destacado
          ? 'border-transparent shadow-2xl shadow-black/12 dark:shadow-black/40'
          : 'border-slate-100 dark:border-white/8 card-shadow card-shadow-hover'
        }`}
      style={destacado ? { boxShadow: `0 20px 60px ${color_principal}28, 0 0 0 2px ${color_principal}` } : {}}
    >
      {/* Franja de acento con el color del paquete */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5 md:right-auto md:bottom-0 md:h-auto md:w-1.5 z-20"
        style={{ backgroundColor: color_principal }}
      />

      {/* ── IZQUIERDA: detalles, título, precio ── */}
      <div className="flex-1 flex flex-col p-6 md:p-7 min-w-0">
        {destacado && (
          <div className="mb-3">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 text-white text-[10px] font-bold rounded-full uppercase tracking-wider shadow"
              style={{ backgroundColor: color_principal }}
            >
              <Star size={10} fill="white" strokeWidth={0} /> Más popular
            </span>
          </div>
        )}

        <h2 className="font-display text-3xl font-bold text-[#0D2137] dark:text-white leading-tight tracking-wide">
          {paquete_nombre}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mt-1.5 mb-4 line-clamp-2">
          {descripcion}
        </p>

        {/* Precio */}
        <div className="flex items-baseline gap-1.5 mb-5">
          <span className="text-sm font-bold" style={{ color: color_principal }}>$</span>
          <span className="text-4xl font-bold tracking-tight" style={{ color: color_principal }}>{precio.toFixed(2)}</span>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wide">/ persona · mín. {minimo_invitados}</span>
        </div>

        {/* Servicios */}
        {servicios.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 italic py-2">Servicios por definir…</p>
        ) : (
          <ul className="space-y-2.5 mb-5">
            {serviciosPreview.map((svc) => (
              <li key={svc.servicio_id} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300 font-medium">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5" style={{ color: color_principal }} strokeWidth={2.5} />
                <span className="leading-snug">{svc.servicio_nombre}</span>
              </li>
            ))}
            {servicios.length > 4 && (
              <li className="text-xs text-slate-400 dark:text-slate-500 pl-[26px] font-medium">
                +{servicios.length - 4} servicios adicionales incluidos
              </li>
            )}
          </ul>
        )}

        {/* Botones */}
        <div className="mt-auto flex flex-col gap-2.5">
          <button
            onClick={() => onVerDetalles(paquete)}
            className="w-full py-2.5 text-sm font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/4 hover:bg-slate-100 dark:hover:bg-white/8 hover:text-[#0D2137] dark:hover:text-white rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-200 dark:border-white/8 group/btn"
          >
            <Eye size={15} className="group-hover/btn:scale-110 transition-transform" />
            Ver todo lo que incluye
          </button>
          <button
            onClick={handleSeleccionar}
            className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all duration-250 hover:-translate-y-0.5 focus:outline-none flex items-center justify-center gap-2.5 group/cta"
            style={{
              background: `linear-gradient(145deg, ${color_principal}, ${color_principal}dd)`,
              boxShadow: `0 6px 20px ${color_principal}45`,
            }}
          >
            Seleccionar este paquete
            <ArrowRight size={17} className="group-hover/cta:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* ── DERECHA: imagen representativa (object-cover) ── */}
      <div
        className="relative md:w-[42%] shrink-0 min-h-[180px] md:min-h-0 overflow-hidden"
        style={{ background: `linear-gradient(145deg, ${color_principal}, ${color_principal}bb)` }}
      >
        {imagenUrl ? (
          <img
            src={imagenUrl}
            alt={paquete_nombre}
            className="absolute inset-0 w-full h-full object-cover rounded-t-3xl md:rounded-t-none md:rounded-r-3xl"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70 gap-2">
            <ImageIcon size={34} />
            <span className="text-xs font-semibold uppercase tracking-widest">{paquete_nombre}</span>
          </div>
        )}
        {/* Velo sutil para integrar la imagen */}
        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/5 pointer-events-none rounded-t-3xl md:rounded-t-none md:rounded-r-3xl" />
      </div>
    </article>
  );
}
