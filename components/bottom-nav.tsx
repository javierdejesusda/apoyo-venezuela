'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { BookOpen, Home, Phone, Plus, UserSearch, type LucideIcon } from 'lucide-react';

import { DESAPARECIDOS_URL } from '@/lib/constants';
import { cn } from '@/lib/utils';

/** Thumb-friendly bottom navigation for mobile, with a central report action. */
export function BottomNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur md:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 items-end px-2 pb-[env(safe-area-inset-bottom)]">
        <NavTab href="/" label="Inicio" icon={Home} active={isActive('/')} />
        <NavTab href="/telefonos" label="Teléfonos" icon={Phone} active={isActive('/telefonos')} />
        <div className="flex justify-center">
          <Link
            href="/reportar"
            aria-label="Reportar o pedir ayuda"
            className="-mt-5 flex h-14 w-14 flex-col items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/30 transition-transform active:scale-95"
          >
            <Plus className="h-6 w-6" aria-hidden />
            <span className="text-[10px] font-medium">Reportar</span>
          </Link>
        </div>
        <NavTab href="/guia" label="Guía" icon={BookOpen} active={isActive('/guia')} />
        <NavExternal href={DESAPARECIDOS_URL} label="Personas" icon={UserSearch} />
      </div>
    </nav>
  );
}

function NavTab({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors',
        active ? 'text-brand-600' : 'text-ink-faint hover:text-ink-soft',
      )}
    >
      <Icon className="h-5 w-5" aria-hidden />
      {label}
    </Link>
  );
}

function NavExternal({ href, label, icon: Icon }: { href: string; label: string; icon: LucideIcon }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-ink-faint transition-colors hover:text-ink-soft"
    >
      <Icon className="h-5 w-5" aria-hidden />
      {label}
    </a>
  );
}
