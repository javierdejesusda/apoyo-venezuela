import { describe, expect, it } from 'vitest';

import type { DataStore } from '@/lib/data/store';
import type { LocationWithNeeds } from '@/lib/data/types';
import { loadZone } from '@/lib/data/zone';

function zone(): LocationWithNeeds {
  return {
    id: 'z1',
    nombre: 'Zona',
    estado: 'Carabobo',
    ciudad: 'Valencia',
    lat: null,
    lng: null,
    status: 'danado',
    fotos: [],
    createdAt: '2026-06-25T00:00:00Z',
    updatedAt: '2026-06-25T00:00:00Z',
    needs: [],
    summary: { total: 0, pendientes: 0, enCamino: 0, cubiertos: 0, urgentes: 0 },
  };
}

function stubStore(getLocation: DataStore['getLocation']): DataStore {
  return {
    isDemo: false,
    listLocations: async () => [],
    getLocation,
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
  };
}

describe('loadZone', () => {
  it('returns the location on success', async () => {
    const loc = zone();
    const data = await loadZone(stubStore(async () => loc), 'z1');
    expect(data).toEqual({ location: loc, loadFailed: false });
  });

  it('returns a null location (genuinely not found) without failing', async () => {
    const data = await loadZone(stubStore(async () => null), 'missing');
    expect(data).toEqual({ location: null, loadFailed: false });
  });

  it('degrades to loadFailed when getLocation rejects', async () => {
    const data = await loadZone(
      stubStore(async () => {
        throw new Error('blocked');
      }),
      'z1',
    );
    expect(data).toEqual({ location: null, loadFailed: true });
  });
});
