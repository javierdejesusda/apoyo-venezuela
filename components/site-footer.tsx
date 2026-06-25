import Link from 'next/link';

import { ExternalLink, TriangleAlert } from 'lucide-react';

import { BrandMark } from '@/components/ui/brand-mark';
import { OpenSourceCallout } from '@/components/open-source-callout';
import { DESAPARECIDOS_URL } from '@/lib/constants';

/** Footer with navigation, the missing-persons site, and a non-partisan notice. */
export function SiteFooter() {
  return (
    <footer className="relative border-t border-border bg-surface">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-danger via-warning to-brand-400 opacity-50"
      />
      <div className="mx-auto w-full max-w-5xl space-y-4 px-4 pb-24 pt-8 md:pb-10">
        <div className="flex items-center gap-2.5">
          <BrandMark className="h-8 w-8" />
          <span className="font-display text-base font-semibold tracking-tight text-ink">
            Apoyo Venezuela
          </span>
        </div>

        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-soft" aria-label="Pie de página">
          <Link href="/" className="hover:text-ink">
            Inicio
          </Link>
          <Link href="/reportar" className="hover:text-ink">
            Reportar
          </Link>
          <Link href="/recaudaciones" className="hover:text-ink">
            Recaudaciones
          </Link>
          <Link href="/telefonos" className="hover:text-ink">
            Teléfonos
          </Link>
          <Link href="/guia" className="hover:text-ink">
            Guía
          </Link>
          <a
            href={DESAPARECIDOS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-ink"
          >
            Personas desaparecidas <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        </nav>

        <div className="flex items-start gap-2 rounded-xl border border-border bg-canvas p-3 text-xs text-ink-soft">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
          <p>
            Iniciativa ciudadana sin afiliación política. La información es aportada por la
            comunidad: <span className="font-medium text-ink">verifica antes de actuar o compartir</span>.
            Ante una emergencia que ponga en riesgo la vida, llama al 911.
          </p>
        </div>

        <OpenSourceCallout />

        <p className="text-xs text-ink-faint">Hecho con solidaridad para Venezuela.</p>
      </div>
    </footer>
  );
}
