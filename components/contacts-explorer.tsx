'use client';

import { useState } from 'react';

import type { StateContacts } from '@/lib/data/types';
import { Select } from '@/components/ui/form';
import { ContactCard } from '@/components/contact-card';

interface ContactsExplorerProps {
  states: StateContacts[];
}

const ALL_VALUE = '__todos__';

export function ContactsExplorer({ states }: ContactsExplorerProps) {
  const [selected, setSelected] = useState<string>(states[0]?.state ?? ALL_VALUE);

  const activeStates: StateContacts[] =
    selected === ALL_VALUE
      ? states
      : states.filter((s) => s.state === selected);

  return (
    <section aria-label="Directorio por estado">
      {/* State picker */}
      <div className="mb-5">
        <label htmlFor="estado-select" className="block text-sm font-medium text-ink mb-1.5">
          Estado
        </label>
        <Select
          id="estado-select"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value={ALL_VALUE}>Todos los estados</option>
          {states.map((s) => (
            <option key={s.state} value={s.state}>
              {s.state}
            </option>
          ))}
        </Select>
      </div>

      {/* State sections */}
      <div className="space-y-8">
        {activeStates.map((stateData) => (
          <div key={stateData.state}>
            <div className="mb-3 flex flex-wrap items-baseline gap-2">
              <h2 className="text-lg font-semibold text-ink">{stateData.state}</h2>
              {stateData.areaCode && (
                <span className="text-sm text-ink-faint">Código de área: {stateData.areaCode}</span>
              )}
            </div>

            {stateData.contacts.length === 0 ? (
              <p className="text-sm text-ink-faint">
                No hay contactos registrados para este estado.
              </p>
            ) : (
              <ul
                className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
                role="list"
                aria-label={`Contactos de emergencia - ${stateData.state}`}
              >
                {stateData.contacts.map((contact, idx) => (
                  <li key={`${stateData.state}-${contact.organization}-${idx}`}>
                    <ContactCard contact={contact} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
