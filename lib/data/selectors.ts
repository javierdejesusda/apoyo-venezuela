/**
 * Pure, framework-free selectors shared by every data store implementation and
 * unit-tested directly. No I/O, no React, no Supabase.
 */
import type {
  EmergencyStatus,
  LocationFilters,
  LocationRecord,
  LocationWithNeeds,
  NeedRecord,
  NeedSummary,
} from './types';
import { EMERGENCY_STATUSES, VENEZUELA_STATES } from './types';

export function buildSummary(needs: NeedRecord[]): NeedSummary {
  let pendientes = 0;
  let enCamino = 0;
  let cubiertos = 0;
  let urgentes = 0;
  for (const n of needs) {
    if (n.status === 'pendiente') pendientes += 1;
    else if (n.status === 'en_camino') enCamino += 1;
    else if (n.status === 'cubierto') cubiertos += 1;
    if (n.urgencia === 'alta' && n.status !== 'cubierto') urgentes += 1;
  }
  return { total: needs.length, pendientes, enCamino, cubiertos, urgentes };
}

/** Attach a location's own needs (matched by id) plus a derived summary. */
export function withSummary(
  location: LocationRecord,
  allNeeds: NeedRecord[],
): LocationWithNeeds {
  const own = allNeeds.filter((n) => n.locationId === location.id);
  return { ...location, needs: own, summary: buildSummary(own) };
}

export function matchesFilters(loc: LocationWithNeeds, f: LocationFilters): boolean {
  if (f.estado && loc.estado !== f.estado) return false;
  if (f.ciudad && loc.ciudad !== f.ciudad) return false;
  if (f.status && loc.status !== f.status) return false;
  if (f.categoria && !loc.needs.some((n) => n.categoria === f.categoria)) return false;
  if (f.urgencia && !loc.needs.some((n) => n.urgencia === f.urgencia && n.status !== 'cubierto')) return false;
  if (f.texto) {
    const q = f.texto.trim().toLowerCase();
    if (q) {
      const haystack = [loc.nombre, loc.ciudad, loc.zona, loc.estado]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
  }
  return true;
}

export function applyFilters(
  locations: LocationWithNeeds[],
  filters: LocationFilters = {},
): LocationWithNeeds[] {
  return locations.filter((l) => matchesFilters(l, filters));
}

/**
 * Removes reporter contact PII (name + phone) from a location for the bulk
 * list/map surfaces, which never render it. The zona detail page still shows
 * the phone, but it reads through getLocation rather than these bulk payloads,
 * so stripping here keeps phone numbers out of the home page and /api/zonas.
 */
export function stripContactPii(location: LocationWithNeeds): LocationWithNeeds {
  const copy = { ...location };
  delete copy.contactoNombre;
  delete copy.contactoTelefono;
  return copy;
}

export const STATUS_RANK = Object.fromEntries(
  EMERGENCY_STATUSES.map((s, i) => [s, i]),
) as Record<EmergencyStatus, number>;

/** Most critical first: collapse > damaged > unknown > stable, then urgency, then recency. */
export function sortLocations(locations: LocationWithNeeds[]): LocationWithNeeds[] {
  return [...locations].sort((a, b) => {
    if (STATUS_RANK[a.status] !== STATUS_RANK[b.status]) {
      return STATUS_RANK[a.status] - STATUS_RANK[b.status];
    }
    if (a.summary.urgentes !== b.summary.urgentes) {
      return b.summary.urgentes - a.summary.urgentes;
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

/** Aggregate counts shown in the home situation board. */
export interface GlobalStats {
  zonas: number;
  derrumbes: number;
  danoGrave: number;
  danoParcial: number;
  urgentes: number;
  necesidadesAbiertas: number;
}

/** Aggregate counts for the home header. */
export function globalStats(locations: LocationWithNeeds[]): GlobalStats {
  let derrumbes = 0;
  let danoGrave = 0;
  let danoParcial = 0;
  let urgentes = 0;
  let necesidadesAbiertas = 0;
  for (const l of locations) {
    if (l.status === 'derrumbe') derrumbes += 1;
    else if (l.status === 'dano_grave') danoGrave += 1;
    else if (l.status === 'dano_parcial') danoParcial += 1;
    urgentes += l.summary.urgentes;
    necesidadesAbiertas += l.summary.pendientes + l.summary.enCamino;
  }
  return {
    zonas: locations.length,
    derrumbes,
    danoGrave,
    danoParcial,
    urgentes,
    necesidadesAbiertas,
  };
}

/**
 * Returns distinct, sorted ciudad values for locations whose estado matches the
 * given value. Returns an empty array when `estado` is falsy or no matches exist.
 * Locations with an empty `ciudad` are excluded from the results.
 */
export function availableCiudadesForEstado(
  locations: LocationRecord[],
  estado: string,
): string[] {
  if (!estado) return [];
  const seen = new Set<string>();
  for (const loc of locations) {
    if (loc.estado === estado && loc.ciudad) seen.add(loc.ciudad);
  }
  return Array.from(seen).sort((a, b) => a.localeCompare(b, 'es'));
}

/**
 * Returns a map from each estado to its distinct sorted ciudades. Estados with
 * only empty ciudades are omitted. Used to thread city options server-side in a
 * single object so the client never has to derive them from a partial list.
 */
export function ciudadesByEstado(locations: LocationRecord[]): Record<string, string[]> {
  const map: Record<string, Set<string>> = {};
  for (const loc of locations) {
    if (!loc.ciudad) continue;
    if (!map[loc.estado]) map[loc.estado] = new Set();
    map[loc.estado].add(loc.ciudad);
  }
  const result: Record<string, string[]> = {};
  for (const [estado, set] of Object.entries(map)) {
    result[estado] = Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
  }
  return result;
}

/**
 * Returns the sorted (es locale) de-duplicated union of all canonical Venezuelan
 * states and every `loc.estado` found in the provided locations. Off-list values
 * from stored data are included defensively, then the whole set is sorted.
 */
export function availableStateOptions(locations: { estado: string }[]): string[] {
  const seen = new Set<string>(VENEZUELA_STATES);
  for (const loc of locations) {
    seen.add(loc.estado);
  }
  return Array.from(seen).sort((a, b) => a.localeCompare(b, 'es'));
}
