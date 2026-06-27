import { MapPinned } from 'lucide-react';

import { LocationCard } from '@/components/location-card';
import type { ExplorerMode, LocationWithNeeds } from '@/lib/data/types';

/** Responsive grid of zone cards with an empty state. */
export function LocationList({
  locations,
  emptyHint,
  mode = 'danos',
}: {
  locations: LocationWithNeeds[];
  emptyHint?: string;
  mode?: ExplorerMode;
}) {
  if (locations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-strong bg-surface px-6 py-14 text-center shadow-card">
        <span className="relative mb-4 flex h-14 w-14 items-center justify-center" aria-hidden>
          <span className="absolute inset-0 rounded-full border border-border-strong" />
          <span className="absolute inset-2.5 rounded-full border border-border-strong" />
          <MapPinned className="relative h-5 w-5 text-ink-faint" />
        </span>
        <p className="text-sm font-medium text-ink">No hay zonas que coincidan</p>
        {emptyHint && <p className="mt-1 max-w-xs text-sm text-ink-soft">{emptyHint}</p>}
      </div>
    );
  }

  return (
    // Single column keeps each horizontal card wide enough for the cover photo
    // plus its details; two columns only once the container is wide enough.
    <div className="grid gap-3 lg:grid-cols-2">
      {locations.map((location) => (
        <LocationCard key={location.id} location={location} mode={mode} />
      ))}
    </div>
  );
}
