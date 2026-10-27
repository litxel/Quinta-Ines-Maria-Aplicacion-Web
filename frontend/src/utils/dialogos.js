import { useDialogoStore } from '../store/useDialogoStore';

// =============================================================================
//  Diálogos con el diseño de la Quinta (en vez de alert/confirm del navegador)
//
//  if (await confirmar({ titulo: '¿Eliminar?', mensaje: '…', tipo: 'peligro' })) { … }
//  await avisar({ titulo: 'Listo', mensaje: '…', tipo: 'exito' });
//
//  tipo: 'info' (dorado) · 'exito' (verde) · 'advertencia' (ámbar) ·
//        'error' (rojo) · 'peligro' (rojo, para acciones que no se deshacen)
// =============================================================================

/** Pide confirmación. Devuelve true si el usuario acepta. */
export const confirmar = ({
  titulo = '¿Estás seguro?',
  mensaje = '',
  tipo = 'advertencia',
  textoConfirmar = 'Sí, continuar',
  textoCancelar = 'Cancelar',
} = {}) =>
  useDialogoStore.getState().abrir({ titulo, mensaje, tipo, textoConfirmar, textoCancelar, soloAviso: false });

/** Muestra un aviso con un solo botón. Se resuelve al cerrarlo. */
export const avisar = ({
  titulo,
  mensaje = '',
  tipo = 'info',
  textoConfirmar = 'Entendido',
} = {}) =>
  useDialogoStore.getState().abrir({
    titulo: titulo ?? { exito: '¡Listo!', error: 'Algo salió mal', advertencia: 'Atención' }[tipo] ?? 'Aviso',
    mensaje, tipo, textoConfirmar, soloAviso: true,
  });

/** Mensaje de error legible a partir de un error de axios. */
export const mensajeDeError = (err, porDefecto = 'Ocurrió un error. Intenta nuevamente.') =>
  err?.response?.data?.message ?? (err?.code === 'ECONNABORTED' ? 'El servidor tardó demasiado en responder.' : porDefecto);
