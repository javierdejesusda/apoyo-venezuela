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
import { VENEZUELA_STATES } from './types';

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
  if (f.status && loc.status !== f.status) return false;
  if (f.categoria && !loc.needs.some((n) => n.categoria === f.categoria)) return false;
  if (f.soloUrgentes && loc.summary.urgentes <= 0) return false;
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

const STATUS_RANK: Record<EmergencyStatus, number> = {
  derrumbe: 0,
  danado: 1,
  desconocido: 2,
  estable: 3,
};

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
  urgentes: number;
  necesidadesAbiertas: number;
}

/** Aggregate counts for the home header. */
export function globalStats(locations: LocationWithNeeds[]): GlobalStats {
  let derrumbes = 0;
  let urgentes = 0;
  let necesidadesAbiertas = 0;
  for (const l of locations) {
    if (l.status === 'derrumbe') derrumbes += 1;
    urgentes += l.summary.urgentes;
    necesidadesAbiertas += l.summary.pendientes + l.summary.enCamino;
  }
  return {
    zonas: locations.length,
    derrumbes,
    urgentes,
    necesidadesAbiertas,
  };
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
