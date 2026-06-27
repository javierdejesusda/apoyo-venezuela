import Link from 'next/link';

import { ChevronRight, MapPin } from 'lucide-react';

import { PhotoCarousel } from '@/components/photo-carousel';
import { CategoryChip, PersonasAtrapadasBadge, StatusBadge } from '@/components/status-badges';
import { ZonePhoto } from '@/components/zone-photo';
import type { ExplorerMode, LocationWithNeeds } from '@/lib/data/types';
import { statusMeta } from '@/lib/status';

/**
 * Summary card linking to a single emergency zone: a large cover photo beside
 * the zone's details.
 *
 * The photo area lives OUTSIDE the navigation Link so carousel prev/next buttons
 * are never nested inside an anchor (invalid HTML). The details Link is the
 * primary interactive element and carries the accessible card name.
 */
export function LocationCard({
  location,
  mode = 'danos',
}: {
  location: LocationWithNeeds;
  mode?: ExplorerMode;
}) {
  const { summary } = location;
  const openNeeds = location.needs.filter((need) => need.status !== 'cubierto');
  const categories = Array.from(new Set(openNeeds.map((need) => need.categoria))).slice(0, 3);
  const place = [location.zona, location.ciudad, location.estado].filter(Boolean).join(', ');
  const fotos = location.fotos ?? [];
  const cover = fotos[0];
  const isAyuda = mode === 'ayuda';

  return (
    <div className="group flex min-w-0 gap-4 rounded-2xl border border-border bg-surface p-4 shadow-card transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lift">
      {/* Photo area - intentionally NOT inside the navigation Link so carousel
       * buttons are valid HTML and don't accidentally trigger navigation. */}
      {fotos.length > 0 && (
        <div className="relative w-28 shrink-0 self-start sm:w-36 lg:w-40">
          {fotos.length > 1 ? (
            <PhotoCarousel fotos={fotos} />
          ) : (
            // Single cover: decorative link so clicking the photo navigates; aria-hidden +
            // tabIndex=-1 keeps it out of the a11y tree (the details Link carries the name).
            <Link href={`/zona/${location.id}`} aria-hidden tabIndex={-1}>
              <ZonePhoto src={cover} alt="" size={400} />
            </Link>
          )}
          <span className="sr-only">
            {fotos.length === 1 ? '1 foto' : `${fotos.length} fotos`}
          </span>
        </div>
      )}

      {/* Primary navigation link: carries the accessible card name (zone nombre). */}
      <Link
        href={`/zona/${location.id}`}
        className="min-w-0 flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 rounded-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-ink">{location.nombre}</h3>
            <p className="mt-0.5 flex items-center gap-1 text-sm text-ink-soft">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-faint" aria-hidden />
              <span className="truncate">{place}</span>
            </p>
          </div>
          {isAyuda ? (
            <p className="mt-0.5 shrink-0 text-xs text-ink-soft">
              Edificio: {statusMeta[location.status]?.label ?? location.status}
            </p>
          ) : (
            <StatusBadge status={location.status} size="sm" />
          )}
        </div>

        {!isAyuda && location.personas_atrapadas === 'si' && (
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
          {isAyuda ? (
            <span>
              {summary.urgentes > 0 ? (
                <span className="font-medium text-danger tabular">
                  {summary.urgentes} urgente{summary.urgentes !== 1 ? 's' : ''}
                </span>
              ) : (
                <span className="tabular font-medium">{summary.pendientes + summary.enCamino}</span>
              )}{' '}
              {summary.urgentes > 0 ? 'sin cubrir' : 'pedidos abiertos'}
            </span>
          ) : (
            <span>
              <span className="tabular font-medium text-ink-soft">{summary.total}</span> necesidades
              {summary.urgentes > 0 && (
                <span className="text-danger"> · {summary.urgentes} urgentes</span>
              )}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-brand-600 transition-all group-hover:gap-1.5">
            {isAyuda ? 'Ver pedidos de ayuda' : 'Ver zona'}{' '}
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </span>
        </div>
      </Link>
    </div>
  );
}
