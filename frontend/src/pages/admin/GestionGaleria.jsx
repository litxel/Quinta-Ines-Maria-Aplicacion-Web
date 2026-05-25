import { useState, useEffect } from 'react';
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
      cargarDatos(); // Recarga para que asome en el selector
      alert('¡Categoría creada con éxito!');
    } catch (err) {
      alert('Error al crear categoría: ' + (err.response?.data?.message || err.message));
    }
  };

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [imgData, catData] = await Promise.all([
        getImagenesAdmin(),
        fetchCategorias()
      ]);
      setImagenes(imgData);
      setCategorias(catData);
    } catch (err) {
      setError('Error al cargar la galería. Revisa la consola.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  // ── ABRIR MODAL PARA FOTO NUEVA ──
  const abrirModalNuevo = () => {
    setImagenEditando({
      titulo: '',
      alt_text: '',
      categoria_id: categorias.length > 0 ? categorias[0].categoria_id : '',
      orden_display: 99,
      imagen_base64: '', // Aquí guardaremos el texto de la imagen
      preview: null      // Para mostrar la foto antes de subirla
    });
    setModalAbierto(true);
  };

  // ── ABRIR MODAL PARA EDITAR FOTO EXISTENTE ──
  const abrirModalEdicion = (img) => {
    setImagenEditando({ ...img });
    setModalAbierto(true);
  };

  // ── CONVERTIR ARCHIVO A BASE64 AL SELECCIONARLO ──
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tamaño (Opcional, ej: max 5MB)
      if (file.size > 25 * 1024 * 1024) {
        alert('La imagen es muy pesada. Máximo 25MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagenEditando({ 
          ...imagenEditando, 
          imagen_base64: reader.result, 
          preview: reader.result // Usamos el base64 como preview temporal
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // ── GUARDAR (CREAR O ACTUALIZAR) ──
  const handleGuardarCambios = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      if (imagenEditando.imagen_id) {
        // ACTUALIZAR (Solo enviamos los textos y estado)
        await actualizarDetallesImagen(imagenEditando.imagen_id, imagenEditando);
      } else {
        // SUBIR NUEVA
        if (!imagenEditando.imagen_base64) {
          alert("Debes seleccionar una imagen.");
          setGuardando(false);
          return;
        }
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

  // ── ELIMINAR FOTO ──
  const handleEliminar = async (id, titulo) => {
    const confirmar = window.confirm(`¿Estás seguro de ELIMINAR la foto "${titulo}"? Esta acción no se puede deshacer.`);
    if (confirmar) {
      try {
        await eliminarImagen(id);
        cargarDatos();
      } catch (err) {
        alert('Error al eliminar: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Helper para buscar el nombre de la categoría
  const getNombreCategoria = (id) => {
    const cat = categorias.find(c => c.categoria_id === id);
    return cat ? cat.nombre : 'Sin categoría';
  };

  if (loading) return <div className="p-8 text-slate-500 font-medium animate-pulse">Cargando galería...</div>;
  if (error) return <div className="p-8 text-red-500 font-bold">{error}</div>;

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#0D2137] font-display">Galería de Fotos</h1>
          <p className="text-sm text-slate-500 mt-1">Sube y organiza las fotos que verán tus clientes.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setModalCategoriaAbierto(true)} 
            className="bg-white border-2 border-[#0D2137] text-[#0D2137] px-4 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <span>📁</span> Nueva Categoría
          </button>
          <button 
            onClick={abrirModalNuevo} 
            className="bg-[#0D2137] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#1A6BAC] shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            <span>📸</span> Subir Foto
          </button>
        </div>
      </div>

      {/* Grid de Imágenes tipo Masonry/Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {imagenes.map((img) => (
          <div key={img.imagen_id} className={`bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col ${img.activo ? 'border-slate-200' : 'border-red-200 opacity-80'}`}>
            
            {/* Contenedor de la Imagen */}
            <div className="relative h-48 bg-slate-100">
              {/* Ajusta la ruta base si tu backend corre en otro puerto, ej: http://localhost:3000 */}
              <img 
                src={img.url_original.startsWith('http') ? img.url_original : `http://localhost:5000${img.url_original}`} 
                alt={img.alt_text} 
                className="w-full h-full object-cover"
              />
              {!img.activo && (
                <div className="absolute inset-0 bg-red-900/50 flex items-center justify-center">
                  <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full border border-red-300 shadow-lg">OCULTA</span>
                </div>
              )}
            </div>

            {/* Detalles de la Imagen */}
            <div className="p-4 flex flex-col flex-1">
              <span className="text-[10px] uppercase font-bold text-[#B7950B] tracking-wider mb-1">
                {getNombreCategoria(img.categoria_id)}
              </span>
              <h3 className="font-bold text-sm text-[#0D2137] mb-1 line-clamp-1" title={img.titulo}>{img.titulo}</h3>
              <p className="text-xs text-slate-500 mb-4 line-clamp-2" title={img.alt_text}>{img.alt_text}</p>
              
              <div className="mt-auto flex gap-2">
                <button 
                  onClick={() => abrirModalEdicion(img)}
                  className="flex-1 py-1.5 bg-slate-100 text-slate-600 rounded-lg font-bold hover:bg-[#0D2137] hover:text-white transition-colors text-xs"
                >
                  ✏️ Editar
                </button>
                <button 
                  onClick={() => handleEliminar(img.imagen_id, img.titulo)}
                  className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-500 hover:text-white transition-colors text-xs"
                  title="Eliminar foto"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {imagenes.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500">
            No hay fotos en la galería. ¡Haz clic en "Subir Foto" para empezar!
          </div>
        )}
      </div>

      {/* MODAL PARA SUBIR / EDITAR */}
      {modalAbierto && imagenEditando && (
        <div className="fixed inset-0 bg-[#0D2137]/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-display font-bold text-[#0D2137] mb-6">
              {imagenEditando.imagen_id ? '✏️ Editar Detalles de Foto' : '📸 Subir Nueva Foto'}
            </h2>
            
            <form onSubmit={handleGuardarCambios} className="space-y-4">
              
              {/* SOLO MOSTRAR INPUT DE ARCHIVO SI ES NUEVA */}
              {!imagenEditando.imagen_id && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Seleccionar Imagen</label>
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleFileChange}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#B7950B]/10 file:text-[#B7950B] hover:file:bg-[#B7950B]/20 cursor-pointer"
                  />
                </div>
              )}

              {/* PREVIEW DE LA IMAGEN */}
              {(imagenEditando.preview || imagenEditando.url_original) && (
                <div className="w-full h-40 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex justify-center items-center">
                  <img 
                    src={imagenEditando.preview || (imagenEditando.url_original.startsWith('http') ? imagenEditando.url_original : `http://localhost:5000${imagenEditando.url_original}`)} 
                    alt="Preview" 
                    className="h-full object-contain"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Título (Visible al público)</label>
                  <input type="text" required value={imagenEditando.titulo} onChange={(e) => setImagenEditando({...imagenEditando, titulo: e.target.value})} className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#B7950B]" placeholder="Ej: Decoración Boda Civil" />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Categoría</label>
                  <select 
                    value={imagenEditando.categoria_id} 
                    onChange={(e) => setImagenEditando({...imagenEditando, categoria_id: parseInt(e.target.value)})}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#B7950B]"
                    required
                  >
                    <option value="" disabled>Selecciona una categoría</option>
                    {categorias.map(cat => (
                      <option key={cat.categoria_id} value={cat.categoria_id}>{cat.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Texto descriptivo (Para accesibilidad/SEO)</label>
                  <input type="text" required value={imagenEditando.alt_text} onChange={(e) => setImagenEditando({...imagenEditando, alt_text: e.target.value})} className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#B7950B]" placeholder="Ej: Mesa decorada con flores blancas..." />
                </div>
              </div>

              {/* Toggle de Estado (Solo si estamos editando) */}
              {imagenEditando.imagen_id && (
                <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl mt-2">
                  <input 
                    type="checkbox" 
                    id="activo_check_galeria"
                    checked={imagenEditando.activo}
                    onChange={(e) => setImagenEditando({...imagenEditando, activo: e.target.checked})}
                    className="w-5 h-5 accent-[#B7950B] cursor-pointer"
                  />
                  <label htmlFor="activo_check_galeria" className="text-sm font-bold text-[#0D2137] cursor-pointer">
                    Imagen Visible en la Galería Pública
                  </label>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setModalAbierto(false)} disabled={guardando} className="flex-1 py-3 text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition-colors">Cancelar</button>
                <button type="submit" disabled={guardando} className="flex-1 py-3 bg-[#B7950B] text-white rounded-xl font-bold hover:bg-[#9A7D0A] shadow-md transition-all flex justify-center items-center gap-2">
                  {guardando ? '⏳ Guardando...' : '💾 Guardar Foto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL PARA NUEVA CATEGORÍA */}
      {modalCategoriaAbierto && (
        <div className="fixed inset-0 bg-[#0D2137]/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-display font-bold text-[#0D2137] mb-6">📁 Crear Nueva Categoría</h2>
            <form onSubmit={handleGuardarCategoria} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Nombre de la Categoría</label>
                <input type="text" required value={nuevaCategoria.nombre} onChange={(e) => setNuevaCategoria({...nuevaCategoria, nombre: e.target.value})} className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#B7950B]" placeholder="Ej: Bautizos" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Descripción (Opcional)</label>
                <input type="text" value={nuevaCategoria.descripcion} onChange={(e) => setNuevaCategoria({...nuevaCategoria, descripcion: e.target.value})} className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#B7950B]" placeholder="Breve frase que saldrá en la página pública..." />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setModalCategoriaAbierto(false)} className="flex-1 py-3 text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-[#B7950B] text-white rounded-xl font-bold hover:bg-[#9A7D0A] shadow-md transition-all">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}