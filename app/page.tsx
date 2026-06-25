import { HomeExplorer } from '@/components/home-explorer';
import { HomeHero } from '@/components/home-hero';
import { MissingPersonsLink } from '@/components/missing-persons-link';
import { availableStateOptions, globalStats } from '@/lib/data/selectors';
import { getStore } from '@/lib/data/store';

export default async function HomePage() {
  const store = getStore();
  const locations = await store.listLocations();
  const stats = globalStats(locations);
  const states = availableStateOptions(locations);

  return (
    <div className="space-y-6">
      <HomeHero stats={stats} />

      <MissingPersonsLink variant="card" />

      <HomeExplorer locations={locations} states={states} />
    </div>
  );
}
