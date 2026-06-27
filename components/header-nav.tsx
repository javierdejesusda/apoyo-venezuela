'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

const NAV = [
  { href: '/', label: 'Inicio' },
  { href: '/reportar', label: 'Reportar' },
  { href: '/recaudaciones', label: 'Recaudaciones' },
  { href: '/telefonos', label: 'Teléfonos' },
  { href: '/guia', label: 'Guía' },
  { href: '/asistente', label: 'Asistente' },
];

/** Desktop primary nav with an active-route highlight. */
export function HeaderNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <nav className="ml-2 hidden items-center gap-0.5 md:flex" aria-label="Navegación">
      {NAV.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-600/15 dark:text-brand-300'
                : 'text-ink-soft hover:bg-surface-2 hover:text-ink',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
