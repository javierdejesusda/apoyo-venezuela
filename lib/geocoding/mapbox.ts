/**
 * Pure parsing layer for the Mapbox Geocoding API v6.
 *
 * This module never performs network I/O: it only builds request URLs and
 * translates raw v6 JSON into the shared geocoding contract. The server action
 * that owns the network call (and the secret token) lives elsewhere; keeping
 * parsing pure makes it deterministic and unit-testable without mocking fetch.
 *
 * v6 reference shapes used here:
 *   - `geometry.coordinates` is `[longitude, latitude]` (GeoJSON order).
 *   - `properties.feature_type` is one of address, secondary_address, street,
 *     neighborhood, postcode, locality, place, district, region, ...
 *   - `properties.context.{region,place,locality,neighborhood,address}` each
 *     expose a `name`; `region` also carries `region_code`.
 */

import { VENEZUELA_STATES } from '@/lib/data/types';

import {
  APPROXIMATE_THRESHOLD_M,
  type GeoPrecision,
  type GeoSuggestion,
  type ReverseResult,
} from './types';

const GEOCODE_V6_BASE = 'https://api.mapbox.com/search/geocode/v6';

/** Bias point near the geographic center of Venezuela, as "lng,lat". */
const VENEZUELA_PROXIMITY = '-66.9,10.5';

/** Number of suggestions to request while the user types. */
const FORWARD_LIMIT = '6';

/**
 * Uncertainty radius (meters) per Mapbox feature type. Coarser feature types
 * describe larger areas, so their representative point is less precise.
 */
const FEATURE_TYPE_ACCURACY_M: Readonly<Record<string, number>> = {
  address: 30,
  secondary_address: 30,
  street: 120,
  neighborhood: 400,
  postcode: 1500,
  locality: 1500,
  place: 4000,
  district: 12000,
  region: 60000,
};

/** Fallback radius for feature types we do not explicitly size. */
const DEFAULT_ACCURACY_M = 2000;

/** Radius a low-confidence fine-grained match is widened to. */
const LOW_CONFIDENCE_FLOOR_M = 400;

/**
 * Builds the v6 forward (search-by-text) request URL.
 *
 * Args:
 *   query: Raw user text; encoded into the `q` parameter.
 *   token: Mapbox access token. Used only here, never logged.
 *
 * Returns:
 *   A fully-qualified forward geocoding URL scoped to Venezuela in Spanish.
 */
export function buildForwardUrl(query: string, token: string): string {
  const url = new URL(`${GEOCODE_V6_BASE}/forward`);
  url.searchParams.set('q', query);
  url.searchParams.set('country', 've');
  url.searchParams.set('language', 'es');
  url.searchParams.set('limit', FORWARD_LIMIT);
  url.searchParams.set('autocomplete', 'true');
  url.searchParams.set('proximity', VENEZUELA_PROXIMITY);
  url.searchParams.set('access_token', token);
  return url.toString();
}

/**
 * Builds the v6 reverse (search-by-coordinate) request URL.
 *
 * Args:
 *   lat: Latitude of the dropped pin.
 *   lng: Longitude of the dropped pin.
 *   token: Mapbox access token. Used only here, never logged.
 *
 * Returns:
 *   A fully-qualified reverse geocoding URL scoped to Venezuela in Spanish.
 */
export function buildReverseUrl(lat: number, lng: number, token: string): string {
  const url = new URL(`${GEOCODE_V6_BASE}/reverse`);
  url.searchParams.set('longitude', String(lng));
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('country', 've');
  url.searchParams.set('language', 'es');
  url.searchParams.set('access_token', token);
  return url.toString();
}

/** Lowercased, accent-stripped, trimmed form for tolerant name matching. */
function normalizeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase();
}

const STATE_BY_KEY: ReadonlyMap<string, string> = (() => {
  const map = new Map<string, string>();
  for (const state of VENEZUELA_STATES) {
    map.set(normalizeKey(state), state);
  }
  // The state was named "Vargas" until its 2019 rename to "La Guaira"; Mapbox
  // may still return either spelling, so both resolve to the canonical name.
  map.set(normalizeKey('Vargas'), 'La Guaira');
  return map;
})();

/**
 * Maps a Mapbox region name to the canonical Venezuelan state.
 *
 * Args:
 *   regionName: The `context.region.name` from a feature, if any.
 *
 * Returns:
 *   The canonical `VENEZUELA_STATES` spelling, or null when there is no
 *   confident match.
 */
export function normalizeEstado(regionName: string | null | undefined): string | null {
  if (typeof regionName !== 'string') return null;
  const key = normalizeKey(regionName);
  if (!key) return null;
  return STATE_BY_KEY.get(key) ?? null;
}

/** True when a v6 `match_code` reports low overall confidence. */
function isLowConfidence(matchCode: unknown): boolean {
  const record = asObject(matchCode);
  return record?.confidence === 'low';
}

/**
 * Estimates an uncertainty radius in meters for a geocoding match.
 *
 * Args:
 *   featureType: The Mapbox `feature_type` of the match.
 *   matchCode: Optional v6 `match_code`; a low-confidence fine-grained match is
 *     widened to a neighborhood-sized radius.
 *
 * Returns:
 *   The radius in meters used to decide exact vs. approximate precision.
 */
export function accuracyToMeters(featureType: string, matchCode?: unknown): number {
  const base = FEATURE_TYPE_ACCURACY_M[featureType] ?? DEFAULT_ACCURACY_M;
  if (base < LOW_CONFIDENCE_FLOOR_M && isLowConfidence(matchCode)) {
    return LOW_CONFIDENCE_FLOOR_M;
  }
  return base;
}

function asObject(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** Returns a trimmed non-empty string, or null. */
function asText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

/** Reads `context[key].name` defensively. */
function contextName(
  context: Record<string, unknown> | null,
  key: string,
): string | null {
  const entry = context ? asObject(context[key]) : null;
  return entry ? asText(entry.name) : null;
}

/** First comma-separated segment of a label (e.g. the street line). */
function firstSegment(value: string | null): string | null {
  if (!value) return null;
  return asText(value.split(',')[0]);
}

/** Translates a single v6 feature into a GeoSuggestion, or null when invalid. */
function mapFeature(feature: unknown): GeoSuggestion | null {
  const f = asObject(feature);
  if (!f) return null;

  const geometry = asObject(f.geometry);
  const coordinates = geometry?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null;
  const lng = Number(coordinates[0]);
  const lat = Number(coordinates[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const props = asObject(f.properties) ?? {};
  const context = asObject(props.context);
  const featureType = asText(props.feature_type) ?? '';

  const estado = normalizeEstado(contextName(context, 'region'));
  const ciudad = contextName(context, 'place') ?? contextName(context, 'locality');
  const zona = contextName(context, 'neighborhood') ?? contextName(context, 'address');

  const fullAddress = asText(props.full_address) ?? asText(props.place_formatted);
  const primary = asText(props.name) ?? firstSegment(fullAddress) ?? 'Ubicación';

  const contextLine = [ciudad, estado].filter((part): part is string => Boolean(part));
  const secondary = contextLine.length
    ? contextLine.join(', ')
    : (asText(props.place_formatted) ?? '');

  const accuracyM = accuracyToMeters(featureType, props.match_code);
  const precision: GeoPrecision =
    accuracyM >= APPROXIMATE_THRESHOLD_M ? 'approximate' : 'exact';

  const id =
    asText(f.id) ?? asText(props.mapbox_id) ?? `${featureType}:${lat},${lng}`;
  const label =
    fullAddress ?? [primary, secondary].filter(Boolean).join(', ');

  return { id, label, primary, secondary, lat, lng, estado, ciudad, zona, accuracyM, precision };
}

/**
 * Parses a v6 forward response into address suggestions.
 *
 * Args:
 *   json: Raw parsed JSON of unknown shape.
 *
 * Returns:
 *   One GeoSuggestion per valid feature; malformed or empty input yields [].
 */
export function parseForward(json: unknown): GeoSuggestion[] {
  const features = asObject(json)?.features;
  if (!Array.isArray(features)) return [];
  const suggestions: GeoSuggestion[] = [];
  for (const feature of features) {
    const mapped = mapFeature(feature);
    if (mapped) suggestions.push(mapped);
  }
  return suggestions;
}

/**
 * Parses a v6 reverse response into a single resolved place.
 *
 * Args:
 *   json: Raw parsed JSON of unknown shape.
 *
 * Returns:
 *   The first valid feature as a ReverseResult, or null when none is usable.
 */
export function parseReverse(json: unknown): ReverseResult | null {
  const features = asObject(json)?.features;
  if (!Array.isArray(features) || features.length === 0) return null;
  const mapped = mapFeature(features[0]);
  if (!mapped) return null;
  const { label, estado, ciudad, zona, accuracyM, precision } = mapped;
  return { label, estado, ciudad, zona, accuracyM, precision };
}
