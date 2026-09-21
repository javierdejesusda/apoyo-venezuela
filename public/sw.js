// Self-destructing service worker for Apoyo Venezuela.
//
// Everyone who used the site while it was running still has the previous
// caching worker installed, and that worker would keep serving them a stale
// copy of a site that no longer operates. This replacement intercepts nothing:
// it takes over, drops every cache, unregisters itself and reloads the open
// tabs, after which the browser talks to the network directly.
//
// Do not add a fetch handler here. The whole point is that no request is served
// from cache any more.

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();

      // Reload the tabs this worker inherited, so they drop it immediately
      // instead of keeping the cached page until the visitor navigates.
      const windows = await self.clients.matchAll({ type: 'window' });
      await Promise.all(windows.map((client) => client.navigate(client.url)));
    })(),
  );
});
