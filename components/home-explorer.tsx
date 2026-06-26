'use client';

import { useMemo, useState } from 'react';

import dynamic from 'next/dynamic';

import { Filters } from '@/components/filters';
import { LocationList } from '@/components/location-list';
import { MapSkeleton } from '@/components/ui/map-skeleton';
import { ViewToggle, type HomeView } from '@/components/view-toggle';
import { applyFilters, sortLocations } from '@/lib/data/selectors';
import type { LocationFilters, LocationWithNeeds } from '@/lib/data/types';

const MapView = dynamic(() => import('@/components/map-view'), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

/** Client shell that filters zones and switches between the map and the list. */
export function HomeExplorer({
  locations,
  states,
}: {
  locations: LocationWithNeeds[];
  states: string[];
}) {
  const [filters, setFilters] = useState<LocationFilters>({});
  const [view, setView] = useState<HomeView>('mapa');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visible = useMemo(
    () => sortLocations(applyFilters(locations, filters)),
    [locations, filters],
  );

  return (
    <section className="space-y-4">
      <Filters value={filters} onChange={setFilters} states={states} resultCount={visible.length} />

      <div className="flex items-center justify-between gap-3">
        <p className="eyebrow text-ink-faint">
          {view === 'mapa' ? 'Mapa de la emergencia' : 'Zonas reportadas'}
        </p>
        <ViewToggle value={view} onChange={setView} />
      </div>

      {view === 'mapa' ? (
        <div className="space-y-2">
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
            <div className="h-[62vh] min-h-80">
              <MapView
                locations={visible}
                selectedId={selectedId}
                onSelect={setSelectedId}
                className="h-full w-full"
              />
            </div>
          </div>
          <p className="text-ink-soft text-xs">
            Toca un punto para ver la zona y sus necesidades.
          </p>
        </div>
      ) : (
        <LocationList locations={visible} emptyHint="Ajusta los filtros o reporta una zona nueva." />
      )}
    </section>
  );
}
