import { describe, expect, it } from 'vitest';

import type { DataStore } from '@/lib/data/store';
import type { ClusterCanonicalView, LocationWithNeeds } from '@/lib/data/types';
import { loadZoneCluster } from '@/lib/data/zone-cluster';

function zone(): LocationWithNeeds {
  return {
    id: 'z1',
    nombre: 'Torre A',
    estado: 'Miranda',
    ciudad: 'Caracas',
    lat: 10.49,
    lng: -66.87,
    status: 'dano_parcial',
    fotos: [],
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
    needs: [],
    summary: { total: 0, pendientes: 0, enCamino: 0, cubiertos: 0, urgentes: 0 },
  };
}

const canonicalView: ClusterCanonicalView = {
  canonicalLocationId: 'z1',
  status: 'dano_parcial',
  personas_atrapadas: 'no_se',
  fotos: [],
  updatedAt: '2026-06-01T00:00:00Z',
  memberCount: 1,
  timeline: [],
};

function stubStore(getClusterForLocation: DataStore['getClusterForLocation']): DataStore {
  return {
    isDemo: false,
    listLocations: async () => [],
    listLocationsPage: async () => ({ items: [], total: 0 }),
    getLocation: async () => zone(),
    createLocation: async () => {
      throw new Error('not implemented');
    },
    updateLocationStatus: async () => null,
    createNeed: async () => {
      throw new Error('not implemented');
    },
    updateNeedStatus: async () => null,
    listFundraisers: async () => [],
    createFundraiser: async () => {
      throw new Error('not implemented');
    },
    checkReportQuota: async () => true,
    getClusterForLocation,
  };
}

describe('loadZoneCluster', () => {
  it('returns ClusterCanonicalView when a cluster exists', async () => {
    const store = stubStore(async () => canonicalView);
    const result = await loadZoneCluster('z1', store);
    expect(result).toEqual(canonicalView);
  });

  it('returns null when no cluster for locationId', async () => {
    const store = stubStore(async () => null);
    const result = await loadZoneCluster('z1', store);
    expect(result).toBeNull();
  });

  it('ClusterCanonicalView carries no verificado field', async () => {
    const store = stubStore(async () => canonicalView);
    const result = (await loadZoneCluster('z1', store)) as unknown as Record<string, unknown> | null;
    expect(result).not.toBeNull();
    expect('verificado' in (result ?? {})).toBe(false);
    expect('Verificado' in (result ?? {})).toBe(false);
  });
});
