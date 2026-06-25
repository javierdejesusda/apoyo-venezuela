'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { getBrowserSupabase } from '@/lib/data/supabase-browser';

/**
 * Subscribes to Supabase changes and refreshes server components so the map and
 * lists update live as others post zones/needs. No-op in demo mode.
 */
export function RealtimeRefresher() {
  const router = useRouter();

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;

    const channel = supabase
      .channel('apoyo-venezuela-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'locations' }, () =>
        router.refresh(),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'needs' }, () =>
        router.refresh(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
