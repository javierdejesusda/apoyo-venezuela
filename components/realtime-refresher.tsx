'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { interpretChannelStatus } from '@/lib/data/realtime-status';
import { getBrowserSupabase } from '@/lib/data/supabase-browser';

/**
 * Subscribes to Supabase changes and refreshes server components so the map and
 * lists update live. No-op in demo mode. On a censored or degraded network the
 * websocket may never connect: errors are swallowed and onStatusChange(false)
 * lets a parent surface an "actualizaciones en vivo no disponibles" hint. The
 * Supabase client keeps retrying, so onStatusChange(true) fires again on
 * recovery.
 *
 * onStatusChange must be a stable reference (useCallback) to avoid resubscribe
 * churn.
 */
export function RealtimeRefresher({
  onStatusChange,
}: {
  onStatusChange?: (live: boolean) => void;
} = {}) {
  const router = useRouter();

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel('apoyo-venezuela-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'locations' }, () =>
          router.refresh(),
        )
        .on('postgres_changes', { event: '*', schema: 'public', table: 'needs' }, () =>
          router.refresh(),
        )
        .subscribe((status) => {
          const { live, settled } = interpretChannelStatus(status);
          if (settled) onStatusChange?.(live);
        });
    } catch {
      onStatusChange?.(false);
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }
    };
  }, [router, onStatusChange]);

  return null;
}
