'use client';

import { useEffect } from 'react';

import { registerServiceWorker } from '@/lib/register-sw';

/**
 * Registers the offline service worker on mount (production only, to avoid
 * interfering with dev HMR). Renders nothing. Registration failures are
 * swallowed by registerServiceWorker, so this never breaks the app.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    void registerServiceWorker();
  }, []);

  return null;
}
