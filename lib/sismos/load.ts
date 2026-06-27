/**
 * Server-side loader for recent Venezuela earthquakes.
 *
 * Fetches the USGS FDSN feed and caches it for five minutes via the Next data
 * cache, so the page's ISR revalidations reuse one upstream call instead of
 * hitting USGS per render. Any failure degrades to an empty list: the ticker and
 * epicenters simply do not render, never breaking the emergency page.
 */
import { buildUsgsQuery } from './query';
import { parseUsgsFeed } from './parse';
import type { Sismo } from './types';

const REVALIDATE_SECONDS = 300;

export async function loadSismos(): Promise<Sismo[]> {
  try {
    const url = buildUsgsQuery({ now: Date.now() });
    const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!res.ok) return [];
    return parseUsgsFeed(await res.json());
  } catch {
    return [];
  }
}
