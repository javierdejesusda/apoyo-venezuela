/**
 * In-memory data store used as the "demo mode" backend when Supabase is not
 * configured. It is also the unit-test target (via the `createMemoryStore`
 * factory, which accepts controlled seed data).
 *
 * On serverless this persists only within a warm instance, so demo writes are
 * not durable or shared - the UI surfaces this with a banner. Production uses
 * the Supabase store instead.
 */
import { createId } from '@/lib/utils';

import { DuplicateFundraiserError } from './fundraiser-url';
import { applyFilters, sortLocations, withSummary } from './selectors';
import { SEED } from './seed';
import {
  PERSONAS_ATRAPADAS_DEFAULT,
  REPORT_QUOTA_LIMIT,
  REPORT_QUOTA_WINDOW_MS,
} from './types';
import type {
  CreateFundraiserInput,
  CreateLocationInput,
  CreateNeedInput,
  EmergencyStatus,
  Fundraiser,
  LocationFilters,
  LocationRecord,
  LocationWithNeeds,
  NeedRecord,
  NeedStatus,
} from './types';
import type { DataStore } from './store';

export interface MemorySeed {
  locations: LocationRecord[];
  needs: NeedRecord[];
  fundraisers?: Fundraiser[];
}

export function createMemoryStore(initial?: MemorySeed): DataStore {
  const locations: LocationRecord[] = initial
    ? [...initial.locations]
    : [...SEED.locations];
  const needs: NeedRecord[] = initial ? [...initial.needs] : [...SEED.needs];
  const fundraisers: Fundraiser[] = initial
    ? [...(initial.fundraisers ?? [])]
    : [...SEED.fundraisers];
  // Tracks report submission timestamps (ms) per hashed key for rate limiting.
  const quotaHits = new Map<string, number[]>();

  const compose = (): LocationWithNeeds[] =>
    locations.map((l) => withSummary(l, needs));

  const now = () => new Date().toISOString();

  return {
    isDemo: true,

    async listLocations(filters?: LocationFilters) {
      return sortLocations(applyFilters(compose(), filters));
    },

    async listLocationsPage(filters: LocationFilters, offset: number, limit: number) {
      const filtered = sortLocations(applyFilters(compose(), filters));
      return { items: filtered.slice(offset, offset + limit), total: filtered.length };
    },

    async getLocation(id: string) {
      const loc = locations.find((l) => l.id === id);
      return loc ? withSummary(loc, needs) : null;
    },

    async createLocation(input: CreateLocationInput) {
      const ts = now();
      const record: LocationRecord = {
        id: createId('zona'),
        nombre: input.nombre,
        estado: input.estado,
        ciudad: input.ciudad,
        zona: input.zona,
        lat: input.lat ?? null,
        lng: input.lng ?? null,
        accuracyM: input.accuracyM ?? null,
        status: input.status,
        personas_atrapadas: input.personas_atrapadas ?? PERSONAS_ATRAPADAS_DEFAULT,
        fuente_reporte: input.fuente_reporte ?? null,
        tipo_construccion: input.tipo_construccion ?? null,
        descripcion: input.descripcion,
        contactoNombre: input.contactoNombre,
        contactoTelefono: input.contactoTelefono,
        fotos: input.fotos ?? [],
        createdAt: ts,
        updatedAt: ts,
      };
      locations.unshift(record);
      return record;
    },

    async updateLocationStatus(id: string, status: EmergencyStatus) {
      const loc = locations.find((l) => l.id === id);
      if (!loc) return null;
      loc.status = status;
      loc.updatedAt = now();
      return loc;
    },

    async createNeed(input: CreateNeedInput) {
      const ts = now();
      const record: NeedRecord = {
        id: createId('need'),
        locationId: input.locationId,
        categoria: input.categoria,
        descripcion: input.descripcion,
        cantidad: input.cantidad,
        urgencia: input.urgencia,
        status: 'pendiente',
        createdAt: ts,
        updatedAt: ts,
      };
      needs.unshift(record);
      const loc = locations.find((l) => l.id === input.locationId);
      if (loc) loc.updatedAt = ts;
      return record;
    },

    async updateNeedStatus(id: string, status: NeedStatus) {
      const need = needs.find((n) => n.id === id);
      if (!need) return null;
      need.status = status;
      need.updatedAt = now();
      return need;
    },

    async listFundraisers() {
      return [...fundraisers].sort((a, b) =>
        a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0,
      );
    },

    async createFundraiser(input: CreateFundraiserInput) {
      if (fundraisers.some((f) => f.url === input.url)) {
        throw new DuplicateFundraiserError(input.url);
      }
      const ts = now();
      const record: Fundraiser = {
        id: createId('recaudacion'),
        titulo: input.titulo,
        descripcion: input.descripcion,
        url: input.url,
        organizador: input.organizador,
        createdAt: ts,
        updatedAt: ts,
      };
      fundraisers.unshift(record);
      return record;
    },

    async checkReportQuota(keyHash: string) {
      const cutoff = Date.now() - REPORT_QUOTA_WINDOW_MS;
      const hits = (quotaHits.get(keyHash) ?? []).filter((t) => t > cutoff);
      if (hits.length >= REPORT_QUOTA_LIMIT) {
        quotaHits.set(keyHash, hits);
        return false;
      }
      hits.push(Date.now());
      quotaHits.set(keyHash, hits);
      return true;
    },

    // No clustering in demo/memory mode: the zone_clusters tables exist only in
    // the real Supabase database. Returning null causes the zona page to fall
    // back to single-report display, which is the correct demo behaviour.
    async getClusterForLocation() {
      return null;
    },
  };
}

/** Process-wide demo store (shared across requests within a warm instance). */
export const memoryStore = createMemoryStore();
