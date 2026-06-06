import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MapPin, Leaf, UtensilsCrossed, PartyPopper, ArrowRight, Play } from 'lucide-react';
import ScrollReveal, { StaggerReveal, staggerItem } from '../components/shared/ScrollReveal';

import bg1 from '../assets/FotosQuintaInes/EntradaQuinta/entrada 1 quinta ines.jpg';
import bg3 from '../assets/FotosQuintaInes/EntradaQuinta/entrada 3 quinta ines.jpg';
import bg5 from '../assets/FotosQuintaInes/EntradaQuinta/entrada 5 quinta ines.jpg';
import bg6 from '../assets/FotosQuintaInes/EntradaQuinta/entrada 6 quinta ines.jpg';
import imgMisionVision from '../assets/FotosQuintaInes/LogosQuinta/mision.JPG';
import imgQrDirections from '../assets/FotosQuintaInes/LogosQuinta/QRINVITACIONCOMOLLEGAR.jpg';
import vidPromocional  from '../assets/FotosQuintaInes/VideosQuinta/WhatsAppVideo2024-06-04at2.43.50PM.mp4';

const IMAGENES_FONDO = [bg1, bg3, bg5, bg6];

const VALORES = [
  { icon: Leaf,           title: 'Entorno Natural',  desc: 'Jardines, glorieta, puente y pileta en Chambo. El escenario perfecto para cada celebración.' },
  { icon: UtensilsCrossed, title: 'Catering Propio', desc: 'Chef y equipo culinario propio. Menús de 2 a 5 tiempos adaptados a tu gusto.' },
  { icon: PartyPopper,    title: 'Todo Incluido',    desc: 'Decoración, audio, parqueadero, personal y coordinación en un solo paquete.' },
];

const STATS = [
  { value: '15+',  label: 'Años de experiencia'       },
  { value: '500+', label: 'Eventos realizados'         },
  { value: '100%', label: 'Atención personalizada'     },
];

export default function Home() {
  const [indiceActual, setIndiceActual] = useState(0);

  useEffect(() => {
    const intervalo = setInterval(
      () => setIndiceActual((prev) => (prev + 1) % IMAGENES_FONDO.length),
      4500
    );
    return () => clearInterval(intervalo);
  }, []);

  return (
    <main className="font-sans overflow-x-hidden">

      {/* ── HERO ── */}
      <section className="relative min-h-[100svh] flex items-center justify-center text-center px-4" aria-label="Sección principal">
        {/* Carousel de imágenes */}
        <AnimatePresence mode="wait">
          <motion.div
            key={indiceActual}
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: 'easeInOut' }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url("${IMAGENES_FONDO[indiceActual]}")` }}
          />
        </AnimatePresence>

        {/* Overlay cinematográfico */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0D2137]/72 via-[#0D2137]/48 to-[#060D18]/90" />
        {/* Viñeta lateral */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#060D18]/30 via-transparent to-[#060D18]/30" />

        <div className="relative z-10 max-w-4xl mx-auto pt-32 pb-24">
          {/* Chip de ubicación */}
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 mb-7 px-5 py-2 bg-[#C9A227]/18 text-[#F5E6B8] text-sm font-semibold rounded-full border border-[#C9A227]/35 backdrop-blur-md"
          >
            <MapPin size={15} className="text-[#C9A227]" />
            Chambo, Chimborazo · Ecuador
          </motion.span>

          {/* Título principal con gradiente dorado */}
          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.36, duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-6xl sm:text-7xl lg:text-[90px] font-bold leading-[1.0] tracking-tight"
          >
            <span className="text-white">Quinta </span>
            <span className="gradient-text">Inés María</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.52 }}
            className="mt-5 text-[#C9A227] text-xl sm:text-2xl font-semibold tracking-[0.12em] uppercase"
          >
            BED · Catering · Eventos
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.66 }}
            className="mt-6 text-white/80 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto font-light"
          >
            Creamos momentos únicos e irrepetibles. Bodas, quinceañeras y eventos corporativos con el calor del campo ecuatoriano.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.84, ease: [0.22, 1, 0.36, 1] }}
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/configurador"
              className="group inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-[#B7950B] to-[#D4AF37] text-[#0D2137] font-bold rounded-full hover:shadow-2xl hover:shadow-[#C9A227]/40 hover:-translate-y-1.5 transition-all duration-300 text-lg"
            >
              <Sparkles size={21} className="group-hover:rotate-12 transition-transform" />
              Planifica tu evento
              <ArrowRight size={19} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/paquetes"
              className="px-10 py-4 bg-white/10 backdrop-blur-md text-white font-semibold rounded-full border-2 border-white/22 hover:bg-white/18 hover:border-white/38 transition-all text-lg"
            >
              Ver paquetes
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.08 }}
            className="mt-18 grid grid-cols-3 gap-6 max-w-md mx-auto"
          >
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold gradient-text">{s.value}</p>
                <p className="text-white/50 text-[10px] sm:text-xs mt-1 uppercase tracking-wider font-medium">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Indicador scroll */}
        <motion.div
          animate={{ y: [0, 9, 0] }}
          transition={{ repeat: Infinity, duration: 2.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40"
          aria-hidden
        >
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold">Descubrir</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>

        {/* Indicadores del carousel */}
        <div className="absolute bottom-8 right-6 flex gap-1.5" aria-hidden>
          {IMAGENES_FONDO.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndiceActual(i)}
              className={`transition-all duration-300 rounded-full ${
                i === indiceActual ? 'w-6 h-2 bg-[#C9A227]' : 'w-2 h-2 bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      </section>

      {/* ── PROPUESTA DE VALOR ── */}
      <section className="py-28 px-4 bg-white dark:bg-[#060D18] transition-colors" aria-labelledby="propuesta-titulo">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-[#C9A227] mb-3">Por qué elegirnos</p>
            <h2 id="propuesta-titulo" className="font-display text-5xl sm:text-6xl font-bold text-[#0D2137] dark:text-white">
              Una experiencia <em>diferente</em>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#C9A227] to-transparent mx-auto mt-6 rounded-full" />
          </ScrollReveal>

          <StaggerReveal className="grid grid-cols-1 md:grid-cols-3 gap-8" stagger={0.12}>
            {VALORES.map((item) => (
              <motion.article
                key={item.title}
                variants={staggerItem}
                className="group h-full p-9 rounded-3xl bg-gradient-to-br from-[#FCF9F2] to-white dark:from-white/4 dark:to-white/2 border border-[#C9A227]/12 dark:border-white/6 shadow-sm hover:shadow-xl dark:hover:shadow-black/30 hover:border-[#C9A227]/28 transition-all duration-300 hover:-translate-y-2 text-center"
              >
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#0D2137]/5 dark:bg-white/6 flex items-center justify-center group-hover:bg-[#C9A227]/14 transition-colors duration-300">
                  <item.icon size={30} className="text-[#0D2137] dark:text-white/80 group-hover:text-[#C9A227] transition-colors duration-300" />
                </div>
                <h3 className="font-bold text-[#0D2137] dark:text-white text-xl mb-3">{item.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </motion.article>
            ))}
          </StaggerReveal>
        </div>
      </section>

      {/* ── UBICACIÓN Y MISIÓN ── */}
      <section className="py-28 px-4 bg-[#F8F5EF] dark:bg-[#080F1C] transition-colors" aria-labelledby="info-titulo">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <ScrollReveal direction="left">
              <div className="bg-white dark:bg-[#0C1829] p-10 rounded-3xl shadow-xl dark:shadow-black/30 border border-slate-100 dark:border-white/8 text-center flex flex-col items-center">
                <h3 className="font-display text-2xl font-bold text-[#0D2137] dark:text-white mb-3 flex items-center gap-2 justify-center">
                  <MapPin size={22} className="text-[#C9A227]" /> Cómo llegar
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm text-sm">
                  Escanea el QR o abre el mapa para planificar tu visita a la quinta.
                </p>
                <img
                  src={imgQrDirections} alt="QR direcciones"
                  className="w-52 h-auto border-4 border-[#C9A227]/12 rounded-2xl shadow-inner mb-8"
                />
                <a
                  href="https://www.google.com/maps/search/quinta+ines+maria+chambo"
                  target="_blank" rel="noopener noreferrer"
                  className="btn-primary"
                >
                  Abrir en Google Maps <ArrowRight size={17} />
                </a>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right">
              <div className="space-y-8">
                <div>
                  <span className="text-xs font-bold uppercase text-[#C9A227] tracking-widest">Nuestra esencia</span>
                  <h2 id="info-titulo" className="mt-2 font-display text-4xl sm:text-5xl font-bold text-[#0D2137] dark:text-white">
                    Misión y visión
                  </h2>
                  <div className="w-14 h-1 bg-gradient-to-r from-[#C9A227] to-transparent mt-4 rounded-full" />
                </div>
                {[
                  { title: 'Misión', text: 'Proveer un entorno natural y servicios integrales de catering y planificación de excelencia, convirtiendo cada evento en una experiencia única con el calor del campo ecuatoriano.' },
                  { title: 'Visión', text: 'Consolidarnos como la quinta de eventos líder en Chambo y Chimborazo, reconocida por la calidad humana, excelencia operativa y momentos de felicidad auténtica.' },
                ].map((block, i) => (
                  <ScrollReveal key={block.title} delay={i * 0.12}>
                    <div className="relative p-6 pl-12 bg-white dark:bg-[#0C1829] border border-slate-100 dark:border-white/8 rounded-2xl shadow-sm hover:shadow-md dark:hover:shadow-black/20 transition-all">
                      <img src={imgMisionVision} alt="" className="absolute top-5 left-3 h-10 w-auto opacity-70" aria-hidden />
                      <h4 className="font-bold text-lg text-[#0D2137] dark:text-white mb-2">{block.title}</h4>
                      <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{block.text}</p>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── VIDEO ── */}
      <section className="py-28 px-4 bg-white dark:bg-[#060D18] transition-colors" aria-labelledby="video-titulo">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-[#C9A227] mb-3">Nuestra quinta</p>
            <h2 id="video-titulo" className="font-display text-5xl sm:text-6xl font-bold text-[#0D2137] dark:text-white">
              Vívelo tú mismo
            </h2>
            <p className="mt-4 text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-lg">
              Un recorrido por nuestras instalaciones y la magia de cada celebración.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.15}>
            <div className="relative aspect-video bg-[#0D2137] rounded-3xl overflow-hidden shadow-2xl ring-1 ring-slate-200 dark:ring-white/8 group">
              <video controls className="w-full h-full object-cover" poster={bg6}>
                <source src={vidPromocional} type="video/mp4" />
              </video>
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/55 backdrop-blur rounded-full text-white text-xs font-semibold pointer-events-none">
                <Play size={13} fill="white" strokeWidth={0} /> Video promocional
              </div>
            </div>
            <div className="mt-10 text-center">
              <Link
                to="/galeria"
                className="inline-flex items-center gap-2 text-lg font-bold text-[#C9A227] hover:text-[#B7950B] transition-colors group"
              >
                Ver galería de fotos
                <ArrowRight size={19} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-32 px-4 relative overflow-hidden" aria-labelledby="cta-titulo">
        <div className="absolute inset-0 bg-gradient-to-br from-[#060D18] via-[#0D2137] to-[#060D18]" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(ellipse at 30% 50%, rgba(201,162,39,0.14) 0%, transparent 60%), radial-gradient(ellipse at 70% 50%, rgba(26,106,172,0.1) 0%, transparent 60%)' }} />
        {/* Grid de puntos decorativo */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, #C9A227 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        <ScrollReveal className="relative max-w-3xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-[#C9A227] mb-4">¿Listo para empezar?</p>
          <h2 id="cta-titulo" className="font-display text-5xl sm:text-6xl font-bold text-white leading-tight">
            Crea un momento
            <br />
            <span className="gradient-text">inolvidable</span>
          </h2>
          <p className="mt-6 text-white/65 text-lg leading-relaxed max-w-xl mx-auto">
            Usa el configurador interactivo, elige tu paquete y recibe tu cotización al instante.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/configurador"
              className="inline-flex items-center gap-3 px-12 py-5 bg-gradient-to-r from-[#B7950B] to-[#D4AF37] text-[#0D2137] font-bold rounded-full hover:shadow-2xl hover:shadow-[#C9A227]/40 hover:-translate-y-1.5 transition-all duration-300 text-lg"
            >
              <Sparkles size={22} /> Comenzar ahora
            </Link>
            <Link
              to="/paquetes"
              className="inline-flex items-center gap-2 px-8 py-5 text-white/75 hover:text-white font-semibold transition-colors text-lg"
            >
              Explorar paquetes <ArrowRight size={18} />
            </Link>
          </div>
        </ScrollReveal>
      </section>
    </main>
  );
}
