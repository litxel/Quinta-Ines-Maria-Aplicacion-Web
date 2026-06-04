import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ChevronLeft, ChevronRight, Calendar, Palette, Sparkles } from 'lucide-react';

import { useConfiguradorStore } from '../store/useConfiguradorStore';
import AsistenteIA from '../components/configurador/AsistenteIA';
import LucideIcon from '../components/shared/LucideIcon';
import { fetchPaquetePorCodigo } from '../services/catalogo.service';
import {
  fetchDatosConfiguracion,
  crearSesion,
  actualizarSesion,
  calcularPrecioServidor,
  fetchFechasOcupadas
} from '../services/configurador.service';

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

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

  const [catalogos,      setCatalogos]      = useState(null);
  const [fechasOcupadas, setFechasOcupadas] = useState([]);
  const [loadingCat,     setLoadingCat]     = useState(true);
  const [guardando,      setGuardando]      = useState(false);
  const [errorMsg,       setErrorMsg]       = useState('');
  const [alertaMagica,   setAlertaMagica]   = useState(null);

  // Animación de transición de evento (Paso 1 → 2)
  const [transicionEvento, setTransicionEvento] = useState(null);

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

          // Corregir si la fecha viene con año pasado (ej: 2024)
          let fechaCorregida = urlFecha;
          const fechaAnio = parseInt(urlFecha?.split('-')[0]);
          const anioActual = new Date().getFullYear();
          if (fechaAnio < anioActual) {
            fechaCorregida = urlFecha.replace(/^\d{4}/, String(anioActual + 1));
          } else if (fechaAnio === anioActual && urlFecha < new Date().toISOString().split('T')[0]) {
            // La fecha ya pasó en el año actual → pasarla al año siguiente
            fechaCorregida = urlFecha.replace(/^\d{4}/, String(anioActual + 1));
          }
          
          // Buscar tipo de evento por nombre
          let tipoEventoEncontrado = null;
          if (urlEvento && datos.tipos_evento?.length > 0) {
            tipoEventoEncontrado = datos.tipos_evento.find(t =>
              t.tipo_nombre.toLowerCase().includes(urlEvento.toLowerCase())
            );
            // Si no encuentra match exacto, usar el primero disponible
            if (!tipoEventoEncontrado) {
              tipoEventoEncontrado = datos.tipos_evento[0];
            }
          } else if (datos.tipos_evento?.length > 0) {
            tipoEventoEncontrado = datos.tipos_evento[0];
          }

          if (tipoEventoEncontrado) store.setTipoEvento(tipoEventoEncontrado);
          store.setPaquete(paq);
          store.setNumInvitados(urlInvitados);
          store.setFechaEvento(fechaCorregida);
          
          store.setPaso(5);
          setSearchParams({});
          
          setAlertaMagica({
            titulo: '✨ ¡Magia Aplicada!',
            mensaje: `Hemos pre-cargado el ${paq.paquete_nombre} para ${urlInvitados} personas en la fecha ${new Date(fechaCorregida + 'T12:00:00').toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' })}. Por favor, continúa personalizando tu evento.`
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
    
    // Paso 1 → 2: Animación de transición de evento
    if (store.paso_actual === 1 && store.tipoEventoSeleccionado) {
      setTransicionEvento(store.tipoEventoSeleccionado);
      await new Promise(r => setTimeout(r, 2000));
      setTransicionEvento(null);
    }

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
    if (exito) store.setPaso(pasoDestino);
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

  const handleFechaChange = (fecha) => {
    if (fechasOcupadas.includes(fecha)) {
      setAlertaMagica({
        titulo: '📅 Fecha Ocupada',
        mensaje: 'Lo sentimos, esa fecha ya está reservada. Por favor elige otra disponibilidad.'
      });
      store.setFechaEvento('');
    } else {
      store.setFechaEvento(fecha);
    }
  };

  if (loadingCat) return <main className="min-h-screen pt-24 flex items-center justify-center"><div className="animate-spin w-10 h-10 border-4 border-[#0D2137] border-t-transparent rounded-full" /></main>;

  return (
    <main className="min-h-screen pt-28 pb-16 bg-[#FDF8F0] relative">

      {/* ── ANIMACIÓN DE TRANSICIÓN DE EVENTO ── */}
      <AnimatePresence>
        {transicionEvento && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-[70] flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #0D2137 0%, #1A3A5C 60%, #0D2137 100%)' }}
          >
            {/* Fondo con foto del evento (si existe) */}
            {transicionEvento.imagen_url && (
              <motion.div
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 0.25, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${BACKEND_URL}${transicionEvento.imagen_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            )}

            {/* Contenido principal */}
            <motion.div
              initial={{ scale: 0.6, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 1.15, y: -50, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
              className="text-center relative z-10 px-8"
            >
              {transicionEvento.imagen_url ? (
                // Mostrar foto del evento en un marco elegante
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className="relative mx-auto mb-6"
                  style={{ width: 220, height: 160 }}
                >
                  <div className="absolute inset-0 rounded-2xl ring-4 ring-[#B7950B]/60 shadow-2xl overflow-hidden">
                    <img
                      src={`${BACKEND_URL}${transicionEvento.imagen_url}`}
                      alt={transicionEvento.tipo_nombre}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0D2137]/70 via-transparent to-transparent" />
                  </div>
                  {/* Brillo dorado animado */}
                  <motion.div
                    animate={{ opacity: [0, 0.6, 0], x: ['-100%', '200%'] }}
                    transition={{ duration: 1.2, delay: 0.3, ease: 'easeInOut' }}
                    className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
                    style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(183,149,11,0.5) 50%, transparent 60%)' }}
                  />
                </motion.div>
              ) : (
                // Fallback: ícono en círculo
                <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6 ring-4 ring-[#B7950B]/40">
                  <span className="text-white"><LucideIcon name={transicionEvento.tipo_icono} size={64} /></span>
                </div>
              )}

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-4xl font-display font-bold text-white mb-2"
              >
                {transicionEvento.tipo_nombre}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-[#B7950B] text-lg font-medium"
              >
                ✨ ¡Excelente elección!
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MODAL ALERTA MÁGICA ── */}
      {alertaMagica && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0D2137]/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center animate-in zoom-in-95">
            <div className="w-16 h-16 bg-[#B7950B]/10 text-[#B7950B] rounded-full flex items-center justify-center text-3xl mx-auto mb-4">✨</div>
            <h2 className="text-2xl font-bold text-[#0D2137] mb-2 font-display">{alertaMagica.titulo}</h2>
            <p className="text-slate-600 mb-6 leading-relaxed text-sm">{alertaMagica.mensaje}</p>
            <button onClick={() => setAlertaMagica(null)} className="w-full py-3.5 bg-[#0D2137] text-white font-bold rounded-xl hover:bg-[#1A6BAC] shadow-md">Aceptar</button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        <div className="text-center pt-8 mb-8">
          <h1 className="font-display text-4xl font-bold text-[#0D2137]">Configura tu Evento</h1>
          <p className="mt-2 text-slate-500 text-sm">Personaliza cada detalle. <span className="text-[#B7950B] font-medium">✨ Consulta al Asistente IA.</span></p>
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
                  <span className={`text-[9px] font-medium text-center mt-1 ${actual ? 'text-[#0D2137] font-bold' : 'text-slate-400'}`}>{p.label}</span>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 min-h-[340px]">
          {errorMsg && <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">⚠ {errorMsg}</div>}

          {/* ── PASO 1: TIPO DE EVENTO ── */}
          {store.paso_actual === 1 && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h2 className="font-display text-2xl text-[#0D2137] mb-6">¿Qué tipo de evento vas a celebrar?</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(catalogos?.tipos_evento ?? []).map((tipo) => (
                  <motion.button
                    key={tipo.tipo_id}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => store.setTipoEvento(tipo)}
                    className={`rounded-xl border-2 p-5 text-center transition-all flex flex-col items-center justify-center gap-2 ${
                      store.tipo_evento_id === tipo.tipo_id
                        ? 'border-[#0D2137] bg-[#0D2137]/5 shadow-md'
                        : 'border-slate-200 hover:border-[#0D2137]/40 hover:shadow-sm'
                    }`}
                  >
                    <span className={`${store.tipo_evento_id === tipo.tipo_id ? 'text-[#0D2137]' : 'text-slate-500'} transition-colors`}>
                      <LucideIcon name={tipo.tipo_icono} size={36} />
                    </span>
                    <span className="text-xs font-semibold text-slate-700">{tipo.tipo_nombre}</span>
                  </motion.button>
                ))}
              </div>
            </section>
          )}

          {/* ── PASO 2: PAQUETE ── */}
          {store.paso_actual === 2 && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h2 className="font-display text-2xl text-[#0D2137] mb-6">Selecciona o cambia tu paquete</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {(catalogos?.paquetes ?? []).map((paq) => (
                  <motion.button
                    key={paq.paquete_id}
                    whileHover={{ scale: 1.02, y: -3 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => store.setPaquete(paq)}
                    className={`relative rounded-xl border-2 p-4 text-left transition-all overflow-hidden ${store.paquete_id === paq.paquete_id ? 'border-[#0D2137] bg-[#0D2137]/5 shadow-md' : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'}`}
                  >
                    <div className="absolute top-0 left-0 bottom-0 w-2 rounded-l-lg" style={{ backgroundColor: paq.color_principal || '#B7950B' }} />
                    <div className="pl-3">
                      <p className="font-bold text-[#0D2137] text-sm">{paq.paquete_nombre}</p>
                      <p className="text-[#B7950B] font-bold text-xl mt-1">${parseFloat(paq.precio_persona).toFixed(2)}</p>
                      <p className="text-slate-400 text-[10px] uppercase mt-0.5">Desde {paq.minimo_invitados} pax</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </section>
          )}

          {/* ── PASO 3: INVITADOS CON SLIDER ── */}
          {store.paso_actual === 3 && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h2 className="font-display text-2xl text-[#0D2137] mb-8">¿Cuántos invitados asistirán?</h2>
              <SliderInvitados value={store.num_invitados} onChange={(v) => store.setNumInvitados(v)} />
              <div className="mt-6 flex justify-center gap-8 text-sm font-bold text-slate-600">
                <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl">
                  <span className="text-lg">🪑</span>
                  <span>{store.num_mesas} mesas</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl">
                  <span className="text-lg">🤵</span>
                  <span>{store.num_meseros} meseros</span>
                </div>
              </div>
              <PrecioEstimado store={store} />
            </section>
          )}

          {/* ── PASO 4: CALENDARIO PERSONALIZADO ── */}
          {store.paso_actual === 4 && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h2 className="font-display text-2xl text-[#0D2137] mb-6">¿Qué día será tu evento?</h2>
              <CalendarioCustom
                fechaSeleccionada={store.fecha_evento}
                fechasOcupadas={fechasOcupadas}
                iconoEvento={store.tipoEventoSeleccionado?.tipo_icono}
                onSelect={handleFechaChange}
              />
              <PrecioEstimado store={store} />
            </section>
          )}

          {/* ── PASO 5: COLORES ── */}
          {store.paso_actual === 5 && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h2 className="font-display text-2xl text-[#0D2137] mb-6">Elige tu paleta de colores</h2>
              <div className="flex flex-col lg:flex-row gap-8 items-start">
                <div className="flex-1 space-y-6">
                  <ColorSelector label="Color principal" valor={store.color_primario} onChange={(hex) => store.setColores(hex, store.color_secundario)} />
                  <ColorSelector label="Color secundario" valor={store.color_secundario} onChange={(hex) => store.setColores(store.color_primario, hex)} />
                </div>
                <AnimatePresence>
                  {store.color_primario && store.color_secundario && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, x: 20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex flex-col items-center gap-4 lg:mt-4"
                    >
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tu combinación</p>
                      {/* Círculo dual */}
                      <div className="relative w-32 h-32">
                        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
                          <defs>
                            <clipPath id="left-half"><rect x="0" y="0" width="50" height="100" /></clipPath>
                            <clipPath id="right-half"><rect x="50" y="0" width="50" height="100" /></clipPath>
                          </defs>
                          <circle cx="50" cy="50" r="46" fill={store.color_primario} clipPath="url(#left-half)" />
                          <circle cx="50" cy="50" r="46" fill={store.color_secundario} clipPath="url(#right-half)" />
                          <circle cx="50" cy="50" r="46" fill="none" stroke="white" strokeWidth="2" />
                          <line x1="50" y1="4" x2="50" y2="96" stroke="white" strokeWidth="1.5" />
                        </svg>
                      </div>
                      <div className="space-y-1 text-center">
                        {[{hex: store.color_primario, label: 'Principal'}, {hex: store.color_secundario, label: 'Secundario'}].map(({hex, label}) => {
                          const nombre = COLORES_PALETA.find(c => c.hex === hex)?.nombre || hex;
                          return (
                            <div key={hex} className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full shadow-sm border border-white/50" style={{ backgroundColor: hex }} />
                              <span className="text-xs text-slate-600 font-medium">{nombre}</span>
                              <span className="text-[10px] text-slate-400">({label})</span>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <PrecioEstimado store={store} />
            </section>
          )}

          {/* ── PASO 6: DECORACIÓN CON HOVER IMAGEN ── */}
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
                  <TarjetaConHover
                    key={e.estilo_id}
                    item={e}
                    seleccionado={store.estilo_deco_id === e.estilo_id}
                    onSelect={() => store.setEstiloDecoracion(e)}
                    precio={null}
                  />
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
                  <TarjetaConHover
                    key={cm.centro_id}
                    item={cm}
                    seleccionado={store.centro_mesa_id === cm.centro_id}
                    onSelect={() => store.setCentroMesa(cm)}
                    precio={`+$${parseFloat(cm.costo_por_mesa).toFixed(2)} /mesa`}
                  />
                ))}
              </div>
              <PrecioEstimado store={store} />
            </section>
          )}

          {/* ── PASO 7: EXTRAS CON HOVER ── */}
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
                        <TarjetaExtraConHover
                          key={ad.adicional_id}
                          item={ad}
                          seleccionado={seleccionado}
                          onToggle={(cantidad) => store.toggleServicio(ad, cantidad)}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
              <PrecioEstimado store={store} />
            </section>
          )}

          {/* ── PASO 8: RESUMEN TIPO CHECKOUT ── */}
          {store.paso_actual === 8 && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h2 className="font-display text-2xl text-[#0D2137] mb-6 text-center">🎉 Resumen de tu evento</h2>
              <ResumenCheckout store={store} />
              <button
                onClick={async () => {
                  const exito = await persistirSesion(8);
                  if (exito) navigate('/solicitar');
                }}
                disabled={guardando}
                className="mt-6 w-full py-5 rounded-2xl bg-gradient-to-r from-[#B7950B] to-yellow-600 text-white font-bold text-lg hover:from-[#9A7D0A] hover:to-yellow-700 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Sparkles size={22} />
                {guardando ? 'Guardando configuración...' : 'Solicitar este evento →'}
              </button>
            </section>
          )}
        </div>

        {/* ── BOTONES ANTERIOR / SIGUIENTE ── */}
        <div className="flex items-center justify-between mt-6">
          <button onClick={handlePrev} disabled={store.paso_actual === 1} className="px-6 py-3 rounded-xl border-2 border-slate-200 font-bold text-sm text-slate-600 disabled:opacity-30 hover:bg-white transition-colors">← Anterior</button>
          <span className="text-xs text-slate-400 font-medium hidden sm:block">{guardando ? '⏳ Guardando…' : `Paso ${store.paso_actual} de 8`}</span>
          {store.paso_actual < 8 && (
            <button onClick={handleNext} disabled={!pasoValido() || guardando} className="px-6 py-3 rounded-xl bg-[#0D2137] text-white font-bold text-sm disabled:opacity-40 hover:bg-[#1A6BAC] transition-all shadow-md">
              {guardando ? 'Guardando…' : 'Siguiente →'}
            </button>
          )}
        </div>
      </div>
      <AsistenteIA paqueteActual={store.paqueteSeleccionado} numInvitados={store.num_invitados} />
    </main>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: SliderInvitados
// ═══════════════════════════════════════════════════════════════════════════════
function SliderInvitados({ value, onChange }) {
  const MIN = 100, MAX = 500;
  const pct = ((value - MIN) / (MAX - MIN)) * 100;

  return (
    <div className="max-w-md mx-auto">
      {/* Tooltip con ícono de persona */}
      <div className="relative mb-4 h-16 flex items-end">
        <motion.div
          className="absolute flex flex-col items-center"
          style={{ left: `calc(${pct}% - 28px)` }}
          animate={{ left: `calc(${pct}% - 28px)` }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div className="bg-[#0D2137] text-white px-3 py-1.5 rounded-xl text-sm font-bold shadow-lg flex items-center gap-1.5 whitespace-nowrap">
            <Users size={14} />
            {value} personas
          </div>
          <div className="w-0 h-0 border-l-4 border-r-4 border-t-6 border-l-transparent border-r-transparent border-t-[#0D2137]" />
        </motion.div>
      </div>

      {/* Slider */}
      <div className="relative">
        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#0D2137] to-[#1A6BAC] rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <input
          type="range"
          min={MIN}
          max={MAX}
          step={10}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-3"
          style={{ WebkitAppearance: 'none' }}
          aria-label="Número de invitados"
          aria-valuemin={MIN}
          aria-valuemax={MAX}
          aria-valuenow={value}
        />
        {/* Thumb visual */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white border-3 border-[#0D2137] rounded-full shadow-lg pointer-events-none transition-all"
          style={{ left: `calc(${pct}% - 12px)`, borderWidth: 3 }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between mt-2 text-xs text-slate-400 font-medium">
        <span>{MIN} mín</span>
        <span>{MAX} máx</span>
      </div>

      {/* Input numérico manual */}
      <div className="mt-5 flex items-center justify-center gap-3">
        <button
          onClick={() => onChange(Math.max(MIN, value - 1))}
          className="w-10 h-10 rounded-full border-2 border-slate-200 font-bold text-slate-600 hover:bg-slate-100 transition-colors"
        >−</button>
        <input
          type="number"
          min={MIN}
          max={MAX}
          value={value}
          onChange={(e) => onChange(Math.max(MIN, Math.min(MAX, parseInt(e.target.value) || MIN)))}
          className="w-24 text-center text-2xl font-bold text-[#0D2137] border-2 border-slate-200 rounded-xl py-2 focus:border-[#B7950B] focus:outline-none"
          aria-label="Número exacto de invitados"
        />
        <button
          onClick={() => onChange(Math.min(MAX, value + 1))}
          className="w-10 h-10 rounded-full bg-[#0D2137] text-white font-bold hover:bg-[#1A6BAC] transition-colors"
        >+</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: CalendarioCustom
// ═══════════════════════════════════════════════════════════════════════════════
const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function CalendarioCustom({ fechaSeleccionada, fechasOcupadas, iconoEvento, onSelect }) {
  const hoy = new Date();
  const [mesActual, setMesActual] = useState(new Date(hoy.getFullYear(), hoy.getMonth(), 1));

  const year = mesActual.getFullYear();
  const month = mesActual.getMonth();
  const primerDia = new Date(year, month, 1).getDay();
  const diasEnMes = new Date(year, month + 1, 0).getDate();

  const formatFecha = (d) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  const anteriorMes = () => setMesActual(new Date(year, month - 1, 1));
  const siguienteMes = () => setMesActual(new Date(year, month + 1, 1));

  const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,'0')}-${String(hoy.getDate()).padStart(2,'0')}`;

  return (
    <div className="max-w-sm mx-auto">
      {/* Cabecera mes */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={anteriorMes} className="p-2 rounded-xl hover:bg-slate-100 transition-colors" aria-label="Mes anterior">
          <ChevronLeft size={20} className="text-slate-600" />
        </button>
        <h3 className="font-display font-bold text-[#0D2137] text-lg">{MESES[month]} {year}</h3>
        <button onClick={siguienteMes} className="p-2 rounded-xl hover:bg-slate-100 transition-colors" aria-label="Mes siguiente">
          <ChevronRight size={20} className="text-slate-600" />
        </button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 mb-2">
        {DIAS_SEMANA.map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase py-1">{d}</div>
        ))}
      </div>

      {/* Grilla de días */}
      <div className="grid grid-cols-7 gap-1">
        {/* Espacios vacíos del inicio */}
        {Array.from({ length: primerDia }).map((_, i) => <div key={`empty-${i}`} />)}

        {Array.from({ length: diasEnMes }).map((_, i) => {
          const dia = i + 1;
          const fechaStr = formatFecha(dia);
          const esOcupado  = fechasOcupadas.includes(fechaStr);
          const esPasado   = fechaStr < hoyStr;
          const esHoy      = fechaStr === hoyStr;
          const esSeleccionado = fechaStr === fechaSeleccionada;
          const deshabilitado  = esOcupado || esPasado;

          return (
            <motion.button
              key={dia}
              whileHover={!deshabilitado ? { scale: 1.1 } : {}}
              whileTap={!deshabilitado ? { scale: 0.95 } : {}}
              onClick={() => !deshabilitado && onSelect(fechaStr)}
              disabled={deshabilitado}
              aria-label={`${dia} de ${MESES[month]}, ${esOcupado ? 'ocupado' : 'disponible'}`}
              className={`relative aspect-square rounded-xl flex items-center justify-center text-sm font-semibold transition-all ${
                esSeleccionado
                  ? 'bg-[#0D2137] text-white shadow-lg'
                  : esOcupado
                  ? 'bg-red-50 text-red-300 cursor-not-allowed'
                  : esPasado
                  ? 'text-slate-300 cursor-not-allowed'
                  : esHoy
                  ? 'bg-[#B7950B]/10 text-[#B7950B] font-bold ring-2 ring-[#B7950B]/30'
                  : 'hover:bg-[#0D2137]/5 text-slate-700'
              }`}
            >
              {esOcupado ? (
                <span className="text-red-400 font-bold text-lg leading-none">✕</span>
              ) : esSeleccionado && iconoEvento ? (
                <span className="text-white"><LucideIcon name={iconoEvento} size={18} /></span>
              ) : (
                <span>{dia}</span>
              )}
              {esHoy && !esSeleccionado && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#B7950B]" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="flex gap-4 justify-center mt-4 text-[10px] text-slate-500 font-medium">
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#0D2137] inline-block" /> Seleccionado</div>
        <div className="flex items-center gap-1"><span className="text-red-400 text-sm font-bold">✕</span> Ocupado</div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#B7950B]/20 inline-block ring-1 ring-[#B7950B]" /> Hoy</div>
      </div>

      {fechaSeleccionada && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-[#0D2137]/5 border border-[#0D2137]/10 rounded-xl text-center"
        >
          <div className="flex items-center justify-center gap-2 text-[#0D2137] font-bold text-sm">
            <Calendar size={16} />
            Fecha seleccionada: {new Date(fechaSeleccionada + 'T12:00:00').toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: ColorSelector (cajas grandes)
// ═══════════════════════════════════════════════════════════════════════════════
function ColorSelector({ label, valor, onChange }) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
        <Palette size={16} className="text-slate-400" />
        {label}
        {valor && <span className="ml-2 text-xs font-medium text-slate-400">— {COLORES_PALETA.find(c => c.hex === valor)?.nombre || valor}</span>}
      </label>
      <div className="grid grid-cols-6 gap-2">
        {COLORES_PALETA.map((c) => (
          <motion.button
            key={c.hex}
            whileHover={{ scale: 1.12, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(c.hex)}
            title={c.nombre}
            aria-label={`Color ${c.nombre}`}
            aria-pressed={valor === c.hex}
            className={`flex flex-col items-center gap-1 group`}
          >
            <div
              className={`w-10 h-10 rounded-xl border-3 shadow-sm transition-all ${valor === c.hex ? 'ring-3 ring-offset-2 ring-[#0D2137] scale-110 shadow-md' : 'border-slate-200 hover:shadow-md'}`}
              style={{ backgroundColor: c.hex, borderColor: valor === c.hex ? '#0D2137' : '#e2e8f0', borderWidth: 3 }}
            />
            <span className="text-[9px] text-slate-500 text-center leading-tight max-w-[44px] truncate">{c.nombre}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK: retardo y auto-ocultar al hacer hover
// ═══════════════════════════════════════════════════════════════════════════════
function useHoverPreview(delayMs = 300, autoHideMs = 4000) {
  const [visible, setVisible] = useState(false);
  const timerRef    = useRef(null);
  const autoHideRef = useRef(null);

  const iniciar = () => {
    timerRef.current = setTimeout(() => {
      setVisible(true);
      autoHideRef.current = setTimeout(() => setVisible(false), autoHideMs);
    }, delayMs);
  };

  const cancelar = () => {
    clearTimeout(timerRef.current);
    clearTimeout(autoHideRef.current);
    setVisible(false);
  };

  return { visible, iniciar, cancelar };
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: Vista previa lateral (izquierda o derecha según posición)
// ═══════════════════════════════════════════════════════════════════════════════
const PREVIEW_ANCHO = 300;
const PREVIEW_IMG_ALTO = 260;

function PreviewImagenLateral({ visible, anchorRef, imagenUrl, titulo, descripcion, pie, fallbackIcon }) {
  const [pos, setPos] = useState({ top: 0, left: 0, lado: 'right' });

  useEffect(() => {
    if (!visible || !anchorRef.current) return;

    const calcular = () => {
      const rect = anchorRef.current.getBoundingClientRect();
      const gap = 12;
      const espacioDer = window.innerWidth - rect.right;
      const espacioIzq = rect.left;
      // La card está en la mitad izquierda del viewport → mostrar preview a la IZQUIERDA
      // La card está en la mitad derecha → mostrar preview a la DERECHA
      // También respetar el espacio disponible
      const cardCentroX = rect.left + rect.width / 2;
      const mitadViewport = window.innerWidth / 2;
      let lado;
      if (cardCentroX < mitadViewport) {
        // Card en la mitad izquierda: preferir mostrar a la izquierda si hay espacio
        lado = espacioIzq >= PREVIEW_ANCHO + gap ? 'left' : 'right';
      } else {
        // Card en la mitad derecha: preferir mostrar a la derecha si hay espacio
        lado = espacioDer >= PREVIEW_ANCHO + gap ? 'right' : 'left';
      }

      const altoEstimado = imagenUrl ? PREVIEW_IMG_ALTO + 72 : 160;
      const top = Math.max(
        12,
        Math.min(window.innerHeight - altoEstimado - 12, rect.top + rect.height / 2 - altoEstimado / 2)
      );
      const left = lado === 'right'
        ? rect.right + gap
        : rect.left - PREVIEW_ANCHO - gap;

      setPos({ top, left, lado });
    };

    calcular();
    window.addEventListener('scroll', calcular, true);
    window.addEventListener('resize', calcular);
    return () => {
      window.removeEventListener('scroll', calcular, true);
      window.removeEventListener('resize', calcular);
    };
  }, [visible, anchorRef, imagenUrl]);

  return createPortal(
    <AnimatePresence>
      {visible && (
      <motion.div
        key="preview-lateral"
        initial={{ opacity: 0, x: pos.lado === 'right' ? -16 : 16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: pos.lado === 'right' ? -16 : 16 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        style={{ top: pos.top, left: pos.left, width: PREVIEW_ANCHO }}
        className="fixed z-[100] rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-white pointer-events-none"
      >
        {imagenUrl ? (
          <>
            <div className="bg-slate-100 flex items-center justify-center" style={{ minHeight: PREVIEW_IMG_ALTO }}>
              <img
                src={imagenUrl}
                alt={titulo}
                className="w-full object-cover"
                style={{ maxHeight: PREVIEW_IMG_ALTO }}
              />
            </div>
            <div className="px-3 py-2.5 border-t border-slate-100 bg-white">
              <p className="font-bold text-sm text-[#0D2137] leading-snug">{titulo}</p>
              {descripcion && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{descripcion}</p>}
              {pie}
            </div>
          </>
        ) : (
          <div className="p-4 bg-gradient-to-br from-[#0D2137] to-[#1A6BAC] text-white">
            <div className="flex items-start gap-3">
              <div className="shrink-0 opacity-90"><LucideIcon name={fallbackIcon} size={36} /></div>
              <div className="min-w-0">
                <p className="font-bold text-sm">{titulo}</p>
                {descripcion && <p className="text-white/80 text-xs mt-1 line-clamp-3">{descripcion}</p>}
                {pie}
              </div>
            </div>
          </div>
        )}
      </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: TarjetaConHover (estilos y centros de mesa)
// ═══════════════════════════════════════════════════════════════════════════════
function TarjetaConHover({ item, seleccionado, onSelect, precio }) {
  const cardRef = useRef(null);
  const { visible, iniciar, cancelar } = useHoverPreview();
  const imagenUrl = item.imagen_url ? `${BACKEND_URL}${item.imagen_url}` : null;

  return (
    <div ref={cardRef} className="relative">
      <motion.button
        whileHover={{ scale: 1.01 }}
        onMouseEnter={iniciar}
        onMouseLeave={cancelar}
        onClick={onSelect}
        className={`w-full rounded-xl border-2 p-4 text-left flex gap-3 transition-all ${seleccionado ? 'border-[#0D2137] bg-[#0D2137]/5 shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'}`}
      >
        <div className="shrink-0 text-[#0D2137] mt-1">
          <LucideIcon name={item.icono} size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <p className="font-bold text-[#0D2137] text-sm truncate">{item.nombre}</p>
            {precio && <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md shrink-0">{precio}</span>}
          </div>
          <p className="text-slate-500 text-xs mt-1 line-clamp-2">{item.descripcion}</p>
        </div>
      </motion.button>

      <PreviewImagenLateral
        visible={visible}
        anchorRef={cardRef}
        imagenUrl={imagenUrl}
        titulo={item.nombre}
        descripcion={item.descripcion}
        pie={precio ? <p className="mt-1 text-[#B7950B] font-bold text-xs">{precio}</p> : null}
        fallbackIcon={item.icono}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: TarjetaExtraConHover
// ═══════════════════════════════════════════════════════════════════════════════
function TarjetaExtraConHover({ item, seleccionado, onToggle }) {
  const cardRef = useRef(null);
  const { visible, iniciar, cancelar } = useHoverPreview();
  const imagenUrl = item.imagen_url ? `${BACKEND_URL}${item.imagen_url}` : null;
  const precioTxt = `$${parseFloat(item.precio_unitario).toFixed(2)} / ${item.unidad}`;

  return (
    <div ref={cardRef} className="relative">
      <div
        onMouseEnter={iniciar}
        onMouseLeave={cancelar}
        className={`flex items-center justify-between rounded-xl border-2 p-3.5 transition-colors ${seleccionado ? 'border-[#0D2137] bg-[#0D2137]/5' : 'border-slate-200 hover:border-slate-300'}`}
      >
        <div className="flex items-center gap-3 flex-1 mr-3">
          <div className="text-[#0D2137]/70"><LucideIcon name={item.icono} size={20} /></div>
          <div>
            <p className="font-medium text-[#0D2137] text-sm">{item.nombre}</p>
            <p className="text-[#B7950B] text-xs font-bold mt-0.5">{precioTxt}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {seleccionado && <button onClick={() => onToggle(seleccionado.cantidad - 1)} className="w-8 h-8 rounded-full bg-white border border-slate-300 font-bold hover:bg-slate-100 shadow-sm text-slate-600">−</button>}
          {seleccionado && <span className="w-6 text-center font-bold text-sm text-[#0D2137]">{seleccionado.cantidad}</span>}
          <button onClick={() => onToggle((seleccionado?.cantidad ?? 0) + 1)} className="w-8 h-8 rounded-full bg-[#0D2137] text-white font-bold hover:bg-[#1A6BAC] shadow-sm">+</button>
        </div>
      </div>

      <PreviewImagenLateral
        visible={visible}
        anchorRef={cardRef}
        imagenUrl={imagenUrl}
        titulo={item.nombre}
        descripcion={item.descripcion}
        pie={<p className="mt-1 text-[#B7950B] font-bold text-xs">{precioTxt}</p>}
        fallbackIcon={item.icono}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: ResumenCheckout (Paso 8)
// ═══════════════════════════════════════════════════════════════════════════════
function ResumenCheckout({ store }) {
  const total = store.precioServidor ? store.precioServidor.total : store.precio_estimado;

  return (
    <div className="space-y-4">
      {/* Fila 1: Evento + Fecha */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TarjetaResumen
          icono="🎉"
          titulo="Tipo de Evento"
          valor={store.tipoEventoSeleccionado?.tipo_nombre ?? '—'}
          sub={store.paqueteSeleccionado?.paquete_nombre ?? 'Sin paquete'}
          color="#0D2137"
        />
        <TarjetaResumen
          icono="📅"
          titulo="Fecha del Evento"
          valor={store.fecha_evento ? new Date(store.fecha_evento + 'T12:00:00').toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
          sub={`${store.num_invitados} invitados · ${store.num_mesas} mesas`}
          color="#1A5276"
        />
      </div>

      {/* Fila 2: Colores */}
      <div className="bg-white border-2 border-slate-100 rounded-2xl p-5 shadow-sm">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Paleta de colores</p>
        <div className="flex items-center gap-4">
          {[{hex: store.color_primario, label: 'Principal'}, {hex: store.color_secundario, label: 'Secundario'}].map(({hex, label}) => {
            const nombre = COLORES_PALETA.find(c => c.hex === hex)?.nombre || hex;
            return (
              <div key={hex} className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl shadow-md border-2 border-white" style={{ backgroundColor: hex }} />
                <div>
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="text-sm font-bold text-[#0D2137]">{nombre}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fila 3: Decoración */}
      {(store.estiloSeleccionado || store.centroMesaSeleccionado) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {store.estiloSeleccionado && (
            <div className="bg-white border-2 border-slate-100 rounded-2xl p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Estilo de decoración</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0D2137]/10 rounded-xl flex items-center justify-center text-[#0D2137]">
                  <LucideIcon name={store.estiloSeleccionado.icono} size={22} />
                </div>
                <div>
                  <p className="font-bold text-[#0D2137] text-sm">{store.estiloSeleccionado.nombre}</p>
                  <p className="text-xs text-slate-500">{store.estiloSeleccionado.descripcion}</p>
                </div>
              </div>
            </div>
          )}
          {store.centroMesaSeleccionado && (
            <div className="bg-white border-2 border-slate-100 rounded-2xl p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Centro de mesa</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-700">
                  <LucideIcon name={store.centroMesaSeleccionado.icono} size={22} />
                </div>
                <div>
                  <p className="font-bold text-[#0D2137] text-sm">{store.centroMesaSeleccionado.nombre}</p>
                  <p className="text-xs text-[#B7950B] font-bold">+${parseFloat(store.centroMesaSeleccionado.costo_por_mesa).toFixed(2)}/mesa</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fila 4: Extras */}
      {store.servicios.length > 0 && (
        <div className="bg-white border-2 border-slate-100 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Servicios adicionales</p>
          <div className="space-y-2">
            {store.servicios.map((s) => (
              <div key={s.adicional_id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#B7950B]" />
                  <span className="text-slate-700 font-medium">{s.nombre}</span>
                  <span className="text-slate-400">×{s.cantidad}</span>
                </div>
                <span className="font-bold text-[#0D2137]">${(s.precio_snapshot * s.cantidad).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Desglose de precio */}
      {store.precioServidor && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Desglose</p>
          <div className="flex justify-between"><span className="text-slate-600">Subtotal paquete</span><span className="font-semibold">${store.precioServidor.subtotal_paquete?.toFixed(2) ?? '—'}</span></div>
          <div className="flex justify-between"><span className="text-slate-600">Centros de mesa</span><span className="font-semibold">${store.precioServidor.subtotal_mesas?.toFixed(2) ?? '0.00'}</span></div>
          <div className="flex justify-between"><span className="text-slate-600">Extras</span><span className="font-semibold">${store.precioServidor.subtotal_adicionales?.toFixed(2) ?? '0.00'}</span></div>
        </div>
      )}

      {/* Total */}
      <div className="bg-gradient-to-r from-[#0D2137] to-[#1A6BAC] rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-xs uppercase tracking-wider font-bold">Total Estimado</p>
            <p className="text-white text-sm mt-0.5">Precio referencial, sujeto a ajustes</p>
          </div>
          <motion.span
            key={total}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl font-bold text-[#B7950B] font-display"
          >
            ${total?.toFixed(2) ?? '—'}
          </motion.span>
        </div>
      </div>
    </div>
  );
}

function TarjetaResumen({ icono, titulo, valor, sub, color }) {
  return (
    <div className="bg-white border-2 border-slate-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor: `${color}15` }}>
          {icono}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{titulo}</p>
          <p className="font-bold text-[#0D2137] text-base mt-1 truncate">{valor}</p>
          <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
        </div>
      </div>
    </div>
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

function agruparPorCategoria(servicios) {
  const mapa = {};
  servicios.forEach((s) => {
    const cat = s.categoria ?? 'OTROS';
    if (!mapa[cat]) mapa[cat] = [];
    mapa[cat].push(s);
  });
  return Object.entries(mapa);
}