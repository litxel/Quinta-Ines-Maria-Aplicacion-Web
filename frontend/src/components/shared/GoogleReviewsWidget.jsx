import { useEffect, useRef } from 'react';

/**
 * GoogleReviewsWidget — muestra TODAS las reseñas reales (Google y Facebook)
 * embebiendo un widget gratuito de terceros (Trustindex / Featurable).
 *
 * ¿Por qué un widget y no la API?
 *   La Places API de Google limita a 5 reseñas por negocio. Para mostrar las
 *   174 completas (y las de Facebook) la vía gratuita es un widget que el
 *   propio proveedor genera tras conectar tu ficha de Google/Facebook.
 *
 * Activación (gratis, 5 min): genera tu widget en trustindex.io o featurable.com,
 * copia el `src` del <script> que te dan y pégalo en `frontend/.env`:
 *
 *   VITE_TRUSTINDEX_SRC=https://cdn.trustindex.io/loader.js?XXXXXXXXXXXX
 *
 * Mientras no esté configurado, este componente no muestra nada al visitante
 * (solo una nota de ayuda en modo desarrollo).
 */
const TRUSTINDEX_SRC = import.meta.env.VITE_TRUSTINDEX_SRC;

export default function GoogleReviewsWidget() {
  const ref = useRef(null);
  const montado = useRef(false); // evita doble inyección (StrictMode en dev)

  useEffect(() => {
    if (!TRUSTINDEX_SRC || !ref.current || montado.current) return;
    montado.current = true;
    const s = document.createElement('script');
    s.src = TRUSTINDEX_SRC;
    s.async = true;
    s.defer = true;
    ref.current.appendChild(s);
  }, []);

  // No configurado: nada para el visitante; ayuda visible solo en desarrollo.
  if (!TRUSTINDEX_SRC) {
    if (!import.meta.env.DEV) return null;
    return (
      <div className="rounded-3xl border-2 border-dashed border-[#A971D6]/40 bg-white/60 dark:bg-[#332247]/60 p-8 text-center">
        <p className="font-bold text-[#0D2137] dark:text-white mb-1">Widget de reseñas (todas) — pendiente de activar</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Define <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10">VITE_TRUSTINDEX_SRC</code> en <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10">frontend/.env</code> con el script de tu widget gratuito de Trustindex/Featurable.
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">(Esta nota solo aparece en modo desarrollo.)</p>
      </div>
    );
  }

  return <div ref={ref} className="ti-widget-container min-h-[220px]" aria-label="Reseñas verificadas de Google y Facebook" />;
}
