import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useConfiguradorStore } from '../store/useConfiguradorStore';
import AsistenteIA from '../components/configurador/AsistenteIA';
import { fetchPaquetePorCodigo } from '../services/catalogo.service';
import {
  fetchDatosConfiguracion,
  crearSesion,
  actualizarSesion,
  calcularPrecioServidor,
  fetchFechasOcupadas
} from '../services/configurador.service';

const PASOS = [
  { num: 1, label: 'Evento',      campo: 'tipo_evento_id'   },
  { num: 2, label: 'Paquete',     campo: 'paquete_id'       },
  { num: 3, label: 'Invitados',   campo: 'num_invitados'    },
  { num: 4, label: 'Fecha',       campo: 'fecha_evento'     },
  { num: 5, label: 'Colores',     campo: 'color_primario'   },
  { num: 6, label: 'Decoración',  campo: 'estilo_deco_id'   },
  { num: 7, label: 'Extras',      campo: 'sesion_servicios' },
  { num: 8, label: 'Resumen',     campo: 'precio_estimado'  },
];

const COLORES_PALETA = [
  { hex: '#0D2137', nombre: 'Azul Marino'     }, { hex: '#B7950B', nombre: 'Dorado'          },
  { hex: '#8B0000', nombre: 'Rojo Vino'       }, { hex: '#1F3864', nombre: 'Azul Corporativo'},
  { hex: '#2E4053', nombre: 'Gris Pizarra'    }, { hex: '#4A235A', nombre: 'Púrpura'         },
  { hex: '#145A32', nombre: 'Verde Bosque'    }, { hex: '#784212', nombre: 'Café Tierra'     },
  { hex: '#C0392B', nombre: 'Rojo'            }, { hex: '#1A5276', nombre: 'Azul Océano'     },
  { hex: '#F5F5F5', nombre: 'Blanco Hueso'    }, { hex: '#212121', nombre: 'Negro Elegante'  },
];

export default function Configurador() {
  const navigate  = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const store     = useConfiguradorStore();

  const [catalogos,   setCatalogos]   = useState(null);
  const [fechasOcupadas, setFechasOcupadas] = useState([]);
  const [loadingCat,  setLoadingCat]  = useState(true);
  const [guardando,   setGuardando]   = useState(false);
  const [errorMsg,    setErrorMsg]    = useState('');
  
  const [alertaMagica, setAlertaMagica] = useState(null);

  useEffect(() => {
    const iniciarConfigurador = async () => {
      try {
        const [datos, fechasBloqueadas] = await Promise.all([
          fetchDatosConfiguracion(),
          fetchFechasOcupadas()
        ]);
        
        setCatalogos(datos);
        setFechasOcupadas(fechasBloqueadas || []); 

        const urlEvento    = searchParams.get('evento');
        const urlPaquete   = searchParams.get('paquete');
        const urlInvitados = searchParams.get('invitados');
        const urlFecha     = searchParams.get('fecha');

        if (urlPaquete && urlInvitados && urlFecha) {
          const paq = await fetchPaquetePorCodigo(urlPaquete);
          
          let tipoEventoEncontrado = null;
          if (urlEvento) {
            tipoEventoEncontrado = datos.tipos_evento.find(t => 
              t.tipo_nombre.toLowerCase().includes(urlEvento.toLowerCase())
            );
          }

          if (tipoEventoEncontrado) store.setTipoEvento(tipoEventoEncontrado);
          store.setPaquete(paq);
          store.setNumInvitados(urlInvitados);
          store.setFechaEvento(urlFecha);
          
          store.setPaso(5);
          setSearchParams({});
          
          setAlertaMagica({
            titulo: '✨ ¡Magia Aplicada!',
            mensaje: `Hemos pre-cargado el ${paq.paquete_nombre} para ${urlInvitados} personas. Por favor, continúa personalizando tu evento.`
          });
        }
      } catch (e) {
        setErrorMsg(e.message);
      } finally {
        setLoadingCat(false);
      }
    };
    iniciarConfigurador();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistirSesion = useCallback(async (pasoNuevo) => {
    setGuardando(true);
    setErrorMsg('');
    try {
      const payload = {
        tipo_evento_id:   store.tipo_evento_id,
        paquete_id:       store.paquete_id,
        num_invitados:    store.num_invitados,
        fecha_evento:     store.fecha_evento,
        color_primario:   store.color_primario,
        color_secundario: store.color_secundario,
        estilo_deco_id:   store.estilo_deco_id,
        centro_mesa_id:   store.centro_mesa_id,
        num_mesas:        store.num_mesas,
        num_meseros:      store.num_meseros,
        paso_actual:      pasoNuevo,
        completada:       false, 
        precio_estimado:  store.precio_estimado,
        servicios:        store.servicios.map((s) => ({
          adicional_id:    s.adicional_id,
          cantidad:        s.cantidad,
          precio_snapshot: s.precio_snapshot,
        })),
      };

      let sesion;
      if (store.sesion_id) {
        try {
          sesion = await actualizarSesion(store.sesion_id, payload);
        } catch (errorDb) {
          if (errorDb.response?.status === 404 || errorDb.status === 404) {
            sesion = await crearSesion(payload);
            const newId = sesion.sesion_id || sesion.data?.sesion_id || sesion.id;
            store.setSesionId(newId);
          } else {
            throw errorDb;
          }
        }
      } else {
        sesion = await crearSesion(payload);
        const newId = sesion.sesion_id || sesion.data?.sesion_id || sesion.id;
        store.setSesionId(newId);
      }
      return true; 
    } catch (e) {
      setErrorMsg(e.response?.data?.message ?? e.message);
      return false; 
    } finally {
      setGuardando(false);
    }
  }, [store]);

  const handleNext = async () => {
    setErrorMsg('');
    const siguiente = store.paso_actual + 1;
    
    const exito = await persistirSesion(siguiente);
    
    if (exito) {
      store.nextPaso();

      if (siguiente === 8 && store.paquete_id) {
        try {
          const resultado = await calcularPrecioServidor({
            paquete_id:    store.paquete_id,
            num_invitados: store.num_invitados,
            centro_mesa_id: store.centro_mesa_id,
            servicios: store.servicios.map((s) => ({ adicional_id: s.adicional_id, cantidad: s.cantidad })),
          });
          store.setPrecioServidor(resultado);
        } catch (e) {
          console.warn('Error cálculo servidor:', e.message);
        }
      }
    }
  };

  const handlePrev = () => { setErrorMsg(''); store.prevPaso(); };

  const saltarAPaso = async (pasoDestino) => {
    if (pasoDestino > store.paso_actual && !pasoValido(store.paso_actual)) return;
    setErrorMsg('');
    const exito = await persistirSesion(pasoDestino);
    if (exito) {
      store.setPaso(pasoDestino);
    }
  };

  const pasoValido = (pasoValidar = store.paso_actual) => {
    switch (pasoValidar) {
      case 1: return !!store.tipo_evento_id;
      case 2: return !!store.paquete_id;
      case 3: return store.num_invitados >= 100;
      case 4: return !!store.fecha_evento;
      case 5: return !!store.color_primario;
      case 6: return true; 
      case 7: return true; 
      case 8: return true;
      default: return true;
    }
  };

  const handleFechaChange = (e) => {
    const seleccionada = e.target.value;
    if (fechasOcupadas.includes(seleccionada)) {
      setAlertaMagica({
        titulo: '📅 Fecha Ocupada',
        mensaje: 'Lo sentimos, esa fecha ya está reservada por otro cliente. Por favor elige otra disponibilidad.'
      });
      store.setFechaEvento('');
    } else {
      store.setFechaEvento(seleccionada);
    }
  };

  const hoy = new Date().toISOString().split('T')[0];

  if (loadingCat) return <main className="min-h-screen pt-24 flex items-center justify-center"><div className="spinner" /></main>;

  return (
    <main className="min-h-screen pt-28 pb-16 bg-[#FDF8F0] relative">
      
      {alertaMagica && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0D2137]/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center animate-in zoom-in-95">
            <div className="w-16 h-16 bg-[#B7950B]/10 text-[#B7950B] rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
              ✨
            </div>
            <h2 className="text-2xl font-bold text-[#0D2137] mb-2 font-display">{alertaMagica.titulo}</h2>
            <p className="text-slate-600 mb-6 leading-relaxed text-sm">{alertaMagica.mensaje}</p>
            <button onClick={() => setAlertaMagica(null)} className="w-full py-3.5 bg-[#0D2137] text-white font-bold rounded-xl hover:bg-[#1A6BAC] shadow-md">
              Aceptar
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        <div className="text-center pt-8 mb-8">
          <h1 className="font-display text-4xl font-bold text-[#0D2137]">Configura tu Evento</h1>
          <p className="mt-2 text-slate-500 text-sm">
            Personaliza cada detalle. <span className="text-[#B7950B] font-medium">✨ Consulta al Asistente IA.</span>
          </p>
        </div>

        {/* ── BARRA DE PROGRESO ── */}
        <nav aria-label="Progreso" className="mb-8">
          <div className="relative h-1.5 bg-slate-200 rounded-full mb-5">
            <div className="absolute h-full bg-[#0D2137] rounded-full transition-all duration-500" style={{ width: `${((store.paso_actual - 1) / 7) * 100}%` }} />
          </div>
          <ol className="hidden sm:flex justify-between">
            {PASOS.map((p) => {
              const completado = p.num < store.paso_actual;
              const actual     = p.num === store.paso_actual;
              const clickable  = completado || actual || (p.num === store.paso_actual + 1 && pasoValido());

              return (
                <li key={p.num} className="flex flex-col items-center gap-1 relative group">
                  <button
                    onClick={() => clickable ? saltarAPaso(p.num) : null}
                    disabled={!clickable}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                      actual ? 'bg-white border-[#0D2137] text-[#0D2137] scale-110 shadow-sm'
                      : completado ? 'bg-[#0D2137] border-[#0D2137] text-white cursor-pointer hover:shadow-lg'
                      : 'bg-white border-slate-300 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {completado ? '✓' : p.num}
                  </button>
                  <span className={`text-[9px] font-medium text-center mt-1 ${actual ? 'text-[#0D2137] font-bold' : 'text-slate-400'}`}>
                    {p.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 min-h-[340px]">
          {errorMsg && <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">⚠ {errorMsg}</div>}

          {/* PASO 1 */}
          {store.paso_actual === 1 && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h2 className="font-display text-2xl text-[#0D2137] mb-6">¿Qué tipo de evento vas a celebrar?</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(catalogos?.tipos_evento ?? []).map((tipo) => (
                  <button 
                    key={tipo.tipo_id} 
                    onClick={() => store.setTipoEvento(tipo)} 
                    className={`rounded-xl border-2 p-4 text-center transition-all ${
                      store.tipo_evento_id === tipo.tipo_id 
                        ? 'border-[#0D2137] bg-[#0D2137]/5 shadow-sm scale-[1.02]' 
                        : 'border-slate-200 hover:border-[#0D2137]/40'
                    }`}
                  >
                    <span className="text-2xl block mb-1.5">{iconoEvento(tipo.tipo_codigo)}</span>
                    <span className="text-xs font-medium text-slate-700">{tipo.tipo_nombre}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* PASO 2 */}
          {store.paso_actual === 2 && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h2 className="font-display text-2xl text-[#0D2137] mb-6">Selecciona o cambia tu paquete</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {(catalogos?.paquetes ?? []).map((paq) => (
                  <button 
                    key={paq.paquete_id} 
                    onClick={() => store.setPaquete(paq)} 
                    className={`relative rounded-xl border-2 p-4 text-left transition-all overflow-hidden ${store.paquete_id === paq.paquete_id ? 'border-[#0D2137] bg-[#0D2137]/5 shadow-md scale-[1.02]' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <div className="absolute top-0 left-0 bottom-0 w-2" style={{ backgroundColor: paq.color_principal || '#B7950B' }} />
                    <div className="pl-3">
                      <p className="font-bold text-[#0D2137] text-sm">{paq.paquete_nombre}</p>
                      <p className="text-[#B7950B] font-bold text-lg mt-1">${parseFloat(paq.precio_persona).toFixed(2)}</p>
                      <p className="text-slate-400 text-[10px] uppercase mt-0.5">Desde {paq.minimo_invitados} pax</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* PASO 3 */}
          {store.paso_actual === 3 && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h2 className="font-display text-2xl text-[#0D2137] mb-6">¿Cuántos invitados asistirán?</h2>
              <div className="max-w-xs mx-auto">
                <input type="number" min={100} max={500} value={store.num_invitados} onChange={(e) => store.setNumInvitados(e.target.value)} className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl text-3xl font-bold text-center text-[#0D2137] focus:border-[#1A6BAC] focus:outline-none shadow-inner" />
                <div className="mt-4 flex justify-between px-2 text-xs font-bold text-slate-500 uppercase">
                  <span>🪑 {store.num_mesas} mesas</span>
                  <span>🤵 {store.num_meseros} meseros</span>
                </div>
              </div>
              <PrecioEstimado store={store} />
            </section>
          )}

          {/* PASO 4 */}
          {store.paso_actual === 4 && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h2 className="font-display text-2xl text-[#0D2137] mb-6">¿Qué día será tu evento?</h2>
              <div className="max-w-sm mx-auto">
                <label className="block text-sm font-bold text-slate-700 mb-2">Selecciona la fecha:</label>
                <input 
                  type="date" 
                  min={hoy}
                  value={store.fecha_evento || ''}
                  onChange={handleFechaChange}
                  className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl text-xl font-bold text-center text-[#0D2137] focus:border-[#B7950B] focus:outline-none shadow-inner cursor-pointer"
                />
                
                <div className="mt-6 bg-[#0D2137]/5 border border-[#0D2137]/10 p-4 rounded-xl text-center">
                  <h3 className="font-bold text-[#0D2137] text-sm mb-1">📅 Fechas Ocupadas</h3>
                  <div className="flex flex-wrap gap-2 justify-center mt-2">
                    {fechasOcupadas.length === 0 ? (
                      <span className="text-xs text-green-600 font-medium">¡Todas las fechas disponibles!</span>
                    ) : (
                      fechasOcupadas.map((f, i) => (
                        <span key={i} className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-md line-through">{f}</span>
                      ))
                    )}
                  </div>
                </div>
              </div>
              <PrecioEstimado store={store} />
            </section>
          )}

          {/* PASO 5 */}
          {store.paso_actual === 5 && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h2 className="font-display text-2xl text-[#0D2137] mb-6">Elige tus colores</h2>
              <div className="space-y-6">
                <ColorSelector label="Color principal" valor={store.color_primario} onChange={(hex) => store.setColores(hex, store.color_secundario)} />
                <ColorSelector label="Color secundario" valor={store.color_secundario} onChange={(hex) => store.setColores(store.color_primario, hex)} />
              </div>
              <PrecioEstimado store={store} />
            </section>
          )}

          {/* PASO 6 */}
          {store.paso_actual === 6 && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h2 className="font-display text-2xl text-[#0D2137] mb-6">Estilo de decoración</h2>
              
              <button 
                onClick={() => store.setEstiloDecoracion(null)} 
                className={`mb-4 w-full rounded-xl border-2 p-3 text-center text-sm font-bold transition-all ${store.estilo_deco_id === null ? 'border-[#0D2137] bg-[#0D2137]/5 text-[#0D2137]' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
              >
                ✖ Decoración estándar (Incluida en el paquete)
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-7">
                {(catalogos?.estilos_decoracion ?? []).map((e) => (
                  <button key={e.estilo_id} onClick={() => store.setEstiloDecoracion(e)} className={`rounded-xl border-2 p-4 text-left ${store.estilo_deco_id === e.estilo_id ? 'border-[#0D2137] bg-[#0D2137]/5 shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}>
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-[#0D2137] text-sm">{e.nombre}</p>
                    </div>
                    <p className="text-slate-500 text-xs mt-1">{e.descripcion}</p>
                  </button>
                ))}
              </div>

              <h3 className="font-display text-xl text-[#0D2137] mb-4 mt-8">Centro de mesa</h3>
              
              <button 
                onClick={() => store.setCentroMesa(null)} 
                className={`mb-4 w-full rounded-xl border-2 p-3 text-center text-sm font-bold transition-all ${store.centro_mesa_id === null ? 'border-[#0D2137] bg-[#0D2137]/5 text-[#0D2137]' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
              >
                ✖ Centro estándar (Sin costo extra)
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(catalogos?.centros_mesa ?? []).map((cm) => (
                  <button key={cm.centro_id} onClick={() => store.setCentroMesa(cm)} className={`rounded-xl border-2 p-4 text-left flex justify-between items-center ${store.centro_mesa_id === cm.centro_id ? 'border-[#0D2137] bg-[#0D2137]/5 shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}>
                    <p className="font-bold text-[#0D2137] text-sm">{cm.nombre}</p>
                    <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-1 rounded-md">
                      +${parseFloat(cm.costo_por_mesa).toFixed(2)} /mesa
                    </span>
                  </button>
                ))}
              </div>
              <PrecioEstimado store={store} />
            </section>
          )}

          {/* PASO 7 */}
          {store.paso_actual === 7 && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h2 className="font-display text-2xl text-[#0D2137] mb-6">Servicios adicionales</h2>
              {agruparPorCategoria(catalogos?.servicios_adicionales ?? []).map(([cat, items]) => (
                <div key={cat} className="mb-6">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 pl-1">{cat}</h3>
                  <div className="space-y-2">
                    {items.map((ad) => {
                      const seleccionado = store.servicios.find((s) => s.adicional_id === ad.adicional_id);
                      return (
                        <div key={ad.adicional_id} className={`flex items-center justify-between rounded-xl border-2 p-3.5 transition-colors ${seleccionado ? 'border-[#0D2137] bg-[#0D2137]/5' : 'border-slate-200 hover:border-slate-300'}`}>
                          <div className="flex-1 mr-3">
                            <p className="font-medium text-[#0D2137] text-sm">{ad.nombre}</p>
                            <p className="text-[#B7950B] text-xs font-bold mt-0.5">${parseFloat(ad.precio_unitario).toFixed(2)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {seleccionado && <button onClick={() => store.toggleServicio(ad, seleccionado.cantidad - 1)} className="w-8 h-8 rounded-full bg-white border border-slate-300 font-bold hover:bg-slate-100 shadow-sm text-slate-600">−</button>}
                            {seleccionado && <span className="w-6 text-center font-bold text-sm text-[#0D2137]">{seleccionado.cantidad}</span>}
                            <button onClick={() => store.toggleServicio(ad, (seleccionado?.cantidad ?? 0) + 1)} className="w-8 h-8 rounded-full bg-[#0D2137] text-white font-bold hover:bg-[#1A6BAC] shadow-sm">+</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <PrecioEstimado store={store} />
            </section>
          )}

          {/* PASO 8 */}
          {store.paso_actual === 8 && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h2 className="font-display text-2xl text-[#0D2137] mb-6 text-center">Resumen de tu evento</h2>
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-6 space-y-3 text-sm">
                <FilaResumen label="Tipo de evento" valor={store.tipoEventoSeleccionado?.tipo_nombre ?? '—'} />
                <FilaResumen label="Fecha" valor={store.fecha_evento || '—'} />
                <FilaResumen label="Paquete" valor={store.paqueteSeleccionado?.paquete_nombre ?? '—'} />
                <FilaResumen label="Invitados" valor={`${store.num_invitados} personas`} />
                <div className="flex justify-between py-2 border-b border-slate-200/60 last:border-0 items-center">
                   <span className="text-slate-500 font-medium">Colores</span>
                   <div className="flex gap-2">
                      <div className="w-5 h-5 rounded-full shadow-sm" style={{ backgroundColor: store.color_primario }} />
                      <div className="w-5 h-5 rounded-full shadow-sm" style={{ backgroundColor: store.color_secundario }} />
                   </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0D2137] to-[#1A6BAC] shadow-lg">
                <div className="flex justify-between items-center">
                  <span className="text-white font-bold uppercase tracking-wider text-sm">Total Estimado</span>
                  <span className="text-[#B7950B] font-bold text-3xl font-display">
                    ${store.precioServidor ? store.precioServidor.total.toFixed(2) : store.precio_estimado.toFixed(2)}
                  </span>
                </div>
              </div>

              <button 
                onClick={async () => {
                  const exito = await persistirSesion(8); // Fuerza guardado final
                  if (exito) navigate('/solicitar');
                }} 
                disabled={guardando}
                className="mt-6 w-full py-4 rounded-xl bg-[#B7950B] text-white font-bold text-base hover:bg-[#9A7D0A] transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50"
              >
                {guardando ? 'Guardando configuración...' : 'Generar Cotización Formal (PDF) →'}
              </button>
            </section>
          )}
        </div>

        {/* ── BOTONES ANTERIOR / SIGUIENTE ── */}
        <div className="flex items-center justify-between mt-6">
          <button onClick={handlePrev} disabled={store.paso_actual === 1} className="px-6 py-3 rounded-xl border-2 border-slate-200 font-bold text-sm text-slate-600 disabled:opacity-30 hover:bg-white transition-colors">← Anterior</button>
          <span className="text-xs text-slate-400 font-medium hidden sm:block">{guardando ? '⏳ Guardando…' : `Paso ${store.paso_actual} de 8`}</span>
          {store.paso_actual < 8 && (
            <button onClick={handleNext} disabled={!pasoValido() || guardando} className="px-6 py-3 rounded-xl bg-[#0D2137] text-white font-bold text-sm disabled:opacity-40 hover:bg-[#1A6BAC] transition-all shadow-md">{guardando ? 'Guardando…' : 'Siguiente →'}</button>
          )}
        </div>
      </div>
      <AsistenteIA paqueteActual={store.paqueteSeleccionado} numInvitados={store.num_invitados} />
    </main>
  );
}

function PrecioEstimado({ store }) {
  if (!store.paqueteSeleccionado) return null;
  return (
    <div className="mt-8 flex items-center justify-between p-4 bg-[#0D2137]/5 rounded-xl border border-[#0D2137]/10 animate-in fade-in">
      <span className="text-sm text-slate-600 font-bold uppercase tracking-wider">Precio estimado</span>
      <span className="text-2xl font-bold text-[#0D2137] font-display">${store.precio_estimado.toFixed(2)}</span>
    </div>
  );
}

function ColorSelector({ label, valor, onChange }) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-3">{label}</label>
      <div className="flex flex-wrap gap-3">
        {COLORES_PALETA.map((c) => (
          <button key={c.hex} onClick={() => onChange(c.hex)} title={c.nombre} className={`w-10 h-10 rounded-full border-2 transition-transform ${valor === c.hex ? 'border-[#0D2137] scale-110 shadow-md ring-2 ring-offset-2 ring-[#0D2137]/20' : 'border-slate-200 hover:scale-105 hover:shadow-sm'}`} style={{ backgroundColor: c.hex }} />
        ))}
      </div>
    </div>
  );
}

function FilaResumen({ label, valor }) {
  return (
    <div className="flex justify-between py-2 border-b border-slate-200/60 last:border-0">
      <span className="text-slate-500 font-medium">{label}</span>
      <span className="text-[#0D2137] font-bold text-right max-w-[60%] capitalize">{valor}</span>
    </div>
  );
}

function iconoEvento(codigo) {
  const mapa = { MATRIMONIO_CIVIL: '💍', MATRIMONIO_ECLESIASTICO: '⛪', QUINCEANERA: '👑', BAUTIZO: '👶', PRIMERA_COMUNION: '🕊️', CUMPLEANOS: '🎂', GRADUACION: '🎓', CONGRESO_EMPRESARIAL: '💼', PEDIDA_MANO: '💍', CENA_FAMILIAR: '🍽️', SESION_FOTOGRAFICA: '📸', MISA_CAMPAL: '🎪' };
  return mapa[codigo] ?? '🎉';
}

function agruparPorCategoria(servicios) {
  const mapa = {};
  servicios.forEach((s) => {
    const cat = s.categoria ?? 'OTROS';
    if (!mapa[cat]) mapa[cat] = [];
    mapa[cat].push(s);
  });
  return Object.entries(mapa);
}