import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, MapPin, PhoneCall } from 'lucide-react';

import { getStore } from '@/lib/data/store';
import { loadZone } from '@/lib/data/zone';
import { statusMeta, toneClasses } from '@/lib/status';
import { formatRelativeTime, telHref } from '@/lib/utils';
import { StatusBadge } from '@/components/status-badges';
import { AddNeedForm } from '@/components/add-need-form';
import { NeedList } from '@/components/need-list';
import { ZonePhoto } from '@/components/zone-photo';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<{ title: string }> {
  const { id } = await params;
  const { location } = await loadZone(getStore(), id);
  return { title: location?.nombre ?? 'Zona' };
}

export default async function ZonaPage({ params }: Props) {
  const { id } = await params;
  const { location, loadFailed } = await loadZone(getStore(), id);

  const backLink = (
    <Link
      href="/"
      className="mb-4 inline-flex min-h-[44px] items-center gap-1 text-sm text-ink-soft transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 rounded-lg px-1"
    >
      <ChevronLeft className="h-4 w-4" aria-hidden />
      Volver al mapa
    </Link>
  );

  if (loadFailed) {
    return (
      <div className="mx-auto max-w-2xl pb-24 pt-4">
        {backLink}
        <p
          role="status"
          className="rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm text-ink-soft"
        >
          No pudimos cargar esta zona en este momento. Intenta refrescar en unos minutos.
        </p>
      </div>
    );
  }

  if (!location) notFound();

  const placeParts = [location.zona, location.ciudad, location.estado].filter(Boolean);
  const placeLabel = placeParts.join(', ');

  const { total, pendientes, urgentes, cubiertos } = location.summary;

  const tone = statusMeta[location.status].tone;
  const tones = toneClasses(tone);
  const isDerrumbe = location.status === 'derrumbe';
  const fotos = location.fotos ?? [];

  return (
    <div className="mx-auto max-w-2xl pb-24 pt-4">
      {backLink}

      <div className="space-y-4">
        <div className={`space-y-2 border-l-4 pl-4 ${tones.border}`}>
          <p className="eyebrow flex items-center gap-2.5 text-ink-faint">
            {isDerrumbe ? (
              <span className="relative flex h-2 w-2 items-center justify-center" aria-hidden>
                <span className={`live-ping absolute inline-flex h-full w-full rounded-full ${tones.dot}`} />
                <span className={`relative inline-flex h-2 w-2 rounded-full ${tones.dot}`} />
              </span>
            ) : (
              <span aria-hidden className="h-px w-7 bg-border-strong" />
            )}
            Zona reportada
          </p>
          <h1 className="text-3xl font-semibold text-ink sm:text-4xl">
            {location.nombre}
          </h1>

          {placeLabel && (
            <div className="flex items-center gap-1.5 text-sm text-ink-soft">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden />
              <span>{placeLabel}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={location.status} />
            <span className="text-xs text-ink-faint">
              Actualizado {formatRelativeTime(location.updatedAt)}
            </span>
          </div>
        </div>

        {location.contactoTelefono && (
          <a
            href={telHref(location.contactoTelefono)}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-border-strong bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
          >
            <PhoneCall className="h-4 w-4 text-brand-600" aria-hidden />
            {location.contactoNombre ?? location.contactoTelefono}
          </a>
        )}

        {location.descripcion && (
          <p className="text-sm leading-relaxed text-ink-soft">{location.descripcion}</p>
        )}

        {fotos.length > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {fotos.map((foto, index) => (
              <ZonePhoto
                key={`${foto}-${index}`}
                src={foto}
                alt={`Foto de la zona ${location.nombre}`}
              />
            ))}
          </div>
        )}

        {total > 0 && (
          <div className="flex flex-wrap gap-4 rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm">
            <span className="text-ink-soft">
              <strong className="text-ink">{total}</strong>{' '}
              {total === 1 ? 'necesidad' : 'necesidades'}
            </span>
            {urgentes > 0 && (
              <span className="text-danger">
                <strong>{urgentes}</strong> urgente{urgentes !== 1 ? 's' : ''}
              </span>
            )}
            {pendientes > 0 && (
              <span className="text-ink-soft">
                <strong className="text-ink">{pendientes}</strong> pendiente{pendientes !== 1 ? 's' : ''}
              </span>
            )}
            {cubiertos > 0 && (
              <span className="text-success">
                <strong>{cubiertos}</strong> cubierta{cubiertos !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        <AddNeedForm locationId={location.id} />

        <NeedList needs={location.needs} locationId={location.id} />
      </div>
    </div>
  );
}
