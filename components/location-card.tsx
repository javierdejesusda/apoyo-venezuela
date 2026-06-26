import Link from 'next/link';

import { ChevronRight, MapPin } from 'lucide-react';

import { CategoryChip, PersonasAtrapadasBadge, StatusBadge } from '@/components/status-badges';
import { ZonePhoto } from '@/components/zone-photo';
import type { LocationWithNeeds } from '@/lib/data/types';

/** Summary card linking to a single emergency zone: a large cover photo beside
 * the zone's details. */
export function LocationCard({ location }: { location: LocationWithNeeds }) {
  const { summary } = location;
  const openNeeds = location.needs.filter((need) => need.status !== 'cubierto');
  const categories = Array.from(new Set(openNeeds.map((need) => need.categoria))).slice(0, 3);
  const place = [location.zona, location.ciudad, location.estado].filter(Boolean).join(', ');
  const fotos = location.fotos ?? [];
  const cover = fotos[0];

  return (
    <Link
      href={`/zona/${location.id}`}
      className="group flex min-w-0 gap-4 rounded-2xl border border-border bg-surface p-4 shadow-card transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lift focus-visible:border-brand-400 active:scale-[0.99]"
    >
      {cover && (
        <div className="relative w-28 shrink-0 self-start sm:w-36 lg:w-40">
          {/* Decorative cover (alt=""): keeps the card link's accessible name
           * clean. The full set of photos lives on the zone page. */}
          <ZonePhoto src={cover} alt="" size={400} />
          {fotos.length > 1 && (
            <span
              aria-hidden
              className="absolute bottom-1.5 right-1.5 rounded-full bg-black/55 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-sm"
            >
              +{fotos.length - 1}
            </span>
          )}
          <span className="sr-only">
            {fotos.length === 1 ? '1 foto' : `${fotos.length} fotos`}
          </span>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-ink">{location.nombre}</h3>
            <p className="mt-0.5 flex items-center gap-1 text-sm text-ink-soft">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-faint" aria-hidden />
              <span className="truncate">{place}</span>
            </p>
          </div>
          <StatusBadge status={location.status} size="sm" />
        </div>

        {location.personas_atrapadas === 'si' && (
          <div className="mt-2">
            <PersonasAtrapadasBadge value={location.personas_atrapadas} />
          </div>
        )}

        {location.descripcion && (
          <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{location.descripcion}</p>
        )}

        {categories.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {categories.map((categoria) => (
              <CategoryChip key={categoria} categoria={categoria} size="sm" />
            ))}
            {openNeeds.length > categories.length && (
              <span className="text-xs text-ink-soft">+{openNeeds.length - categories.length} más</span>
            )}
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pt-3 text-xs text-ink-soft">
          <span>
            <span className="tabular font-medium text-ink-soft">{summary.total}</span> necesidades
            {summary.urgentes > 0 && (
              <span className="text-danger"> · {summary.urgentes} urgentes</span>
            )}
          </span>
          <span className="inline-flex items-center gap-1 text-brand-600 transition-all group-hover:gap-1.5">
            Ver zona <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  );
}
