import { BrandMark } from '@/components/ui/brand-mark';
import { OpenSourceCallout } from '@/components/open-source-callout';

/**
 * Footer for the transition page. Every internal destination it used to link
 * to is gone, so what remains is the identity, the non-partisan notice and the
 * source repository.
 */
export function SiteFooter() {
  return (
    <footer className="relative border-t border-border bg-surface">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-danger via-warning to-brand-400 opacity-50"
      />
      <div className="mx-auto w-full max-w-5xl space-y-4 px-4 pb-10 pt-8">
        <div className="flex items-center gap-2.5">
          <BrandMark className="h-8 w-8" />
          <span className="font-display text-base font-semibold tracking-tight text-ink">
            Apoyo Venezuela
          </span>
        </div>

        <p className="text-xs text-ink-soft">
          Iniciativa ciudadana <span className="font-medium text-ink">sin afiliación política</span>
          . Los enlaces de esta página llevan a sitios externos administrados por cada iniciativa.
        </p>

        <OpenSourceCallout />

        <p className="text-xs text-ink-faint">Hecho con solidaridad para Venezuela.</p>
      </div>
    </footer>
  );
}
