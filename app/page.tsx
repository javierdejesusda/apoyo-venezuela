import { HomeExplorer } from '@/components/home-explorer';
import { HomeHero } from '@/components/home-hero';
import { MissingPersonsLink } from '@/components/missing-persons-link';
import { globalStats } from '@/lib/data/selectors';
import { getStore } from '@/lib/data/store';

export default async function HomePage() {
  const store = getStore();
  const locations = await store.listLocations();
  const stats = globalStats(locations);
  const states = Array.from(new Set(locations.map((location) => location.estado))).sort((a, b) =>
    a.localeCompare(b, 'es'),
  );

  return (
    <div className="space-y-6">
      <HomeHero stats={stats} />

      <MissingPersonsLink variant="card" />

      <HomeExplorer locations={locations} states={states} />
    </div>
  );
}
