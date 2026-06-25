import { ExternalLink, UserSearch } from 'lucide-react';

import { DESAPARECIDOS_URL } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface MissingPersonsLinkProps {
  variant?: 'card' | 'inline';
  className?: string;
}

/** Clear link to the missing-persons sister site (card for pages, inline for the header). */
export function MissingPersonsLink({ variant = 'card', className }: MissingPersonsLinkProps) {
  if (variant === 'inline') {
    return (
      <a
        href={DESAPARECIDOS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 transition-colors hover:text-brand-700',
          className,
        )}
      >
        <UserSearch className="h-4 w-4" aria-hidden />
        <span>Buscar personas</span>
        <ExternalLink className="h-3.5 w-3.5 text-ink-faint" aria-hidden />
      </a>
    );
  }

  return (
    <a
      href={DESAPARECIDOS_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'group flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4 transition-colors hover:border-brand-300 dark:border-brand-900 dark:bg-brand-900/20',
        className,
      )}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
        <UserSearch className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 font-semibold text-ink">
          ¿Buscas a una persona?
          <ExternalLink
            className="h-4 w-4 text-ink-faint transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </span>
        <span className="mt-0.5 block text-sm text-ink-soft">
          Reporta o consulta personas desaparecidas en{' '}
          <span className="font-medium text-brand-700 dark:text-brand-300">
            desaparecidosterremotovenezuela.com
          </span>
        </span>
      </span>
    </a>
  );
}
