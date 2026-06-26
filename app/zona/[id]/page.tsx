import { cache } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, MapPin, PhoneCall } from 'lucide-react';

import { getStore } from '@/lib/data/store';
import { loadZone } from '@/lib/data/zone';
import { loadZoneCluster } from '@/lib/data/zone-cluster';
import { buildDirectionsLinks } from '@/lib/directions';
import { FUENTE_REPORTE_LABELS } from '@/lib/data/types';
import { resolveStatusMeta, toneClasses } from '@/lib/status';
import { formatRelativeTime, telHref } from '@/lib/utils';
import { SharePanel } from '@/components/share-panel';
import { GroupedReportsNote } from '@/components/grouped-reports-note';
import { PersonasAtrapadasBadge, StatusBadge } from '@/components/status-badges';
import { ZoneTimeline } from '@/components/zone-timeline';
import { AddNeedForm } from '@/components/add-need-form';
import { NeedList } from '@/components/need-list';
import { ZonePhotoGallery } from '@/components/zone-photo-gallery';

// ISR with 30-second revalidation. In-app writes call revalidatePath('/zona/<id>')
// via app/actions.ts for instant on-demand revalidation. Out-of-band changes
// (e.g. `npm run delete-report`, which bypasses the app) reflect within 30 s,
// which is an acceptable trade-off for surviving high concurrent load.
export const revalidate = 30;

// Deduplicate the Supabase round-trip that generateMetadata and the page
// component both need. React cache() memoises per request across module scope.
const getZone = cache((id: string) => loadZone(getStore(), id));

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<{ title: string }> {
  const { id } = await params;
  const { location } = await getZone(id);
  return { title: location?.nombre ?? 'Zona' };
}

export default async function ZonaPage({ params }: Props) {
  const { id } = await params;
  // Run zone load and cluster load in parallel; cluster failure is non-fatal.
  const [{ location, loadFailed }, cluster] = await Promise.all([
    getZone(id),
    loadZoneCluster(id, getStore()),
  ]);

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

  // When a cluster canonical view is available, override severity-derived
  // values with the cluster aggregate (most-severe member wins).
  const effectiveStatus = cluster?.status ?? location.status;
  const effectivePersonasAtrapadas = cluster?.personas_atrapadas ?? location.personas_atrapadas;
  const effectiveFotos = cluster?.fotos ?? location.fotos ?? [];

  const tone = resolveStatusMeta(effectiveStatus).tone;
  const tones = toneClasses(tone);
  const isDerrumbe = effectiveStatus === 'derrumbe';
  const fotos = effectiveFotos;
  const dirs = buildDirectionsLinks(location.lat, location.lng);

  const dirLinkClass =
    'inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50';

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
            <StatusBadge status={effectiveStatus} />
            <span className="text-xs text-ink-faint">
              Actualizado {formatRelativeTime(location.updatedAt)}
            </span>
          </div>

          {effectivePersonasAtrapadas === 'si' && (
            <PersonasAtrapadasBadge value={effectivePersonasAtrapadas} />
          )}

          <GroupedReportsNote memberCount={cluster?.memberCount ?? 1} />
        </div>

        <SharePanel
          kind="zone"
          zone={{ id: location.id, nombre: location.nombre, ciudad: location.ciudad }}
        />

        {dirs && (
          <section aria-labelledby="como-llegar-heading">
            <h2 id="como-llegar-heading" className="mb-2 text-sm font-semibold text-ink">
              Cómo llegar
            </h2>
            <div className="flex flex-wrap gap-2">
              <a
                href={dirs.google}
                aria-label="Cómo llegar con Google Maps"
                target="_blank"
                rel="noopener noreferrer"
                className={dirLinkClass}
              >
                Google Maps
              </a>
              <a
                href={dirs.osm}
                aria-label="Cómo llegar con OpenStreetMap"
                target="_blank"
                rel="noopener noreferrer"
                className={dirLinkClass}
              >
                OpenStreetMap
              </a>
            </div>
          </section>
        )}

        {location.contactoTelefono && (
          <div className="flex flex-col items-start gap-1">
            <a
              href={telHref(location.contactoTelefono)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-border-strong bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
            >
              <PhoneCall className="h-4 w-4 text-brand-600" aria-hidden />
              {location.contactoNombre ?? location.contactoTelefono}
            </a>
            <span className="pl-1 text-xs text-ink-faint">Para llamar</span>
          </div>
        )}

        {location.descripcion && (
          <p className="text-sm leading-relaxed text-ink-soft">{location.descripcion}</p>
        )}

        {(location.fuente_reporte || location.tipo_construccion) && (
          <dl className="space-y-1 text-sm text-ink-soft">
            {location.fuente_reporte && (
              <div className="flex gap-2">
                <dt className="font-medium text-ink">Fuente del reporte:</dt>
                <dd>{FUENTE_REPORTE_LABELS[location.fuente_reporte]}</dd>
              </div>
            )}
            {location.tipo_construccion && (
              <div className="flex gap-2">
                <dt className="font-medium text-ink">Tipo de construcción:</dt>
                <dd>{location.tipo_construccion}</dd>
              </div>
            )}
          </dl>
        )}

        {fotos.length > 0 && (
          <ZonePhotoGallery fotos={fotos} zoneName={location.nombre} />
        )}

        {cluster && cluster.timeline.length > 0 && (
          <ZoneTimeline entries={cluster.timeline} />
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
