import { AccessRestrictionAdvisory } from '@/components/access-restriction-advisory';
import { AsistenteCallout } from '@/components/asistente-callout';
import { HomeExplorer } from '@/components/home-explorer';
import { HomeHero } from '@/components/home-hero';
import { MissingPersonsLink } from '@/components/missing-persons-link';
import { RescueAdvisory } from '@/components/rescue-advisory';
import { SeismicTicker } from '@/components/seismic-ticker';
import { SharePanel } from '@/components/share-panel';
import { loadHomeData } from '@/lib/data/home';
import { toClientSafeLocation } from '@/lib/data/selectors';
import { getStore, PAGE_SIZE } from '@/lib/data/store';
import { loadSismos } from '@/lib/sismos/load';

// ISR with 5-minute revalidation. In-app writes call revalidatePath('/')
// via app/actions.ts for instant on-demand revalidation, so real reports show
// up immediately; the background window only bounds out-of-band changes
// (e.g. `npm run delete-report`, which bypasses the app). The long window
// keeps Vercel compute near zero now that traffic is mostly crawlers.
export const revalidate = 300;

export default async function HomePage() {
  const [{ locations, stats, states, ciudadesByEstado, loadFailed }, sismos] =
    await Promise.all([loadHomeData(getStore()), loadSismos()]);

  // Embed the full server-loaded set for the map (no per-visitor fetch) and a
  // bounded first page for the list, both with reporter contact PII stripped
  // and coordinates rounded to ~110m, since neither surface needs exact
  // precision. listLocations() returns the sorted set.
  const mapLocations = locations.map(toClientSafeLocation);
  const initialLocations = mapLocations.slice(0, PAGE_SIZE);
  const initialTotal = mapLocations.length;

  // Tab badge counts: ayuda = zones with any open need; danos = total zones.
  const ayudaCount = mapLocations.filter(
    (l) => l.summary.pendientes + l.summary.enCamino > 0,
  ).length;
  const danosCount = mapLocations.length;

  return (
    <div className="space-y-6">
      <SeismicTicker sismos={sismos} />

      <HomeHero stats={stats} />

      <AccessRestrictionAdvisory />

      <RescueAdvisory />

      <MissingPersonsLink variant="card" />

      <AsistenteCallout />

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
        ayudaCount={ayudaCount}
        danosCount={danosCount}
      />
    </div>
  );
}
