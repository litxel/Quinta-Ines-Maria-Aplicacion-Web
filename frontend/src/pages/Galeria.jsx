import { useState, useEffect, useCallback } from 'react';
import { fetchImagenes, fetchCategorias } from '../services/galeria.service';

/**
 * Página de Galería.
 *
 * Columnas reales usadas del JSON de la API:
 *   imagen.imagen_id       → key
 *   imagen.url_thumbnail   → src de la miniatura en la grid
 *   imagen.url_original    → src del lightbox (imagen grande)
 *   imagen.url_webp        → versión WebP optimizada (si existe)
 *   imagen.alt_text        → atributo alt (WCAG 2.1)
 *   imagen.titulo          → título visible en hover
 *   imagen.categoria_id    → para filtrar
 *   imagen.destacada       → para marcar visualmente
 *
 *   categoria.categoria_id → valor del filtro
 *   categoria.nombre       → etiqueta del botón
 *   categoria.slug         → identificador amigable
 */
export default function Galeria() {
  const [categorias,    setCategorias]    = useState([]);
  const [imagenes,      setImagenes]      = useState([]);
  const [catActiva,     setCatActiva]     = useState(0);   // 0 = "Todos"
  const [loading,       setLoading]       = useState(true);
  const [loadingCats,   setLoadingCats]   = useState(true);
  const [error,         setError]         = useState(null);
  const [lightbox,      setLightbox]      = useState(null); // imagen abierta

  // Cargar categorías una sola vez
  useEffect(() => {
    fetchCategorias()
      .then(setCategorias)
      .catch(console.error)
      .finally(() => setLoadingCats(false));
  }, []);

  // Cargar imágenes cuando cambia la categoría activa
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchImagenes(catActiva === 0 ? null : catActiva)
      .then(setImagenes)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [catActiva]);

  // Cerrar lightbox con Escape
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') setLightbox(null);
  }, []);

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

  return (
    <main className="min-h-screen pt-24 pb-16 bg-[#FDF8F0]">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="text-center px-4 mb-10">
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#0D2137] section-line">
          Galería de Eventos
        </h1>
        <p className="mt-6 text-slate-600 max-w-xl mx-auto leading-relaxed">
          Descubre la magia de cada celebración en la Quinta Inés María.
          Filtra por tipo de evento para encontrar tu inspiración.
        </p>
      </section>

      {/* ── Filtros de categoría ─────────────────────────────────────────── */}
      {!loadingCats && categorias.length > 0 && (
        <div
          className="flex flex-wrap justify-center gap-2 px-4 mb-10"
          role="tablist"
          aria-label="Filtrar por categoría"
        >
          {categorias.map((cat) => (
            <button
              key={cat.categoria_id}
              role="tab"
              aria-selected={catActiva === cat.categoria_id}
              onClick={() => setCatActiva(cat.categoria_id)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1A6BAC] focus:ring-offset-2 ${
                catActiva === cat.categoria_id
                  ? 'bg-[#0D2137] text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-[#0D2137] hover:text-[#0D2137]'
              }`}
            >
              {cat.nombre}
            </button>
          ))}
        </div>
      )}

      {/* ── Estado de carga ──────────────────────────────────────────────── */}
      {loading && (
        <div className="flex justify-center items-center py-20" role="status" aria-live="polite">
          <div className="spinner" />
          <span className="sr-only">Cargando imágenes…</span>
        </div>
      )}

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && (
        <div className="max-w-md mx-auto px-4" role="alert">
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center">
            <p className="text-red-700 font-medium">Error al cargar la galería.</p>
            <p className="text-red-500 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* ── Grid de imágenes ─────────────────────────────────────────────── */}
      {!loading && !error && (
        <section
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          aria-label="Imágenes de la galería"
        >
          {imagenes.length === 0 ? (
            <p className="text-center text-slate-400 py-20">
              No hay imágenes en esta categoría todavía.
            </p>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
              {imagenes.map((img) => (
                <button
                  key={img.imagen_id}
                  onClick={() => setLightbox(img)}
                  className="block w-full break-inside-avoid rounded-xl overflow-hidden cursor-pointer group focus:outline-none focus:ring-2 focus:ring-[#1A6BAC] focus:ring-offset-2 relative"
                  aria-label={`Ver imagen: ${img.alt_text}`}
                >
                  {/* Imagen — usa url_thumbnail para la grid, url_webp si existe */}
                  <picture>
                    {img.url_webp && (
                      <source srcSet={img.url_webp} type="image/webp" />
                    )}
                    <img
                      src={img.url_thumbnail ?? img.url_original}
                      alt={img.alt_text}   // ← columna real del SQL
                      loading="lazy"
                      decoding="async"
                      className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </picture>

                  {/* Overlay con título al hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                    <span className="text-white text-sm font-medium line-clamp-2">
                      {img.titulo}
                    </span>
                  </div>

                  {/* Badge "Destacada" */}
                  {img.destacada && (
                    <span
                      className="absolute top-2 right-2 bg-[#B7950B] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                      aria-label="Imagen destacada"
                    >
                      ★
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Lightbox ─────────────────────────────────────────────────────── */}
      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.alt_text}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative max-w-5xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón cerrar */}
            <button
              onClick={() => setLightbox(null)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white text-3xl leading-none focus:outline-none"
              aria-label="Cerrar imagen"
            >
              ×
            </button>

            {/* Imagen original en lightbox */}
            <picture>
              {lightbox.url_webp && (
                <source srcSet={lightbox.url_webp} type="image/webp" />
              )}
              <img
                src={lightbox.url_original}   // ← url_original para alta calidad
                alt={lightbox.alt_text}
                className="w-full h-auto max-h-[80vh] object-contain rounded-xl"
              />
            </picture>

            {/* Pie del lightbox */}
            {(lightbox.titulo || lightbox.descripcion) && (
              <div className="mt-3 text-center">
                {lightbox.titulo && (
                  <h3 className="text-white font-semibold">{lightbox.titulo}</h3>
                )}
                {lightbox.descripcion && (
                  <p className="text-white/60 text-sm mt-1">{lightbox.descripcion}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
