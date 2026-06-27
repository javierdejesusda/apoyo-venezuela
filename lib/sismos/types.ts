/**
 * Domain type for a recent earthquake ("sismo") surfaced on the home map and
 * ticker. Normalized from the USGS FDSN GeoJSON feed (see parse.ts) so the rest
 * of the app never touches the raw upstream shape.
 */
export interface Sismo {
  /** USGS event id (e.g. "us6000t8k6"). */
  id: string;
  /** Reported magnitude. */
  magnitude: number;
  /** Human-readable location, as given by USGS (English). */
  place: string;
  /** Event time as UTC epoch milliseconds. */
  time: number;
  /** Latitude in decimal degrees. */
  lat: number;
  /** Longitude in decimal degrees. */
  lng: number;
  /** Hypocenter depth in kilometers. */
  depthKm: number;
  /** Canonical USGS event page. */
  url: string;
}
