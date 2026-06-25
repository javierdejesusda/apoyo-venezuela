'use client';

import { type ReactNode } from 'react';

import { Search, TriangleAlert, X, type LucideIcon } from 'lucide-react';

import { Input, Select } from '@/components/ui/form';
import { EMERGENCY_STATUSES, type LocationFilters } from '@/lib/data/types';
import { statusMeta } from '@/lib/status';
import { cn } from '@/lib/utils';

interface FiltersProps {
  value: LocationFilters;
  onChange: (next: LocationFilters) => void;
  states: string[];
  resultCount: number;
}

/** Search + status + state filtering for the home explorer. */
export function Filters({ value, onChange, states, resultCount }: FiltersProps) {
  const set = (patch: Partial<LocationFilters>) => onChange({ ...value, ...patch });
  const hasFilters = Boolean(
    value.texto || value.estado || value.status || value.soloUrgentes || value.categoria,
  );

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
          aria-hidden
        />
        <Input
          type="search"
          inputMode="search"
          value={value.texto ?? ''}
          onChange={(event) => set({ texto: event.target.value || undefined })}
          placeholder="Buscar por zona, ciudad o estado"
          aria-label="Buscar zonas"
          className="pl-10"
        />
      </div>

      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        <FilterChip active={!value.status} onClick={() => set({ status: undefined })}>
          Todas
        </FilterChip>
        {EMERGENCY_STATUSES.map((status) => (
          <FilterChip
            key={status}
            active={value.status === status}
            icon={statusMeta[status].icon}
            onClick={() => set({ status: value.status === status ? undefined : status })}
          >
            {statusMeta[status].label}
          </FilterChip>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label
          className={cn(
            'inline-flex h-10 cursor-pointer select-none items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors sm:h-9',
            value.soloUrgentes
              ? 'border-danger/30 bg-danger/10 text-danger'
              : 'border-border-strong bg-surface text-ink-soft hover:text-ink',
          )}
        >
          <input
            type="checkbox"
            className="sr-only"
            checked={Boolean(value.soloUrgentes)}
            onChange={(event) => set({ soloUrgentes: event.target.checked || undefined })}
          />
          <TriangleAlert className="h-4 w-4" aria-hidden />
          Solo urgentes
        </label>

        <div className="min-w-40 flex-1 sm:flex-none">
          <Select
            value={value.estado ?? ''}
            onChange={(event) => set({ estado: event.target.value || undefined })}
            aria-label="Filtrar por estado"
          >
            <option value="">Todos los estados</option>
            {states.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </Select>
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={() => onChange({})}
            className="inline-flex h-10 items-center gap-1 rounded-full px-3 text-sm font-medium text-ink-soft transition-colors hover:text-ink sm:h-9"
          >
            <X className="h-4 w-4" aria-hidden /> Limpiar
          </button>
        )}
      </div>

      <p className="text-xs text-ink-faint" aria-live="polite">
        {resultCount} {resultCount === 1 ? 'zona' : 'zonas'}
      </p>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-sm font-medium transition-colors sm:h-9',
        active
          ? 'border-brand-600 bg-brand-600 text-white'
          : 'border-border-strong bg-surface text-ink-soft hover:text-ink',
      )}
    >
      {Icon && <Icon className="h-4 w-4" aria-hidden />}
      {children}
    </button>
  );
}
