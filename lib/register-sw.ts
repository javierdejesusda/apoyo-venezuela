/**
 * Registers the service worker, guarded so it is a safe no-op when service
 * workers are unavailable (older browsers, SSR). Kept out of React so the glue
 * is unit-testable with a fake navigator.
 */
export async function registerServiceWorker(
  nav: Navigator | undefined = typeof navigator !== 'undefined' ? navigator : undefined,
): Promise<ServiceWorkerRegistration | null> {
  if (!nav || !('serviceWorker' in nav)) return null;
  try {
    return await nav.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' });
  } catch {
    return null;
  }
}
