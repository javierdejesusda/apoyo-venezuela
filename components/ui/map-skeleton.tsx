import { SeismicLoader } from '@/components/ui/seismic-loader';
import { cn } from '@/lib/utils';

/**
 * Instant-paint placeholder shown while the heavy Leaflet map chunk downloads.
 * Zero leaflet imports, so it ships in the cheap initial chunk and fills the
 * reserved map height edge-to-edge: there is never a blank or black box on slow
 * 2G/3G connections.
 */
export function MapSkeleton({ className }: { className?: string }) {
  return (
    <div
      data-testid="map-skeleton"
      role="status"
      aria-busy="true"
      aria-label="Cargando mapa"
      className={cn('flex h-full w-full items-center justify-center bg-surface-2', className)}
    >
      <SeismicLoader label="Cargando mapa…" />
    </div>
  );
}
