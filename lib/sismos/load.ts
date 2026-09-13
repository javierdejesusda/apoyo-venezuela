/**
 * Server-side loader for recent Venezuela earthquakes.
 *
 * Fetches the USGS FDSN feed and caches it for an hour via the Next data cache,
 * so the page's ISR revalidations reuse one upstream call instead of hitting
 * USGS per render. Any failure degrades to an empty list: the ticker and
 * epicenters simply do not render, never breaking the emergency page.
 */
import { buildUsgsQuery } from './query';
import { parseUsgsFeed } from './parse';
import type { Sismo } from './types';

// Next.js serves a route on the shortest window in play, so this also caps how
// often the home page regenerates: keep it aligned with the `revalidate` export
// in app/page.tsx or that segment config is silently overridden.
const REVALIDATE_SECONDS = 3600;
const WINDOW_MS = REVALIDATE_SECONDS * 1000;

export async function loadSismos(): Promise<Sismo[]> {
  try {
    // Bucket "now" to the cache window so starttime (and thus the query URL)
    // stays stable for five minutes; otherwise millisecond-precision timestamps
    // would change the URL every call and defeat the Next data cache.
    const now = Math.floor(Date.now() / WINDOW_MS) * WINDOW_MS;
    const url = buildUsgsQuery({ now });
    const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!res.ok) return [];
    return parseUsgsFeed(await res.json());
  } catch {
    return [];
  }
}
