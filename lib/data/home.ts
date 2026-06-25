/**
 * SSR data loader for the home page. Wrapping the store here means a transient
 * Supabase failure (cold region, rate limit, outage) degrades to an empty list
 * plus a `loadFailed` flag the page can surface, instead of throwing a 500.
 * Pure and node-testable: no React, no Next runtime.
 */
import { availableStateOptions, globalStats, type GlobalStats } from './selectors';
import type { DataStore } from './store';
import type { LocationWithNeeds } from './types';

export interface HomeData {
  locations: LocationWithNeeds[];
  stats: GlobalStats;
  states: string[];
  loadFailed: boolean;
}

export async function loadHomeData(store: DataStore): Promise<HomeData> {
  try {
    const locations = await store.listLocations();
    return {
      locations,
      stats: globalStats(locations),
      states: availableStateOptions(locations),
      loadFailed: false,
    };
  } catch {
    return { locations: [], stats: globalStats([]), states: [], loadFailed: true };
  }
}
