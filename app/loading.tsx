import { Skeleton, SkeletonCard } from '@/components/skeleton';

export default function Loading() {
  return (
    <div className="space-y-6 py-2" aria-label="Cargando contenido" aria-busy="true">
      <div className="space-y-3 pt-2">
        <Skeleton className="h-5 w-48 rounded-full" />
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-5 w-1/2" />
      </div>

      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-surface p-3 space-y-2">
            <Skeleton className="h-6 w-10" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>

      <Skeleton className="h-11 w-full rounded-xl" />

      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
