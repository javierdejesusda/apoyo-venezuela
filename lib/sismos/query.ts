/**
 * Builds the USGS FDSN event query for recent earthquakes near Venezuela.
 *
 * USGS is public, key-less and returns epoch-millisecond timestamps, which makes
 * relative-time formatting trivial. The query is constrained to a bounding box
 * around the country and to magnitudes worth surfacing; the caller passes the
 * current time so the helper stays pure and testable.
 */

/** Bounding box around Venezuela (decimal degrees). */
export const VENEZUELA_BBOX = {
  minLat: 0.6,
  maxLat: 12.5,
  minLng: -73.4,
  maxLng: -59.8,
} as const;

const USGS_ENDPOINT = 'https://earthquake.usgs.gov/fdsnws/event/1/query';

export interface UsgsQueryOptions {
  /** Current time as epoch milliseconds; starttime is derived from it. */
  now: number;
  /** Time window to look back, in days (default 7). */
  days?: number;
  /** Minimum magnitude to include (default 3, the "felt indoors" threshold). */
  minMagnitude?: number;
  /** Maximum number of events to return (default 50). */
  limit?: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Returns the fully-formed USGS FDSN GeoJSON query URL. */
export function buildUsgsQuery({
  now,
  days = 7,
  minMagnitude = 3,
  limit = 50,
}: UsgsQueryOptions): string {
  const starttime = new Date(now - days * DAY_MS).toISOString();
  const params = new URLSearchParams({
    format: 'geojson',
    minlatitude: String(VENEZUELA_BBOX.minLat),
    maxlatitude: String(VENEZUELA_BBOX.maxLat),
    minlongitude: String(VENEZUELA_BBOX.minLng),
    maxlongitude: String(VENEZUELA_BBOX.maxLng),
    minmagnitude: String(minMagnitude),
    orderby: 'time',
    limit: String(limit),
    starttime,
  });
  return `${USGS_ENDPOINT}?${params.toString()}`;
}
