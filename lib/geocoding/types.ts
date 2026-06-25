/**
 * Shared geocoding contract.
 *
 * The Mapbox parsing layer (`lib/geocoding/mapbox.ts`), the server actions that
 * proxy it (`app/geocode-actions.ts`), and the UI that consumes address search
 * and reverse lookups all speak these shapes. Keeping them in one place lets the
 * parsing, the actions, and the components agree at compile time.
 */

/** A Venezuelan state name as stored on locations (one of `VENEZUELA_STATES`). */
export type EstadoName = string;

/**
 * Coarse precision of a geocoded point. `exact` renders as a single pin;
 * `approximate` renders as an uncertainty circle ("una cerca") whose radius is
 * `accuracyM`.
 */
export type GeoPrecision = 'exact' | 'approximate';

/**
 * Coordinate precision at or above which a point is treated as approximate and
 * the map draws an uncertainty circle instead of a single pin. Shared so the
 * picker, the form, and the map agree on the threshold.
 */
export const APPROXIMATE_THRESHOLD_M = 150;

/** A single address suggestion surfaced while the user types. */
export interface GeoSuggestion {
  /** Stable id from the provider, used as a React key. */
  id: string;
  /** Full human-readable label (used for matching / accessibility). */
  label: string;
  /** Primary line shown in the dropdown (street or place name). */
  primary: string;
  /** Secondary context line shown under the primary (e.g. "Chacao, Miranda"). */
  secondary: string;
  lat: number;
  lng: number;
  /** Canonical Venezuelan state when it maps to `VENEZUELA_STATES`, else null. */
  estado: EstadoName | null;
  /** City or municipality when present, else null. */
  ciudad: string | null;
  /** Neighborhood / sector detail when present, else null. */
  zona: string | null;
  /** Uncertainty radius in meters for this match (smaller is more precise). */
  accuracyM: number;
  precision: GeoPrecision;
}

/** Result of reverse-geocoding a dropped or dragged pin. */
export interface ReverseResult {
  /** Full human-readable label for the resolved place. */
  label: string;
  estado: EstadoName | null;
  ciudad: string | null;
  zona: string | null;
  /** Uncertainty radius in meters for the address match (not the pin itself). */
  accuracyM: number;
  precision: GeoPrecision;
}

/**
 * Forward search function injected into `AddressAutocomplete` so the component
 * stays decoupled from the server action and is trivially testable.
 */
export type GeoSearchFn = (query: string) => Promise<GeoSuggestion[]>;

/** Reverse-geocode function (lat, lng) -> resolved place, or null when unknown. */
export type GeoReverseFn = (
  lat: number,
  lng: number,
) => Promise<ReverseResult | null>;
