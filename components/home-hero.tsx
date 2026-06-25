import Link from 'next/link';

import { HeartHandshake, Phone } from 'lucide-react';

import { buttonClasses } from '@/components/ui/button';
import { VenezuelaSilhouette } from '@/components/ui/venezuela-silhouette';
import type { GlobalStats } from '@/lib/data/selectors';
import { cn } from '@/lib/utils';

type RibbonTone = 'brand' | 'danger' | 'warning' | 'neutral';

const DOT: Record<RibbonTone, string> = {
  brand: 'bg-brand-400',
  danger: 'bg-danger',
  warning: 'bg-warning',
  neutral: 'bg-hero-ink-faint',
};

const RIBBON: { key: keyof GlobalStats; label: string; tone: RibbonTone }[] = [
  { key: 'zonas', label: 'Zonas activas', tone: 'brand' },
  { key: 'derrumbes', label: 'Derrumbes', tone: 'danger' },
  { key: 'urgentes', label: 'Necesidades urgentes', tone: 'warning' },
  { key: 'necesidadesAbiertas', label: 'Necesidades abiertas', tone: 'neutral' },
];

/**
 * Faint Venezuela silhouette watermark anchored to the right of the panel, with
 * a single epicenter ring over the Yaracuy/Carabobo area. The ring reuses the
 * live-ping pattern, which the global prefers-reduced-motion rule freezes.
 */
function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <VenezuelaSilhouette className="absolute -right-16 top-1/2 h-[150%] w-auto -translate-y-1/2 text-white/[0.06]" />
      <span className="absolute left-[58%] top-[42%] flex h-2.5 w-2.5 items-center justify-center">
        <span className="live-ping absolute inline-flex h-full w-full rounded-full bg-danger" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-danger/80" />
      </span>
    </div>
  );
}

/**
 * Home situation board: the page thesis. A contained dark panel carrying the
 * live emergency state, the headline and the primary actions, with the global
 * counts folded into a single semaphore ribbon (not a grid of stat tiles).
 */
export function HomeHero({ stats }: { stats: GlobalStats }) {
  return (
    <section className="relative overflow-hidden rounded-[1.75rem] bg-hero text-hero-ink shadow-pop">
      {/* Top edge: a thin semaphore signal line. */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-danger via-warning to-brand-400 opacity-70"
      />
      <HeroBackdrop />

      <div className="relative px-6 pb-6 pt-7 sm:px-8 sm:pb-8 sm:pt-9">
        <p className="animate-fade-up eyebrow flex items-center gap-2 text-hero-ink-soft">
          <span className="relative flex h-2 w-2 items-center justify-center">
            <span className="live-ping absolute inline-flex h-full w-full rounded-full bg-danger" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-danger" />
          </span>
          Emergencia activa · sismo del 24 jun 2026
        </p>

        <h1
          className="animate-fade-up mt-4 max-w-2xl text-[2rem] font-semibold leading-[1.05] text-hero-ink sm:text-5xl"
          style={{ animationDelay: '60ms' }}
        >
          Coordinemos la ayuda,{' '}
          <span className="text-brand-300">zona por zona</span>
        </h1>

        <p
          className="animate-fade-up mt-4 max-w-xl text-[0.95rem] leading-relaxed text-hero-ink-soft sm:text-base"
          style={{ animationDelay: '120ms' }}
        >
          Reporta zonas afectadas, publica qué se necesita y descubre a quién ayudar. Información
          colaborativa para responder más rápido al terremoto en Venezuela.
        </p>

        <div
          className="animate-fade-up mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap"
          style={{ animationDelay: '180ms' }}
        >
          <Link
            href="/reportar"
            className={buttonClasses('primary', 'lg', 'h-11 w-full shadow-lift sm:h-12 sm:w-auto')}
          >
            <HeartHandshake className="h-5 w-5" aria-hidden />
            Reportar o pedir ayuda
          </Link>
          <Link
            href="/telefonos"
            className="inline-flex h-11 w-full select-none items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 text-base font-medium text-hero-ink backdrop-blur transition-[background-color,transform] duration-150 hover:bg-white/10 active:scale-[0.96] sm:h-12 sm:w-auto"
          >
            <Phone className="h-5 w-5" aria-hidden />
            Teléfonos de emergencia
          </Link>
        </div>

        <dl
          className="animate-fade-up mt-7 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-hero-line pt-5 sm:grid-cols-4"
          style={{ animationDelay: '240ms' }}
        >
          {RIBBON.map((item) => (
            <div key={item.key} className="min-w-0">
              <dd className="tabular text-2xl font-semibold leading-none text-hero-ink sm:text-[1.75rem]">
                {stats[item.key]}
              </dd>
              <dt className="mt-1.5 flex items-center gap-1.5 text-xs text-hero-ink-soft">
                <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', DOT[item.tone])} aria-hidden />
                <span className="truncate">{item.label}</span>
              </dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
