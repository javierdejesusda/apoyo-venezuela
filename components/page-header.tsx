import { type ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}

/**
 * Shared editorial masthead: a ticked eyebrow over a display-scale title. Gives
 * every secondary page the same authoritative voice as the home situation board.
 */
export function PageHeader({ eyebrow, title, description, children }: PageHeaderProps) {
  return (
    <header className="relative space-y-3">
      {/* Top edge: a thin semaphore signal line, matching the home situation board. */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-danger via-warning to-brand-400 opacity-70"
      />
      {eyebrow && (
        <p className="eyebrow flex items-center gap-2.5 text-ink-faint">
          <span className="relative flex h-2 w-2 items-center justify-center" aria-hidden>
            <span className="live-ping absolute inline-flex h-full w-full rounded-full bg-danger" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-danger" />
          </span>
          {eyebrow}
        </p>
      )}
      <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{title}</h1>
      {description && <p className="max-w-2xl text-ink-soft">{description}</p>}
      {children}
    </header>
  );
}
