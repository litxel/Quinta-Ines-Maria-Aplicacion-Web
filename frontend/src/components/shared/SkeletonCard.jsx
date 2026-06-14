/* Tarjeta esqueleto con efecto shimmer para estados de carga */
export default function SkeletonCard({ variant = 'package' }) {
  if (variant === 'package') {
    return (
      <div className="bg-white dark:bg-[#332247] rounded-3xl overflow-hidden border border-slate-100 dark:border-white/8 flex flex-col card-shadow">
        <div className="skeleton h-52 rounded-none" />
        <div className="p-7 flex-1 space-y-3">
          <div className="skeleton h-4 w-3/4 rounded-xl" />
          <div className="skeleton h-3 w-full rounded-xl" />
          <div className="skeleton h-3 w-5/6 rounded-xl" />
          <div className="skeleton h-3 w-2/3 rounded-xl" />
        </div>
        <div className="px-7 pb-7">
          <div className="skeleton h-12 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (variant === 'gallery') {
    return (
      <div className="rounded-2xl overflow-hidden border border-slate-100 dark:border-white/8 card-shadow">
        <div className="skeleton h-56 rounded-none" />
      </div>
    );
  }

  if (variant === 'row') {
    return (
      <div className="bg-white dark:bg-[#332247] rounded-2xl p-5 border border-slate-100 dark:border-white/8 flex items-center gap-4 card-shadow">
        <div className="skeleton w-12 h-12 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3.5 w-2/3 rounded-lg" />
          <div className="skeleton h-3 w-1/2 rounded-lg" />
        </div>
        <div className="skeleton h-8 w-20 rounded-xl shrink-0" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#332247] rounded-2xl p-6 border border-slate-100 dark:border-white/8 space-y-3 card-shadow">
      <div className="skeleton h-4 w-3/4 rounded-xl" />
      <div className="skeleton h-3 w-full rounded-xl" />
      <div className="skeleton h-3 w-5/6 rounded-xl" />
    </div>
  );
}

/* Componente wrapper para mostrar N skeletons mientras carga */
export function SkeletonList({ count = 3, variant = 'package', className = '' }) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} variant={variant} />
      ))}
    </div>
  );
}
