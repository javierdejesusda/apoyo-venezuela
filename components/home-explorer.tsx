'use client';

import { useMemo, useState } from 'react';

import dynamic from 'next/dynamic';

import { MapPin } from 'lucide-react';

import { Filters } from '@/components/filters';
import { LocationList } from '@/components/location-list';
import { ViewToggle, type HomeView } from '@/components/view-toggle';
import { applyFilters, sortLocations } from '@/lib/data/selectors';
import type { LocationFilters, LocationWithNeeds } from '@/lib/data/types';

const MapView = dynamic(() => import('@/components/map-view'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-surface-2 text-sm text-ink-faint">
      <MapPin className="mr-2 h-4 w-4 animate-pulse" aria-hidden /> Cargando mapa...
    </div>
  ),
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
      <ViewToggle value={view} onChange={setView} />
      {view === 'mapa' ? (
        <div className="h-[60vh] min-h-80 overflow-hidden rounded-2xl border border-border">
          <MapView
            locations={visible}
            selectedId={selectedId}
            onSelect={setSelectedId}
            className="h-full w-full"
          />
        </div>
      ) : (
        <LocationList locations={visible} emptyHint="Ajusta los filtros o reporta una zona nueva." />
      )}
    </section>
  );
}
