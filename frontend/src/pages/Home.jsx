import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// 1. Importamos las imágenes exactas del carrusel (EntradaQuinta)
import bg1 from '../assets/FotosQuintaInes/EntradaQuinta/entrada 1 quinta ines.jpg';
import bg3 from '../assets/FotosQuintaInes/EntradaQuinta/entrada 3 quinta ines.jpg';
import bg5 from '../assets/FotosQuintaInes/EntradaQuinta/entrada 5 quinta ines.jpg';
import bg6 from '../assets/FotosQuintaInes/EntradaQuinta/entrada 6 quinta ines.jpg';

//  INFORMATIVOS 
import imgMisionVision from '../assets/FotosQuintaInes/LogosQuinta/mision.JPG';
import imgQrDirections from '../assets/FotosQuintaInes/LogosQuinta/QRINVITACIONCOMOLLEGAR.jpg';
//  VIDEO 
import vidPromocional from '../assets/FotosQuintaInes/VideosQuinta/WhatsAppVideo2024-06-04at2.43.50PM.mp4';

// Arreglo con las imágenes para el carrusel
const IMAGENES_FONDO = [bg1, bg3, bg5, bg6];

export default function Home() {
  const [indiceActual, setIndiceActual] = useState(0);

  // Efecto para cambiar la imagen cada 3 segundos
  useEffect(() => {
    const intervalo = setInterval(() => {
      setIndiceActual((prev) => (prev + 1) % IMAGENES_FONDO.length);
    }, 3000);

    return () => clearInterval(intervalo);
  }, []);

  return (
    <main className="font-sans">
      
      {/* ── SECCIÓN 1: Hero con Carrusel (Intacto, solo ajustamos padding para Navbar fijo) ── */}
      <section
        className="relative min-h-screen flex items-center justify-center text-center px-4 bg-cover bg-center transition-all duration-1000 ease-in-out"
        style={{
          backgroundImage: `url("${IMAGENES_FONDO[indiceActual]}")`,
        }}
        aria-label="Sección principal"
      >
        <div className="absolute inset-0 bg-black/50" aria-hidden="true" />

        <div className="relative z-10 max-w-3xl mx-auto mt-20 pb-16">
          <span className="inline-block mb-4 px-4 py-1.5 bg-[#B7950B]/20 text-[#B7950B] text-sm font-semibold rounded-full uppercase tracking-wider backdrop-blur-sm border border-[#B7950B]/30">
            Chambo, Chimborazo · Ecuador
          </span>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight drop-shadow-lg">
            Quinta Inés María
          </h1>

          <p className="mt-4 text-white/90 text-lg font-medium tracking-wide drop-shadow-md">
            BED · Catering · Eventos
          </p>

          <p className="mt-6 text-white/90 text-lg leading-relaxed max-w-xl mx-auto drop-shadow-md">
            Creamos eventos únicos e irrepetibles. Desde bodas íntimas hasta
            congresos empresariales, con el calor del campo ecuatoriano.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/configurador" className="px-8 py-4 bg-[#B7950B] text-white font-bold rounded-full hover:bg-[#9A7D0A] transition-colors shadow-lg">
              Planifica tu evento →
            </Link>
            <Link to="/paquetes" className="px-8 py-4 bg-white/10 backdrop-blur-md text-white font-semibold rounded-full border border-white/20 hover:bg-white/20 transition-all">
              Ver paquetes
            </Link>
          </div>
        </div>

        <div className="absolute bottom-8 left-0 right-0 flex justify-center animate-bounce" aria-hidden="true">
          <svg className="w-6 h-6 text-white/60" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
          </svg>
        </div>
      </section>

      {/* ── SECCIÓN 2: Propuesta de valor (Intacto) ── */}
      <section className="py-24 px-4 bg-white" aria-labelledby="propuesta-titulo">
        <div className="max-w-5xl mx-auto text-center">
          <h2 id="propuesta-titulo" className="font-display text-3xl sm:text-4xl font-bold text-[#0D2137]">
            ¿Por qué elegirnos?
          </h2>
          <div className="w-20 h-1.5 bg-[#B7950B] mx-auto mt-4 rounded-full mb-16"></div>
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-10">
            {[
              { icon: '🌿', title: 'Entorno Natural', desc: 'Jardines, glorieta, puente y pileta en Chambo. Escenario perfecto para cada celebración.' },
              { icon: '🍽️', title: 'Catering Propio', desc: 'Chef y equipo culinario propio. Menús de 2 a 5 tiempos adaptados a tus preferencias.' },
              { icon: '✨', title: 'Todo Incluido', desc: 'Decoración, audio, parqueadero, personal y coordinación en un solo paquete.' }
            ].map((item) => (
              <article key={item.title} className="bg-[#FCF9F2] p-8 rounded-2xl border border-[#B7950B]/10 shadow-sm text-center">
                <span className="text-6xl block mb-6" aria-hidden="true">{item.icon}</span>
                <h3 className="font-semibold text-[#0D2137] text-lg mb-3 tracking-wide">{item.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 🌟 NUEVA SECCIÓN 3: Información Clave (Misión, Visión, QR) 🌟 */}
      <section className="py-24 px-4 bg-[#F8F9FA] border-y border-slate-100" aria-labelledby="info-titulo">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            
            {/* Lado Izquierdo: Direcciones y QR */}
            <div className="bg-white p-10 rounded-2xl shadow-lg border border-slate-100 text-center flex flex-col items-center">
              <h3 className="font-display text-2xl font-bold text-[#0D2137] mb-3">📍 Cómo llegar a la Quinta</h3>
              <p className="text-slate-600 mb-8 max-w-sm">Escanea este código QR con tu celular para obtener las direcciones exactas en Google Maps y planificar tu visita.</p>
              <img 
                src={imgQrDirections} 
                alt="Código QR con Direcciones a Quinta Inés María" 
                className="w-56 h-auto border-4 border-[#B7950B]/10 rounded-xl shadow-inner mb-8"
              />
              <a 
                href="https://maps.app.goo.gl/TU_RUTA_ACTUAL" // REEMPLAZA POR EL LINK REAL DE GOOGLE MAPS
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm font-semibold text-[#B7950B] hover:text-[#9A7D0A] flex items-center gap-2 border-b border-transparent hover:border-[#9A7D0A] pb-0.5"
              >
                 Abrir en Google Maps <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
              </a>
            </div>

            {/* Lado Derecho: Misión y Visión */}
            <div className="space-y-12">
              <div>
                <span className="text-xs font-bold uppercase text-[#B7950B] tracking-widest">Nuestra Esencia</span>
                <h2 id="info-titulo" className="mt-1 font-display text-4xl font-bold text-[#0D2137] leading-tight">Misión y Visión</h2>
                <div className="w-16 h-1 bg-[#B7950B] mt-3 rounded-full"></div>
              </div>
              
              <div className="relative group p-6 pl-10 bg-white border border-slate-100 rounded-xl shadow-sm">
                 <img src={imgMisionVision} alt="Icono Misión" className="absolute top-6 -left-6 h-12 w-auto" />
                 <h4 className="font-semibold text-lg text-[#0D2137] mb-2 tracking-wide">Misión</h4>
                 <p className="text-slate-600 text-sm leading-relaxed">Proveer un entorno natural y servicios integrales de catering y planificación de excelencia, convirtiendo cada evento en una experiencia única e inolvidable con el calor del campo ecuatoriano.</p>
              </div>

              <div className="relative p-6 pl-10 bg-white border border-slate-100 rounded-xl shadow-sm">
                 <img src={imgMisionVision} alt="Icono Visión" className="absolute top-6 -left-6 h-12 w-auto scale-x-[-1]" />
                 <h4 className="font-semibold text-lg text-[#0D2137] mb-2 tracking-wide">Visión</h4>
                 <p className="text-slate-600 text-sm leading-relaxed">Consolidarnos como la quinta de eventos líder en Chambo y la provincia de Chimborazo, reconocida por la calidad humana, la excelencia operativa y la creación de momentos de felicidad auténtica.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🌟 NUEVA SECCIÓN 4: Video Promocional 🌟 */}
      <section className="py-24 px-4 bg-white" aria-labelledby="video-titulo">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 id="video-titulo" className="font-display text-3xl sm:text-4xl font-bold text-[#0D2137]">Vívelo tú mismo</h2>
            <p className="mt-4 text-slate-600 max-w-xl mx-auto text-lg leading-relaxed">Un recorrido rápido por nuestras instalaciones y la magia que envolvemos en cada celebración.</p>
          </div>
          
          <div className="aspect-video bg-[#0D2137] rounded-3xl overflow-hidden shadow-2xl border-4 border-white ring-1 ring-slate-100 flex items-center justify-center relative group">
            {vidPromocional ? (
              <video 
                controls 
                className="w-full h-full object-cover"
                poster={bg6} // Usamos una foto del carrusel como portada del video
              >
                <source src={vidPromocional} type="video/mp4" />
                Tu navegador no soporta la reproducción de videos.
              </video>
            ) : (
                <span className="text-white/70">Video cargando...</span>
            )}
             {/* Un pequeño overlay sutil decorativo en hover */}
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </div>

          <div className="mt-12 text-center">
            <Link 
                to="/galeria" 
                className="inline-flex items-center gap-3 text-lg font-bold text-[#B7950B] hover:text-[#9A7D0A] transition-colors border-b-2 border-transparent hover:border-[#9A7D0A] pb-1"
            >
                Ver más fotos en nuestra Galería →
            </Link>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 5: CTA final (Intacto) ── */}
      <section className="py-24 px-4 bg-[#0D2137] border-t border-[#B7950B]/30" aria-labelledby="cta-titulo">
        <div className="max-w-3xl mx-auto text-center">
          <h2 id="cta-titulo" className="font-display text-4xl font-bold text-white drop-shadow-md">
            ¿Listo para crear un momento inolvidable?
          </h2>
          <p className="mt-6 text-white/70 max-w-xl mx-auto leading-relaxed text-lg font-medium">
            Usa nuestro configurador interactivo, elige tu paquete, personaliza cada detalle
            y recibe tu cotización al instante.
          </p>
          <Link to="/configurador" className="inline-block mt-10 px-12 py-4 bg-[#B7950B] text-white font-bold rounded-full hover:bg-[#9A7D0A] transition-colors shadow-xl hover:-translate-y-1 transform">
            Comenzar ahora
          </Link>
        </div>
      </section>
    </main>
  );
}