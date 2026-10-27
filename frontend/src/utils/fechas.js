// =============================================================================
//  Fechas — EventPlanner QIM
//
//  `new Date('2026-11-14')` se interpreta como medianoche UTC, que en Ecuador
//  (UTC-5) es el 13 de noviembre a las 19:00 → se mostraría un día antes.
//  Estas funciones tratan 'YYYY-MM-DD' como fecha local.
// =============================================================================

/** Convierte 'YYYY-MM-DD' o una fecha ISO en Date local (o null si no es válida). */
export const fechaLocal = (valor) => {
  if (!valor) return null;
  if (typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor)) return new Date(`${valor}T12:00:00`);
  const d = new Date(valor);
  return isNaN(d) ? null : d;
};

/** Formatea una fecha en español de Ecuador; '—' si no hay fecha. */
export const formatearFecha = (valor, opciones = { day: '2-digit', month: 'short', year: 'numeric' }) => {
  const d = fechaLocal(valor);
  return d ? d.toLocaleDateString('es-EC', opciones) : '—';
};
