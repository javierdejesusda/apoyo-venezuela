import { HomeExplorer } from '@/components/home-explorer';
import { HomeHero } from '@/components/home-hero';
import { MissingPersonsLink } from '@/components/missing-persons-link';
import { loadHomeData } from '@/lib/data/home';
import { getStore } from '@/lib/data/store';

// Live emergency data: render on every request so the list reflects the current
// database (including reports removed out-of-band, e.g. via the admin tool),
// instead of serving a statically prerendered snapshot. Realtime keeps open
// tabs in sync on top of this.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const { locations, stats, states, loadFailed } = await loadHomeData(getStore());

  return (
    <div className="space-y-6">
      <HomeHero stats={stats} />

      <MissingPersonsLink variant="card" />

      {loadFailed && (
        <p
          role="status"
          className="rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm text-ink-soft"
        >
          No pudimos cargar las zonas en este momento. La información de emergencia sigue
          disponible; intenta refrescar en unos minutos.
        </p>
      )}

      <HomeExplorer locations={locations} states={states} />
    </div>
  );
}
