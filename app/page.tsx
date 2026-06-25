import Link from 'next/link';

import { HeartHandshake, Phone } from 'lucide-react';

import { HomeExplorer } from '@/components/home-explorer';
import { MissingPersonsLink } from '@/components/missing-persons-link';
import { StatsBar } from '@/components/stats-bar';
import { buttonClasses } from '@/components/ui/button';
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
      <section className="space-y-3 pt-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-danger/10 px-3 py-1 text-xs font-medium text-danger">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-danger" aria-hidden />
          Emergencia activa · sismo del 24 de junio de 2026
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Coordinemos la ayuda, zona por zona
        </h1>
        <p className="max-w-2xl text-base text-ink-soft">
          Reporta zonas afectadas, publica qué se necesita y descubre a quién ayudar. Información
          colaborativa para responder más rápido al terremoto en Venezuela.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/reportar" className={buttonClasses('primary', 'lg')}>
            <HeartHandshake className="h-5 w-5" aria-hidden />
            Reportar o pedir ayuda
          </Link>
          <Link href="/telefonos" className={buttonClasses('outline', 'lg')}>
            <Phone className="h-5 w-5" aria-hidden />
            Teléfonos de emergencia
          </Link>
        </div>
      </section>

      <StatsBar stats={stats} />

      <MissingPersonsLink variant="card" />

      <HomeExplorer locations={locations} states={states} />
    </div>
  );
}
