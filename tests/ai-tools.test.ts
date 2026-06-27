import { describe, expect, it, vi } from 'vitest';

import { buscarZonasQuery, toModelZona } from '@/lib/ai/tools';
import type { DataStore } from '@/lib/data/store';
import type { LocationFilters, LocationWithNeeds } from '@/lib/data/types';

function loc(over: Partial<LocationWithNeeds> = {}): LocationWithNeeds {
  return {
    id: 'z1',
    nombre: 'Zona Test',
    estado: 'Carabobo',
    ciudad: 'Valencia',
    zona: undefined,
    lat: 10.123,
    lng: -67.456,
    status: 'dano_parcial',
    contactoNombre: 'Juan Perez',
    contactoTelefono: '0412-1234567',
    fotos: ['https://example.com/foto.jpg'],
    createdAt: '2026-06-25T00:00:00Z',
    updatedAt: '2026-06-25T00:00:00Z',
    needs: [],
    summary: { total: 0, pendientes: 0, enCamino: 0, cubiertos: 0, urgentes: 0 },
    ...over,
  };
}

function stubStore(
  listLocations: (filters?: LocationFilters) => Promise<LocationWithNeeds[]>,
): DataStore {
  return {
    isDemo: false,
    listLocations,
    listLocationsPage: async (_, offset, limit) => {
      const all = await listLocations();
      return { items: all.slice(offset, offset + limit), total: all.length };
    },
    getLocation: async () => null,
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
    getClusterForLocation: async () => null,
  };
}

describe('toModelZona', () => {
  it('omits PII and infrastructure fields', () => {
    const result = toModelZona(loc());

    expect(Object.keys(result)).not.toContain('contactoNombre');
    expect(Object.keys(result)).not.toContain('contactoTelefono');
    expect(Object.keys(result)).not.toContain('lat');
    expect(Object.keys(result)).not.toContain('lng');
    expect(Object.keys(result)).not.toContain('fotos');
    expect(Object.keys(result)).not.toContain('id');
    expect(Object.keys(result)).not.toContain('createdAt');
    expect(Object.keys(result)).not.toContain('updatedAt');
  });

  it('preserves the expected ModelZona fields', () => {
    const result = toModelZona(loc({ nombre: 'Test', estado: 'Lara', ciudad: 'Barquisimeto' }));

    expect(result.nombre).toBe('Test');
    expect(result.estado).toBe('Lara');
    expect(result.ciudad).toBe('Barquisimeto');
    expect(result.status).toBe('dano_parcial');
    expect(Array.isArray(result.needs)).toBe(true);
  });

  it('maps needs to ModelNeed shape', () => {
    const location = loc({
      needs: [
        {
          id: 'n1',
          locationId: 'z1',
          categoria: 'agua',
          descripcion: 'Se necesita agua',
          urgencia: 'alta',
          status: 'pendiente',
          createdAt: '2026-06-25T00:00:00Z',
          updatedAt: '2026-06-25T00:00:00Z',
        },
      ],
    });

    const result = toModelZona(location);

    expect(result.needs).toHaveLength(1);
    expect(result.needs[0].categoria).toBe('agua');
    expect(result.needs[0].urgencia).toBe('alta');
    expect(result.needs[0].status).toBe('pendiente');
    expect(result.needs[0].descripcion).toBe('Se necesita agua');
  });
});

describe('buscarZonasQuery', () => {
  it('caps results to 8 when the store returns more', async () => {
    const store = stubStore(async () => Array.from({ length: 20 }, (_, i) => loc({ id: `z${i}` })));

    const results = await buscarZonasQuery(store, {});

    expect(results).toHaveLength(8);
  });

  it('forwards categoria and estado filters to listLocations', async () => {
    const spy = vi.fn<(f?: LocationFilters) => Promise<LocationWithNeeds[]>>(async () => [loc()]);
    const store = stubStore(spy);

    await buscarZonasQuery(store, { categoria: 'agua', estado: 'Zulia' });

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ categoria: 'agua', estado: 'Zulia' }),
    );
  });

  it('forwards texto filter to listLocations', async () => {
    const spy = vi.fn<(f?: LocationFilters) => Promise<LocationWithNeeds[]>>(async () => []);
    const store = stubStore(spy);

    await buscarZonasQuery(store, { texto: 'medicinas urgente' });

    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ texto: 'medicinas urgente' }));
  });

  it('does not forward unrecognized params', async () => {
    const spy = vi.fn<(f?: LocationFilters) => Promise<LocationWithNeeds[]>>(async () => []);
    const store = stubStore(spy);

    await buscarZonasQuery(store, {});

    const calledWith = (spy.mock.calls[0][0] ?? {}) as Record<string, unknown>;
    expect(calledWith).not.toHaveProperty('needStatus');
  });
});
