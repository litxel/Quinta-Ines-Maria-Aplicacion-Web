import { Clock, Search, CheckCircle2, XCircle, Ban, PartyPopper } from 'lucide-react';

// Colores: amber | blue | green | red | slate | purple
const CONFIG = {
  amber:  { bg: 'bg-amber-50  dark:bg-amber-500/10',  text: 'text-amber-700 dark:text-amber-400',  border: 'border-amber-200 dark:border-amber-500/25',  Icon: Clock         },
  blue:   { bg: 'bg-blue-50   dark:bg-blue-500/10',   text: 'text-blue-700  dark:text-blue-400',   border: 'border-blue-200  dark:border-blue-500/25',   Icon: Search        },
  green:  { bg: 'bg-green-50  dark:bg-green-500/10',  text: 'text-green-700 dark:text-green-400',  border: 'border-green-200 dark:border-green-500/25',  Icon: CheckCircle2  },
  red:    { bg: 'bg-red-50    dark:bg-red-500/10',    text: 'text-red-700   dark:text-red-400',    border: 'border-red-200   dark:border-red-500/25',    Icon: XCircle       },
  slate:  { bg: 'bg-slate-50  dark:bg-slate-500/10',  text: 'text-slate-600 dark:text-slate-400',  border: 'border-slate-200 dark:border-slate-500/25',  Icon: Ban           },
  purple: { bg: 'bg-purple-50 dark:bg-purple-500/10', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-500/25', Icon: PartyPopper  },
};

export default function BadgeEstado({ estadoColor = 'slate', estadoNombre = 'Desconocido', size = 'md' }) {
  const { bg, text, border, Icon } = CONFIG[estadoColor] ?? CONFIG.slate;
  const padding = size === 'sm' ? 'text-[10px] px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5';
  const iconSize = size === 'sm' ? 10 : 12;

  return (
    <span className={`inline-flex items-center rounded-full border font-semibold ${bg} ${text} ${border} ${padding}`}>
      <Icon size={iconSize} strokeWidth={2.5} aria-hidden="true" />
      {estadoNombre}
    </span>
  );
}
