import { Layers } from 'lucide-react';

/**
 * Caveat shown when a zone's displayed status, photos and trapped-persons flag
 * are the aggregate of several co-located reports rather than this single
 * building. It prevents a stable building from silently appearing as derrumbe
 * (or with "personas atrapadas") just because a different nearby report did.
 * Renders nothing for a single-member zone, where no aggregation happened.
 */
export function GroupedReportsNote({ memberCount }: { memberCount: number }) {
  if (memberCount <= 1) return null;

  return (
    <div className="flex items-start gap-2 rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-xs text-ink-soft">
      <Layers className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" aria-hidden />
      <p>
        Información agrupada de {memberCount} reportes de esta zona. El estado, las
        fotos y las alertas combinan los reportes cercanos, no un edificio en
        particular.
      </p>
    </div>
  );
}
