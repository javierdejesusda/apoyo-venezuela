import Link from 'next/link';

import { EmergencyCallButton } from '@/components/emergency-call-button';
import { HeaderNav } from '@/components/header-nav';
import { MissingPersonsLink } from '@/components/missing-persons-link';
import { ThemeToggle } from '@/components/theme-toggle';
import { BrandMark } from '@/components/ui/brand-mark';

/** Sticky top bar: brand, primary nav (desktop), missing-persons link, 911. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur-lg supports-[backdrop-filter]:bg-surface/70">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center gap-2 px-4">
        <Link href="/" className="group flex items-center gap-2.5">
          <BrandMark className="h-9 w-9 transition-transform group-active:scale-[0.96]" />
          <span className="flex flex-col leading-none">
            <span className="font-display text-[0.95rem] font-semibold tracking-tight text-ink">
              Apoyo Venezuela
            </span>
            <span className="eyebrow mt-0.5 text-[0.5rem] text-ink-faint">Coordinación de ayuda</span>
          </span>
        </Link>

        <HeaderNav />

        <div className="ml-auto flex items-center gap-1.5">
          <MissingPersonsLink variant="inline" className="hidden lg:inline-flex" />
          <ThemeToggle />
          <EmergencyCallButton className="px-3.5 text-xs" />
        </div>
      </div>
    </header>
  );
}
