import { describe, expect, it } from 'vitest';

import { loadHomeData } from '@/lib/data/home';
import type { DataStore } from '@/lib/data/store';
import type { LocationWithNeeds } from '@/lib/data/types';

function loc(over: Partial<LocationWithNeeds> = {}): LocationWithNeeds {
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
    ...over,
  };
}

function stubStore(listLocations: () => Promise<LocationWithNeeds[]>): DataStore {
  return {
    isDemo: false,
    listLocations,
    getLocation: async () => null,
    createLocation: async () => {
      throw new Error('not implemented');
    },
    updateLocationStatus: async () => null,
    createNeed: async () => {
      throw new Error('not implemented');
    },
    updateNeedStatus: async () => null,
  };
}

describe('loadHomeData', () => {
  it('returns locations, stats and the available state options on success', async () => {
    const store = stubStore(async () => [
      loc({ id: 'a', estado: 'Zulia' }),
      loc({ id: 'b', estado: 'Aragua' }),
      loc({ id: 'c', estado: 'Aragua' }),
    ]);

    const data = await loadHomeData(store);

    expect(data.loadFailed).toBe(false);
    expect(data.locations).toHaveLength(3);
    expect(data.states).toContain('Aragua');
    expect(data.states).toContain('Zulia');
    expect(new Set(data.states).size).toBe(data.states.length);
    expect(data.states).toEqual(
      [...data.states].sort((a, b) => a.localeCompare(b, 'es')),
    );
    expect(data.stats.zonas).toBe(3);
  });

  it('degrades to an empty list and loadFailed when listLocations rejects', async () => {
    const store = stubStore(async () => {
      throw new Error('fetch failed');
    });

    const data = await loadHomeData(store);

    expect(data.loadFailed).toBe(true);
    expect(data.locations).toEqual([]);
    expect(data.states).toEqual([]);
    expect(data.stats.zonas).toBe(0);
  });

  it('degrades on a non-Error rejection', async () => {
    const store = stubStore(async () => {
      throw 'blocked';
    });

    await expect(loadHomeData(store)).resolves.toMatchObject({ loadFailed: true });
  });
});
