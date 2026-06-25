export type RequestClass =
  | 'precache-shell'
  | 'network-first-dynamic'
  | 'static-asset'
  | 'network-only';

const STATIC_ROUTES = new Set(['/telefonos', '/guia']);
const ASSET_EXTENSIONS =
  /\.(?:js|mjs|css|woff2?|ttf|otf|png|jpe?g|svg|ico|webp|gif|json|txt|webmanifest)$/i;

/**
 * Pure request classification used by the service worker. Extracted so the
 * life-safety routing decisions are unit-testable (the SW runtime is not).
 * public/sw.js mirrors this exactly.
 *
 * Invariant: dynamic emergency data (home, zone pages) is never served from
 * cache as fresh, and mutations / Supabase / cross-origin calls always hit the
 * network and fail closed when offline.
 */
export function classifyRequest(
  rawUrl: string,
  method: string,
  sameOrigin: boolean,
): RequestClass {
  if (method.toUpperCase() !== 'GET') return 'network-only';

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return 'network-only';
  }

  // Cross-origin (Supabase, CDNs, fonts) is never intercepted: hit the network.
  if (!sameOrigin || url.hostname.endsWith('supabase.co')) return 'network-only';

  const path = url.pathname;
  if (path.startsWith('/_next/static/') || ASSET_EXTENSIONS.test(path)) return 'static-asset';
  if (STATIC_ROUTES.has(path)) return 'precache-shell';

  // Home and zone pages carry live emergency data: never serve cache as fresh.
  return 'network-first-dynamic';
}
