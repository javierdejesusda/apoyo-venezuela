import { HomeExplorer } from '@/components/home-explorer';
import { HomeHero } from '@/components/home-hero';
import { MissingPersonsLink } from '@/components/missing-persons-link';
import { SharePanel } from '@/components/share-panel';
import { loadHomeData } from '@/lib/data/home';
import { getStore, PAGE_SIZE } from '@/lib/data/store';

// ISR with 30-second revalidation. In-app writes call revalidatePath('/')
// via app/actions.ts for instant on-demand revalidation. Out-of-band changes
// (e.g. `npm run delete-report`, which bypasses the app) reflect within 30 s,
// which is an acceptable trade-off for surviving high concurrent load.
export const revalidate = 30;

export default async function HomePage() {
  const { locations, stats, states, loadFailed } = await loadHomeData(getStore());

  // Derive the first page from the already-loaded full set to avoid a second
  // round-trip. listLocations() returns the sorted set; slicing to PAGE_SIZE
  // gives the bounded initial payload for the client.
  const initialLocations = locations.slice(0, PAGE_SIZE);
  const initialTotal = locations.length;

  return (
    <div className="space-y-6">
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
        initialTotal={initialTotal}
        states={states}
      />
    </div>
  );
}
