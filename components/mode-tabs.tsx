'use client';

import { cn } from '@/lib/utils';
import type { ExplorerMode } from '@/lib/data/types';

interface ModeTabsProps {
  mode: ExplorerMode;
  onChange: (next: ExplorerMode) => void;
  ayudaCount: number;
  danosCount: number;
  className?: string;
}

const TABS: { value: ExplorerMode; label: string; mobileLabel: (n: number) => string }[] = [
  {
    value: 'ayuda',
    label: 'Pedidos de Ayuda',
    mobileLabel: (n) => `Pedidos (${n})`,
  },
  {
    value: 'danos',
    label: 'Reportes de Daño',
    mobileLabel: (n) => `Daños (${n})`,
  },
];

/** Top-level mode switcher: Pedidos de Ayuda vs Reportes de Daño. */
export function ModeTabs({ mode, onChange, ayudaCount, danosCount, className }: ModeTabsProps) {
  const counts: Record<ExplorerMode, number> = { ayuda: ayudaCount, danos: danosCount };

  return (
    <div
      role="group"
      aria-label="Modo del explorador"
      className={cn(
        'flex gap-1 rounded-2xl border border-border bg-surface p-1 shadow-card',
        className,
      )}
    >
      {TABS.map((tab) => {
        const active = mode === tab.value;
        const count = counts[tab.value];
        return (
          <button
            key={tab.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium',
              'transition-[background-color,color,transform] duration-150',
              'active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40',
              active
                ? 'bg-brand-600 text-white shadow-sm'
                : cn(
                    'text-ink-soft hover:text-ink',
                    tab.value === 'danos' && !active && 'opacity-70',
                  ),
            )}
          >
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.mobileLabel(count)}</span>
            <span
              className={cn(
                'hidden sm:inline tabular rounded-full px-1.5 py-0.5 text-xs font-semibold leading-none',
                active ? 'bg-white/20 text-white' : 'bg-ink-faint/15 text-ink-soft',
              )}
              aria-label={`${count} ${count === 1 ? 'zona' : 'zonas'}`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
