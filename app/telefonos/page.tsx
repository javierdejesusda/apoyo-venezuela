import type { Metadata } from 'next';

import { BadgeCheck, Info } from 'lucide-react';

import { nationalNumbers } from '@/lib/data/resources';
import { stateContacts } from '@/lib/data/emergency-contacts';
import { telHref } from '@/lib/utils';
import { EmergencyCallButton } from '@/components/emergency-call-button';
import { ContactsExplorer } from '@/components/contacts-explorer';
import { PageHeader } from '@/components/page-header';

export const metadata: Metadata = {
  title: 'Teléfonos de emergencia',
};

export default function TelefonosPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 py-8">
      <PageHeader
        icon={BadgeCheck}
        eyebrow="Directorio verificado"
        title="Teléfonos de emergencia"
      >
        <div
          role="note"
          className="flex items-start gap-2.5 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3"
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
          <p className="text-sm text-ink leading-snug">
            <strong className="font-semibold">Importante:</strong> Verifica el número antes de
            llamar; las líneas pueden saturarse en situaciones de emergencia masiva.
          </p>
        </div>
      </PageHeader>

      {/* National numbers */}
      <section aria-labelledby="nacionales-heading">
        <h2 id="nacionales-heading" className="mb-4 text-lg font-semibold text-ink">
          Números nacionales
        </h2>

        {/* 911 hero button */}
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-danger/25 bg-danger/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-base font-bold text-danger">Emergencia 911</p>
            <p className="text-sm text-ink-soft">
              Número único nacional. Marque desde cualquier teléfono, sin saldo.
            </p>
          </div>
          <EmergencyCallButton className="shrink-0 self-start sm:self-auto" />
        </div>

        {/* Rest of national numbers */}
        <ul className="flex flex-col gap-2" role="list" aria-label="Números nacionales de emergencia">
          {nationalNumbers
            .filter((item) => !item.phones?.includes('911') || item.phones.length > 1)
            .map((item) => (
              <li
                key={item.name}
                className="flex flex-col gap-1.5 rounded-xl border border-border bg-surface p-4"
              >
                <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-ink">{item.name}</p>
                    {item.description && (
                      <p className="text-xs text-ink-faint leading-relaxed">{item.description}</p>
                    )}
                  </div>
                </div>

                {item.phones && item.phones.length > 0 && (
                  <ul className="flex flex-wrap gap-2" role="list" aria-label={`Teléfonos de ${item.name}`}>
                    {item.phones.map((phone) => (
                      <li key={phone}>
                        <a
                          href={telHref(phone)}
                          aria-label={`Llamar al ${phone}`}
                          className="inline-flex min-h-[44px] items-center rounded-xl border border-brand-500/30 bg-brand-50 px-3 text-sm font-semibold text-brand-700 transition-colors duration-150 hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                        >
                          {phone}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
        </ul>
      </section>

      {/* Per-state directory */}
      <ContactsExplorer states={stateContacts} />
    </div>
  );
}
