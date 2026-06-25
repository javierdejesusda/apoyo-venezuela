/**
 * SSR data loader for a single zone page. Wrapping the store here means a
 * transient Supabase failure (cold region, rate limit, outage) degrades to a
 * `loadFailed` flag the page can surface, instead of throwing a 500. A genuine
 * not-found still returns `location: null` with `loadFailed: false` so the page
 * can render a real 404. Pure and node-testable: no React, no Next runtime.
 */
import type { DataStore } from './store';
import type { LocationWithNeeds } from './types';

export interface ZoneData {
  location: LocationWithNeeds | null;
  loadFailed: boolean;
}

export async function loadZone(store: DataStore, id: string): Promise<ZoneData> {
  try {
    return { location: await store.getLocation(id), loadFailed: false };
  } catch {
    return { location: null, loadFailed: true };
  }
}
