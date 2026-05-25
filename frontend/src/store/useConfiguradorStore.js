import { create } from 'zustand';

/**
 * Store del Configurador Interactivo — Sprint 4
 *
 * Mapea 1:1 las columnas de eqim_configurador.sesiones:
 *   tipo_evento_id, paquete_id, num_invitados,
 *   color_primario, color_secundario, estilo_deco_id,
 *   centro_mesa_id, num_mesas, num_meseros,
 *   paso_actual, completada, precio_estimado
 *
 * servicios → tabla eqim_configurador.sesion_servicios:
 *   [{ adicional_id, cantidad, precio_snapshot }]
 */
export const useConfiguradorStore = create((set, get) => ({

  // ── Estado de sesión (mapea a eqim_configurador.sesiones) ────────────────
  sesion_id:        null,    // null = sesión aún no guardada en BD
  tipo_evento_id:   null,
  paquete_id:       null,
  num_invitados:    100,
  fecha_evento:     null,
  color_primario:   '#0D2137',
  color_secundario: '#B7950B',
  estilo_deco_id:   null,
  centro_mesa_id:   null,
  num_mesas:        13,      // ceil(100/8) para mínimo 100
  num_meseros:      10,      // ceil(100/10)
  paso_actual:      1,
  completada:       false,
  precio_estimado:  0,

  // ── Servicios adicionales (sesion_servicios) ──────────────────────────────
  // [{ adicional_id, nombre, cantidad, precio_snapshot }]
  servicios: [],

  // ── Datos enriquecidos para la UI (no van a BD) ───────────────────────────
  paqueteSeleccionado:    null,
  tipoEventoSeleccionado: null,
  estiloSeleccionado:     null,
  centroMesaSeleccionado: null,

  // ── Precio calculado en el servidor (paso 7) ──────────────────────────────
  precioServidor: null,  // { total, subtotal_paquete, subtotal_mesas, subtotal_adicionales }

  // ─────────────────────────────────────────────────────────────────────────
  //  ACCIONES
  // ─────────────────────────────────────────────────────────────────────────

  setFechaEvento: (fecha) => set({ fecha_evento: fecha }),
  setPaso: (n) => set({ paso_actual: Math.min(Math.max(n, 1), 8) }),
  nextPaso: () => set((s) => ({ paso_actual: Math.min(s.paso_actual + 1, 8) })),
  prevPaso: () => set((s) => ({ paso_actual: Math.max(s.paso_actual - 1, 1) })),

  setTipoEvento: (tipo) => set({
    tipo_evento_id:          tipo.tipo_id,
    tipoEventoSeleccionado:  tipo,
  }),

  setPaquete: (paquete) => {
    set({
      paquete_id:           paquete.paquete_id,
      paqueteSeleccionado:  paquete,
    });
    get().recalcularPrecio();
  },

  setNumInvitados: (n) => {
    const num = Math.max(100, parseInt(n, 10) || 100);
    // Recalcular mesas y meseros automáticamente
    const num_mesas   = Math.ceil(num / 8);
    const num_meseros = Math.ceil(num / 10);
    set({ num_invitados: num, num_mesas, num_meseros });
    get().recalcularPrecio();
  },

  setColores: (primario, secundario) => set({
    color_primario:   primario   ?? get().color_primario,
    color_secundario: secundario ?? get().color_secundario,
  }),

  setEstiloDecoracion: (estilo) => {
    set({
      estilo_deco_id:      estilo?.estilo_id ?? null,
      estiloSeleccionado:  estilo,
    });
    get().recalcularPrecio();
  },

  setCentroMesa: (centro) => {
    set({
      centro_mesa_id:          centro?.centro_id ?? null,
      centroMesaSeleccionado:  centro,
    });
    get().recalcularPrecio();
  },

  // Agregar o quitar una unidad de un servicio adicional
  toggleServicio: (adicional, cantidad = 1) => {
    const { servicios } = get();
    const existe = servicios.find((s) => s.adicional_id === adicional.adicional_id);

    let nuevosServicios;
    if (existe) {
      // Si ya existe y cantidad es 0 → eliminar
      if (cantidad <= 0) {
        nuevosServicios = servicios.filter((s) => s.adicional_id !== adicional.adicional_id);
      } else {
        nuevosServicios = servicios.map((s) =>
          s.adicional_id === adicional.adicional_id
            ? { ...s, cantidad, precio_snapshot: parseFloat(adicional.precio_unitario) }
            : s
        );
      }
    } else {
      nuevosServicios = [
        ...servicios,
        {
          adicional_id:    adicional.adicional_id,
          nombre:          adicional.nombre,
          cantidad,
          precio_snapshot: parseFloat(adicional.precio_unitario),
        },
      ];
    }

    set({ servicios: nuevosServicios });
    get().recalcularPrecio();
  },

  // Precio en tiempo real (cliente) — confirmación del servidor en paso 7
  recalcularPrecio: () => {
    const {
      paqueteSeleccionado, num_invitados,
      centroMesaSeleccionado, servicios,
    } = get();

    if (!paqueteSeleccionado) return;

    const personas    = Math.max(num_invitados, paqueteSeleccionado.minimo_invitados);
    const subtotalPaq = parseFloat(paqueteSeleccionado.precio_persona) * personas;

    // costo_por_mesa viene de centros_mesa
    const numMesas        = Math.ceil(personas / 8);
    const costoPorMesa    = centroMesaSeleccionado
      ? parseFloat(centroMesaSeleccionado.costo_por_mesa)
      : 0;
    const subtotalMesas   = costoPorMesa * numMesas;

    const subtotalSvc = servicios.reduce(
      (acc, s) => acc + parseFloat(s.precio_snapshot) * s.cantidad,
      0
    );

    set({ precio_estimado: subtotalPaq + subtotalMesas + subtotalSvc });
  },

  // Guardar resultado del servidor (precio definitivo)
  setPrecioServidor: (precio) => set({ precioServidor: precio }),

  setSesionId: (id) => set({ sesion_id: id }),

  reset: () => set({
    sesion_id:               null,
    tipo_evento_id:          null,
    paquete_id:              null,
    num_invitados:           100,
    color_primario:          '#0D2137',
    color_secundario:        '#B7950B',
    estilo_deco_id:          null,
    centro_mesa_id:          null,
    num_mesas:               13,
    num_meseros:             10,
    paso_actual:             1,
    completada:              false,
    precio_estimado:         0,
    servicios:               [],
    paqueteSeleccionado:     null,
    tipoEventoSeleccionado:  null,
    estiloSeleccionado:      null,
    centroMesaSeleccionado:  null,
    precioServidor:          null,
  }),
}));
