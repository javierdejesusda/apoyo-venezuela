'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import dynamic from 'next/dynamic';

import { Filters } from '@/components/filters';
import { LocationList } from '@/components/location-list';
import { ModeTabs } from '@/components/mode-tabs';
import { MapSkeleton } from '@/components/ui/map-skeleton';
import { ViewToggle, type HomeView } from '@/components/view-toggle';
import { applyFilters, sortLocations } from '@/lib/data/selectors';
import { PAGE_SIZE } from '@/lib/data/store';
import type { ExplorerMode, LocationFilters, LocationWithNeeds } from '@/lib/data/types';
import type { Sismo } from '@/lib/sismos/types';

const MapView = dynamic(() => import('@/components/map-view'), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

interface ZonasResponse {
  items: LocationWithNeeds[];
  total: number;
  nextCursor: number | null;
}

/** Raw fetch + ok-check shared by all three fetch sites. */
async function fetchZonas(url: string): Promise<ZonasResponse> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`/api/zonas ${res.status}`);
  return res.json() as Promise<ZonasResponse>;
}

/**
 * Build a /api/zonas URL from filters plus a cursor or all=true option.
 * Centralised so every caller uses the same parameter names.
 */
function buildZonasUrl(
  filters: LocationFilters,
  options: { cursor?: number; all?: boolean },
): string {
  const params = new URLSearchParams();
  if (filters.estado) params.set('estado', filters.estado);
  if (filters.ciudad) params.set('ciudad', filters.ciudad);
  if (filters.status) params.set('status', filters.status);
  if (filters.categoria) params.set('categoria', filters.categoria);
  if (filters.urgencia) params.set('urgencia', filters.urgencia);
  if (filters.texto) params.set('texto', filters.texto);
  if (filters.soloConPedidos) params.set('soloConPedidos', 'true');
  if (options.all) {
    params.set('all', 'true');
  } else {
    params.set('cursor', String(options.cursor ?? 0));
  }
  return `/api/zonas?${params.toString()}`;
}

// Ayuda mode always seeds with soloConPedidos — hoisted so useMemo can reference
// a stable object identity and avoid recomputing the filtered set on every render.
const DEFAULT_AYUDA_FILTERS: LocationFilters = { soloConPedidos: true };

/**
 * Client shell that filters zones and switches between the map and the list.
 *
 * Map:  renders the full server-loaded set embedded at ISR time, so the default
 *       view needs no per-visitor fetch. Filter changes refetch all matches.
 * List: bounded to PAGE_SIZE items; "Ver más" appends the next page.
 *
 * Server-path filter changes are debounced 300 ms; the latest-wins monotonic
 * requestId guard ensures out-of-order responses are discarded.
 */
export function HomeExplorer({
  initialLocations,
  initialMapLocations,
  initialTotal,
  states,
  ciudadesByEstado = {},
  sismos = [],
  ayudaCount = 0,
  danosCount = 0,
}: {
  initialLocations: LocationWithNeeds[];
  /**
   * Full matching set for the map surface, embedded by the server. Defaults to
   * the bounded `initialLocations` so call sites that only pass the first page
   * still render (the map then shows just that page until a fetch widens it).
   */
  initialMapLocations?: LocationWithNeeds[];
  initialTotal: number;
  states: string[];
  ciudadesByEstado?: Record<string, string[]>;
  /** Recent earthquakes to plot as epicenters on the map surface. */
  sismos?: Sismo[];
  /** Count of zones with open needs, for the ayuda tab badge. */
  ayudaCount?: number;
  /** Total zones count, for the danos tab badge. */
  danosCount?: number;
}) {
  const mapInitial = initialMapLocations ?? initialLocations;

  // Always start in ayuda mode so the server-rendered HTML matches the ISR-cached
  // page. The URL is read once after hydration (useEffect below) to switch to danos
  // if the user deep-linked to /?m=danos, avoiding any hydration mismatch.
  // Memoized: re-renders from pin-clicks, keystrokes, and view-toggles no longer
  // recompute sortLocations(applyFilters(...)) over the full ~800-location set.
  const seeded = useMemo(
    () => sortLocations(applyFilters(mapInitial, DEFAULT_AYUDA_FILTERS)),
    [mapInitial],
  );

  const [mode, setMode] = useState<ExplorerMode>('ayuda');
  const [filters, setFilters] = useState<LocationFilters>(DEFAULT_AYUDA_FILTERS);
  const [view, setView] = useState<HomeView>('mapa');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [displayed, setDisplayed] = useState<LocationWithNeeds[]>(() => seeded.slice(0, PAGE_SIZE));
  const [total, setTotal] = useState(seeded.length);
  const [cursorOffset, setCursorOffset] = useState(() => Math.min(seeded.length, PAGE_SIZE));
  // The default map data is already embedded, so nothing is loading on mount.
  const [loading, setLoading] = useState(false);
  // mapLocations holds the full matching set for the map surface.
  const [mapLocations, setMapLocations] = useState<LocationWithNeeds[]>(seeded);

  // Monotonic counter: every dispatch increments this; stale resolves are
  // detected by comparing the captured id to the current value.
  const requestIdRef = useRef(0);
  // Debounce timer for server-path filter changes.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Shadow of view state kept in a ref so callbacks never capture stale view.
  const viewRef = useRef<HomeView>('mapa');

  /**
   * Shared fetch dispatcher: increments the request id, sets loading, calls
   * onSuccess only if still the latest request, and clears loading on both
   * success and error. Prior data is preserved on error (no state reset).
   */
  const dispatch = useCallback(
    (url: string, onSuccess: (data: ZonasResponse) => void): void => {
      const thisId = ++requestIdRef.current;
      setLoading(true);
      fetchZonas(url)
        .then((data) => {
          if (thisId !== requestIdRef.current) return;
          onSuccess(data);
          setLoading(false);
        })
        .catch(() => {
          if (thisId !== requestIdRef.current) return;
          // Prior data preserved; just clear the loading indicator.
          setLoading(false);
        });
    },
    [],
  );

  const handleFilterChange = useCallback(
    (newFilters: LocationFilters): void => {
      setFilters(newFilters);

      if (initialTotal <= PAGE_SIZE) {
        // All data embedded; filter entirely on the client for instant response.
        const next = sortLocations(applyFilters(initialLocations, newFilters));
        setDisplayed(next);
        setTotal(next.length);
        setCursorOffset(next.length);
        setMapLocations(next);
        return;
      }

      // Server path: debounce to avoid a full-table scan per keystroke.
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (viewRef.current === 'mapa') {
          // In map view: fetch every match; also prime the list for the return trip.
          dispatch(buildZonasUrl(newFilters, { all: true }), (data) => {
            setMapLocations(data.items);
            setDisplayed(data.items.slice(0, PAGE_SIZE));
            setTotal(data.total);
            setCursorOffset(Math.min(data.items.length, PAGE_SIZE));
          });
        } else {
          dispatch(buildZonasUrl(newFilters, { cursor: 0 }), (data) => {
            setDisplayed(data.items);
            setTotal(data.total);
            setCursorOffset(data.items.length);
          });
        }
      }, 300);
    },
    [initialLocations, initialTotal, dispatch],
  );

  const handleModeChange = useCallback(
    (newMode: ExplorerMode): void => {
      setMode(newMode);
      // Keep universal filters, drop mode-specific ones, inject the new invariant.
      const base: LocationFilters = {
        texto: filters.texto,
        estado: filters.estado,
        ciudad: filters.ciudad,
      };
      const newFilters: LocationFilters =
        newMode === 'ayuda' ? { ...base, soloConPedidos: true } : base;
      handleFilterChange(newFilters);
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', `?m=${newMode}`);
      }
    },
    [filters, handleFilterChange],
  );

  // One-time URL sync: if the user deep-linked to /?m=danos, switch client-side
  // after hydration so the server HTML (always ayuda) matches the ISR cache.
  useEffect(() => {
    const m = new URLSearchParams(window.location.search).get('m');
    // eslint-disable-next-line react-hooks/set-state-in-effect -- legitimate external-state sync (URL -> React)
    if (m === 'danos') handleModeChange('danos');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- empty deps intentional: one-time URL read on mount
  }, []);

  const handleLoadMore = useCallback((): void => {
    dispatch(buildZonasUrl(filters, { cursor: cursorOffset }), (data) => {
      setDisplayed((prev) => [...prev, ...data.items]);
      setTotal(data.total);
      setCursorOffset((prev) => prev + data.items.length);
    });
  }, [filters, cursorOffset, dispatch]);

  const handleViewChange = useCallback(
    (newView: HomeView): void => {
      viewRef.current = newView;
      setView(newView);
      if (newView === 'mapa' && initialTotal > PAGE_SIZE) {
        // Lazy-load all matching zones on first map open (or each view switch).
        dispatch(buildZonasUrl(filters, { all: true }), (data) => {
          setMapLocations(data.items);
        });
      }
    },
    [filters, initialTotal, dispatch],
  );

  const remaining = total - displayed.length;

  const sectionLabel =
    mode === 'ayuda' ? 'Pedidos de ayuda activos' : 'Reportes de daño estructural';

  return (
    <section className="space-y-4" aria-label={sectionLabel}>
      <ModeTabs
        mode={mode}
        onChange={handleModeChange}
        ayudaCount={ayudaCount}
        danosCount={danosCount}
      />

      <Filters
        value={filters}
        onChange={handleFilterChange}
        states={states}
        ciudadesByEstado={ciudadesByEstado}
        resultCount={total}
        mode={mode}
      />

      <div className="flex items-center justify-between gap-3">
        <p className="eyebrow text-ink-faint">
          {view === 'mapa' ? 'Mapa de la emergencia' : 'Zonas reportadas'}
        </p>
        <ViewToggle value={view} onChange={handleViewChange} />
      </div>

      {view === 'mapa' ? (
        <div className="space-y-2">
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
            <div className="h-[62vh] min-h-80">
              {loading ? (
                <MapSkeleton />
              ) : (
                <MapView
                  locations={mapLocations}
                  sismos={sismos}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  className="h-full w-full"
                  mode={mode}
                />
              )}
            </div>
          </div>
          <p className="text-ink-soft text-xs">
            Toca un punto para ver la zona y sus necesidades.
          </p>
        </div>
      ) : (
        <div aria-live="polite">
          <LocationList
            locations={displayed}
            emptyHint="Ajusta los filtros o reporta una zona nueva."
            mode={mode}
          />
          {remaining > 0 && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loading}
                className="rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink disabled:opacity-50"
              >
                {loading ? 'Cargando...' : `Ver más (${remaining} restantes)`}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
