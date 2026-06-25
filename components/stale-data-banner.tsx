'use client';

import { WifiOff } from 'lucide-react';

/**
 * Surfaces a connectivity warning so cached content is never mistaken for live
 * data. For an emergency map a stale "estable/safe" status must never look
 * current. The role="status" region stays mounted even when healthy so screen
 * readers reliably announce the message the moment it appears.
 */
export function StaleDataBanner({
  offline = false,
  liveUpdatesDown = false,
}: {
  offline?: boolean;
  liveUpdatesDown?: boolean;
}) {
  const message = offline
    ? 'Sin conexión: los datos podrían estar desactualizados.'
    : liveUpdatesDown
      ? 'Actualizaciones en vivo no disponibles: los datos podrían estar desactualizados.'
      : '';

  return (
    <div
      role="status"
      aria-live="polite"
      className={
        message
          ? 'flex items-center justify-center gap-2 bg-warning/15 px-4 py-2 text-sm font-medium text-ink'
          : 'sr-only'
      }
    >
      {message ? (
        <>
          <WifiOff className="h-3.5 w-3.5 shrink-0 text-warning" aria-hidden />
          <span className="text-left">{message}</span>
        </>
      ) : null}
    </div>
  );
}
