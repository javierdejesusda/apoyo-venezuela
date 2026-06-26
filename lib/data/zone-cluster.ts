/**
 * Canonical view derivation for zone clusters.
 *
 * The derived view is always re-computed from the current cluster MEMBERS; it
 * never relies on the stored `canonical_location_id` column, which can be NULL
 * when the canonical location is deleted (ON DELETE SET NULL).
 */
import { STATUS_RANK } from './selectors';
import type { DataStore } from './store';
import type {
  ClusterCanonicalView,
  LocationRecord,
  PersonasAtrapadas,
  TimelineEntry,
  ZoneUpdate,
} from './types';

/**
 * Derives the canonical cluster view from member LocationRecords and
 * cluster ZoneUpdates. Pure: no I/O, no side effects, no mutations.
 *
 * Aggregation rules:
 * - status: the member with the lowest STATUS_RANK (most severe) wins.
 * - personas_atrapadas: 'si' > 'no_se' > 'no' (life-safety wins).
 * - fotos: de-duplicated union of all member fotos, first-seen order.
 * - updatedAt: the latest member updatedAt.
 * - canonicalLocationId: id of the most-severe member (re-elected from
 *   members; never reads the stored canonical, which may be null).
 * - memberCount: members.length.
 * - timeline: ZoneUpdates mapped to TimelineEntry[], sorted ascending.
 *
 * Precondition: members must be non-empty. Callers must guard against
 * empty arrays before invoking (the supabase store already does this).
 */
export function deriveCanonicalView(
  members: LocationRecord[],
  updates: ZoneUpdate[],
): ClusterCanonicalView {
  if (members.length === 0) {
    throw new Error('deriveCanonicalView requires at least one member');
  }

  // Re-elect the canonical from members by lowest STATUS_RANK.
  let canonical = members[0];
  for (const m of members) {
    if (STATUS_RANK[m.status] < STATUS_RANK[canonical.status]) {
      canonical = m;
    }
  }

  // Personas atrapadas: 'si' wins, then 'no_se', then 'no'.
  let personas_atrapadas: PersonasAtrapadas = 'no';
  for (const m of members) {
    const val = m.personas_atrapadas ?? 'no_se';
    if (val === 'si') {
      personas_atrapadas = 'si';
      break;
    }
    if (val === 'no_se') {
      personas_atrapadas = 'no_se';
    }
  }

  // Photos: de-duplicated union, first-seen order.
  const seen = new Set<string>();
  const fotos: string[] = [];
  for (const m of members) {
    for (const url of m.fotos ?? []) {
      if (!seen.has(url)) {
        seen.add(url);
        fotos.push(url);
      }
    }
  }

  // Latest updatedAt across all members.
  const updatedAt = members.reduce(
    (latest, m) => (m.updatedAt > latest ? m.updatedAt : latest),
    members[0].updatedAt,
  );

  // Timeline: sorted chronologically ascending.
  const timeline: TimelineEntry[] = [...updates]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((u) => ({
      id: u.id,
      kind: u.kind,
      note: u.note,
      createdAt: u.createdAt,
    }));

  return {
    canonicalLocationId: canonical.id,
    status: canonical.status,
    personas_atrapadas,
    fotos,
    updatedAt,
    memberCount: members.length,
    timeline,
  };
}

/**
 * Thin wrapper that delegates cluster loading to the store. Keeps the zona
 * page testable via a fake store rather than requiring real Supabase access.
 */
export async function loadZoneCluster(
  locationId: string,
  store: DataStore,
): Promise<ClusterCanonicalView | null> {
  return store.getClusterForLocation(locationId);
}
