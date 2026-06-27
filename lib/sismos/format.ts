/**
 * Spanish formatting helpers for earthquake data. Pure functions so the relative
 * time is testable without faking the clock: the caller passes "now".
 */

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** Formats how long ago an event happened, e.g. "hace 3 h". */
export function relativeTimeEs(fromMs: number, nowMs: number): string {
  const diff = Math.max(0, nowMs - fromMs);
  const minutes = Math.floor(diff / MINUTE_MS);
  if (minutes < 1) return 'justo ahora';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(diff / HOUR_MS);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(diff / DAY_MS);
  return `hace ${days} d`;
}

// USGS places read like "54 km N of El Limón, Venezuela".
const PLACE_PATTERN = /^(\d+(?:\.\d+)?\s*km)\s+([NSEW]{1,3})\s+of\s+(.+)$/i;

/** Translates a USGS English place string into Spanish phrasing. */
export function formatPlaceEs(place: string): string {
  const match = place.match(PLACE_PATTERN);
  if (!match) return place;
  const [, distance, direction, rest] = match;
  return `${distance} al ${direction} de ${rest}`;
}
