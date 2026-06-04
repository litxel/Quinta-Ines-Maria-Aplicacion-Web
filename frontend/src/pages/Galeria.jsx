import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronLeft, ChevronRight, X, ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { fetchImagenes, fetchCategorias } from '../services/galeria.service';

// ── Componente ImageWithSkeleton ──────────────────────────────────────────────
const ImageWithSkeleton = ({ src, alt, onClick, className }) => {
  const [cargado, setCargado] = useState(false);
  return (
    <div className={`relative w-full h-full rounded-2xl overflow-hidden ${!cargado ? 'animate-pulse bg-slate-200' : ''}`}>
      <img
        src={src} alt={alt}
        onLoad={() => setCargado(true)}
        onClick={onClick}
        loading="lazy"
        className={`${className} ${cargado ? 'opacity-100' : 'opacity-0'} transition-opacity duration-700 ease-in-out`}
      />
    </div>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export default function Galeria() {
  const [lightbox,   setLightbox]   = useState(null);
  const [secciones,  setSecciones]  = useState([]);     // secciones por categoría
  const [loading,    setLoading]    = useState(true);
  const [orden,      setOrden]      = useState('desc'); // 'desc' = más nuevas primero
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const secRefs = useRef({});                           // refs para scroll anchor

  // Cargar datos al montar
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        const [categoriasDB, imagenesDB] = await Promise.all([
          fetchCategorias(),
          fetchImagenes()
        ]);

        // Filtrar categoría "Todos" y ordenar por orden_display
        const categoriasValidas = categoriasDB
          .filter(c => c.slug !== 'todos' && c.nombre.toLowerCase() !== 'todos')
          .sort((a, b) => a.orden_display - b.orden_display || a.nombre.localeCompare(b.nombre));

        // Construir secciones agrupando imágenes por categoría
        const seccionesFormateadas = categoriasValidas.map(cat => {
          const fotosDeCategoria = imagenesDB
            .filter(img => img.categoria_id === cat.categoria_id)
            .map(img => ({
              id:       img.imagen_id,
              url:      img.url_original.startsWith('http')
                          ? img.url_original
                          : `http://localhost:5000${img.url_original}`,
              titulo:   img.titulo,
              alt_text: img.alt_text,
            }));
          return {
            id:          cat.categoria_id,
            slug:        cat.slug,
            boton:       cat.nombre,
            titulo:      cat.nombre,
            descripcion: cat.descripcion || `Momentos inolvidables de ${cat.nombre.toLowerCase()} en la Quinta Inés María.`,
            imagenes:    fotosDeCategoria,
          };
        }).filter(s => s.imagenes.length > 0);

        setSecciones(seccionesFormateadas);
      } catch (error) {
        console.error('Error al cargar la galería:', error);
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, []);

  // Imágenes de cada sección ordenadas según el dropdown
  const seccionesOrdenadas = useMemo(() => {
    return secciones.map(sec => ({
      ...sec,
      imagenes: [...sec.imagenes].sort((a, b) =>
        orden === 'desc' ? b.id - a.id : a.id - b.id
      ),
    }));
  }, [secciones, orden]);

  // Todas las imágenes aplanadas para el lightbox (con orden aplicado)
  const todasLasImagenes = useMemo(
    () => seccionesOrdenadas.flatMap(s => s.imagenes),
    [seccionesOrdenadas]
  );

  // Scroll suave a la sección al presionar el botón de categoría
  const scrollASeccion = (seccion) => {
    const el = secRefs.current[seccion.id];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Navegación lightbox
  const handleNavegacion = useCallback((dir, e) => {
    e.stopPropagation();
    if (!lightbox) return;
    const idx = todasLasImagenes.findIndex(img => img.id === lightbox.id);
    const next = dir === 'siguiente'
      ? (idx === todasLasImagenes.length - 1 ? 0 : idx + 1)
      : (idx === 0 ? todasLasImagenes.length - 1 : idx - 1);
    setLightbox(todasLasImagenes[next]);
  }, [lightbox, todasLasImagenes]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape')     setLightbox(null);
    if (e.key === 'ArrowRight') handleNavegacion('siguiente', e);
    if (e.key === 'ArrowLeft')  handleNavegacion('anterior', e);
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

  const ordenLabel = orden === 'desc' ? 'Más nuevas primero' : 'Más antiguas primero';

  return (
    <main className="min-h-screen pt-28 pb-16 bg-[#F8F9FA]">

      {/* ── Encabezado ── */}
      <section className="text-center px-4 mb-10">
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#0D2137]">
          Nuestra Galería
        </h1>
        <div className="w-24 h-1 bg-[#B7950B] mx-auto mt-4 rounded-full" />
        <p className="mt-6 text-slate-600 max-w-xl mx-auto leading-relaxed text-lg">
          Descubre la magia de cada celebración en la Quinta Inés María.
        </p>
      </section>

      {/* ── Botones de Filtro por categoría (sin "Todos") ── */}
      {secciones.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3 px-4 mb-8 max-w-5xl mx-auto">
          {secciones.map((sec) => (
            <button
              key={sec.id}
              onClick={() => scrollASeccion(sec)}
              className="px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 shadow-sm bg-white text-slate-600 border border-slate-200 hover:border-[#B7950B] hover:text-[#B7950B] hover:shadow-md"
            >
              {sec.boton}
            </button>
          ))}
        </div>
      )}

      {/* ── Barra de controles: totales + dropdown de orden ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex items-center justify-between">
          <p className="text-slate-500 text-sm font-medium">
            <span className="font-bold text-[#0D2137]">{todasLasImagenes.length}</span> fotos en{' '}
            <span className="font-bold text-[#0D2137]">{secciones.length}</span>{' '}
            {secciones.length === 1 ? 'categoría' : 'categorías'}
          </p>

          {/* Dropdown de orden */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(v => !v)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:border-[#B7950B] hover:text-[#B7950B] transition-all shadow-sm"
              aria-haspopup="listbox"
              aria-expanded={dropdownOpen}
            >
              <ArrowUpDown size={16} />
              {ordenLabel}
              <ChevronRight size={14} className={`transition-transform ${dropdownOpen ? 'rotate-90' : ''}`} />
            </button>
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-40"
                  role="listbox"
                >
                  {[
                    { value: 'desc', label: 'Más nuevas primero', icon: ArrowDown },
                    { value: 'asc',  label: 'Más antiguas primero', icon: ArrowUp },
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      role="option"
                      aria-selected={orden === value}
                      onClick={() => { setOrden(value); setDropdownOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors text-left ${
                        orden === value ? 'bg-[#0D2137] text-white' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Icon size={15} /> {label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Secciones por categoría ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {secciones.length === 0 ? (
          <div className="text-center text-slate-500 py-20">
            <p className="text-5xl mb-4">📷</p>
            <p className="text-lg font-medium">Próximamente estaremos subiendo nuestras mejores fotos.</p>
          </div>
        ) : (
          seccionesOrdenadas.map((seccion) => (
            <section
              key={seccion.id}
              ref={el => { secRefs.current[seccion.id] = el; }}
              style={{ scrollMarginTop: '110px' }}
            >
              {/* Encabezado de sección */}
              <div className="mb-8 border-b border-[#B7950B]/20 pb-4">
                <h2 className="text-3xl font-display font-bold text-[#0D2137]">{seccion.titulo}</h2>
                <p className="text-slate-500 mt-2 font-medium">{seccion.descripcion}</p>
              </div>

              {/* Masonry de imágenes */}
              <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-5 space-y-5">
                {seccion.imagenes.map((img) => (
                  <motion.div
                    layout key={img.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    onClick={() => setLightbox(img)}
                    className="break-inside-avoid group relative overflow-hidden rounded-2xl cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100"
                  >
                    <ImageWithSkeleton
                      src={img.url}
                      alt={img.alt_text || img.titulo}
                      className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0D2137]/90 via-[#0D2137]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                      <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300 flex items-center gap-3">
                        <div className="bg-[#B7950B] p-2 rounded-full text-white shrink-0">
                          <Search size={16} />
                        </div>
                        <span className="text-white font-medium text-sm truncate">{img.titulo}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#0D2137]/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
            onClick={() => setLightbox(null)}
          >
            <div className="relative max-w-6xl w-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
              <button onClick={() => setLightbox(null)}
                className="absolute -top-12 right-0 sm:-right-12 text-white/50 hover:text-white transition-colors bg-black/20 p-2 rounded-full"
                aria-label="Cerrar visor">
                <X size={32} />
              </button>
              <button onClick={e => handleNavegacion('anterior', e)}
                className="absolute left-2 sm:-left-12 top-1/2 -translate-y-1/2 text-white/50 hover:text-white bg-black/20 hover:bg-black/40 p-3 rounded-full transition-all"
                aria-label="Imagen anterior">
                <ChevronLeft size={36} />
              </button>
              <button onClick={e => handleNavegacion('siguiente', e)}
                className="absolute right-2 sm:-right-12 top-1/2 -translate-y-1/2 text-white/50 hover:text-white bg-black/20 hover:bg-black/40 p-3 rounded-full transition-all"
                aria-label="Imagen siguiente">
                <ChevronRight size={36} />
              </button>
              <motion.img
                key={lightbox.id}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                src={lightbox.url} alt={lightbox.alt_text || lightbox.titulo}
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