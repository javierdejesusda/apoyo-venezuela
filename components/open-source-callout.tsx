import { Code, ExternalLink } from 'lucide-react';

import { GITHUB_URL } from '@/lib/constants';

/**
 * Footer callout that states the project is open source and invites anyone to
 * contribute on GitHub. Uses the civic brand blue, never status colors, so it
 * stays clear of the emergency semaphore.
 */
export function OpenSourceCallout() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-brand-900 dark:bg-brand-900/20">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
          <Code className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="font-display text-sm font-semibold text-ink">Proyecto de código abierto</p>
          <p className="mt-0.5 text-sm text-ink-soft">
            Cualquiera puede revisar el código y contribuir con mejoras.
          </p>
        </div>
      </div>
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex h-11 w-full shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border-strong bg-surface px-4 text-sm font-medium text-ink transition-[background-color,border-color,transform] duration-150 hover:bg-surface-2 active:scale-[0.96] sm:w-auto"
      >
        Contribuir en GitHub
        <ExternalLink
          className="h-3.5 w-3.5 text-ink-faint transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </a>
    </div>
  );
}
