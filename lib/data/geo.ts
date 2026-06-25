/**
 * Geographic helpers for mapping Venezuelan states to capital coordinates.
 *
 * Used by the map view to place approximate pins for zones that were reported
 * without explicit lat/lng coordinates.
 */
import { APPROXIMATE_THRESHOLD_M } from '@/lib/geocoding/types';

/**
 * Uncertainty radius in meters assigned when a zone has no coordinates and we
 * fall back to its state centroid. Wide on purpose: it covers most of a state.
 */
export const STATE_FALLBACK_RADIUS_M = 60000;

/** Centroid (state capital) coordinates for each Venezuelan federal entity. */
export const STATE_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  Amazonas: { lat: 5.6631, lng: -67.6256 },
  'Anzoátegui': { lat: 10.134, lng: -64.6836 },
  Apure: { lat: 7.889, lng: -67.4647 },
  Aragua: { lat: 10.2469, lng: -67.5958 },
  Barinas: { lat: 8.6231, lng: -70.2075 },
  'Bolívar': { lat: 8.1222, lng: -63.5497 },
  Carabobo: { lat: 10.162, lng: -68.0077 },
  Cojedes: { lat: 9.6611, lng: -68.5879 },
  'Delta Amacuro': { lat: 9.0606, lng: -62.0453 },
  'Distrito Capital': { lat: 10.4806, lng: -66.9036 },
  'Falcón': { lat: 11.4022, lng: -69.6736 },
  'Guárico': { lat: 9.9097, lng: -67.3539 },
  'La Guaira': { lat: 10.6019, lng: -66.9336 },
  Lara: { lat: 10.0647, lng: -69.3206 },
  'Mérida': { lat: 8.5897, lng: -71.1561 },
  Miranda: { lat: 10.3411, lng: -67.0406 },
  Monagas: { lat: 9.7457, lng: -63.1832 },
  'Nueva Esparta': { lat: 11.0339, lng: -63.8614 },
  Portuguesa: { lat: 9.0417, lng: -69.7333 },
  Sucre: { lat: 10.4537, lng: -64.1739 },
  'Táchira': { lat: 7.7669, lng: -72.225 },
  Trujillo: { lat: 9.3667, lng: -70.4333 },
  Yaracuy: { lat: 10.34, lng: -68.7425 },
  Zulia: { lat: 10.6427, lng: -71.6125 },
};

/**
 * Returns the centroid coordinates for a Venezuelan state, or null if unknown.
 */
export function stateCentroid(
  estado: string,
): { lat: number; lng: number } | null {
  return STATE_CENTROIDS[estado] ?? null;
}

/**
 * Resolves the best available map coordinates for a location, plus the
 * uncertainty radius the map should draw around them.
 *
 * - With lat/lng present: returns them; approximate is true only when the saved
 *   accuracyM meets APPROXIMATE_THRESHOLD_M. accuracyM defaults to 0 (exact).
 * - With either coordinate null: falls back to the estado centroid, approximate,
 *   with accuracyM = STATE_FALLBACK_RADIUS_M.
 * - With no coords and an unknown estado: returns null.
 */
export function resolveMapCoords(loc: {
  lat: number | null;
  lng: number | null;
  estado: string;
  accuracyM?: number | null;
}): {
  lat: number;
  lng: number;
  approximate: boolean;
  accuracyM: number;
} | null {
  if (loc.lat !== null && loc.lng !== null) {
    const approximate =
      loc.accuracyM != null && loc.accuracyM >= APPROXIMATE_THRESHOLD_M;
    return {
      lat: loc.lat,
      lng: loc.lng,
      approximate,
      accuracyM: loc.accuracyM ?? 0,
    };
  }
  const centroid = stateCentroid(loc.estado);
  if (centroid !== null) {
    return {
      ...centroid,
      approximate: true,
      accuracyM: STATE_FALLBACK_RADIUS_M,
    };
  }
  return null;
}
