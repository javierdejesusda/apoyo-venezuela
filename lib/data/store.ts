/**
 * The data-store contract plus the selector that decides, at runtime, between
 * the shared Supabase backend (when env vars are present) and the in-memory
 * demo store (otherwise). All reads/writes in the app go through `getStore()`.
 */
import { memoryStore } from './memory-store';
import { createSupabaseStore } from './supabase-store';
import type {
  ClusterCanonicalView,
  CreateFundraiserInput,
  CreateLocationInput,
  CreateNeedInput,
  EmergencyStatus,
  Fundraiser,
  LocationFilters,
  LocationRecord,
  LocationWithNeeds,
  NeedRecord,
  NeedStatus,
  RequestRemovalInput,
} from './types';

export { PAGE_SIZE, REPORT_QUOTA_LIMIT, REPORT_QUOTA_WINDOW_MS } from './types';

export interface DataStore {
  /** True when running on the in-memory demo backend (data is not shared). */
  isDemo: boolean;
  /**
   * Cheapest possible round-trip to the backend. Used by the daily keep-alive
   * cron so the Supabase Free project does not auto-pause after inactivity.
   * Resolves on success and rejects if the backend is unreachable.
   */
  ping(): Promise<void>;
  listLocations(filters?: LocationFilters): Promise<LocationWithNeeds[]>;
  /**
   * Returns a single page of filtered, sorted locations plus the total
   * filtered count (before slicing). Used by the home page and the
   * /api/zonas Route Handler for bounded pagination.
   */
  listLocationsPage(
    filters: LocationFilters,
    offset: number,
    limit: number,
  ): Promise<{ items: LocationWithNeeds[]; total: number }>;
  getLocation(id: string): Promise<LocationWithNeeds | null>;
  createLocation(input: CreateLocationInput): Promise<LocationRecord>;
  updateLocationStatus(
    id: string,
    status: EmergencyStatus,
  ): Promise<LocationRecord | null>;
  createNeed(input: CreateNeedInput): Promise<NeedRecord>;
  updateNeedStatus(id: string, status: NeedStatus): Promise<NeedRecord | null>;
  listFundraisers(): Promise<Fundraiser[]>;
  createFundraiser(input: CreateFundraiserInput): Promise<Fundraiser>;
  /**
   * Queues a public request to take a report down (resolved, duplicate, or
   * wrong). This only records the request in a private, maintainer-reviewed
   * queue; it never deletes anything. Returns void (not the stored row): the
   * queue is service-role only and there is intentionally no anon read path, so
   * the created row cannot be read back from the anon client.
   */
  createRemovalRequest(input: RequestRemovalInput): Promise<void>;
  /**
   * Returns true when the caller is allowed to submit a report (quota not
   * exceeded). Returns false when the sliding-window limit is reached.
   * FAIL-OPEN: always returns true on infrastructure errors so a legitimate
   * emergency report is never blocked by a throttle-table outage.
   */
  checkReportQuota(keyHash: string): Promise<boolean>;
  /**
   * Returns the canonical cluster view for the given location, or null when
   * no cluster has been assigned (yet) or the location does not exist.
   * Implementation lands in PR11; both stores return null for now.
   */
  getClusterForLocation(locationId: string): Promise<ClusterCanonicalView | null>;
}

let cached: DataStore | null = null;

export function getStore(): DataStore {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Demo/live detection matches schemas.ts and supabase-browser.ts exactly.
  if (!url || !anonKey) {
    cached = memoryStore;
    return cached;
  }
  // This app is fail-open by design (see report throttle/rate limiting), so
  // a hard throw here is wrong: getStore() is called as an argument (e.g.
  // loadHomeData(getStore())), outside the try/catch that loadHomeData/loadZone
  // wrap around the store calls themselves, so throwing would crash the route
  // instead of degrading. Log and fall back to the anon key instead: this
  // keeps the code safe to deploy before SUPABASE_SECRET_KEY is set, and once
  // the lockdown migration revokes anon table access, the resulting
  // permission errors are exactly what those try/catch wrappers already
  // catch and degrade from, with this log line pinpointing the root cause.
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) {
    console.error(
      'SUPABASE_SECRET_KEY is not set; falling back to the anon key. Set it before the lockdown migration is applied, or reads/writes will start failing.',
    );
  }
  cached = createSupabaseStore(url, key || anonKey);
  return cached;
}

export function isDemoMode(): boolean {
  return getStore().isDemo;
}
