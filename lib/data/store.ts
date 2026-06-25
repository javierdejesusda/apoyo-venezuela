/**
 * The data-store contract plus the selector that decides, at runtime, between
 * the shared Supabase backend (when env vars are present) and the in-memory
 * demo store (otherwise). All reads/writes in the app go through `getStore()`.
 */
import { memoryStore } from './memory-store';
import { createSupabaseStore } from './supabase-store';
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

export interface DataStore {
  /** True when running on the in-memory demo backend (data is not shared). */
  isDemo: boolean;
  listLocations(filters?: LocationFilters): Promise<LocationWithNeeds[]>;
  getLocation(id: string): Promise<LocationWithNeeds | null>;
  createLocation(input: CreateLocationInput): Promise<LocationRecord>;
  updateLocationStatus(
    id: string,
    status: EmergencyStatus,
  ): Promise<LocationRecord | null>;
  createNeed(input: CreateNeedInput): Promise<NeedRecord>;
  updateNeedStatus(id: string, status: NeedStatus): Promise<NeedRecord | null>;
  listFundraisers(): Promise<Fundraiser[]>;
  createFundraiser(input: CreateFundraiserInput): Promise<Fundraiser>;
}

let cached: DataStore | null = null;

export function getStore(): DataStore {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  cached = url && key ? createSupabaseStore(url, key) : memoryStore;
  return cached;
}

export function isDemoMode(): boolean {
  return getStore().isDemo;
}
