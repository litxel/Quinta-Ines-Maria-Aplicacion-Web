// =============================================================================
//  BadgeEstado — Badge de estado reutilizable
//  Usa los color_badge que devuelve la API desde eqim_solicitudes.estados.
//  Colores disponibles: amber | blue | green | red | slate | purple
// =============================================================================

const COLORES = {
  amber:  'bg-amber-100  text-amber-800  border-amber-200',
  blue:   'bg-blue-100   text-blue-800   border-blue-200',
  green:  'bg-green-100  text-green-800  border-green-200',
  red:    'bg-red-100    text-red-800    border-red-200',
  slate:  'bg-slate-100  text-slate-700  border-slate-200',
  purple: 'bg-purple-100 text-purple-800 border-purple-200',
};

const ICONOS = {
  amber:  '⏳',
  blue:   '🔍',
  green:  '✅',
  red:    '❌',
  slate:  '⊘',
  purple: '🎉',
};

export default function BadgeEstado({ estadoColor = 'slate', estadoNombre = 'Desconocido', size = 'md' }) {
  const clases    = COLORES[estadoColor] ?? COLORES.slate;
  const icono     = ICONOS[estadoColor]  ?? '•';
  const tamano    = size === 'sm'
    ? 'text-[10px] px-2 py-0.5'
    : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${clases} ${tamano}`}>
      <span aria-hidden="true">{icono}</span>
      {estadoNombre}
    </span>
  );
}
