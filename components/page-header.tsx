import { type ReactNode } from 'react';

import { type LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  eyebrow?: string;
  /** Optional lucide icon shown inside the section-label chip. */
  icon?: LucideIcon;
  title: string;
  description?: string;
  children?: ReactNode;
}

/**
 * Shared editorial masthead: a contained section-label chip (icon + eyebrow)
 * over a display-scale title. The chip uses the civic brand accent rather than
 * the emergency semaphore, so a static page label never reads as a live alert.
 */
export function PageHeader({ eyebrow, icon: Icon, title, description, children }: PageHeaderProps) {
  return (
    <header className="space-y-3">
      {eyebrow && (
        <p className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/20 bg-brand-50 py-1 pl-2 pr-2.5 text-tone-brand-text dark:border-brand-400/25 dark:bg-brand-500/10">
          {Icon && <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />}
          <span className="eyebrow">{eyebrow}</span>
        </p>
      )}
      <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{title}</h1>
      {description && <p className="max-w-2xl text-ink-soft">{description}</p>}
      {children}
    </header>
  );
}
