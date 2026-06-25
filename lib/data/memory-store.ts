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

import { applyFilters, sortLocations, withSummary } from './selectors';
import { SEED } from './seed';
import type {
  CreateLocationInput,
  CreateNeedInput,
  EmergencyStatus,
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
}

export function createMemoryStore(initial?: MemorySeed): DataStore {
  const locations: LocationRecord[] = initial
    ? [...initial.locations]
    : [...SEED.locations];
  const needs: NeedRecord[] = initial ? [...initial.needs] : [...SEED.needs];

  const compose = (): LocationWithNeeds[] =>
    locations.map((l) => withSummary(l, needs));

  const now = () => new Date().toISOString();

  return {
    isDemo: true,

    async listLocations(filters?: LocationFilters) {
      return sortLocations(applyFilters(compose(), filters));
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
  };
}

/** Process-wide demo store (shared across requests within a warm instance). */
export const memoryStore = createMemoryStore();
