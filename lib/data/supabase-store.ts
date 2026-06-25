/**
 * Supabase-backed data store (production). Maps snake_case rows to the
 * camelCase domain model and reuses the shared pure selectors for summaries,
 * filtering and sorting. Schema lives in supabase/schema.sql.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { DuplicateFundraiserError } from './fundraiser-url';
import { applyFilters, sortLocations, withSummary } from './selectors';
import type {
  CreateFundraiserInput,
  CreateLocationInput,
  CreateNeedInput,
  EmergencyStatus,
  Fundraiser,
  LocationFilters,
  LocationRecord,
  NeedCategory,
  NeedRecord,
  NeedStatus,
  Urgency,
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
 * True when an insert failed only because the `accuracy_m` column is absent
 * (the accuracy migration has not been applied to this database yet).
 */
function isMissingAccuracyColumn(error: unknown): boolean {
  const message = (error as { message?: string } | null)?.message ?? '';
  return /accuracy_m/i.test(message);
}

export function createSupabaseStore(url: string, key: string): DataStore {
  const client: SupabaseClient = createClient(url, key, {
    auth: { persistSession: false },
  });

  async function fetchNeeds(locationIds?: string[]): Promise<NeedRecord[]> {
    let query = client.from('needs').select('*').order('created_at', { ascending: false });
    if (locationIds) query = query.in('location_id', locationIds);
    const { data, error } = await query;
    if (error) throw error;
    return (data as NeedRow[]).map(toNeed);
  }

  return {
    isDemo: false,

    async listLocations(filters?: LocationFilters) {
      const { data, error } = await client
        .from('locations')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      const locations = (data as LocationRow[]).map(toLocation);
      const needs = await fetchNeeds();
      const composed = locations.map((l) => withSummary(l, needs));
      return sortLocations(applyFilters(composed, filters));
    },

    async getLocation(id: string) {
      const { data, error } = await client
        .from('locations')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const location = toLocation(data as LocationRow);
      const needs = await fetchNeeds([id]);
      return withSummary(location, needs);
    },

    async createLocation(input: CreateLocationInput) {
      const row = {
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
      };

      let { data, error } = await client
        .from('locations')
        .insert({ ...row, accuracy_m: input.accuracyM ?? null })
        .select('*')
        .single();

      // Databases that have not run the accuracy_m migration yet reject that
      // column; retry without it so reports still save instead of failing.
      if (error && isMissingAccuracyColumn(error)) {
        ({ data, error } = await client
          .from('locations')
          .insert(row)
          .select('*')
          .single());
      }

      if (error) throw error;
      return toLocation(data as LocationRow);
    },

    async updateLocationStatus(id: string, status: EmergencyStatus) {
      const { data, error } = await client
        .from('locations')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*')
        .maybeSingle();
      if (error) throw error;
      return data ? toLocation(data as LocationRow) : null;
    },

    async createNeed(input: CreateNeedInput) {
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
      await client
        .from('locations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', input.locationId);
      return toNeed(data as NeedRow);
    },

    async updateNeedStatus(id: string, status: NeedStatus) {
      const { data, error } = await client
        .from('needs')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*')
        .maybeSingle();
      if (error) throw error;
      return data ? toNeed(data as NeedRow) : null;
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
  };
}
