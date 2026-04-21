import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <main>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        className="relative min-h-screen flex items-center justify-center text-center px-4"
        style={{
          background: 'linear-gradient(135deg, #0D2137 0%, #1A3C5E 60%, #B7950B22 100%)',
        }}
        aria-label="Sección principal"
      >
        {/* Overlay decorativo */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-3xl mx-auto">
          <span className="inline-block mb-4 px-4 py-1.5 bg-[#B7950B]/20 text-[#B7950B] text-sm font-semibold rounded-full uppercase tracking-wider">
            Chambo, Chimborazo · Ecuador
          </span>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight">
            Quinta Inés María
          </h1>

          <p className="mt-4 text-white/60 text-lg font-medium tracking-wide">
            BED · Catering · Eventos
          </p>

          <p className="mt-6 text-white/80 text-lg leading-relaxed max-w-xl mx-auto">
            Creamos eventos únicos e irrepetibles. Desde bodas íntimas hasta
            congresos empresariales, con el calor del campo ecuatoriano.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/configurador"
              className="px-8 py-4 bg-[#B7950B] text-white font-bold rounded-full hover:bg-[#9A7D0A] transition-colors shadow-lg text-base focus:outline-none focus:ring-2 focus:ring-[#B7950B] focus:ring-offset-2 focus:ring-offset-[#0D2137]"
            >
              Planifica tu evento →
            </Link>
            <Link
              to="/paquetes"
              className="px-8 py-4 bg-white/10 backdrop-blur text-white font-semibold rounded-full hover:bg-white/20 transition-colors border border-white/20 text-base focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#0D2137]"
            >
              Ver paquetes
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center" aria-hidden="true">
          <div className="w-6 h-9 border-2 border-white/30 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-white/50 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* ── Propuesta de valor ───────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white" aria-labelledby="propuesta-titulo">
        <div className="max-w-5xl mx-auto text-center">
          <h2
            id="propuesta-titulo"
            className="font-display text-3xl sm:text-4xl font-bold text-[#0D2137] section-line"
          >
            ¿Por qué elegirnos?
          </h2>
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                icon:  '🌿',
                title: 'Entorno Natural',
                desc:  'Jardines, glorieta, puente y pileta en Chambo. El escenario perfecto para cada celebración.',
              },
              {
                icon:  '🍽️',
                title: 'Catering Propio',
                desc:  'Chef y equipo culinario propio. Menús de 2 a 5 tiempos adaptados a tus preferencias.',
              },
              {
                icon:  '✨',
                title: 'Todo Incluido',
                desc:  'Decoración, audio, parqueadero, personal y coordinación en un solo paquete sin sorpresas.',
              },
            ].map((item) => (
              <article key={item.title} className="text-center p-6">
                <span className="text-5xl block mb-4" aria-hidden="true">{item.icon}</span>
                <h3 className="font-semibold text-[#0D2137] text-lg mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-[#0D2137] text-center" aria-labelledby="cta-titulo">
        <h2
          id="cta-titulo"
          className="font-display text-3xl font-bold text-white"
        >
          ¿Listo para crear un momento inolvidable?
        </h2>
        <p className="mt-4 text-white/60 max-w-xl mx-auto">
          Usa nuestro configurador interactivo, elige tu paquete, personaliza cada detalle
          y recibe tu cotización al instante.
        </p>
        <Link
          to="/configurador"
          className="inline-block mt-8 px-10 py-4 bg-[#B7950B] text-white font-bold rounded-full hover:bg-[#9A7D0A] transition-colors shadow-lg focus:outline-none focus:ring-2 focus:ring-[#B7950B] focus:ring-offset-2 focus:ring-offset-[#0D2137]"
        >
          Comenzar ahora
        </Link>
      </section>
    </main>
  );
}
