/**
 * Append-only timeline of cluster events for a zone detail page.
 * Renders a semantic ordered list sorted chronologically. No edit affordances.
 */
import type { TimelineEntry, ZoneUpdateKind } from '@/lib/data/types';
import { formatRelativeTime } from '@/lib/utils';

interface ZoneTimelineProps {
  entries: TimelineEntry[];
}

function kindLabel(kind: ZoneUpdateKind, isFirst: boolean): string {
  if (kind === 'merged_duplicate') return 'Agrupado con un reporte similar';
  if (kind === 'report_added' && isFirst) return 'Reporte inicial';
  return 'Actualización';
}

export function ZoneTimeline({ entries }: ZoneTimelineProps) {
  const sorted = [...entries].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return (
    <section aria-labelledby="timeline-heading">
      <h2 id="timeline-heading" className="mb-2 text-sm font-semibold text-ink">
        Historial de actualizaciones
      </h2>
      <ol className="space-y-2">
        {sorted.map((entry, index) => (
          // entry.note carries internal cluster/location identifiers and is
          // intentionally NOT rendered to the client.
          <li key={entry.id} className="flex gap-3 text-sm text-ink-soft">
            <time dateTime={entry.createdAt} className="shrink-0 text-ink-faint">
              {formatRelativeTime(entry.createdAt)}
            </time>
            <span>{kindLabel(entry.kind, index === 0)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
