import { useState, useEffect } from 'react';
import { fetchPaquetes } from '../services/catalogo.service';
import TarjetaPaquete from '../components/catalogo/TarjetaPaquete';

export default function Paquetes() {
  const [paquetes, setPaquetes] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    fetchPaquetes()
      .then(setPaquetes)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen pt-24 pb-16 bg-[#FDF8F0]">
      {/* ── Hero de sección ──────────────────────────────────────────────── */}
      <section className="text-center px-4 mb-14">
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#0D2137] section-line">
          Nuestros Paquetes
        </h1>
        <p className="mt-6 text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Elige el paquete que mejor se ajuste a tu evento. Todos incluyen el uso
          de nuestras instalaciones con un mínimo de 100 invitados.
        </p>
      </section>

      {/* ── Estado de carga ──────────────────────────────────────────────── */}
      {loading && (
        <div className="flex justify-center items-center py-20" role="status" aria-live="polite">
          <div className="spinner" />
          <span className="sr-only">Cargando paquetes…</span>
        </div>
      )}

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && (
        <div className="max-w-md mx-auto px-4" role="alert">
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center">
            <p className="text-red-700 font-medium">No pudimos cargar los paquetes.</p>
            <p className="text-red-500 text-sm mt-1">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-5 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* ── Grid de paquetes ─────────────────────────────────────────────── */}
      {!loading && !error && (
        <>
          {paquetes.length === 0 ? (
            <p className="text-center text-slate-500 py-20">
              No hay paquetes disponibles en este momento.
            </p>
          ) : (
            <section
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
                         grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
              aria-label="Vitrina de paquetes"
            >
              {/* Los paquetes vienen ordenados por orden_display ASC desde la API */}
              {paquetes.map((paquete) => (
                <TarjetaPaquete key={paquete.paquete_id} paquete={paquete} />
              ))}
            </section>
          )}

          {/* ── Nota de personalización ──────────────────────────────────── */}
          <div className="max-w-3xl mx-auto mt-14 px-4 text-center">
            <div className="bg-[#0D2137]/5 rounded-2xl p-8">
              <h3 className="font-display text-xl font-semibold text-[#0D2137]">
                ¿Necesitas algo más personalizado?
              </h3>
              <p className="text-slate-600 mt-2 text-sm leading-relaxed">
                Todos nuestros paquetes se pueden complementar con servicios adicionales
                como fotografía, DJ, barra de bebidas, animación infantil y mucho más.
                Úsalos en el configurador interactivo.
              </p>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
