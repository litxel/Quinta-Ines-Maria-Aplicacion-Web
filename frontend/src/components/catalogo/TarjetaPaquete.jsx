import { useNavigate } from 'react-router-dom';
import { useConfiguradorStore } from '../../store/useConfiguradorStore';

/**
 * Tarjeta de un paquete en la vitrina.
 *
 * Props recibidas del JSON real de la API:
 *   paquete.paquete_id        → number
 *   paquete.paquete_nombre    → string   "Bronce"
 *   paquete.paquete_codigo    → string   "BRONCE"
 *   paquete.descripcion       → string
 *   paquete.precio_persona    → string   "15.00"  (viene como string desde DECIMAL)
 *   paquete.minimo_invitados  → number   100
 *   paquete.color_principal   → string   "#CD7F32"  ← columna real
 *   paquete.destacado         → boolean
 *   paquete.servicios[]
 *     .servicio_id            → number
 *     .nombre_servicio        → string   ← columna real (NO servicio_nombre)
 *     .descripcion            → string
 *     .icono                  → string | null
 */
export default function TarjetaPaquete({ paquete }) {
  const navigate          = useNavigate();
  const setPaqueteStore   = useConfiguradorStore((s) => s.setPaquete);

  const {
    paquete_nombre,
    paquete_codigo,
    descripcion,
    precio_persona,
    minimo_invitados,
    color_principal,   // ← columna real del SQL
    destacado,
    servicios = [],
  } = paquete;

  const precio = parseFloat(precio_persona);

  // Seleccionar paquete y navegar al configurador
  const handleSeleccionar = () => {
    setPaqueteStore(paquete);
    navigate('/configurador');
  };

  return (
    <article
      className={`relative bg-white rounded-2xl overflow-hidden card-shadow card-shadow-hover flex flex-col ${
        destacado ? 'ring-2 ring-offset-2' : ''
      }`}
      style={destacado ? { '--tw-ring-color': color_principal } : {}}
      aria-label={`Paquete ${paquete_nombre}`}
    >
      {/* ── Encabezado coloreado con color_principal real ─────────────────── */}
      <div
        className="px-6 py-8 text-center"
        style={{ backgroundColor: color_principal }}
      >
        {destacado && (
          <span className="inline-block mb-3 px-3 py-0.5 bg-white/25 text-white text-xs font-semibold rounded-full uppercase tracking-wide">
            Más popular
          </span>
        )}
        <h2 className="font-display text-3xl font-bold text-white">
          {paquete_nombre}
        </h2>
        <p className="mt-2 text-white/80 text-sm leading-relaxed">
          {descripcion}
        </p>

        {/* Precio */}
        <div className="mt-5">
          <span className="text-4xl font-bold text-white">
            ${precio.toFixed(2)}
          </span>
          <span className="text-white/70 text-sm ml-1">/ persona</span>
        </div>
        <p className="text-white/60 text-xs mt-1">
          Mínimo {minimo_invitados} personas
        </p>
      </div>

      {/* ── Lista de servicios incluidos ─────────────────────────────────── */}
      <div className="flex-1 px-6 py-5">
        {servicios.length === 0 ? (
          <p className="text-sm text-slate-400 italic text-center py-4">
            Sin servicios registrados aún.
          </p>
        ) : (
          <ul className="space-y-2" aria-label={`Servicios del paquete ${paquete_nombre}`}>
            {servicios.map((svc) => (
              <li
                key={svc.servicio_id}
                className="flex items-start gap-2 text-sm text-slate-700"
              >
                {/* icono o checkmark por defecto */}
                <span
                  className="mt-0.5 shrink-0 text-base"
                  aria-hidden="true"
                  style={{ color: color_principal }}
                >
                  {svc.icono ?? '✓'}
                </span>
                {/* nombre_servicio ← columna real de paquete_servicios */}
                <span>{svc.nombre_servicio}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <div className="px-6 pb-6">
        <button
          onClick={handleSeleccionar}
          className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-opacity hover:opacity-90 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2"
          style={{ backgroundColor: color_principal }}
          aria-label={`Seleccionar paquete ${paquete_nombre} y configurar evento`}
        >
          Seleccionar y configurar
        </button>
        <p className="mt-2 text-center text-xs text-slate-400">
          Precio total: ${(precio * minimo_invitados).toFixed(2)} para {minimo_invitados} personas
        </p>
      </div>
    </article>
  );
}
