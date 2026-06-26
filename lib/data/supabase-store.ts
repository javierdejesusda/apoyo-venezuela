/**
 * Supabase-backed data store (production). Maps snake_case rows to the
 * camelCase domain model and reuses the shared pure selectors for summaries,
 * filtering and sorting. Schema lives in supabase/schema.sql.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { DuplicateFundraiserError } from './fundraiser-url';
import { applyFilters, sortLocations, withSummary } from './selectors';
import { deriveCanonicalView } from './zone-cluster';
import { PERSONAS_ATRAPADAS_DEFAULT } from './types';
import type {
  ClusterCanonicalView,
  CreateFundraiserInput,
  CreateLocationInput,
  CreateNeedInput,
  EmergencyStatus,
  FuenteReporte,
  Fundraiser,
  LocationFilters,
  LocationRecord,
  NeedCategory,
  NeedRecord,
  NeedStatus,
  PersonasAtrapadas,
  Urgency,
  ZoneUpdate,
  ZoneUpdateKind,
} from './types';
import type { DataStore } from './store';

/** Postgres unique-violation SQLSTATE, raised by the UNIQUE(url) constraint. */
const UNIQUE_VIOLATION = '23505';

interface LocationRow {
  id: string;
  nombre: string;
  estado: string;
  ciudad: string;
  zona: string | null;
  lat: number | null;
  lng: number | null;
  // Optional so older row fixtures (pre-migration) still satisfy this type.
  accuracy_m?: number | null;
  // Optional so rows from databases without the severity migration still work.
  personas_atrapadas?: string | null;
  // Optional so rows from databases without the report-metadata migration still work.
  fuente_reporte?: string | null;
  tipo_construccion?: string | null;
  status: string;
  descripcion: string | null;
  contacto_nombre: string | null;
  contacto_telefono: string | null;
  fotos: string[] | null;
  created_at: string;
  updated_at: string;
}

interface NeedRow {
  id: string;
  location_id: string;
  categoria: string;
  descripcion: string;
  cantidad: string | null;
  urgencia: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface FundraiserRow {
  id: string;
  titulo: string;
  descripcion: string;
  url: string;
  organizador: string | null;
  created_at: string;
  updated_at: string;
}

/** Snake-case row returned by the get_cluster_for_location RPC. */
interface RpcUpdateRow {
  id: string;
  cluster_id: string;
  kind: string;
  note: string | null;
  created_at: string;
}

function toFundraiser(r: FundraiserRow): Fundraiser {
  return {
    id: r.id,
    titulo: r.titulo,
    descripcion: r.descripcion,
    url: r.url,
    organizador: r.organizador ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function toLocation(r: LocationRow): LocationRecord {
  return {
    id: r.id,
    nombre: r.nombre,
    estado: r.estado,
    ciudad: r.ciudad,
    zona: r.zona ?? undefined,
    lat: r.lat,
    lng: r.lng,
    accuracyM: r.accuracy_m ?? null,
    status: r.status as EmergencyStatus,
    personas_atrapadas: (r.personas_atrapadas as PersonasAtrapadas) ?? PERSONAS_ATRAPADAS_DEFAULT,
    fuente_reporte: (r.fuente_reporte as FuenteReporte) ?? null,
    tipo_construccion: r.tipo_construccion ?? null,
    descripcion: r.descripcion ?? undefined,
    contactoNombre: r.contacto_nombre ?? undefined,
    contactoTelefono: r.contacto_telefono ?? undefined,
    fotos: r.fotos ?? [],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function toNeed(r: NeedRow): NeedRecord {
  return {
    id: r.id,
    locationId: r.location_id,
    categoria: r.categoria as NeedCategory,
    descripcion: r.descripcion,
    cantidad: r.cantidad ?? undefined,
    urgencia: r.urgencia as Urgency,
    status: r.status as NeedStatus,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/**
 * Returns the column name when an insert failed because that column is absent
 * from the table. Returns null for any other error type.
 *
 * Handles both Postgres 42703 ("column X of relation Y does not exist") and
 * PostgREST schema-cache misses ("Could not find the column X"). Used to
 * detect databases that have not yet had a particular migration applied.
 */
function missingColumnName(error: unknown): string | null {
  const message = (error as { message?: string } | null)?.message ?? '';
  // Postgres: column "name" of relation "table" does not exist
  let m = message.match(/column "(\w+)" of relation .+ does not exist/i);
  if (m) return m[1];
  // PostgREST schema cache miss
  m = message.match(/could not find the column "(\w+)"/i);
  return m?.[1] ?? null;
}

export function createSupabaseStore(url: string, key: string): DataStore {
  const client: SupabaseClient = createClient(url, key, {
    auth: { persistSession: false },
  });

  type LocationWithNeedsRow = LocationRow & { needs?: NeedRow[] | null };

  // Compose a location row plus its embedded needs into the domain model,
  // ordering needs newest-first to match the previous standalone query.
  function composeLocation(row: LocationWithNeedsRow) {
    const needs = (row.needs ?? [])
      .map((need) => toNeed({ ...need, location_id: row.id }))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
    return withSummary(toLocation(row), needs);
  }

  return {
    isDemo: false,

    async listLocations(filters?: LocationFilters) {
      // Embed each location's needs in a single round-trip rather than scanning
      // the entire needs table separately, which does not scale under load.
      const { data, error } = await client
        .from('locations')
        .select('*, needs(*)')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      const composed = ((data as LocationWithNeedsRow[] | null) ?? []).map(composeLocation);
      return sortLocations(applyFilters(composed, filters));
    },

    async listLocationsPage(filters: LocationFilters, offset: number, limit: number) {
      // Embed needs in a single round-trip, then apply shared selectors in
      // memory. Full server-side predicate push for every filter field is
      // deferred to a future optimization; the in-memory approach keeps
      // the needs composition logic in one place.
      const { data, error } = await client
        .from('locations')
        .select('*, needs(*)')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      const filtered = sortLocations(
        applyFilters(((data as LocationWithNeedsRow[] | null) ?? []).map(composeLocation), filters),
      );
      return { items: filtered.slice(offset, offset + limit), total: filtered.length };
    },

    async getLocation(id: string) {
      const { data, error } = await client
        .from('locations')
        .select('*, needs(*)')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return composeLocation(data as LocationWithNeedsRow);
    },

    async createLocation(input: CreateLocationInput) {
      // Build the full insert payload with all optional columns. The retry loop
      // below strips any column the database does not yet have (un-migrated DB),
      // so reports are never silently lost due to a missing migration.
      let payload: Record<string, unknown> = {
        nombre: input.nombre,
        estado: input.estado,
        ciudad: input.ciudad,
        zona: input.zona ?? null,
        lat: input.lat ?? null,
        lng: input.lng ?? null,
        status: input.status,
        descripcion: input.descripcion ?? null,
        contacto_nombre: input.contactoNombre ?? null,
        contacto_telefono: input.contactoTelefono ?? null,
        fotos: input.fotos ?? [],
        accuracy_m: input.accuracyM ?? null,
        personas_atrapadas: input.personas_atrapadas ?? PERSONAS_ATRAPADAS_DEFAULT,
        fuente_reporte: input.fuente_reporte ?? null,
        tipo_construccion: input.tipo_construccion ?? null,
      };

      // Retry: if the insert fails because an optional column is absent from the
      // database, remove that column and try again. Loops until success or a
      // non-missing-column error, cleanly handling any combination of pending
      // migrations without hardcoding column names.
      for (;;) {
        const { data, error } = await client
          .from('locations')
          .insert(payload)
          .select('*')
          .single();

        if (!error) return toLocation(data as LocationRow);

        const col = missingColumnName(error);
        if (col && col in payload) {
          const next = { ...payload };
          delete next[col];
          payload = next;
          continue;
        }

        throw error;
      }
    },

    async updateLocationStatus(id: string, status: EmergencyStatus) {
      // Anon clients can no longer UPDATE arbitrary columns: a SECURITY DEFINER
      // function validates the status and is the only update path RLS allows.
      const { data, error } = await client.rpc('set_location_status', {
        loc_id: id,
        new_status: status,
      });
      if (error) throw error;
      const row = (Array.isArray(data) ? data[0] : data) as LocationRow | null;
      return row ? toLocation(row) : null;
    },

    async createNeed(input: CreateNeedInput) {
      // A trigger bumps the parent location's updated_at, so no second write is
      // needed here (and anon can no longer UPDATE locations directly anyway).
      const { data, error } = await client
        .from('needs')
        .insert({
          location_id: input.locationId,
          categoria: input.categoria,
          descripcion: input.descripcion,
          cantidad: input.cantidad ?? null,
          urgencia: input.urgencia,
          status: 'pendiente',
        })
        .select('*')
        .single();
      if (error) throw error;
      return toNeed(data as NeedRow);
    },

    async updateNeedStatus(id: string, status: NeedStatus) {
      const { data, error } = await client.rpc('set_need_status', {
        need_id: id,
        new_status: status,
      });
      if (error) throw error;
      const row = (Array.isArray(data) ? data[0] : data) as NeedRow | null;
      return row ? toNeed(row) : null;
    },

    async listFundraisers() {
      const { data, error } = await client
        .from('fundraisers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as FundraiserRow[]).map(toFundraiser);
    },

    async createFundraiser(input: CreateFundraiserInput) {
      const { data, error } = await client
        .from('fundraisers')
        .insert({
          titulo: input.titulo,
          descripcion: input.descripcion,
          url: input.url,
          organizador: input.organizador ?? null,
        })
        .select('*')
        .single();
      if (error) {
        if (error.code === UNIQUE_VIOLATION) {
          throw new DuplicateFundraiserError(input.url);
        }
        throw error;
      }
      return toFundraiser(data as FundraiserRow);
    },

    async checkReportQuota(keyHash: string) {
      // FAIL-OPEN: any infrastructure error allows the report through so a
      // legitimate emergency submission is never blocked by a throttle-table
      // outage or a database that has not yet had the migration applied.
      try {
        const { data, error } = await client.rpc('check_report_quota', {
          p_key_hash: keyHash,
        });
        if (error) return true;
        return data !== false;
      } catch {
        return true;
      }
    },

    async getClusterForLocation(locationId: string): Promise<ClusterCanonicalView | null> {
      // FAIL-OPEN: any RPC error (missing migration, permissions, network)
      // returns null so the zona page degrades to single-report display rather
      // than breaking with a 500. The cluster tables are RLS-locked; direct
      // table access from the anon client is intentionally blocked. The
      // SECURITY DEFINER RPC in 20260630010000_cluster_read_rpc.sql is the
      // only sanctioned read path.
      try {
        const { data, error } = await client.rpc('get_cluster_for_location', {
          loc_id: locationId,
        });
        if (error || !data) return null;

        const raw = data as { members: LocationRow[]; updates: RpcUpdateRow[] };
        if (!raw.members || raw.members.length === 0) return null;

        const members: LocationRecord[] = raw.members.map(toLocation);
        const updates: ZoneUpdate[] = (raw.updates ?? []).map((u) => ({
          id: u.id,
          clusterId: u.cluster_id,
          kind: u.kind as ZoneUpdateKind,
          note: u.note,
          createdAt: u.created_at,
        }));

        return deriveCanonicalView(members, updates);
      } catch {
        return null;
      }
    },
  };
}
