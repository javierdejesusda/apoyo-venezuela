import { HomeExplorer } from '@/components/home-explorer';
import { HomeHero } from '@/components/home-hero';
import { MissingPersonsLink } from '@/components/missing-persons-link';
import { SeismicTicker } from '@/components/seismic-ticker';
import { SharePanel } from '@/components/share-panel';
import { loadHomeData } from '@/lib/data/home';
import { stripContactPii } from '@/lib/data/selectors';
import { getStore, PAGE_SIZE } from '@/lib/data/store';
import { loadSismos } from '@/lib/sismos/load';

// ISR with 30-second revalidation. In-app writes call revalidatePath('/')
// via app/actions.ts for instant on-demand revalidation. Out-of-band changes
// (e.g. `npm run delete-report`, which bypasses the app) reflect within 30 s,
// which is an acceptable trade-off for surviving high concurrent load.
export const revalidate = 30;

export default async function HomePage() {
  const [{ locations, stats, states, ciudadesByEstado, loadFailed }, sismos] =
    await Promise.all([loadHomeData(getStore()), loadSismos()]);

  // Embed the full server-loaded set for the map (no per-visitor fetch) and a
  // bounded first page for the list, both with reporter contact PII stripped
  // since neither surface displays it. listLocations() returns the sorted set.
  const mapLocations = locations.map(stripContactPii);
  const initialLocations = mapLocations.slice(0, PAGE_SIZE);
  const initialTotal = mapLocations.length;

  return (
    <div className="space-y-6">
      <SeismicTicker sismos={sismos} />

      <HomeHero stats={stats} />

      <MissingPersonsLink variant="card" />

      <SharePanel kind="home" />

      {loadFailed && (
        <p
          role="status"
          className="rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm text-ink-soft"
        >
          No pudimos cargar las zonas en este momento. La información de emergencia sigue
          disponible; intenta refrescar en unos minutos.
        </p>
      )}

      <HomeExplorer
        initialLocations={initialLocations}
        initialMapLocations={mapLocations}
        initialTotal={initialTotal}
        states={states}
        ciudadesByEstado={ciudadesByEstado}
        sismos={sismos}
      />
    </div>
  );
}
