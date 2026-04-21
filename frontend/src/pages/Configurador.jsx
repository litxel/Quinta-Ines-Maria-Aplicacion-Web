import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfiguradorStore } from '../store/useConfiguradorStore';
import {
  fetchDatosConfiguracion,
  crearSesion,
  actualizarSesion,
  calcularPrecioServidor,
} from '../services/configurador.service';

// ─── Constantes de los 7 pasos (mapean a sesiones) ────────────────────────────
const PASOS = [
  { num: 1, label: 'Evento',      campo: 'tipo_evento_id'   },
  { num: 2, label: 'Paquete',     campo: 'paquete_id'       },
  { num: 3, label: 'Invitados',   campo: 'num_invitados'    },
  { num: 4, label: 'Colores',     campo: 'color_primario'   },
  { num: 5, label: 'Decoración',  campo: 'estilo_deco_id'   },
  { num: 6, label: 'Extras',      campo: 'sesion_servicios' },
  { num: 7, label: 'Resumen',     campo: 'precio_estimado'  },
];

// ─── Colores de muestra para el selector ──────────────────────────────────────
const COLORES_PALETA = [
  { hex: '#0D2137', nombre: 'Azul Marino'     },
  { hex: '#B7950B', nombre: 'Dorado'          },
  { hex: '#8B0000', nombre: 'Rojo Vino'       },
  { hex: '#1F3864', nombre: 'Azul Corporativo'},
  { hex: '#2E4053', nombre: 'Gris Pizarra'    },
  { hex: '#4A235A', nombre: 'Púrpura'         },
  { hex: '#145A32', nombre: 'Verde Bosque'    },
  { hex: '#784212', nombre: 'Café Tierra'     },
  { hex: '#C0392B', nombre: 'Rojo'            },
  { hex: '#1A5276', nombre: 'Azul Océano'     },
  { hex: '#F5F5F5', nombre: 'Blanco Hueso'    },
  { hex: '#212121', nombre: 'Negro Elegante'  },
];

export default function Configurador() {
  const navigate  = useNavigate();
  const store     = useConfiguradorStore();

  // Catálogos cargados desde la API
  const [catalogos,   setCatalogos]   = useState(null);
  const [loadingCat,  setLoadingCat]  = useState(true);
  const [guardando,   setGuardando]   = useState(false);
  const [errorMsg,    setErrorMsg]    = useState('');

  // ── Cargar catálogos una sola vez ────────────────────────────────────────
  useEffect(() => {
    fetchDatosConfiguracion()
      .then(setCatalogos)
      .catch((e) => setErrorMsg(e.message))
      .finally(() => setLoadingCat(false));
  }, []);

  // ── Guardar / actualizar sesión en BD al avanzar de paso ─────────────────
  const persistirSesion = useCallback(async (pasoNuevo) => {
    setGuardando(true);
    try {
      const payload = {
        tipo_evento_id:   store.tipo_evento_id,
        paquete_id:       store.paquete_id,
        num_invitados:    store.num_invitados,
        color_primario:   store.color_primario,
        color_secundario: store.color_secundario,
        estilo_deco_id:   store.estilo_deco_id,
        centro_mesa_id:   store.centro_mesa_id,
        num_mesas:        store.num_mesas,
        num_meseros:      store.num_meseros,
        paso_actual:      pasoNuevo,
        completada:       pasoNuevo === 7 && store.completada,
        precio_estimado:  store.precio_estimado,
        servicios:        store.servicios.map((s) => ({
          adicional_id:    s.adicional_id,
          cantidad:        s.cantidad,
          precio_snapshot: s.precio_snapshot,
        })),
      };

      let sesion;
      if (store.sesion_id) {
        sesion = await actualizarSesion(store.sesion_id, payload);
      } else {
        sesion = await crearSesion(payload);
        store.setSesionId(sesion.sesion_id);
      }
    } catch (e) {
      setErrorMsg(e.response?.data?.message ?? e.message);
    } finally {
      setGuardando(false);
    }
  }, [store]);

  const handleNext = async () => {
    setErrorMsg('');
    const siguiente = store.paso_actual + 1;
    await persistirSesion(siguiente);
    store.nextPaso();

    // En paso 7, calcular precio definitivo desde el servidor
    if (siguiente === 7 && store.paquete_id) {
      try {
        const resultado = await calcularPrecioServidor({
          paquete_id:    store.paquete_id,
          num_invitados: store.num_invitados,
          centro_mesa_id: store.centro_mesa_id,
          servicios: store.servicios.map((s) => ({
            adicional_id: s.adicional_id,
            cantidad:     s.cantidad,
          })),
        });
        store.setPrecioServidor(resultado);
      } catch (e) {
        console.warn('No se pudo calcular el precio del servidor:', e.message);
      }
    }
  };

  const handlePrev = () => { setErrorMsg(''); store.prevPaso(); };

  // ── Validación por paso ───────────────────────────────────────────────────
  const pasoValido = () => {
    switch (store.paso_actual) {
      case 1: return !!store.tipo_evento_id;
      case 2: return !!store.paquete_id;
      case 3: return store.num_invitados >= 100;
      case 4: return !!store.color_primario;
      case 5: return true;    // estilo y centro son opcionales
      case 6: return true;
      case 7: return true;
      default: return true;
    }
  };

  if (loadingCat) {
    return (
      <main className="min-h-screen pt-24 flex items-center justify-center">
        <div className="spinner" />
        <span className="sr-only">Cargando opciones del configurador…</span>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-20 pb-16 bg-[#FDF8F0]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        {/* Título */}
        <div className="text-center pt-8 mb-8">
          <h1 className="font-display text-4xl font-bold text-[#0D2137]">
            Configura tu Evento
          </h1>
          <p className="mt-2 text-slate-500 text-sm">
            Personaliza cada detalle y obtén tu cotización en tiempo real.
          </p>
        </div>

        {/* Stepper */}
        <nav aria-label="Progreso" className="mb-8">
          <div className="relative h-1.5 bg-slate-200 rounded-full mb-5">
            <div
              className="absolute h-full bg-[#0D2137] rounded-full transition-all duration-500"
              style={{ width: `${((store.paso_actual - 1) / 6) * 100}%` }}
              role="progressbar"
              aria-valuenow={store.paso_actual}
              aria-valuemin={1}
              aria-valuemax={7}
            />
          </div>
          <ol className="hidden sm:flex justify-between">
            {PASOS.map((p) => (
              <li key={p.num} className="flex flex-col items-center gap-1">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                  p.num < store.paso_actual  ? 'bg-[#0D2137] border-[#0D2137] text-white'
                  : p.num === store.paso_actual ? 'bg-white border-[#0D2137] text-[#0D2137]'
                  : 'bg-white border-slate-300 text-slate-400'
                }`}>
                  {p.num < store.paso_actual ? '✓' : p.num}
                </span>
                <span className={`text-[9px] font-medium text-center ${
                  p.num === store.paso_actual ? 'text-[#0D2137]' : 'text-slate-400'
                }`}>{p.label}</span>
              </li>
            ))}
          </ol>
          <p className="sm:hidden text-center text-sm text-slate-600 font-medium">
            Paso {store.paso_actual}/7 — {PASOS[store.paso_actual - 1].label}
          </p>
        </nav>

        {/* Panel del paso actual */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 min-h-[340px]">

          {/* Error global */}
          {errorMsg && (
            <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              ⚠ {errorMsg}
            </div>
          )}

          {/* ── PASO 1: Tipo de evento ──────────────────────────────────────────── */}
          {store.paso_actual === 1 && (
            <section aria-labelledby="h-paso1">
              <h2 id="h-paso1" className="font-display text-2xl text-[#0D2137] mb-1">
                ¿Qué tipo de evento vas a celebrar?
              </h2>
              <p className="text-slate-400 text-sm mb-6">
                Los 12 tipos vienen de <code className="bg-slate-100 px-1 rounded">eqim_catalogo.tipos_evento</code>
              </p>
              {/* tipo_icono, tipo_nombre — columnas reales */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(catalogos?.tipos_evento ?? []).map((tipo) => (
                  <button
                    key={tipo.tipo_id}
                    onClick={() => store.setTipoEvento(tipo)}
                    aria-pressed={store.tipo_evento_id === tipo.tipo_id}
                    className={`rounded-xl border-2 p-4 text-center transition-all focus:outline-none focus:ring-2 focus:ring-[#1A6BAC] ${
                      store.tipo_evento_id === tipo.tipo_id
                        ? 'border-[#0D2137] bg-[#0D2137]/5 shadow-sm'
                        : 'border-slate-200 hover:border-[#0D2137]/40'
                    }`}
                  >
                    {/* tipo_icono es un string como "icon-rings" — usamos emoji fallback */}
                    <span className="text-2xl block mb-1.5" aria-hidden="true">
                      {iconoEvento(tipo.tipo_codigo)}
                    </span>
                    <span className="text-xs font-medium text-slate-700 leading-tight">
                      {tipo.tipo_nombre}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ── PASO 2: Paquete ────────────────────────────────────────────────── */}
          {store.paso_actual === 2 && (
            <section aria-labelledby="h-paso2">
              <h2 id="h-paso2" className="font-display text-2xl text-[#0D2137] mb-1">
                Selecciona tu paquete
              </h2>
              <p className="text-slate-400 text-sm mb-5">
                El paquete que elegiste en la vitrina ya está pre-cargado.
              </p>
              {store.paqueteSeleccionado ? (
                <div
                  className="rounded-xl border-2 p-5"
                  style={{ borderColor: store.paqueteSeleccionado.color_principal }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-10 h-10 rounded-full shrink-0"
                      style={{ backgroundColor: store.paqueteSeleccionado.color_principal }}
                      aria-hidden="true"
                    />
                    <div>
                      <p className="font-bold text-[#0D2137] text-lg">
                        {store.paqueteSeleccionado.paquete_nombre}
                      </p>
                      <p className="text-slate-500 text-sm">
                        ${parseFloat(store.paqueteSeleccionado.precio_persona).toFixed(2)} /persona
                        · Mín. {store.paqueteSeleccionado.minimo_invitados} personas
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-400 mb-5">No has seleccionado un paquete.</p>
                  <a href="/paquetes" className="px-6 py-2.5 bg-[#0D2137] text-white rounded-full text-sm font-semibold hover:bg-[#1A6BAC] transition-colors">
                    Ver paquetes
                  </a>
                </div>
              )}
            </section>
          )}

          {/* ── PASO 3: Número de invitados ─────────────────────────────────────── */}
          {store.paso_actual === 3 && (
            <section aria-labelledby="h-paso3">
              <h2 id="h-paso3" className="font-display text-2xl text-[#0D2137] mb-1">
                ¿Cuántos invitados asistirán?
              </h2>
              <p className="text-slate-400 text-sm mb-6">Mínimo 100 personas · Máximo 500</p>
              <div className="max-w-xs">
                <label htmlFor="inp-invitados" className="block text-sm font-medium text-slate-700 mb-2">
                  Número de invitados
                </label>
                <input
                  id="inp-invitados"
                  type="number"
                  min={100} max={500}
                  value={store.num_invitados}
                  onChange={(e) => store.setNumInvitados(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-2xl font-bold text-center text-[#0D2137] focus:outline-none focus:border-[#1A6BAC]"
                  aria-describedby="inv-hint"
                />
                <p id="inv-hint" className="mt-1.5 text-xs text-slate-400">
                  Mesas: {store.num_mesas} · Meseros: {store.num_meseros}
                </p>
                {store.num_invitados < 100 && (
                  <p role="alert" className="mt-2 text-xs font-medium text-red-600">
                    ⚠ El mínimo es 100 personas.
                  </p>
                )}
              </div>
              <PrecioEstimado store={store} />
            </section>
          )}

          {/* ── PASO 4: Colores ──────────────────────────────────────────────────── */}
          {store.paso_actual === 4 && (
            <section aria-labelledby="h-paso4">
              <h2 id="h-paso4" className="font-display text-2xl text-[#0D2137] mb-1">
                Elige tus colores
              </h2>
              <p className="text-slate-400 text-sm mb-6">
                Se guardan en <code className="bg-slate-100 px-1 rounded">color_primario</code> y{' '}
                <code className="bg-slate-100 px-1 rounded">color_secundario</code> de la sesión.
              </p>
              <div className="space-y-6">
                <ColorSelector
                  label="Color principal"
                  valor={store.color_primario}
                  onChange={(hex) => store.setColores(hex, store.color_secundario)}
                  idHint="color-ppal-hint"
                  hint="Define el color dominante de la decoración"
                />
                <ColorSelector
                  label="Color secundario"
                  valor={store.color_secundario}
                  onChange={(hex) => store.setColores(store.color_primario, hex)}
                  idHint="color-sec-hint"
                  hint="Complementa el color principal"
                />
              </div>
              {/* Vista previa */}
              <div
                className="mt-6 rounded-xl h-16 border border-slate-200 flex overflow-hidden"
                aria-label={`Vista previa: ${store.color_primario} y ${store.color_secundario}`}
              >
                <div className="flex-1" style={{ backgroundColor: store.color_primario }} />
                <div className="flex-1" style={{ backgroundColor: store.color_secundario }} />
              </div>
              <PrecioEstimado store={store} />
            </section>
          )}

          {/* ── PASO 5: Decoración ────────────────────────────────────────────────── */}
          {store.paso_actual === 5 && (
            <section aria-labelledby="h-paso5">
              <h2 id="h-paso5" className="font-display text-2xl text-[#0D2137] mb-1">
                Estilo de decoración y centro de mesa
              </h2>
              <p className="text-slate-400 text-sm mb-5">
                Guarda <code className="bg-slate-100 px-1 rounded">estilo_deco_id</code> y{' '}
                <code className="bg-slate-100 px-1 rounded">centro_mesa_id</code> en la sesión.
              </p>

              {/* Estilos de decoración — estilo_id, nombre, costo_adicional */}
              <h3 className="font-semibold text-slate-700 mb-3">Estilo de decoración</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-7">
                {(catalogos?.estilos_decoracion ?? []).map((e) => (
                  <button
                    key={e.estilo_id}
                    onClick={() => store.setEstiloDecoracion(e)}
                    aria-pressed={store.estilo_deco_id === e.estilo_id}
                    className={`rounded-xl border-2 p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-[#1A6BAC] ${
                      store.estilo_deco_id === e.estilo_id
                        ? 'border-[#0D2137] bg-[#0D2137]/5'
                        : 'border-slate-200 hover:border-[#0D2137]/30'
                    }`}
                  >
                    <p className="font-semibold text-[#0D2137] text-sm">{e.nombre}</p>
                    <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">{e.descripcion}</p>
                    {parseFloat(e.costo_adicional) > 0 && (
                      <p className="text-[#B7950B] text-xs font-medium mt-1">
                        +${parseFloat(e.costo_adicional).toFixed(2)}/persona
                      </p>
                    )}
                  </button>
                ))}
              </div>

              {/* Centros de mesa — centro_id, nombre, costo_por_mesa */}
              <h3 className="font-semibold text-slate-700 mb-3">Centro de mesa</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(catalogos?.centros_mesa ?? []).map((cm) => (
                  <button
                    key={cm.centro_id}
                    onClick={() => store.setCentroMesa(cm)}
                    aria-pressed={store.centro_mesa_id === cm.centro_id}
                    className={`rounded-xl border-2 p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-[#1A6BAC] ${
                      store.centro_mesa_id === cm.centro_id
                        ? 'border-[#0D2137] bg-[#0D2137]/5'
                        : 'border-slate-200 hover:border-[#0D2137]/30'
                    }`}
                  >
                    <p className="font-semibold text-[#0D2137] text-sm">{cm.nombre}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{cm.descripcion}</p>
                    <p className="text-[#B7950B] text-xs font-medium mt-1">
                      ${parseFloat(cm.costo_por_mesa).toFixed(2)}/mesa
                      · {store.num_mesas} mesas = ${(parseFloat(cm.costo_por_mesa) * store.num_mesas).toFixed(2)}
                    </p>
                  </button>
                ))}
              </div>
              <PrecioEstimado store={store} />
            </section>
          )}

          {/* ── PASO 6: Servicios adicionales ─────────────────────────────────────── */}
          {store.paso_actual === 6 && (
            <section aria-labelledby="h-paso6">
              <h2 id="h-paso6" className="font-display text-2xl text-[#0D2137] mb-1">
                Servicios adicionales
              </h2>
              <p className="text-slate-400 text-sm mb-5">
                Se guardan en <code className="bg-slate-100 px-1 rounded">eqim_configurador.sesion_servicios</code>
                · Campos: <code className="bg-slate-100 px-1 rounded">adicional_id, cantidad, precio_snapshot</code>
              </p>

              {/* Agrupar por categoría */}
              {agruparPorCategoria(catalogos?.servicios_adicionales ?? []).map(([cat, items]) => (
                <div key={cat} className="mb-6">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{cat}</h3>
                  <div className="space-y-2">
                    {items.map((ad) => {
                      const seleccionado = store.servicios.find((s) => s.adicional_id === ad.adicional_id);
                      return (
                        <div
                          key={ad.adicional_id}
                          className={`flex items-center justify-between rounded-xl border-2 p-3.5 transition-colors ${
                            seleccionado ? 'border-[#0D2137] bg-[#0D2137]/5' : 'border-slate-200'
                          }`}
                        >
                          <div className="flex-1 min-w-0 mr-3">
                            <p className="font-medium text-slate-800 text-sm truncate">{ad.nombre}</p>
                            <p className="text-slate-400 text-xs truncate">{ad.descripcion}</p>
                            <p className="text-[#B7950B] text-xs font-semibold mt-0.5">
                              ${parseFloat(ad.precio_unitario).toFixed(2)}/{ad.unidad}
                            </p>
                          </div>
                          {/* Contador de cantidad */}
                          <div className="flex items-center gap-2 shrink-0">
                            {seleccionado && (
                              <>
                                <button
                                  onClick={() => store.toggleServicio(ad, seleccionado.cantidad - 1)}
                                  className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-bold text-lg flex items-center justify-center hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1A6BAC]"
                                  aria-label={`Quitar una unidad de ${ad.nombre}`}
                                >
                                  −
                                </button>
                                <span className="w-6 text-center font-bold text-[#0D2137] text-sm">
                                  {seleccionado.cantidad}
                                </span>
                              </>
                            )}
                            <button
                              onClick={() => store.toggleServicio(ad, (seleccionado?.cantidad ?? 0) + 1)}
                              className="w-7 h-7 rounded-full bg-[#0D2137] text-white font-bold text-lg flex items-center justify-center hover:bg-[#1A6BAC] focus:outline-none focus:ring-2 focus:ring-[#1A6BAC]"
                              aria-label={`Agregar ${ad.nombre}`}
                            >
                              +
                            </button>
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

          {/* ── PASO 7: Resumen y cotización ────────────────────────────────────────── */}
          {store.paso_actual === 7 && (
            <section aria-labelledby="h-paso7">
              <h2 id="h-paso7" className="font-display text-2xl text-[#0D2137] mb-1">
                Resumen de tu evento
              </h2>
              <p className="text-slate-400 text-sm mb-6">
                Revisa todos los detalles antes de enviar tu solicitud.
              </p>

              <div className="space-y-3 text-sm">
                <FilaResumen label="Tipo de evento"     valor={store.tipoEventoSeleccionado?.tipo_nombre ?? '—'} />
                <FilaResumen label="Paquete"            valor={store.paqueteSeleccionado?.paquete_nombre ?? '—'} />
                <FilaResumen label="Invitados"          valor={`${store.num_invitados} personas`} />
                <FilaResumen label="Mesas / Meseros"    valor={`${store.num_mesas} mesas · ${store.num_meseros} meseros`} />
                <FilaResumen label="Estilo decoración"  valor={store.estiloSeleccionado?.nombre ?? 'Sin seleccionar'} />
                <FilaResumen label="Centro de mesa"     valor={store.centroMesaSeleccionado?.nombre ?? 'Sin seleccionar'} />
                {/* Colores */}
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Colores</span>
                  <div className="flex gap-2">
                    <ColorDot hex={store.color_primario} label="Principal" />
                    <ColorDot hex={store.color_secundario} label="Secundario" />
                  </div>
                </div>
                {/* Servicios adicionales */}
                {store.servicios.length > 0 && (
                  <div className="py-2 border-b border-slate-100">
                    <p className="text-slate-500 font-medium mb-2">Servicios adicionales</p>
                    {store.servicios.map((s) => (
                      <div key={s.adicional_id} className="flex justify-between text-xs text-slate-600 mb-1">
                        <span>{s.nombre} ×{s.cantidad}</span>
                        <span>${(s.precio_snapshot * s.cantidad).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Precio total — usa el del servidor si está disponible */}
              <div className="mt-6 p-5 rounded-xl bg-[#0D2137]">
                {store.precioServidor ? (
                  <>
                    <div className="flex justify-between text-white/70 text-xs mb-1">
                      <span>Subtotal paquete</span>
                      <span>${store.precioServidor.subtotal_paquete.toFixed(2)}</span>
                    </div>
                    {store.precioServidor.subtotal_mesas > 0 && (
                      <div className="flex justify-between text-white/70 text-xs mb-1">
                        <span>Subtotal mesas</span>
                        <span>${store.precioServidor.subtotal_mesas.toFixed(2)}</span>
                      </div>
                    )}
                    {store.precioServidor.subtotal_adicionales > 0 && (
                      <div className="flex justify-between text-white/70 text-xs mb-1">
                        <span>Servicios adicionales</span>
                        <span>${store.precioServidor.subtotal_adicionales.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t border-white/20 mt-2 pt-2 flex justify-between">
                      <span className="text-white font-bold">TOTAL ESTIMADO</span>
                      <span className="text-[#B7950B] font-bold text-xl">
                        ${store.precioServidor.total.toFixed(2)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold">TOTAL ESTIMADO</span>
                    <span className="text-[#B7950B] font-bold text-2xl">
                      ${store.precio_estimado.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => navigate('/solicitar')}
                className="mt-5 w-full py-4 rounded-xl bg-[#B7950B] text-white font-bold text-base hover:bg-[#9A7D0A] transition-colors focus:outline-none focus:ring-2 focus:ring-[#B7950B] focus:ring-offset-2"
                aria-label="Enviar solicitud de cotización"
              >
                Enviar solicitud de cotización →
              </button>
            </section>
          )}
        </div>

        {/* Navegación */}
        <div className="flex items-center justify-between mt-5">
          <button
            onClick={handlePrev}
            disabled={store.paso_actual === 1}
            className="px-6 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 font-medium text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#0D2137] hover:text-[#0D2137] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A6BAC]"
          >
            ← Anterior
          </button>

          <span className="text-xs text-slate-400">
            {guardando ? '💾 Guardando…' : `${store.paso_actual} / 7`}
          </span>

          {store.paso_actual < 7 && (
            <button
              onClick={handleNext}
              disabled={!pasoValido() || guardando}
              className="px-6 py-2.5 rounded-xl bg-[#0D2137] text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#1A6BAC] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A6BAC] focus:ring-offset-2"
            >
              {guardando ? 'Guardando…' : 'Siguiente →'}
            </button>
          )}
        </div>

        <div className="text-center mt-3">
          <button
            onClick={() => { if (window.confirm('¿Reiniciar el configurador?')) store.reset(); }}
            className="text-xs text-slate-400 hover:text-red-500 underline transition-colors"
          >
            Reiniciar
          </button>
        </div>
      </div>
    </main>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function PrecioEstimado({ store }) {
  if (!store.paqueteSeleccionado) return null;
  return (
    <div className="mt-6 flex items-center justify-between p-4 bg-[#0D2137]/5 rounded-xl">
      <span className="text-sm text-slate-600 font-medium">Precio estimado actual:</span>
      <span className="text-xl font-bold text-[#0D2137]">
        ${store.precio_estimado.toFixed(2)}
      </span>
    </div>
  );
}

function ColorSelector({ label, valor, onChange, idHint, hint }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
        <span
          className="ml-2 inline-block w-5 h-5 rounded-full border border-slate-300 align-middle"
          style={{ backgroundColor: valor }}
          aria-hidden="true"
        />
        <code className="ml-2 text-xs text-slate-400">{valor}</code>
      </label>
      <p id={idHint} className="text-xs text-slate-400 mb-2">{hint}</p>
      <div className="flex flex-wrap gap-2">
        {COLORES_PALETA.map((c) => (
          <button
            key={c.hex}
            onClick={() => onChange(c.hex)}
            title={c.nombre}
            aria-label={`${c.nombre} ${c.hex}`}
            aria-pressed={valor === c.hex}
            className={`w-9 h-9 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#1A6BAC] focus:ring-offset-1 ${
              valor === c.hex ? 'border-[#0D2137] scale-110 shadow-md' : 'border-transparent'
            }`}
            style={{ backgroundColor: c.hex }}
          />
        ))}
      </div>
      {/* Input hex manual */}
      <input
        type="color"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="mt-3 h-9 w-16 rounded cursor-pointer border border-slate-200"
        aria-label={`Selector de color personalizado para ${label}`}
        aria-describedby={idHint}
      />
    </div>
  );
}

function FilaResumen({ label, valor }) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-slate-100">
      <span className="text-slate-500 font-medium">{label}</span>
      <span className="text-[#0D2137] font-semibold text-right max-w-[55%]">{valor}</span>
    </div>
  );
}

function ColorDot({ hex, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-5 h-5 rounded-full border border-slate-200"
        style={{ backgroundColor: hex }}
        aria-hidden="true"
      />
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Emoji según tipo_codigo real de eqim_catalogo.tipos_evento
function iconoEvento(codigo) {
  const mapa = {
    MATRIMONIO_CIVIL:          '💍',
    MATRIMONIO_ECLESIASTICO:   '⛪',
    QUINCEANERA:               '👑',
    BAUTIZO:                   '👶',
    PRIMERA_COMUNION:          '✝️',
    CUMPLEANOS:                '🎂',
    GRADUACION:                '🎓',
    CONGRESO_EMPRESARIAL:      '💼',
    PEDIDA_MANO:               '💎',
    CENA_FAMILIAR:             '🍽️',
    SESION_FOTOGRAFICA:        '📸',
    MISA_CAMPAL:               '🙏',
  };
  return mapa[codigo] ?? '🎉';
}

// Agrupar servicios_adicionales por campo `categoria`
function agruparPorCategoria(servicios) {
  const mapa = {};
  servicios.forEach((s) => {
    const cat = s.categoria ?? 'OTROS';
    if (!mapa[cat]) mapa[cat] = [];
    mapa[cat].push(s);
  });
  return Object.entries(mapa);
}
