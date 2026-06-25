'use client';

import { List, Map as MapIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

export type HomeView = 'mapa' | 'lista';

const OPTIONS = [
  { value: 'mapa', label: 'Mapa', icon: MapIcon },
  { value: 'lista', label: 'Lista', icon: List },
] as const;

/** Segmented control to switch the home explorer between map and list. */
export function ViewToggle({
  value,
  onChange,
  className,
}: {
  value: HomeView;
  onChange: (next: HomeView) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label="Cambiar vista"
      className={cn('inline-flex rounded-xl border border-border-strong bg-surface p-1', className)}
    >
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40',
              active ? 'bg-brand-600 text-white shadow-sm' : 'text-ink-soft hover:text-ink',
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
