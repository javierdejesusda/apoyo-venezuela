/**
 * Pure, dependency-free proximity and name-similarity functions for zone
 * clustering documentation and testing.
 *
 * IMPORTANT - authoritative clustering happens in the SQL trigger
 * `assign_zone_cluster` (see 20260630000000_zone_clustering.sql). The
 * functions here are NOT wired to any runtime path: both stores return a null
 * stub and PR11 will read the trigger's output, not re-predict membership.
 * These functions exist so tests can reason about the threshold intent and so
 * the constants stay documented in one place.
 *
 * Keep PROXIMITY_RADIUS_M and NAME_SIMILARITY_THRESHOLD in sync with the
 * thresholds in the migration trigger.
 */

/** Great-circle distance threshold below which two zones may be the same site. */
export const PROXIMITY_RADIUS_M = 150;

/**
 * Name-similarity threshold used by the SQL trigger's `similarity()` call.
 * This constant documents the trigger intent; it is NOT the pg_trgm GUC value
 * (pg_trgm uses Jaccard with word tokenization, not Dice). The SQL trigger is
 * the authoritative clustering mechanism.
 *
 * Kept in sync with the 0.45 threshold in 20260630000000_zone_clustering.sql.
 * Raised from 0.3 to 0.45 to stop merging distinct buildings that only share a
 * generic prefix (e.g. "Torre Galipan" vs "Torre Petare").
 */
export const NAME_SIMILARITY_THRESHOLD = 0.45;

/** Earth's mean radius in meters, used by the haversine formula. */
const EARTH_R_M = 6_371_000;

/**
 * Returns the great-circle distance between two WGS-84 coordinates in meters
 * (haversine formula).
 */
export function haversineMeters(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const a =
    sinDLat * sinDLat +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * sinDLng * sinDLng;
  return 2 * EARTH_R_M * Math.asin(Math.sqrt(a));
}

/**
 * Builds the set of character trigrams from a string, padded with two spaces
 * on each side (matching pg_trgm's padding convention so that short strings
 * generate boundary trigrams).
 */
function trigrams(s: string): Set<string> {
  const padded = `  ${s}  `;
  const result = new Set<string>();
  for (let i = 0; i < padded.length - 2; i++) {
    result.add(padded.slice(i, i + 3));
  }
  return result;
}

/**
 * Returns a Dice trigram coefficient in [0, 1] as a documentation
 * approximation of the SQL trigger's `similarity()` intent. This is NOT a
 * faithful pg_trgm mirror: pg_trgm uses Jaccard with word tokenization, while
 * this function uses Dice with whole-string 2+2-space padding. Near the 0.3
 * threshold the two can disagree. The SQL trigger is the authoritative
 * clustering mechanism; this function exists for test readability only.
 *
 *   Dice = 2 * |A ∩ B| / (|A| + |B|)
 *
 * Identical strings return 1; completely disjoint strings return 0.
 */
export function nameSimilarity(a: string, b: string): number {
  const ta = trigrams(a.toLowerCase());
  const tb = trigrams(b.toLowerCase());
  let intersection = 0;
  for (const t of ta) {
    if (tb.has(t)) intersection++;
  }
  return (2 * intersection) / (ta.size + tb.size);
}

type Coords = { lat: number | null; lng: number | null };

/**
 * Returns true when both locations have non-null coordinates and the
 * great-circle distance between them is at most `radiusM` meters. A location
 * missing either coordinate is never considered proximate (cannot be clustered
 * by position alone).
 */
export function isProximate(
  a: Coords,
  b: Coords,
  radiusM: number = PROXIMITY_RADIUS_M,
): boolean {
  if (a.lat === null || a.lng === null || b.lat === null || b.lng === null) {
    return false;
  }
  return haversineMeters(a.lat, a.lng, b.lat, b.lng) <= radiusM;
}

type ClusterCandidate = Coords & { nombre: string };

/**
 * Returns true when two locations are both proximate (within PROXIMITY_RADIUS_M)
 * AND have sufficiently similar names (>= NAME_SIMILARITY_THRESHOLD). Both
 * conditions are required; failing either returns false without throwing.
 */
export function areClusterable(a: ClusterCandidate, b: ClusterCandidate): boolean {
  if (!isProximate(a, b)) return false;
  return nameSimilarity(a.nombre, b.nombre) >= NAME_SIMILARITY_THRESHOLD;
}
