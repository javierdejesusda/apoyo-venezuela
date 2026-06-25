'use server';

import {
  buildForwardUrl,
  buildReverseUrl,
  parseForward,
  parseReverse,
} from '@/lib/geocoding/mapbox';
import type { GeoSuggestion, ReverseResult } from '@/lib/geocoding/types';

/** Shortest query that produces useful Mapbox suggestions. */
const MIN_QUERY_LENGTH = 3;

/**
 * Forward-geocodes free text into address suggestions via Mapbox.
 *
 * Degrades to an empty list (never throws) when the token is absent, the query
 * is too short, or the request fails, so demo mode keeps working offline.
 *
 * Args:
 *   query: Raw user input from the address search field.
 *
 * Returns:
 *   Parsed suggestions, or [] when geocoding is unavailable or yields nothing.
 */
export async function geocodeForwardAction(query: string): Promise<GeoSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < MIN_QUERY_LENGTH) return [];
  const token = process.env.MAPBOX_TOKEN;
  if (!token) return [];
  try {
    const res = await fetch(buildForwardUrl(trimmed, token));
    if (!res.ok) return [];
    return parseForward(await res.json());
  } catch {
    // Swallow network/parse errors so the form stays usable; the token never
    // reaches the message because we discard the original error.
    return [];
  }
}

/**
 * Reverse-geocodes a coordinate into a resolved place via Mapbox.
 *
 * Degrades to null (never throws) when the coordinate is invalid, the token is
 * absent, or the request fails.
 *
 * Args:
 *   lat: Latitude of the dropped or dragged pin.
 *   lng: Longitude of the dropped or dragged pin.
 *
 * Returns:
 *   The resolved place, or null when geocoding is unavailable.
 */
export async function geocodeReverseAction(
  lat: number,
  lng: number,
): Promise<ReverseResult | null> {
  if (!isValidLat(lat) || !isValidLng(lng)) return null;
  const token = process.env.MAPBOX_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch(buildReverseUrl(lat, lng, token));
    if (!res.ok) return null;
    return parseReverse(await res.json());
  } catch {
    return null;
  }
}

function isValidLat(lat: number): boolean {
  return Number.isFinite(lat) && lat >= -90 && lat <= 90;
}

function isValidLng(lng: number): boolean {
  return Number.isFinite(lng) && lng >= -180 && lng <= 180;
}
