import { useState, useEffect, useRef } from 'react';
import LucideIcon from '../../components/shared/LucideIcon';
import { 
  getPaquetesAdmin, actualizarPaquete, crearPaquete, desactivarPaquete,
  agregarServicioPaquete, eliminarServicioPaquete, actualizarServicioPaquete,
  getTiposAdmin, crearTipo, actualizarTipo, desactivarTipo,
  getEstilosAdmin, crearEstilo, actualizarEstilo, desactivarEstilo,
  getCentrosAdmin, crearCentro, actualizarCentro, desactivarCentro,
  getExtrasAdmin, crearExtra, actualizarExtra, desactivarExtra
} from '../../services/catalogo.service';
import { Package, GlassWater, GripHorizontal, Sparkles, Plus, Edit2, Trash2, X, Settings2, Eye, EyeOff } from 'lucide-react';

const TABS = [
  { id: 'paquetes', label: 'Paquetes Principales', icon: <Package size={18} /> },
  { id: 'tipos',    label: 'Tipos de Evento',      icon: <Sparkles size={18} /> },
  { id: 'estilos',  label: 'Estilos Decoración',   icon: <GlassWater size={18} /> },
  { id: 'centros',  label: 'Centros de Mesa',      icon: <GripHorizontal size={18} /> },
  { id: 'extras',   label: 'Servicios Extras',     icon: <Settings2 size={18} /> }
];

export default function GestionCatalogo() {
  const [activeTab, setActiveTab] = useState('paquetes');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // ── ESTADOS GLOBALES DEL MODAL ──
  const [modalAbierto, setModalAbierto] = useState(false);
  const [itemEditando, setItemEditando] = useState(null);
  const [form, setForm] = useState({});

  // ── ESTADOS ESPECÍFICOS DE PAQUETES (SERVICIOS INTERNOS) ──
  const [modalServiciosAbierto, setModalServiciosAbierto] = useState(false);
  const [paqueteServicios, setPaqueteServicios] = useState(null);
  const [nuevoServicio, setNuevoServicio] = useState('');
  const [servicioEditandoId, setServicioEditandoId] = useState(null);
  const [textoEdicionInline, setTextoEdicionInline] = useState('');

  // ── ESTADO DE IMAGEN DE CATÁLOGO ──
  const fileInputRef  = useRef(null);
  const [imagenPreview, setImagenPreview] = useState(null); // URL local para preview
  const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

  // ── CARGA DE DATOS SEGÚN LA PESTAÑA ──
  const cargarDatos = async () => {
    setLoading(true);
    try {
      let res = [];
      if (activeTab === 'paquetes') res = await getPaquetesAdmin();
      if (activeTab === 'tipos')    res = await getTiposAdmin();
      if (activeTab === 'estilos')  res = await getEstilosAdmin();
      if (activeTab === 'centros')  res = await getCentrosAdmin();
      if (activeTab === 'extras')   res = await getExtrasAdmin();
      
      // Muestra todos, pero el Admin sabrá cuáles están ocultos por el color
      setData(res); 
    } catch (error) {
      console.error("Error cargando catálogo", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    cargarDatos(); 
  }, [activeTab]);

  // ── MANEJO DEL MODAL DINÁMICO ──
  const abrirModal = (item = null) => {
    setItemEditando(item);
    setImagenPreview(null); // Resetear preview
    
    if (item) {
      setForm({ ...item });
      // Si tiene imagen_url, mostrar como preview
      if (item.imagen_url && ['estilos', 'centros', 'extras', 'tipos', 'paquetes'].includes(activeTab)) {
        setImagenPreview(`${BACKEND_URL}${item.imagen_url}`);
      }
    } else {
      if (activeTab === 'paquetes') setForm({ paquete_nombre: '', paquete_codigo: '', descripcion: '', precio_persona: '', minimo_invitados: 100, color_principal: '#B7950B', activo: true });
      if (activeTab === 'tipos')    setForm({ tipo_nombre: '', tipo_codigo: '', tipo_icono: 'Sparkles', descripcion: '', activo: true });
      if (activeTab === 'estilos')  setForm({ nombre: '', estilo_codigo: '', descripcion: '', costo_adicional: 0, icono: 'Sparkles', activo: true });
      if (activeTab === 'centros')  setForm({ nombre: '', descripcion: '', costo_por_mesa: 0, icono: 'Sparkles', activo: true });
      if (activeTab === 'extras')   setForm({ nombre: '', descripcion: '', precio_unitario: 0, unidad: 'unidad', categoria: 'GENERAL', icono: 'Sparkles', activo: true });
    }
    setModalAbierto(true);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    try {
      if (activeTab === 'paquetes') {
        itemEditando ? await actualizarPaquete(itemEditando.paquete_id, form) : await crearPaquete(form);
      } else if (activeTab === 'tipos') {
        itemEditando ? await actualizarTipo(itemEditando.tipo_id, form) : await crearTipo(form);
      } else if (activeTab === 'estilos') {
        itemEditando ? await actualizarEstilo(itemEditando.estilo_id, form) : await crearEstilo(form);
      } else if (activeTab === 'centros') {
        itemEditando ? await actualizarCentro(itemEditando.centro_id, form) : await crearCentro(form);
      } else if (activeTab === 'extras') {
        itemEditando ? await actualizarExtra(itemEditando.adicional_id, form) : await crearExtra(form);
      }
      
      setModalAbierto(false);
      cargarDatos();
    } catch (error) {
      alert(error.response?.data?.message || 'Error al guardar los datos.');
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Seguro que deseas ELIMINAR/OCULTAR este elemento? No asomará a los clientes.')) return;
    try {
      if (activeTab === 'paquetes') await desactivarPaquete(id);
      if (activeTab === 'tipos')    await desactivarTipo(id);
      if (activeTab === 'estilos')  await desactivarEstilo(id);
      if (activeTab === 'centros')  await desactivarCentro(id);
      if (activeTab === 'extras')   await desactivarExtra(id);
      cargarDatos();
    } catch (error) {
      alert('Error al desactivar el elemento.');
    }
  };

  // 🚀 NUEVA FUNCIÓN: Restaurar/Ocultar rápido
  const toggleVisibilidad = async (item) => {
    try {
      const nuevoEstado = { ...item, activo: !item.activo };
      if (activeTab === 'paquetes') await actualizarPaquete(item.paquete_id, nuevoEstado);
      if (activeTab === 'tipos')    await actualizarTipo(item.tipo_id, nuevoEstado);
      if (activeTab === 'estilos')  await actualizarEstilo(item.estilo_id, nuevoEstado);
      if (activeTab === 'centros')  await actualizarCentro(item.centro_id, nuevoEstado);
      if (activeTab === 'extras')   await actualizarExtra(item.adicional_id, nuevoEstado);
      cargarDatos();
    } catch (error) {
      alert('Error al cambiar visibilidad.');
    }
  };

  // ── LÓGICA DE SERVICIOS INTERNOS DEL PAQUETE ──
  const abrirServicios = (paquete) => { 
    setPaqueteServicios(paquete); 
    setModalServiciosAbierto(true); 
    setNuevoServicio(''); 
  };
  
  const handleAgregarServicio = async (e) => {
    e.preventDefault();
    if (!nuevoServicio.trim()) return;
    try {
      await agregarServicioPaquete(paqueteServicios.paquete_id, { 
        servicio_nombre: nuevoServicio, 
        servicio_descripcion: '' 
      });
      setNuevoServicio('');
      
      // Recargar datos en caliente
      const pActualizado = await getPaquetesAdmin();
      const p = pActualizado.find(x => x.paquete_id === paqueteServicios.paquete_id);
      setPaqueteServicios(p);
      setData(pActualizado);
    } catch (error) { 
      alert('Error al agregar servicio.'); 
    }
  };

  const handleEliminarServicio = async (servicioId) => {
    try {
      await eliminarServicioPaquete(paqueteServicios.paquete_id, servicioId);
      
      const pActualizado = await getPaquetesAdmin();
      const p = pActualizado.find(x => x.paquete_id === paqueteServicios.paquete_id);
      setPaqueteServicios(p);
      setData(pActualizado);
    } catch (error) { 
      alert('Error al eliminar servicio.'); 
    }
  };

  const iniciarEdicionServicio = (svc) => { 
    setServicioEditandoId(svc.servicio_id); 
    setTextoEdicionInline(svc.servicio_nombre); 
  };
  
  const guardarEdicionServicio = async (servicioId) => {
    try {
      await actualizarServicioPaquete(paqueteServicios.paquete_id, servicioId, { 
        servicio_nombre: textoEdicionInline 
      });
      setServicioEditandoId(null);
      
      const pActualizado = await getPaquetesAdmin();
      const p = pActualizado.find(x => x.paquete_id === paqueteServicios.paquete_id);
      setPaqueteServicios(p);
      setData(pActualizado);
    } catch (error) { 
      alert('Error al actualizar servicio.'); 
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ── CABECERA ── */}
      <div>
        <h1 className="text-3xl font-display font-bold text-[#0D2137] dark:text-white">CMS - Gestión de Catálogo</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configura precios, servicios e íconos que verán los clientes en el sistema público.</p>
      </div>

      {/* ── TABS DE NAVEGACIÓN ── */}
      <div className="flex overflow-x-auto bg-white dark:bg-[#332247] p-1.5 rounded-2xl border border-slate-200 dark:border-white/12 shadow-sm gap-1 custom-scrollbar">
        {TABS.map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-[#0D2137] dark:bg-gradient-to-r dark:from-[#6B3F7A] dark:to-[#A971D6] text-white shadow-md' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── TABLA DINÁMICA ── */}
      <div className="bg-white dark:bg-[#332247] rounded-2xl border border-slate-100 dark:border-white/8 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-white/8 flex justify-between items-center bg-slate-50/50 dark:bg-white/5">
          <h2 className="font-bold text-[#0D2137] dark:text-white flex items-center gap-2 text-lg">
            {TABS.find(t => t.id === activeTab)?.icon} 
            Listado de {TABS.find(t => t.id === activeTab)?.label}
          </h2>
          <button 
            onClick={() => abrirModal()} 
            className="px-5 py-2.5 bg-[#B7950B] text-white text-sm font-bold rounded-xl hover:bg-[#9A7D0A] shadow-md transition-all flex items-center gap-2"
          >
            <Plus size={18} /> Crear Nuevo
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gradient-to-r from-[#0D2137] to-[#1A3A5C] dark:from-[#3E2B57] dark:to-[#332247] text-white/80 text-xs uppercase tracking-wider font-bold">
              <tr>
                {activeTab === 'paquetes' && (
                  <>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4">Paquete</th>
                    <th className="px-6 py-4">Precio (Pax)</th>
                    <th className="px-6 py-4">Servicios Inlcuidos</th>
                  </>
                )}
                {activeTab === 'tipos' && (
                  <>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-center">Ícono</th>
                    <th className="px-6 py-4">Tipo Evento</th>
                  </>
                )}
                {activeTab === 'estilos' && (
                  <>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-center">Ícono</th>
                    <th className="px-6 py-4">Estilo</th>
                    <th className="px-6 py-4">Costo Adicional Fijo</th>
                  </>
                )}
                {activeTab === 'centros' && (
                  <>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-center">Ícono</th>
                    <th className="px-6 py-4">Centro de Mesa</th>
                    <th className="px-6 py-4">Costo por Mesa</th>
                  </>
                )}
                {activeTab === 'extras' && (
                  <>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-center">Ícono</th>
                    <th className="px-6 py-4">Servicio Extra</th>
                    <th className="px-6 py-4">Categoría</th>
                    <th className="px-6 py-4">Precio Unitario</th>
                  </>
                )}
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/8">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-400 font-medium animate-pulse">
                    Cargando catálogo...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-400 font-medium">
                    No hay registros en esta categoría.
                  </td>
                </tr>
              ) : (
                data.map((item, idx) => (
                  <tr key={item.paquete_id || item.tipo_id || item.estilo_id || item.centro_id || item.adicional_id} className={`transition-colors ${
                    item.activo
                      ? (idx % 2 === 0 ? 'bg-white dark:bg-[#332247]' : 'bg-slate-50/50 dark:bg-white/[0.02]') + ' hover:bg-[#B7950B]/8 dark:hover:bg-[#A971D6]/10'
                      : 'bg-red-50/60 dark:bg-red-500/10 opacity-80'
                  }`}>
                    
                    {/* Render dinámico según pestaña */}
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${item.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {item.activo ? 'Público' : 'Oculto'}
                      </span>
                    </td>

                    {activeTab === 'paquetes' && (
                      <>
                        <td className="px-6 py-4 font-bold text-[#0D2137] dark:text-white text-base">{item.paquete_nombre}</td>
                        <td className="px-6 py-4 font-bold text-emerald-600 text-base">${parseFloat(item.precio_persona).toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => abrirServicios(item)} 
                            className="text-xs font-bold text-[#1A6BAC] bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100"
                          >
                            Ver {item.servicios?.length || 0} Servicios
                          </button>
                        </td>
                      </>
                    )}

                    {activeTab === 'tipos' && (
                      <>
                        <td className="px-6 py-4 text-center text-[#0D2137] dark:text-white">
                          <div className="flex justify-center"><LucideIcon name={item.tipo_icono} size={28} /></div>
                        </td>
                        <td className="px-6 py-4 font-bold text-[#0D2137] dark:text-white text-base">
                          {item.tipo_nombre}
                          <span className="block font-mono text-xs text-slate-400 mt-1">{item.tipo_codigo}</span>
                        </td>
                      </>
                    )}

                    {activeTab === 'estilos' && (
                      <>
                        <td className="px-6 py-4 text-center text-[#0D2137] dark:text-white">
                          <div className="flex justify-center"><LucideIcon name={item.icono} size={24} /></div>
                        </td>
                        <td className="px-6 py-4 font-bold text-[#0D2137] dark:text-white text-base">{item.nombre}</td>
                        <td className="px-6 py-4 font-bold text-slate-600 dark:text-slate-300">${parseFloat(item.costo_adicional).toFixed(2)}</td>
                      </>
                    )}

                    {activeTab === 'centros' && (
                      <>
                        <td className="px-6 py-4 text-center text-[#0D2137] dark:text-white">
                          <div className="flex justify-center"><LucideIcon name={item.icono} size={24} /></div>
                        </td>
                        <td className="px-6 py-4 font-bold text-[#0D2137] dark:text-white text-base">{item.nombre}</td>
                        <td className="px-6 py-4 font-bold text-slate-600 dark:text-slate-300">${parseFloat(item.costo_por_mesa).toFixed(2)} / mesa</td>
                      </>
                    )}

                    {activeTab === 'extras' && (
                      <>
                        <td className="px-6 py-4 text-center text-[#0D2137] dark:text-white">
                          <div className="flex justify-center"><LucideIcon name={item.icono} size={24} /></div>
                        </td>
                        <td className="px-6 py-4 font-bold text-[#0D2137] dark:text-white text-base">{item.nombre}</td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 border border-slate-200 dark:border-white/12 rounded px-2 py-1 tracking-wider">
                            {item.categoria}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-emerald-600">${parseFloat(item.precio_unitario).toFixed(2)} / {item.unidad}</td>
                      </>
                    )}

                    {/* Botones de acción genéricos */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {/* 🚀 BOTÓN OCULTAR/MOSTRAR RÁPIDO */}
                        <button 
                          onClick={() => toggleVisibilidad(item)} 
                          className={`p-2.5 rounded-lg transition-colors ${item.activo ? 'text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:text-slate-300' : 'text-green-600 bg-green-50 hover:bg-green-100'}`}
                          title={item.activo ? "Ocultar del público" : "Mostrar al público"}
                        >
                          {item.activo ? <EyeOff size={18}/> : <Eye size={18}/>}
                        </button>

                        <button 
                          onClick={() => abrirModal(item)} 
                          className="p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={18}/>
                        </button>
                        <button 
                          onClick={() => handleEliminar(item.paquete_id || item.tipo_id || item.estilo_id || item.centro_id || item.adicional_id)} 
                          className="p-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                          title="Eliminar lógicamente"
                        >
                          <Trash2 size={18}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL DE EDICIÓN DINÁMICO (CON SELECTOR DE EMOJIS) ── */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-[#221634]/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-[#332247] rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            
            {/* Header del Modal */}
            <div className="px-8 py-6 border-b border-slate-100 dark:border-white/8 flex justify-between items-center bg-slate-50/50 dark:bg-white/5 rounded-t-3xl">
              <h2 className="text-xl font-bold text-[#0D2137] dark:text-white font-display">
                {itemEditando ? 'Editar Registro' : 'Nuevo Registro'}
              </h2>
              <button 
                onClick={() => setModalAbierto(false)} 
                className="p-2 bg-slate-200 hover:bg-slate-300 rounded-full text-slate-600 dark:text-slate-300 transition-colors"
              >
                <X size={18}/>
              </button>
            </div>
            
            {/* Cuerpo del Modal (Formulario) */}
            <div className="p-8 overflow-y-auto custom-scrollbar">
              <form id="catalogoForm" onSubmit={handleGuardar} className="space-y-5">
                
                {/* 🚀 CAMPO DE IMAGEN (Para Tipos de Evento, Estilos, Centros y Extras) */}
                {(activeTab === 'tipos' || activeTab === 'estilos' || activeTab === 'centros' || activeTab === 'extras' || activeTab === 'paquetes') && (
                  <div className="mb-4">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 dark:text-slate-300 mb-2">
                      {activeTab === 'paquetes' ? 'Imagen representativa del paquete (se mostrará al pasar el mouse)' : 'Imagen de referencia (opcional)'}
                    </label>
                    <div className="flex gap-3 items-start">
                      {/* Preview */}
                      <div
                        className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 overflow-hidden flex items-center justify-center bg-slate-50 dark:bg-white/5 shrink-0 cursor-pointer hover:border-[#B7950B] transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                        title="Clic para cambiar imagen"
                      >
                        {imagenPreview ? (
                          <img src={imagenPreview} alt="Vista previa" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-slate-400 text-xs text-center px-1">Sin imagen</span>
                        )}
                      </div>
                      {/* Botón de selección */}
                      <div className="flex-1">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2.5 border-2 border-slate-200 dark:border-white/12 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:border-[#B7950B] hover:text-[#B7950B] transition-colors"
                        >
                          📷 {imagenPreview ? 'Cambiar imagen' : 'Subir imagen'}
                        </button>
                        {imagenPreview && (
                          <button
                            type="button"
                            onClick={() => { setImagenPreview(null); setForm(f => ({ ...f, imagen_base64: null })); }}
                            className="ml-2 px-3 py-2.5 border border-red-200 text-red-500 rounded-xl text-xs font-bold hover:bg-red-50 transition-colors"
                          >
                            Quitar
                          </button>
                        )}
                        <p className="text-xs text-slate-400 mt-1.5">JPG, PNG o WEBP · Máx 5MB</p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 5 * 1024 * 1024) {
                            alert('La imagen no puede superar 5MB.');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const base64 = ev.target.result;
                            setImagenPreview(base64);
                            setForm(f => ({ ...f, imagen_base64: base64 }));
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* 🚀 SELECTOR DE ICONO LUCIDE (Para Tipos, Estilos, Centros y Extras) */}
                {activeTab !== 'paquetes' && (
                  <div className="relative mb-6">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nombre del Ícono (Lucide React)</label>
                    <div className="flex gap-4 items-center">
                      <div className="w-16 h-16 border-2 border-slate-200 dark:border-white/12 rounded-2xl flex items-center justify-center bg-slate-50 dark:bg-white/5 text-[#0D2137] dark:text-white shadow-sm">
                        <LucideIcon name={activeTab === 'tipos' ? form.tipo_icono : form.icono} size={32} />
                      </div>
                      <div className="flex-1">
                        <input 
                          type="text" 
                          value={activeTab === 'tipos' ? (form.tipo_icono || '') : (form.icono || '')} 
                          onChange={(e) => setForm({...form, [activeTab === 'tipos' ? 'tipo_icono' : 'icono']: e.target.value})} 
                          className="w-full border-2 border-slate-200 dark:border-white/12 rounded-xl px-4 py-3 focus:border-[#B7950B] outline-none transition-colors dark:bg-white/5 dark:text-white" 
                          placeholder="Ej: Sparkles, Camera, Heart"
                        />
                        <a href="https://lucide.dev/icons" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 mt-1 inline-block hover:underline">
                          Ver catálogo de iconos en Lucide.dev
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Campos comunes de Nombre */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Nombre / Título Oficial</label>
                  <input 
                    required 
                    type="text" 
                    value={form.paquete_nombre || form.tipo_nombre || form.nombre || ''} 
                    onChange={(e) => setForm({...form, [activeTab === 'paquetes' ? 'paquete_nombre' : activeTab === 'tipos' ? 'tipo_nombre' : 'nombre']: e.target.value})} 
                    className="w-full border-2 border-slate-200 dark:border-white/12 rounded-xl px-4 py-3 focus:border-[#B7950B] outline-none transition-colors dark:bg-white/5 dark:text-white" 
                    placeholder="Ej: Boda Diamante"
                  />
                </div>

                {/* Código Interno (Para Paquetes y Tipos) */}
                {(activeTab === 'paquetes' || activeTab === 'tipos') && !itemEditando && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Código Interno (Sin espacios)</label>
                    <input 
                      required 
                      type="text" 
                      value={form.paquete_codigo || form.tipo_codigo || ''} 
                      onChange={(e) => setForm({...form, [activeTab === 'paquetes' ? 'paquete_codigo' : 'tipo_codigo']: e.target.value.toUpperCase().replace(/\s/g, '')})} 
                      className="w-full border-2 border-slate-200 dark:border-white/12 rounded-xl px-4 py-3 focus:border-[#B7950B] outline-none transition-colors dark:bg-white/5 dark:text-white font-mono text-sm" 
                      placeholder="Ej: BODA_DIAMANTE"
                    />
                  </div>
                )}
                
                {/* Descripción General */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Descripción para el cliente</label>
                  <textarea 
                    rows={3} 
                    value={form.descripcion || ''} 
                    onChange={(e) => setForm({...form, descripcion: e.target.value})} 
                    className="w-full border-2 border-slate-200 dark:border-white/12 rounded-xl px-4 py-3 focus:border-[#B7950B] outline-none transition-colors dark:bg-white/5 dark:text-white" 
                    placeholder="Describe brevemente este servicio..."
                  />
                </div>

                {/* ── CAMPOS DINÁMICOS DE PRECIOS ── */}
                {activeTab === 'paquetes' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Precio (Por Persona)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-bold">$</span>
                        <input required type="number" step="0.01" value={form.precio_persona || ''} onChange={(e) => setForm({...form, precio_persona: e.target.value})} className="w-full border-2 border-slate-200 dark:border-white/12 rounded-xl pl-8 pr-4 py-3 focus:border-[#B7950B] outline-none transition-colors dark:bg-white/5 dark:text-white" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Mínimo Invitados</label>
                      <input required type="number" value={form.minimo_invitados || ''} onChange={(e) => setForm({...form, minimo_invitados: e.target.value})} className="w-full border-2 border-slate-200 dark:border-white/12 rounded-xl px-4 py-3 focus:border-[#B7950B] outline-none transition-colors dark:bg-white/5 dark:text-white" />
                    </div>
                  </div>
                )}

                {activeTab === 'estilos' && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Costo Adicional Fijo (Opcional)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-bold">$</span>
                      <input required type="number" step="0.01" value={form.costo_adicional || 0} onChange={(e) => setForm({...form, costo_adicional: e.target.value})} className="w-full border-2 border-slate-200 dark:border-white/12 rounded-xl pl-8 pr-4 py-3 focus:border-[#B7950B] outline-none transition-colors dark:bg-white/5 dark:text-white" />
                    </div>
                  </div>
                )}

                {activeTab === 'centros' && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Costo Fijo (Por Mesa)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-bold">$</span>
                      <input required type="number" step="0.01" value={form.costo_por_mesa || 0} onChange={(e) => setForm({...form, costo_por_mesa: e.target.value})} className="w-full border-2 border-slate-200 dark:border-white/12 rounded-xl pl-8 pr-4 py-3 focus:border-[#B7950B] outline-none transition-colors dark:bg-white/5 dark:text-white" />
                    </div>
                  </div>
                )}

                {activeTab === 'extras' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Precio Unitario</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-bold">$</span>
                        <input required type="number" step="0.01" value={form.precio_unitario || ''} onChange={(e) => setForm({...form, precio_unitario: e.target.value})} className="w-full border-2 border-slate-200 dark:border-white/12 rounded-xl pl-8 pr-4 py-3 focus:border-[#B7950B] outline-none transition-colors dark:bg-white/5 dark:text-white" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Unidad de cobro</label>
                      <select value={form.unidad || 'unidad'} onChange={(e) => setForm({...form, unidad: e.target.value})} className="w-full border-2 border-slate-200 dark:border-white/12 rounded-xl px-4 py-3 focus:border-[#B7950B] outline-none transition-colors dark:bg-white/5 dark:text-white bg-white">
                        <option value="unidad">Por Unidad</option>
                        <option value="hora">Por Hora</option>
                        <option value="persona">Por Persona</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* 🚀 CHECKBOX PARA OCULTAR/MOSTRAR (Solo en edición) */}
                {itemEditando && (
                  <div className="mt-4 flex items-center gap-3 p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/12 rounded-xl">
                    <input 
                      type="checkbox" 
                      id="activoCheck"
                      checked={form.activo} 
                      onChange={(e) => setForm({...form, activo: e.target.checked})} 
                      className="w-5 h-5 rounded border-slate-300 text-[#B7950B] focus:ring-[#B7950B]"
                    />
                    <label htmlFor="activoCheck" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                      Visible en el catálogo público
                    </label>
                  </div>
                )}

              </form>
            </div>
            
            {/* Footer del Modal */}
            <div className="px-8 py-5 border-t border-slate-100 dark:border-white/8 flex gap-4 bg-slate-50/50 dark:bg-white/5 rounded-b-3xl">
              <button 
                type="button" 
                onClick={() => setModalAbierto(false)} 
                className="flex-1 py-3.5 text-slate-600 dark:text-slate-300 bg-white border-2 border-slate-200 dark:border-white/12 font-bold rounded-xl hover:bg-slate-50 dark:bg-white/5 dark:hover:bg-white/10 hover:border-slate-300 transition-all"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                form="catalogoForm" 
                className="flex-1 py-3.5 bg-[#0D2137] dark:bg-gradient-to-r dark:from-[#6B3F7A] dark:to-[#A971D6] text-white font-bold rounded-xl hover:bg-[#1A6BAC] shadow-lg transition-all"
              >
                Guardar Configuración
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE SERVICIOS INTERNOS DEL PAQUETE ── */}
      {modalServiciosAbierto && paqueteServicios && (
        <div className="fixed inset-0 bg-[#221634]/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-[#332247] rounded-3xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            
            <div className="px-8 py-6 border-b border-slate-100 dark:border-white/8 flex justify-between items-center bg-slate-50/50 dark:bg-white/5 rounded-t-3xl">
              <div>
                <p className="text-[10px] font-bold text-[#B7950B] uppercase tracking-widest mb-1">
                  Beneficios Incluidos
                </p>
                <h2 className="text-2xl font-bold text-[#0D2137] dark:text-white font-display">
                  Paquete {paqueteServicios.paquete_nombre}
                </h2>
              </div>
              <button 
                onClick={() => setModalServiciosAbierto(false)} 
                className="p-3 bg-slate-200 hover:bg-slate-300 rounded-full text-slate-600 dark:text-slate-300 transition-colors"
              >
                <X size={20}/>
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto bg-slate-50/30 dark:bg-[#2A1C40]/40 custom-scrollbar">
              
              <form onSubmit={handleAgregarServicio} className="flex gap-3 mb-8">
                <input 
                  type="text" 
                  value={nuevoServicio} 
                  onChange={(e) => setNuevoServicio(e.target.value)} 
                  placeholder="Ej: Uso exclusivo de los jardines y pileta" 
                  className="flex-1 border-2 border-slate-200 dark:border-white/12 rounded-xl px-5 py-3.5 focus:border-[#B7950B] outline-none transition-colors dark:bg-white/5 dark:text-white text-sm" 
                  required 
                />
                <button 
                  type="submit" 
                  className="px-6 py-3.5 bg-[#B7950B] text-white font-bold rounded-xl hover:bg-[#9A7D0A] shadow-md whitespace-nowrap transition-colors"
                >
                  + Añadir Beneficio
                </button>
              </form>

              <div className="space-y-3">
                {paqueteServicios.servicios?.length === 0 ? (
                  <div className="text-center py-10 bg-white dark:bg-[#332247] rounded-2xl border border-slate-200 dark:border-white/12 border-dashed">
                    <Package size={40} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500 dark:text-slate-400 font-medium">No hay beneficios listados en este paquete.</p>
                  </div>
                ) : (
                  paqueteServicios.servicios?.map((svc) => (
                    <div 
                      key={svc.servicio_id} 
                      className="flex items-center justify-between bg-white dark:bg-[#3E2B57] p-4 rounded-xl border border-slate-200 dark:border-white/12 shadow-sm group hover:border-[#B7950B]/30 transition-colors"
                    >
                      
                      {servicioEditandoId === svc.servicio_id ? (
                        <div className="flex-1 flex gap-3 mr-4">
                          <input 
                            type="text" 
                            autoFocus 
                            value={textoEdicionInline} 
                            onChange={(e) => setTextoEdicionInline(e.target.value)} 
                            className="flex-1 border-b-2 border-[#B7950B] focus:outline-none px-3 py-1.5 text-sm font-bold text-[#0D2137] dark:text-white bg-slate-50 dark:bg-white/5 rounded-t" 
                          />
                          <button 
                            onClick={() => guardarEdicionServicio(svc.servicio_id)} 
                            className="px-4 py-1.5 bg-[#0D2137] dark:bg-gradient-to-r dark:from-[#6B3F7A] dark:to-[#A971D6] text-white text-xs font-bold rounded-lg hover:bg-[#1A6BAC] transition-colors"
                          >
                            Guardar
                          </button>
                          <button 
                            onClick={() => setServicioEditandoId(null)} 
                            className="px-4 py-1.5 bg-slate-200 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-300 transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3 flex-1 pr-4">
                          <span className="text-[#B7950B] mt-0.5"><Sparkles size={16} /></span>
                          <span className="font-bold text-[#0D2137] dark:text-white text-sm">{svc.servicio_nombre}</span>
                        </div>
                      )}

                      {!servicioEditandoId && (
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => iniciarEdicionServicio(svc)} 
                            className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Editar Beneficio"
                          >
                            <Edit2 size={16}/>
                          </button>
                          <button 
                            onClick={() => handleEliminarServicio(svc.servicio_id)} 
                            className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                            title="Eliminar Beneficio"
                          >
                            <Trash2 size={16}/>
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS para la barra de scroll bonita */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
      `}</style>
    </div>
  );
}