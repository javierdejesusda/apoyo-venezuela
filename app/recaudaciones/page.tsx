import type { Metadata } from 'next';

import { HeartHandshake, Inbox } from 'lucide-react';

import { AddFundraiserForm } from '@/components/add-fundraiser-form';
import { EmptyState } from '@/components/empty-state';
import { FundraiserCard } from '@/components/fundraiser-card';
import { PageHeader } from '@/components/page-header';
import { getStore } from '@/lib/data/store';
import type { Fundraiser } from '@/lib/data/types';

export const metadata: Metadata = {
  title: 'Recaudaciones',
};

export default async function RecaudacionesPage() {
  const fundraisers = await getStore()
    .listFundraisers()
    .catch((): Fundraiser[] => []);

  return (
    <div className="mx-auto max-w-5xl space-y-10 py-8">
      <PageHeader
        icon={HeartHandshake}
        eyebrow="Recaudaciones"
        title="Recaudaciones para Venezuela"
        description="Encuentra campañas de GoFundMe para apoyar a las víctimas del terremoto y comparte la tuya para que más personas puedan ayudar."
      />

      <section aria-labelledby="lista-recaudaciones" className="space-y-4">
        <h2 id="lista-recaudaciones" className="text-lg font-semibold text-ink">
          Campañas activas
        </h2>

        {fundraisers.length > 0 ? (
          <ul
            role="list"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {fundraisers.map((fundraiser) => (
              <li key={fundraiser.id}>
                <FundraiserCard fundraiser={fundraiser} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={Inbox}
            title="Aún no hay recaudaciones"
            description="Sé la primera persona en compartir una campaña de GoFundMe para ayudar a las víctimas del terremoto."
          />
        )}
      </section>

      <section aria-labelledby="comparte-recaudacion">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
          <h2 id="comparte-recaudacion" className="text-lg font-semibold text-ink">
            Comparte tu recaudación
          </h2>
          <p className="mb-5 mt-1 text-sm text-ink-soft">
            Pega el enlace de tu campaña de GoFundMe y aparecerá en la lista para que la
            comunidad pueda apoyarla. Verifica que el enlace sea correcto antes de publicarlo.
          </p>
          <AddFundraiserForm />
        </div>
      </section>
    </div>
  );
}
