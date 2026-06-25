'use client';

import { useSyncExternalStore } from 'react';

function subscribe(callback: () => void): () => void {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

/**
 * Tracks browser connectivity. The server snapshot is `true` so SSR and first
 * client paint match (no hydration flash); the client snapshot reflects
 * navigator.onLine and updates on the window online/offline events. Drives the
 * offline data banner.
 */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
}
