import Link from 'next/link';

import { LifeBuoy } from 'lucide-react';

import { EmergencyCallButton } from '@/components/emergency-call-button';
import { MissingPersonsLink } from '@/components/missing-persons-link';

const NAV = [
  { href: '/', label: 'Inicio' },
  { href: '/reportar', label: 'Reportar' },
  { href: '/telefonos', label: 'Teléfonos' },
  { href: '/guia', label: 'Guía' },
];

/** Sticky top bar: brand, primary nav (desktop), missing-persons link, 911. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-3 px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <LifeBuoy className="h-5 w-5" aria-hidden />
          </span>
          <span className="font-display text-base font-semibold tracking-tight text-ink">
            Apoyo Venezuela
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Navegación">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <MissingPersonsLink variant="inline" className="hidden lg:inline-flex" />
          <EmergencyCallButton className="h-10 px-3 text-xs" />
        </div>
      </div>
    </header>
  );
}
