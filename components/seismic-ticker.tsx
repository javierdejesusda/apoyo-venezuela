'use client';

import { Activity } from 'lucide-react';

import { formatPlaceEs, relativeTimeEs } from '@/lib/sismos/format';
import { magnitudeStyle } from '@/lib/sismos/magnitude';
import type { Sismo } from '@/lib/sismos/types';
import { useNow } from '@/lib/use-now';
import { usePrefersReducedMotion } from '@/lib/use-prefers-dark';

/**
 * A slim "último temblor" wire that loops the most recent earthquake across the
 * top of the home page. With reduced motion it stays still and truncates instead
 * of scrolling. Renders nothing when there is no recent quake to show.
 */
export function SeismicTicker({ sismos }: { sismos: Sismo[] }): React.JSX.Element | null {
  const reducedMotion = usePrefersReducedMotion();
  // Relative time arrives after mount (null on SSR/first paint) so the server
  // and client agree on the "hace X" suffix; refreshed each minute.
  const now = useNow();

  const latest = sismos[0];
  if (!latest) return null;

  const color = magnitudeStyle(latest.magnitude).color;
  const place = formatPlaceEs(latest.place);
  const when = now === null ? '' : relativeTimeEs(latest.time, now);

  const content = (
    <>
      <span className="tabular font-semibold" style={{ color }}>
        M{latest.magnitude.toFixed(1)}
      </span>{' '}
      <span className="text-ink-soft">{place}</span>
      {when && <span className="text-ink-faint"> · {when}</span>}
    </>
  );

  return (
    <div
      role="status"
      aria-label={`Último temblor: magnitud ${latest.magnitude.toFixed(1)}, ${place}${
        when ? `, ${when}` : ''
      }`}
      className="flex items-stretch overflow-hidden rounded-xl border border-border bg-surface text-sm shadow-card"
    >
      <span className="eyebrow flex shrink-0 items-center gap-1.5 border-r border-border bg-surface-2 px-3 py-2 text-ink-faint">
        <Activity size={13} aria-hidden="true" style={{ color }} />
        Último temblor
      </span>
      <div className="relative flex-1 overflow-hidden py-2" aria-hidden="true">
        {reducedMotion ? (
          <div className="truncate px-6">{content}</div>
        ) : (
          <div className="animate-marquee flex w-max">
            <span className="whitespace-nowrap px-6">{content}</span>
            <span className="whitespace-nowrap px-6">{content}</span>
          </div>
        )}
      </div>
    </div>
  );
}
