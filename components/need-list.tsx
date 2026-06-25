import type { NeedRecord } from '@/lib/data/types';
import { NeedItem } from '@/components/need-item';

const STATUS_ORDER: Record<string, number> = { pendiente: 0, en_camino: 1, cubierto: 2 };
const URGENCY_ORDER: Record<string, number> = { alta: 0, media: 1, baja: 2 };

function sortNeeds(needs: NeedRecord[]): NeedRecord[] {
  return [...needs].sort((a, b) => {
    const statusDiff = (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3);
    if (statusDiff !== 0) return statusDiff;
    return (URGENCY_ORDER[a.urgencia] ?? 3) - (URGENCY_ORDER[b.urgencia] ?? 3);
  });
}

interface NeedListProps {
  needs: NeedRecord[];
  locationId: string;
}

export function NeedList({ needs, locationId }: NeedListProps) {
  if (needs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface-2 px-4 py-8 text-center">
        <p className="text-sm text-ink-faint">
          Aún no hay necesidades registradas. Agrega la primera.
        </p>
      </div>
    );
  }

  const sorted = sortNeeds(needs);

  return (
    <section aria-label="Lista de necesidades">
      <h2 className="mb-3 text-base font-semibold text-ink">Necesidades reportadas</h2>
      <ul className="space-y-3">
        {sorted.map((need) => (
          <li key={need.id}>
            <NeedItem need={need} locationId={locationId} />
          </li>
        ))}
      </ul>
    </section>
  );
}
