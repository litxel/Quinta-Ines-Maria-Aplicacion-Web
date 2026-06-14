import { useState, useEffect, useCallback } from 'react';
import { Search, Calendar, X, ImageIcon, Filter, FolderOpen, Camera, Pencil, Trash2, Layers } from 'lucide-react';
import {
  getImagenesAdmin,
  subirImagen,
  actualizarDetallesImagen,
  eliminarImagen,
  fetchCategorias,
  crearCategoria
} from '../../services/galeria.service';

export default function GestionGaleria() {
  const [imagenes, setImagenes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Filtros ──
  const [busqueda, setBusqueda] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [busquedaActiva, setBusquedaActiva] = useState('');
  const [fechaActiva, setFechaActiva] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');

  // Estados del modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [imagenEditando, setImagenEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [modalCategoriaAbierto, setModalCategoriaAbierto] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState({ nombre: '', descripcion: '' });

  const handleGuardarCategoria = async (e) => {
    e.preventDefault();
    try {
      await crearCategoria(nuevaCategoria);
      setModalCategoriaAbierto(false);
      setNuevaCategoria({ nombre: '', descripcion: '' });
      cargarDatos();
      alert('¡Categoría creada con éxito!');
    } catch (err) {
      alert('Error al crear categoría: ' + (err.response?.data?.message || err.message));
    }
  };

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const [imgData, catData] = await Promise.all([
        getImagenesAdmin({ busqueda: busquedaActiva, fecha: fechaActiva }),
        fetchCategorias()
      ]);
      setImagenes(imgData);
      setCategorias(catData);
    } catch (err) {
      setError('Error al cargar la galería. Revisa la consola.');
    } finally {
      setLoading(false);
    }
  }, [busquedaActiva, fechaActiva]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const aplicarFiltros = () => {
    setBusquedaActiva(busqueda);
    setFechaActiva(filtroFecha);
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroFecha('');
    setBusquedaActiva('');
    setFechaActiva('');
  };

  const hayFiltrosActivos = busquedaActiva || fechaActiva;

  const abrirModalNuevo = () => {
    setImagenEditando({
      titulo: '', alt_text: '',
      categoria_id: categorias.length > 0 ? categorias[0].categoria_id : '',
      orden_display: 99, imagen_base64: '', preview: null
    });
    setModalAbierto(true);
  };

  const abrirModalEdicion = (img) => { setImagenEditando({ ...img }); setModalAbierto(true); };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) { alert('La imagen es muy pesada. Máximo 25MB.'); return; }
      const reader = new FileReader();
      reader.onloadend = () => setImagenEditando({ ...imagenEditando, imagen_base64: reader.result, preview: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const handleGuardarCambios = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      if (imagenEditando.imagen_id) {
        await actualizarDetallesImagen(imagenEditando.imagen_id, imagenEditando);
      } else {
        if (!imagenEditando.imagen_base64) { alert("Debes seleccionar una imagen."); setGuardando(false); return; }
        await subirImagen(imagenEditando);
      }
      setModalAbierto(false);
      cargarDatos();
    } catch (err) {
      alert('Error al guardar: ' + (err.response?.data?.message || err.message));
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id, titulo) => {
    if (window.confirm(`¿Estás seguro de ELIMINAR la foto "${titulo}"? Esta acción no se puede deshacer.`)) {
      try { await eliminarImagen(id); cargarDatos(); }
      catch (err) { alert('Error al eliminar: ' + (err.response?.data?.message || err.message)); }
    }
  };

  const getCategoria = (id) => categorias.find(c => c.categoria_id === id);
  const getNombreCategoria = (id) => getCategoria(id)?.nombre || 'Sin categoría';

  const urlImg = (u) => u?.startsWith('http') ? u : `http://localhost:5000${u}`;

  // ── Agrupación por categoría ──
  const conteoPorCat = categorias.map(c => ({ ...c, count: imagenes.filter(i => i.categoria_id === c.categoria_id).length }));
  const imagenesVisibles = filtroCategoria === 'todas' ? imagenes : imagenes.filter(i => i.categoria_id === filtroCategoria);
  const catsParaMostrar = (filtroCategoria === 'todas' ? categorias : categorias.filter(c => c.categoria_id === filtroCategoria));
  const grupos = catsParaMostrar
    .map(c => ({ cat: c, imgs: imagenes.filter(i => i.categoria_id === c.categoria_id) }))
    .filter(g => g.imgs.length > 0);
  const sinCategoria = imagenesVisibles.filter(i => !categorias.some(c => c.categoria_id === i.categoria_id));

  // ── Tarjeta de imagen ──
  const TarjetaImg = ({ img }) => (
    <div className={`bg-white dark:bg-[#332247] border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group ${img.activo ? 'border-slate-200 dark:border-white/8' : 'border-red-200 dark:border-red-500/30 opacity-80'}`}>
      <div className="relative h-48 bg-slate-100 dark:bg-white/5 overflow-hidden">
        <img src={urlImg(img.url_original)} alt={img.alt_text} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        {!img.activo && (
          <div className="absolute inset-0 bg-red-900/50 flex items-center justify-center">
            <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full border border-red-300 shadow-lg">OCULTA</span>
          </div>
        )}
        {img.creado_en && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
            <p className="text-white text-[10px] font-medium opacity-90">
              📅 {new Date(img.creado_en).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <span className="text-[10px] uppercase font-bold text-[#B7950B] dark:text-[#C9A227] tracking-wider mb-1">{getNombreCategoria(img.categoria_id)}</span>
        <h3 className="font-bold text-sm text-[#0D2137] dark:text-white mb-1 line-clamp-1" title={img.titulo}>{img.titulo}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2" title={img.alt_text}>{img.alt_text}</p>
        <div className="mt-auto flex gap-2">
          <button onClick={() => abrirModalEdicion(img)} className="flex-1 py-1.5 bg-slate-100 dark:bg-white/8 text-slate-600 dark:text-slate-300 rounded-lg font-bold hover:bg-[#0D2137] dark:hover:bg-[#A971D6] hover:text-white transition-colors text-xs flex items-center justify-center gap-1">
            <Pencil size={12} /> Editar
          </button>
          <button onClick={() => handleEliminar(img.imagen_id, img.titulo)} className="px-3 py-1.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg font-bold hover:bg-red-500 hover:text-white transition-colors text-xs" title="Eliminar foto">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );

  if (error) return <div className="p-8 text-red-500 dark:text-red-400 font-bold">{error}</div>;

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[#0D2137] dark:text-white font-display">Galería de Fotos</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Sube y organiza las fotos que verán tus clientes.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setModalCategoriaAbierto(true)} className="bg-white dark:bg-[#332247] border-2 border-[#0D2137] dark:border-[#A971D6] text-[#0D2137] dark:text-[#A971D6] px-4 py-2.5 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-white/8 transition-all flex items-center gap-2">
            <FolderOpen size={17} /> Nueva Categoría
          </button>
          <button onClick={abrirModalNuevo} className="bg-[#0D2137] dark:bg-gradient-to-r dark:from-[#6B3F7A] dark:to-[#A971D6] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#1A6BAC] shadow-md hover:shadow-lg transition-all flex items-center gap-2">
            <Camera size={17} /> Subir Foto
          </button>
        </div>
      </div>

      {/* ── Barra de Filtros ── */}
      <div className="bg-white dark:bg-[#332247] border border-slate-200 dark:border-white/8 rounded-2xl p-4 mb-5 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Buscar por nombre o descripción</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)} onKeyDown={e => e.key === 'Enter' && aplicarFiltros()} placeholder="Ej: decoración boda, jardín..." className="w-full pl-9 pr-4 py-2.5 border-2 border-slate-200 dark:border-white/12 dark:bg-white/5 dark:text-white rounded-xl text-sm focus:outline-none focus:border-[#B7950B] transition-colors" />
            </div>
          </div>
          <div className="w-full sm:w-52">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Fecha de subida</label>
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input type="date" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)} className="w-full pl-9 pr-4 py-2.5 border-2 border-slate-200 dark:border-white/12 dark:bg-white/5 dark:text-white rounded-xl text-sm focus:outline-none focus:border-[#B7950B] transition-colors" />
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={aplicarFiltros} className="flex items-center gap-2 px-5 py-2.5 bg-[#0D2137] dark:bg-gradient-to-r dark:from-[#6B3F7A] dark:to-[#A971D6] text-white rounded-xl font-bold text-sm hover:bg-[#1A6BAC] transition-colors shadow-sm">
              <Filter size={15} /> Filtrar
            </button>
            {hayFiltrosActivos && (
              <button onClick={limpiarFiltros} className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-white/8 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-white/14 transition-colors">
                <X size={15} /> Limpiar
              </button>
            )}
          </div>
        </div>

        {hayFiltrosActivos && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/8 flex flex-wrap gap-2">
            {busquedaActiva && (<span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#B7950B]/10 dark:bg-[#C9A227]/15 text-[#B7950B] dark:text-[#C9A227] rounded-full text-xs font-bold"><Search size={11} /> "{busquedaActiva}"</span>)}
            {fechaActiva && (<span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 rounded-full text-xs font-bold"><Calendar size={11} /> {new Date(fechaActiva + 'T12:00:00').toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })}</span>)}
            <span className="inline-flex items-center px-3 py-1 bg-slate-100 dark:bg-white/8 text-slate-500 dark:text-slate-400 rounded-full text-xs font-medium">{imagenes.length} resultado{imagenes.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* ── Chips de categorías ── */}
      {categorias.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-7">
          <button
            onClick={() => setFiltroCategoria('todas')}
            className={`px-4 py-2 rounded-full text-xs font-bold border-2 transition-all flex items-center gap-1.5 ${
              filtroCategoria === 'todas'
                ? 'bg-[#0D2137] dark:bg-gradient-to-r dark:from-[#6B3F7A] dark:to-[#A971D6] text-white border-transparent'
                : 'bg-white dark:bg-[#332247] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-[#B7950B] dark:hover:border-[#C9A227]'
            }`}
          >
            <Layers size={13} /> Todas <span className="opacity-70">({imagenes.length})</span>
          </button>
          {conteoPorCat.map((c) => (
            <button
              key={c.categoria_id}
              onClick={() => setFiltroCategoria(c.categoria_id)}
              className={`px-4 py-2 rounded-full text-xs font-bold border-2 transition-all ${
                filtroCategoria === c.categoria_id
                  ? 'bg-[#B7950B] dark:bg-gradient-to-r dark:from-[#B7950B] dark:to-[#C9A227] text-white border-transparent shadow-md'
                  : 'bg-white dark:bg-[#332247] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-[#B7950B] dark:hover:border-[#C9A227]'
              }`}
            >
              {c.nombre} <span className="opacity-70">({c.count})</span>
            </button>
          ))}
        </div>
      )}

      {/* Grid agrupado por categoría */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#332247] border border-slate-100 dark:border-white/8 rounded-2xl overflow-hidden shadow-sm animate-pulse">
              <div className="h-48 bg-slate-200 dark:bg-white/5" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-slate-200 dark:bg-white/5 rounded w-1/3" />
                <div className="h-4 bg-slate-200 dark:bg-white/5 rounded w-2/3" />
                <div className="h-3 bg-slate-200 dark:bg-white/5 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : imagenesVisibles.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
          <ImageIcon size={48} className="mb-4 opacity-30" />
          <p className="font-bold text-lg">No se encontraron imágenes</p>
          <p className="text-sm mt-1">{hayFiltrosActivos || filtroCategoria !== 'todas' ? 'Intenta con otros criterios.' : '¡Haz clic en "Subir Foto" para empezar!'}</p>
        </div>
      ) : (
        <div className="space-y-10">
          {grupos.map(({ cat, imgs }) => (
            <section key={cat.categoria_id}>
              {/* Cabecera elegante de categoría */}
              <div className="flex items-center gap-4 mb-5">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#B7950B] to-[#C9A227] dark:from-[#6B3F7A] dark:to-[#A971D6] flex items-center justify-center text-white shadow-md shrink-0">
                  <FolderOpen size={20} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-display font-bold text-[#0D2137] dark:text-white leading-tight">{cat.nombre}</h2>
                  {cat.descripcion && <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{cat.descripcion}</p>}
                </div>
                <span className="ml-auto text-xs font-bold text-[#B7950B] dark:text-[#C9A227] bg-[#B7950B]/10 dark:bg-[#C9A227]/12 px-3 py-1.5 rounded-full shrink-0">
                  {imgs.length} foto{imgs.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="h-px bg-gradient-to-r from-[#B7950B]/40 dark:from-[#A971D6]/40 to-transparent mb-6" />
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {imgs.map((img) => <TarjetaImg key={img.imagen_id} img={img} />)}
              </div>
            </section>
          ))}

          {/* Sin categoría */}
          {sinCategoria.length > 0 && (
            <section>
              <div className="flex items-center gap-4 mb-5">
                <div className="w-11 h-11 rounded-2xl bg-slate-300 dark:bg-white/10 flex items-center justify-center text-white shrink-0"><ImageIcon size={20} /></div>
                <h2 className="text-xl font-display font-bold text-slate-500 dark:text-slate-400">Sin categoría</h2>
                <span className="ml-auto text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/8 px-3 py-1.5 rounded-full">{sinCategoria.length}</span>
              </div>
              <div className="h-px bg-slate-200 dark:bg-white/8 mb-6" />
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {sinCategoria.map((img) => <TarjetaImg key={img.imagen_id} img={img} />)}
              </div>
            </section>
          )}
        </div>
      )}

      {/* MODAL PARA SUBIR / EDITAR */}
      {modalAbierto && imagenEditando && (
        <div className="fixed inset-0 bg-[#221634]/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-[#332247] border border-transparent dark:border-white/8 rounded-3xl w-full max-w-lg p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            <h2 className="text-2xl font-display font-bold text-[#0D2137] dark:text-white mb-6">
              {imagenEditando.imagen_id ? '✏️ Editar Detalles de Foto' : '📸 Subir Nueva Foto'}
            </h2>

            <form onSubmit={handleGuardarCambios} className="space-y-4">
              {!imagenEditando.imagen_id && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Seleccionar Imagen</label>
                  <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} className="w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#B7950B]/10 dark:file:bg-[#C9A227]/15 file:text-[#B7950B] dark:file:text-[#C9A227] hover:file:bg-[#B7950B]/20 cursor-pointer" />
                </div>
              )}

              {(imagenEditando.preview || imagenEditando.url_original) && (
                <div className="w-full h-40 rounded-xl overflow-hidden bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex justify-center items-center">
                  <img src={imagenEditando.preview || urlImg(imagenEditando.url_original)} alt="Preview" className="h-full object-contain" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Título (Visible al público)</label>
                  <input type="text" required value={imagenEditando.titulo} onChange={(e) => setImagenEditando({...imagenEditando, titulo: e.target.value})} className="w-full border-2 border-slate-200 dark:border-white/12 dark:bg-white/5 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#B7950B]" placeholder="Ej: Decoración Boda Civil" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Categoría</label>
                  <select value={imagenEditando.categoria_id} onChange={(e) => setImagenEditando({...imagenEditando, categoria_id: parseInt(e.target.value)})} className="w-full border-2 border-slate-200 dark:border-white/12 dark:bg-[#3E2B57] dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#B7950B]" required>
                    <option value="" disabled>Selecciona una categoría</option>
                    {categorias.map(cat => (<option key={cat.categoria_id} value={cat.categoria_id}>{cat.nombre}</option>))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Texto descriptivo (Para accesibilidad/SEO)</label>
                  <input type="text" required value={imagenEditando.alt_text} onChange={(e) => setImagenEditando({...imagenEditando, alt_text: e.target.value})} className="w-full border-2 border-slate-200 dark:border-white/12 dark:bg-white/5 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#B7950B]" placeholder="Ej: Mesa decorada con flores blancas..." />
                </div>
              </div>

              {imagenEditando.imagen_id && (
                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl mt-2">
                  <input type="checkbox" id="activo_check_galeria" checked={imagenEditando.activo} onChange={(e) => setImagenEditando({...imagenEditando, activo: e.target.checked})} className="w-5 h-5 accent-[#B7950B] cursor-pointer" />
                  <label htmlFor="activo_check_galeria" className="text-sm font-bold text-[#0D2137] dark:text-white cursor-pointer">Imagen Visible en la Galería Pública</label>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setModalAbierto(false)} disabled={guardando} className="flex-1 py-3 text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-white/8 hover:bg-slate-200 dark:hover:bg-white/14 rounded-xl font-bold transition-colors">Cancelar</button>
                <button type="submit" disabled={guardando} className="flex-1 py-3 bg-[#B7950B] dark:bg-gradient-to-r dark:from-[#B7950B] dark:to-[#C9A227] text-white rounded-xl font-bold hover:bg-[#9A7D0A] shadow-md transition-all flex justify-center items-center gap-2">
                  {guardando ? '⏳ Guardando...' : '💾 Guardar Foto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA NUEVA CATEGORÍA */}
      {modalCategoriaAbierto && (
        <div className="fixed inset-0 bg-[#221634]/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-[#332247] border border-transparent dark:border-white/8 rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-display font-bold text-[#0D2137] dark:text-white mb-6">📁 Crear Nueva Categoría</h2>
            <form onSubmit={handleGuardarCategoria} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Nombre de la Categoría</label>
                <input type="text" required value={nuevaCategoria.nombre} onChange={(e) => setNuevaCategoria({...nuevaCategoria, nombre: e.target.value})} className="w-full border-2 border-slate-200 dark:border-white/12 dark:bg-white/5 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#B7950B]" placeholder="Ej: Bautizos" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Descripción (Opcional)</label>
                <input type="text" value={nuevaCategoria.descripcion} onChange={(e) => setNuevaCategoria({...nuevaCategoria, descripcion: e.target.value})} className="w-full border-2 border-slate-200 dark:border-white/12 dark:bg-white/5 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#B7950B]" placeholder="Breve frase que saldrá en la página pública..." />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setModalCategoriaAbierto(false)} className="flex-1 py-3 text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-white/8 hover:bg-slate-200 dark:hover:bg-white/14 rounded-xl font-bold transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-[#B7950B] dark:bg-gradient-to-r dark:from-[#B7950B] dark:to-[#C9A227] text-white rounded-xl font-bold hover:bg-[#9A7D0A] shadow-md transition-all">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
