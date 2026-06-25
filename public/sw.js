// Service worker for Apoyo Venezuela. The route-classification logic mirrors
// lib/sw-route-policy.ts (the unit-tested source of truth); keep them aligned.
// The SW runtime cannot be unit-tested, so this stays intentionally small.
//
// Life-safety invariant: dynamic emergency data (home, zone pages) is never
// served from cache as if fresh. Static references (emergency phones, guide)
// and build assets are cached so they survive intermittent blocking.

// Bump VERSION whenever the cache structure or precache set changes so activate()
// purges the previous caches.
const VERSION = 'v1';
const SHELL_CACHE = `apoyo-shell-${VERSION}`;
const RUNTIME_CACHE = `apoyo-runtime-${VERSION}`;

// Static, request-free routes + the offline fallback + icons. Dynamic pages
// ('/', '/zona/*') are intentionally NOT precached.
const PRECACHE_URLS = [
  '/telefonos',
  '/guia',
  '/offline.html',
  '/manifest.webmanifest',
  '/icon.svg',
  '/favicon.ico',
];

const ASSET_EXTENSIONS =
  /\.(?:js|mjs|css|woff2?|ttf|otf|png|jpe?g|svg|ico|webp|gif|json|txt|webmanifest)$/i;
const STATIC_ROUTES = new Set(['/telefonos', '/guia']);

// Mirrors classifyRequest() in lib/sw-route-policy.ts.
function classify(url, method, sameOrigin) {
  if (method.toUpperCase() !== 'GET') return 'network-only';
  if (!sameOrigin || url.hostname.endsWith('supabase.co')) return 'network-only';
  const path = url.pathname;
  if (path.startsWith('/_next/static/') || ASSET_EXTENSIONS.test(path)) return 'static-asset';
  if (STATIC_ROUTES.has(path)) return 'precache-shell';
  return 'network-first-dynamic';
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // Resilient precache: one missing asset must not abort the install.
      await Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url)));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== SHELL_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

function putIfOk(cache, request, response) {
  if (response && response.ok) {
    cache.put(request, response.clone()).catch(() => undefined);
  }
  return response;
}

async function cacheFirst(request, cacheName, url) {
  const cache = await caches.open(cacheName);
  // Fall back to any cache so precached shell assets (served as static-asset)
  // are found even though they live in SHELL_CACHE.
  const cached = (await cache.match(request)) || (await caches.match(request));
  if (cached) {
    // Content-hashed build assets are immutable, so skip background revalidation
    // and conserve scarce bandwidth; only revalidate mutable shell routes.
    if (!url.pathname.startsWith('/_next/static/')) {
      fetch(request)
        .then((response) => putIfOk(cache, request, response))
        .catch(() => undefined);
    }
    return cached;
  }
  try {
    return putIfOk(cache, request, await fetch(request));
  } catch {
    return Response.error();
  }
}

async function networkFirstNavigation(request) {
  try {
    return await fetch(request);
  } catch {
    const cache = await caches.open(SHELL_CACHE);
    const offline = await cache.match('/offline.html');
    return offline ?? Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  const sameOrigin = url.origin === self.location.origin;
  const strategy = classify(url, request.method, sameOrigin);
  if (strategy === 'network-only') return;

  if (strategy === 'static-asset') {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE, url));
    return;
  }
  if (strategy === 'precache-shell') {
    event.respondWith(cacheFirst(request, SHELL_CACHE, url));
    return;
  }
  event.respondWith(networkFirstNavigation(request));
});

// Lets the page trigger immediate activation of an updated worker.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
