import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
// 🆕 NUEVO: Importamos las funciones para traer los datos reales de tu base de datos
import { fetchImagenes, fetchCategorias } from '../services/galeria.service';

// ── Componente ImageWithSkeleton (Se mantiene intacto por su excelente rendimiento) ──
const ImageWithSkeleton = ({ src, alt, onClick, className }) => {
  const [cargado, setCargado] = useState(false);

  return (
    <div className={`relative w-full h-full rounded-2xl overflow-hidden ${!cargado ? 'animate-pulse bg-slate-200' : ''}`}>
      <img
        src={src}
        alt={alt}
        onLoad={() => setCargado(true)}
        onClick={onClick}
        loading="lazy"
        className={`${className} ${cargado ? 'opacity-100' : 'opacity-0'} transition-opacity duration-700 ease-in-out`}
      />
    </div>
  );
};

// ============================================================================
// ⚙️ COMPONENTE PRINCIPAL
// ============================================================================
export default function Galeria() {
  const [filtroActivo, setFiltroActivo] = useState('Todos');
  const [lightbox, setLightbox] = useState(null);
  
  // 🆕 NUEVO: Estados para guardar los datos reales del backend
  const [seccionesDinamicas, setSeccionesDinamicas] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🆕 NUEVO: Efecto para cargar los datos desde PostgreSQL al abrir la página
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        // Pedimos las categorías y las imágenes activas al mismo tiempo
        const [categoriasDB, imagenesDB] = await Promise.all([
          fetchCategorias(),
          fetchImagenes()
        ]);

        // 🧠 MAGIA: Agrupamos las imágenes dentro de sus categorías para mantener tu diseño original
        const seccionesFormateadas = categoriasDB.map(cat => {
          // Filtramos solo las imágenes de esta categoría
          const fotosDeCategoria = imagenesDB
            .filter(img => img.categoria_id === cat.categoria_id)
            .map(img => ({
              id: img.imagen_id,
              // Ajustamos la URL al puerto 5000 de tu backend
              url: img.url_original.startsWith('http') ? img.url_original : `http://localhost:5000${img.url_original}`,
              titulo: img.titulo,
              alt_text: img.alt_text
            }));

          return {
            id: cat.categoria_id, // Usamos el ID numérico de la BD
            boton: cat.nombre,
            titulo: cat.nombre,
            descripcion: cat.descripcion || `Momentos inolvidables de ${cat.nombre.toLowerCase()} en la Quinta Inés María.`,
            imagenes: fotosDeCategoria
          };
        }).filter(sec => sec.imagenes.length > 0); // Solo mostramos categorías que SÍ tengan fotos subidas

        setSeccionesDinamicas(seccionesFormateadas);
      } catch (error) {
        console.error("Error al cargar la galería pública:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  // Filtramos qué secciones mostrar según el botón presionado
  const seccionesMostradas = seccionesDinamicas.filter(
    (seccion) => filtroActivo === 'Todos' || filtroActivo === seccion.id
  );

  // Aplanamos todas las imágenes visibles para poder navegar en el Lightbox
  const todasLasImagenesVisibles = useMemo(() => {
    return seccionesMostradas.flatMap(sec => sec.imagenes);
  }, [seccionesMostradas]);

  // Lógica de navegación del Lightbox (Intacta)
  const handleNavegacion = useCallback((direccion, e) => {
    e.stopPropagation();
    if (!lightbox) return;
    
    const currentIndex = todasLasImagenesVisibles.findIndex(img => img.id === lightbox.id);
    let newIndex;

    if (direccion === 'siguiente') {
      newIndex = currentIndex === todasLasImagenesVisibles.length - 1 ? 0 : currentIndex + 1;
    } else {
      newIndex = currentIndex === 0 ? todasLasImagenesVisibles.length - 1 : currentIndex - 1;
    }
    setLightbox(todasLasImagenesVisibles[newIndex]);
  }, [lightbox, todasLasImagenesVisibles]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') setLightbox(null);
    if (e.key === 'ArrowRight') handleNavegacion('siguiente', e);
    if (e.key === 'ArrowLeft') handleNavegacion('anterior', e);
  }, [handleNavegacion]);

  useEffect(() => {
    if (lightbox) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; 
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [lightbox, handleKeyDown]);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] pt-28">
        <div className="text-xl font-bold text-[#0D2137] animate-pulse">Cargando memorias inolvidables...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen pt-28 pb-16 bg-[#F8F9FA]">
      
      {/* ── Encabezado ── */}
      <section className="text-center px-4 mb-10">
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#0D2137]">
          Nuestra Galería
        </h1>
        <div className="w-24 h-1 bg-[#B7950B] mx-auto mt-4 rounded-full"></div>
        <p className="mt-6 text-slate-600 max-w-xl mx-auto leading-relaxed text-lg">
          Descubre la magia de cada celebración en la Quinta Inés María.
        </p>
      </section>

      {/* ── Botones de Filtro (Se generan solos según las categorías que tengan fotos) ── */}
      {seccionesDinamicas.length > 0 ? (
        <div className="flex flex-wrap justify-center gap-3 px-4 mb-16 max-w-5xl mx-auto">
          <button
            onClick={() => setFiltroActivo('Todos')}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 shadow-sm ${
              filtroActivo === 'Todos'
                ? 'bg-[#0D2137] text-white scale-105 shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-[#B7950B] hover:text-[#B7950B]'
            }`}
          >
            Todos
          </button>
          {seccionesDinamicas.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setFiltroActivo(sec.id)}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 shadow-sm ${
                filtroActivo === sec.id
                  ? 'bg-[#0D2137] text-white scale-105 shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-[#B7950B] hover:text-[#B7950B]'
              }`}
            >
              {sec.boton}
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center text-slate-500 py-10">
          Próximamente estaremos subiendo nuestras mejores fotos.
        </div>
      )}

      {/* ── Renderizado de Secciones e Imágenes ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <AnimatePresence mode="popLayout">
          {seccionesMostradas.map((seccion) => (
            <motion.section 
              key={seccion.id} 
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
            >
              
              {/* Título de la Categoría */}
              <div className="mb-8 border-b border-[#B7950B]/20 pb-4">
                <h2 className="text-3xl font-display font-bold text-[#0D2137]">
                  {seccion.titulo}
                </h2>
                <p className="text-slate-500 mt-2 font-medium">{seccion.descripcion}</p>
              </div>

              {/* Layout Masonry puro con Tailwind */}
              <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
                {seccion.imagenes.map((img) => (
                  <motion.div 
                    layout
                    key={img.id} 
                    onClick={() => setLightbox(img)}
                    className="break-inside-avoid group relative overflow-hidden rounded-2xl cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100"
                  >
                    <ImageWithSkeleton 
                      src={img.url} 
                      alt={img.alt_text} // Usamos el texto alt_text SEO que guarda el admin
                      className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0D2137]/90 via-[#0D2137]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                      <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300 flex items-center gap-3">
                        <div className="bg-[#B7950B] p-2 rounded-full text-white">
                          <Search size={18} />
                        </div>
                        <span className="text-white font-medium text-lg border-b border-transparent group-hover:border-[#B7950B] transition-colors duration-500">
                          {img.titulo}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Lightbox (Visor de Imagen Ampliada) ── */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#0D2137]/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
            onClick={() => setLightbox(null)}
          >
            <div className="relative max-w-6xl w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
              
              <button
                onClick={() => setLightbox(null)}
                className="absolute -top-12 right-0 sm:-right-12 text-white/50 hover:text-white transition-colors focus:outline-none bg-black/20 p-2 rounded-full"
                aria-label="Cerrar visor"
              >
                <X size={32} />
              </button>

              <button 
                onClick={(e) => handleNavegacion('anterior', e)}
                className="absolute left-2 sm:-left-12 top-1/2 -translate-y-1/2 text-white/50 hover:text-white bg-black/20 hover:bg-black/40 p-3 rounded-full transition-all focus:outline-none"
              >
                <ChevronLeft size={36} />
              </button>

              <button 
                onClick={(e) => handleNavegacion('siguiente', e)}
                className="absolute right-2 sm:-right-12 top-1/2 -translate-y-1/2 text-white/50 hover:text-white bg-black/20 hover:bg-black/40 p-3 rounded-full transition-all focus:outline-none"
              >
                <ChevronRight size={36} />
              </button>

              <motion.img
                key={lightbox.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                src={lightbox.url}
                alt={lightbox.alt_text}
                className="w-full h-auto max-h-[85vh] object-contain rounded-xl shadow-2xl ring-1 ring-white/10"
              />
              
              {lightbox.titulo && (
                <div className="mt-6 text-center bg-black/30 px-6 py-2 rounded-full backdrop-blur-sm">
                  <h3 className="text-white font-medium text-xl tracking-wide">{lightbox.titulo}</h3>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}