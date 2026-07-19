import type { Metadata } from 'next';

import { HeartHandshake } from 'lucide-react';

import { AddFundraiserForm } from '@/components/add-fundraiser-form';
import { FundraiserList } from '@/components/fundraiser-list';
import { PageHeader } from '@/components/page-header';
import { getStore } from '@/lib/data/store';
import type { Fundraiser } from '@/lib/data/types';

// ISR igual que home y zona: los envios dentro de la app llaman
// revalidatePath('/recaudaciones') via app/actions.ts y se reflejan al
// instante; los cambios hechos fuera de la app (borrados directos en la base)
// se reflejan dentro de la ventana de 5 minutos. Antes era force-dynamic, pero
// eso invocaba una funcion y una consulta a Supabase por cada visita.
export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Recaudaciones',
};

export default async function RecaudacionesPage() {
  // Con ISR un render fallido queda cacheado y se sirve a todos los visitantes
  // hasta la proxima regeneracion, asi que un fallo del store nunca debe
  // disfrazarse del estado vacio "Aún no hay recaudaciones": null marca el
  // fallo y renderiza un aviso de error explicito.
  const fundraisers = await getStore()
    .listFundraisers()
    .catch((): Fundraiser[] | null => null);

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

        {fundraisers === null ? (
          <p
            role="status"
            className="rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm text-ink-soft"
          >
            No pudimos cargar las campañas en este momento. Intenta refrescar en unos
            minutos.
          </p>
        ) : (
          <FundraiserList fundraisers={fundraisers} />
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
