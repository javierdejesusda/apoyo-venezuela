'use client';

import { type ReactNode } from 'react';

import { Search, X, type LucideIcon } from 'lucide-react';

import { Input, Select } from '@/components/ui/form';
import { EMERGENCY_STATUSES, NEED_CATEGORIES, URGENCIES, type ExplorerMode, type LocationFilters } from '@/lib/data/types';
import { categoryMeta, statusMeta, toneClasses, urgencyMeta, type Tone } from '@/lib/status';
import { cn } from '@/lib/utils';

interface FiltersProps {
  value: LocationFilters;
  onChange: (next: LocationFilters) => void;
  states: string[];
  ciudadesByEstado?: Record<string, string[]>;
  resultCount: number;
  mode?: ExplorerMode;
}

/** Search + status + needs filtering for the home explorer. */
export function Filters({
  value,
  onChange,
  states,
  ciudadesByEstado = {},
  resultCount,
  mode = 'danos',
}: FiltersProps) {
  const set = (patch: Partial<LocationFilters>) => onChange({ ...value, ...patch });
  const hasFilters = Boolean(
    value.texto ||
      value.estado ||
      value.ciudad ||
      value.status ||
      value.urgencia ||
      value.categoria,
  );
  const isAyuda = mode === 'ayuda';

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

      {!isAyuda && (
        <div
          role="group"
          aria-label="Filtrar por estado estructural"
          className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1"
        >
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
      )}

      {isAyuda && (
        <div className="space-y-2 rounded-xl border border-border bg-surface/50 p-2.5">
          <p className="px-0.5 text-xs font-medium text-ink-soft">Necesidades de ayuda</p>

          <div
            role="group"
            aria-label="Filtrar por categoría"
            className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1"
          >
            <FilterChip active={!value.categoria} onClick={() => set({ categoria: undefined })}>
              Todas
            </FilterChip>
            {NEED_CATEGORIES.map((cat) => (
              <FilterChip
                key={cat}
                active={value.categoria === cat}
                icon={categoryMeta[cat].icon}
                onClick={() =>
                  set({ categoria: value.categoria === cat ? undefined : cat })
                }
              >
                {categoryMeta[cat].label}
              </FilterChip>
            ))}
          </div>

          <div
            role="group"
            aria-label="Filtrar por urgencia"
            className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1"
          >
            <FilterChip active={!value.urgencia} onClick={() => set({ urgencia: undefined })}>
              Todas
            </FilterChip>
            {URGENCIES.map((u) => {
              const meta = urgencyMeta[u];
              return (
                <UrgencyFilterChip
                  key={u}
                  active={value.urgencia === u}
                  tone={meta.tone}
                  icon={meta.icon}
                  onClick={() =>
                    set({ urgencia: value.urgencia === u ? undefined : u })
                  }
                >
                  {meta.label}
                </UrgencyFilterChip>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-40 flex-1 sm:flex-none">
          <Select
            value={value.estado ?? ''}
            onChange={(event) =>
              set({ estado: event.target.value || undefined, ciudad: undefined })
            }
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

        <div className="min-w-40 flex-1 sm:flex-none">
          <Select
            value={value.ciudad ?? ''}
            onChange={(event) => set({ ciudad: event.target.value || undefined })}
            disabled={!value.estado}
            aria-label="Filtrar por ciudad"
            aria-disabled={!value.estado}
          >
            {!value.estado ? (
              <option value="">Selecciona un estado primero</option>
            ) : (
              <>
                <option value="">Todas las ciudades</option>
                {(ciudadesByEstado[value.estado] ?? []).map((ciudad) => (
                  <option key={ciudad} value={ciudad}>
                    {ciudad}
                  </option>
                ))}
              </>
            )}
          </Select>
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={() => onChange(mode === 'ayuda' ? { soloConPedidos: true } : {})}
            className="inline-flex h-10 items-center gap-1 rounded-full px-3 text-sm font-medium text-ink-soft transition-colors hover:text-ink sm:h-9"
          >
            <X className="h-4 w-4" aria-hidden /> Limpiar
          </button>
        )}
      </div>

      <p className="text-xs text-ink-faint" aria-live="polite">
        {resultCount}{' '}
        {isAyuda
          ? resultCount === 1
            ? 'zona con pedidos'
            : 'zonas con pedidos'
          : resultCount === 1
            ? 'zona'
            : 'zonas'}
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
      aria-pressed={active}
      className={cn(
        'inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-1 sm:h-9',
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

function UrgencyFilterChip({
  active,
  onClick,
  children,
  tone,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  tone: Tone;
  icon?: LucideIcon;
}) {
  const tc = toneClasses(tone);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-1 sm:h-9',
        active ? tc.solid : cn('bg-surface', tc.border, tc.text, 'hover:opacity-80'),
      )}
    >
      {Icon && <Icon className="h-4 w-4" aria-hidden />}
      {children}
    </button>
  );
}
