import Link from 'next/link';

import { ExternalLink } from 'lucide-react';

import { EmergencyDisclaimer } from '@/components/emergency-disclaimer';
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
          <Link href="/api-docs" className="hover:text-ink">
            API
          </Link>
          <Link href="/privacidad" className="hover:text-ink">
            Privacidad
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

        <div className="space-y-3">
          <p className="text-xs text-ink-soft">
            Iniciativa ciudadana{' '}
            <span className="font-medium text-ink">sin afiliación política</span>. La información
            es aportada por la comunidad: verifícala antes de actuar o compartir.
          </p>
          <EmergencyDisclaimer />
        </div>

        <OpenSourceCallout />

        <p className="text-xs text-ink-faint">Hecho con solidaridad para Venezuela.</p>
      </div>
    </footer>
  );
}
