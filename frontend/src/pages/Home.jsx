import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MapPin, Leaf, UtensilsCrossed, PartyPopper, ArrowRight, Play } from 'lucide-react';
import ScrollReveal from '../components/shared/ScrollReveal';

import bg1 from '../assets/FotosQuintaInes/EntradaQuinta/entrada 1 quinta ines.jpg';
import bg3 from '../assets/FotosQuintaInes/EntradaQuinta/entrada 3 quinta ines.jpg';
import bg5 from '../assets/FotosQuintaInes/EntradaQuinta/entrada 5 quinta ines.jpg';
import bg6 from '../assets/FotosQuintaInes/EntradaQuinta/entrada 6 quinta ines.jpg';
import imgMisionVision from '../assets/FotosQuintaInes/LogosQuinta/mision.JPG';
import imgQrDirections from '../assets/FotosQuintaInes/LogosQuinta/QRINVITACIONCOMOLLEGAR.jpg';
import vidPromocional from '../assets/FotosQuintaInes/VideosQuinta/WhatsAppVideo2024-06-04at2.43.50PM.mp4';

const IMAGENES_FONDO = [bg1, bg3, bg5, bg6];

const VALORES = [
  { icon: Leaf, title: 'Entorno Natural', desc: 'Jardines, glorieta, puente y pileta en Chambo. El escenario perfecto para cada celebración.' },
  { icon: UtensilsCrossed, title: 'Catering Propio', desc: 'Chef y equipo culinario propio. Menús de 2 a 5 tiempos adaptados a tu gusto.' },
  { icon: PartyPopper, title: 'Todo Incluido', desc: 'Decoración, audio, parqueadero, personal y coordinación en un solo paquete.' },
];

const STATS = [
  { value: '15+', label: 'Años de experiencia' },
  { value: '500+', label: 'Eventos realizados' },
  { value: '100%', label: 'Atención personalizada' },
];

export default function Home() {
  const [indiceActual, setIndiceActual] = useState(0);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setIndiceActual((prev) => (prev + 1) % IMAGENES_FONDO.length);
    }, 4500);
    return () => clearInterval(intervalo);
  }, []);

  return (
    <main className="font-sans overflow-x-hidden">

      {/* ── HERO ── */}
      <section className="relative min-h-[100svh] flex items-center justify-center text-center px-4" aria-label="Sección principal">
        <AnimatePresence mode="wait">
          <motion.div
            key={indiceActual}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url("${IMAGENES_FONDO[indiceActual]}")` }}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0D2137]/70 via-[#0D2137]/50 to-[#0D2137]/85" />

        <div className="relative z-10 max-w-4xl mx-auto pt-28 pb-20">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 mb-6 px-5 py-2 bg-[#B7950B]/20 text-[#F5E6B8] text-sm font-semibold rounded-full border border-[#B7950B]/40 backdrop-blur-md"
          >
            <MapPin size={16} /> Chambo, Chimborazo · Ecuador
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.7 }}
            className="font-display text-5xl sm:text-6xl lg:text-8xl font-bold text-white leading-[1.05] tracking-tight"
          >
            Quinta Inés María
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-5 text-[#B7950B] text-xl sm:text-2xl font-semibold tracking-wide"
          >
            BED · Catering · Eventos
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
            className="mt-6 text-white/85 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto"
          >
            Creamos momentos únicos e irrepetibles. Bodas, quinceañeras y eventos corporativos con el calor del campo ecuatoriano.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85 }}
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/configurador"
              className="group inline-flex items-center gap-3 px-10 py-4 bg-[#B7950B] text-[#0D2137] font-bold rounded-full hover:bg-[#D4AC0D] transition-all shadow-xl shadow-[#B7950B]/30 hover:-translate-y-1 text-lg"
            >
              <Sparkles size={22} className="group-hover:rotate-12 transition-transform" />
              Planifica tu evento
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/paquetes"
              className="px-10 py-4 bg-white/10 backdrop-blur-md text-white font-semibold rounded-full border-2 border-white/25 hover:bg-white/20 hover:border-white/40 transition-all text-lg"
            >
              Ver paquetes
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto"
          >
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-[#B7950B]">{s.value}</p>
                <p className="text-white/60 text-[10px] sm:text-xs mt-1 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50"
          aria-hidden
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
        </motion.div>
      </section>

      {/* ── VALOR ── */}
      <section className="py-28 px-4 bg-white" aria-labelledby="propuesta-titulo">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="text-center mb-16">
            <h2 id="propuesta-titulo" className="font-display text-4xl sm:text-5xl font-bold text-[#0D2137]">
              ¿Por qué elegirnos?
            </h2>
            <div className="w-24 h-1.5 bg-gradient-to-r from-transparent via-[#B7950B] to-transparent mx-auto mt-5 rounded-full" />
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {VALORES.map((item, i) => (
              <ScrollReveal key={item.title} delay={i * 0.12}>
                <article className="group h-full p-8 rounded-3xl bg-gradient-to-br from-[#FCF9F2] to-white border border-[#B7950B]/15 shadow-sm hover:shadow-xl hover:border-[#B7950B]/30 transition-all duration-300 hover:-translate-y-2 text-center">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#0D2137]/5 flex items-center justify-center group-hover:bg-[#B7950B]/15 transition-colors">
                    <item.icon size={32} className="text-[#0D2137] group-hover:text-[#B7950B] transition-colors" />
                  </div>
                  <h3 className="font-bold text-[#0D2137] text-xl mb-3">{item.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── UBICACIÓN Y MISIÓN ── */}
      <section className="py-28 px-4 bg-[#F8FAFC]" aria-labelledby="info-titulo">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <ScrollReveal direction="left">
              <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-100 text-center flex flex-col items-center">
                <h3 className="font-display text-2xl font-bold text-[#0D2137] mb-3 flex items-center gap-2 justify-center">
                  <MapPin size={24} className="text-[#B7950B]" /> Cómo llegar
                </h3>
                <p className="text-slate-600 mb-8 max-w-sm">Escanea el QR o abre el mapa para planificar tu visita a la quinta.</p>
                <img src={imgQrDirections} alt="QR direcciones" className="w-52 h-auto border-4 border-[#B7950B]/10 rounded-2xl shadow-inner mb-8" />
                <a
                  href="https://www.google.com/maps/search/quinta+ines+maria+chambo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#0D2137] text-white font-bold rounded-xl hover:bg-[#1A6BAC] transition-colors"
                >
                  Abrir en Google Maps <ArrowRight size={18} />
                </a>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right">
              <div className="space-y-8">
                <div>
                  <span className="text-xs font-bold uppercase text-[#B7950B] tracking-widest">Nuestra esencia</span>
                  <h2 id="info-titulo" className="mt-2 font-display text-4xl font-bold text-[#0D2137]">Misión y visión</h2>
                  <div className="w-16 h-1 bg-[#B7950B] mt-4 rounded-full" />
                </div>
                {[
                  { title: 'Misión', text: 'Proveer un entorno natural y servicios integrales de catering y planificación de excelencia, convirtiendo cada evento en una experiencia única con el calor del campo ecuatoriano.' },
                  { title: 'Visión', text: 'Consolidarnos como la quinta de eventos líder en Chambo y Chimborazo, reconocida por la calidad humana, excelencia operativa y momentos de felicidad auténtica.' },
                ].map((block) => (
                  <div key={block.title} className="relative p-6 pl-12 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <img src={imgMisionVision} alt="" className="absolute top-5 left-3 h-10 w-auto opacity-80" aria-hidden />
                    <h4 className="font-bold text-lg text-[#0D2137] mb-2">{block.title}</h4>
                    <p className="text-slate-600 text-sm leading-relaxed">{block.text}</p>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── VIDEO ── */}
      <section className="py-28 px-4 bg-white" aria-labelledby="video-titulo">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="text-center mb-14">
            <h2 id="video-titulo" className="font-display text-4xl sm:text-5xl font-bold text-[#0D2137]">Vívelo tú mismo</h2>
            <p className="mt-4 text-slate-600 max-w-xl mx-auto text-lg">Un recorrido por nuestras instalaciones y la magia de cada celebración.</p>
          </ScrollReveal>

          <ScrollReveal delay={0.15}>
            <div className="relative aspect-video bg-[#0D2137] rounded-3xl overflow-hidden shadow-2xl ring-1 ring-slate-200 group">
              <video controls className="w-full h-full object-cover" poster={bg6}>
                <source src={vidPromocional} type="video/mp4" />
              </video>
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/50 backdrop-blur rounded-full text-white text-xs font-medium pointer-events-none">
                <Play size={14} fill="white" /> Video promocional
              </div>
            </div>
            <div className="mt-10 text-center">
              <Link to="/galeria" className="inline-flex items-center gap-2 text-lg font-bold text-[#B7950B] hover:text-[#9A7D0A] transition-colors">
                Ver galería de fotos <ArrowRight size={20} />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-28 px-4 relative overflow-hidden" aria-labelledby="cta-titulo">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0D2137] via-[#1A3A5C] to-[#0D2137]" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #B7950B 0%, transparent 50%)' }} />
        <ScrollReveal className="relative max-w-3xl mx-auto text-center">
          <h2 id="cta-titulo" className="font-display text-4xl sm:text-5xl font-bold text-white">
            ¿Listo para un momento inolvidable?
          </h2>
          <p className="mt-6 text-white/75 text-lg leading-relaxed">
            Usa el configurador interactivo, elige tu paquete y recibe tu cotización al instante.
          </p>
          <Link
            to="/configurador"
            className="inline-flex items-center gap-3 mt-10 px-12 py-5 bg-[#B7950B] text-[#0D2137] font-bold rounded-full hover:bg-[#D4AC0D] transition-all shadow-2xl hover:-translate-y-1 text-lg"
          >
            <Sparkles size={24} /> Comenzar ahora
          </Link>
        </ScrollReveal>
      </section>
    </main>
  );
}
