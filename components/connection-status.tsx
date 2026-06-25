'use client';

import { useCallback, useState } from 'react';

import { RealtimeRefresher } from '@/components/realtime-refresher';
import { StaleDataBanner } from '@/components/stale-data-banner';
import { useOnlineStatus } from '@/lib/use-online-status';

/**
 * Single source of the app's connectivity warning. Combines device online state
 * with Supabase realtime liveness, so a censored network where the device is
 * "online" but Supabase is blocked still warns that data may be stale.
 */
export function ConnectionStatus() {
  const online = useOnlineStatus();
  const [liveUpdates, setLiveUpdates] = useState(true);
  const handleStatusChange = useCallback((live: boolean) => setLiveUpdates(live), []);

  return (
    <>
      <StaleDataBanner offline={!online} liveUpdatesDown={online && !liveUpdates} />
      <RealtimeRefresher onStatusChange={handleStatusChange} />
    </>
  );
}
