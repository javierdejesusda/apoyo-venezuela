import { Inbox } from 'lucide-react';

import { LocationCard } from '@/components/location-card';
import type { LocationWithNeeds } from '@/lib/data/types';

/** Responsive grid of zone cards with an empty state. */
export function LocationList({
  locations,
  emptyHint,
}: {
  locations: LocationWithNeeds[];
  emptyHint?: string;
}) {
  if (locations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-strong bg-surface px-6 py-12 text-center">
        <Inbox className="h-8 w-8 text-ink-faint" aria-hidden />
        <p className="mt-3 text-sm font-medium text-ink">No hay zonas que coincidan</p>
        {emptyHint && <p className="mt-1 text-sm text-ink-soft">{emptyHint}</p>}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {locations.map((location) => (
        <LocationCard key={location.id} location={location} />
      ))}
    </div>
  );
}
