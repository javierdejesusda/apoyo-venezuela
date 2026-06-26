import { describe, expect, it } from 'vitest';

import { createMemoryStore } from '@/lib/data/memory-store';
import { SEED } from '@/lib/data/seed';
import { EMERGENCY_STATUSES, PAGE_SIZE } from '@/lib/data/types';

describe('memory store', () => {
  it('starts empty when given no seed', async () => {
    const store = createMemoryStore({ locations: [], needs: [] });
    expect(await store.listLocations()).toEqual([]);
    expect(store.isDemo).toBe(true);
  });

  it('creates a location and lists it with an empty summary', async () => {
    const store = createMemoryStore({ locations: [], needs: [] });
    const created = await store.createLocation({
      nombre: 'Edificio San Bernardino',
      estado: 'Distrito Capital',
      ciudad: 'Caracas',
      status: 'derrumbe',
    });
    expect(created.id).toBeTruthy();
    const list = await store.listLocations();
    expect(list).toHaveLength(1);
    expect(list[0].summary.total).toBe(0);
  });

  it('adds needs and reflects them in the location summary', async () => {
    const store = createMemoryStore({ locations: [], needs: [] });
    const loc = await store.createLocation({
      nombre: 'Zona',
      estado: 'Carabobo',
      ciudad: 'Valencia',
      status: 'dano_parcial',
    });
    await store.createNeed({
      locationId: loc.id,
      categoria: 'agua',
      descripcion: 'Agua potable para 40 personas',
      urgencia: 'alta',
    });
    const detail = await store.getLocation(loc.id);
    expect(detail?.needs).toHaveLength(1);
    expect(detail?.summary.urgentes).toBe(1);
  });

  it('updates a need status', async () => {
    const store = createMemoryStore({ locations: [], needs: [] });
    const loc = await store.createLocation({
      nombre: 'Zona',
      estado: 'Aragua',
      ciudad: 'Maracay',
      status: 'dano_parcial',
    });
    const n = await store.createNeed({
      locationId: loc.id,
      categoria: 'medicinas',
      descripcion: 'Insulina',
      urgencia: 'alta',
    });
    const updated = await store.updateNeedStatus(n.id, 'cubierto');
    expect(updated?.status).toBe('cubierto');
    const detail = await store.getLocation(loc.id);
    expect(detail?.summary.cubiertos).toBe(1);
    expect(detail?.summary.urgentes).toBe(0);
  });

  it('updates a location status', async () => {
    const store = createMemoryStore({ locations: [], needs: [] });
    const loc = await store.createLocation({
      nombre: 'Zona',
      estado: 'Yaracuy',
      ciudad: 'San Felipe',
      status: 'desconocido',
    });
    const updated = await store.updateLocationStatus(loc.id, 'estable');
    expect(updated?.status).toBe('estable');
  });

  it('returns null for an unknown location', async () => {
    const store = createMemoryStore({ locations: [], needs: [] });
    expect(await store.getLocation('nope')).toBeNull();
  });

  it('round-trips accuracyM on a created location', async () => {
    const store = createMemoryStore({ locations: [], needs: [] });
    const created = await store.createLocation({
      nombre: 'Zona con radio',
      estado: 'Miranda',
      ciudad: 'Los Teques',
      status: 'dano_parcial',
      lat: 10.3,
      lng: -67.0,
      accuracyM: 200,
    });
    expect(created.accuracyM).toBe(200);
    const detail = await store.getLocation(created.id);
    expect(detail?.accuracyM).toBe(200);
  });

  it('defaults accuracyM to null when not provided', async () => {
    const store = createMemoryStore({ locations: [], needs: [] });
    const created = await store.createLocation({
      nombre: 'Zona sin radio',
      estado: 'Lara',
      ciudad: 'Barquisimeto',
      status: 'estable',
    });
    expect(created.accuracyM).toBeNull();
  });

  it('round-trips personas_atrapadas when provided', async () => {
    const store = createMemoryStore({ locations: [], needs: [] });
    const created = await store.createLocation({
      nombre: 'Zona con atrapados',
      estado: 'Yaracuy',
      ciudad: 'San Felipe',
      status: 'derrumbe',
      personas_atrapadas: 'si',
    });
    expect(created.personas_atrapadas).toBe('si');
    const detail = await store.getLocation(created.id);
    expect(detail?.personas_atrapadas).toBe('si');
  });

  it('defaults personas_atrapadas to no_se when not provided', async () => {
    const store = createMemoryStore({ locations: [], needs: [] });
    const created = await store.createLocation({
      nombre: 'Zona sin dato',
      estado: 'Carabobo',
      ciudad: 'Valencia',
      status: 'dano_grave',
    });
    expect(created.personas_atrapadas).toBe('no_se');
  });

  it('seed fixtures use only valid 5-value statuses (no danado)', () => {
    for (const loc of SEED.locations) {
      expect(EMERGENCY_STATUSES).toContain(loc.status);
      expect(loc.status).not.toBe('danado');
    }
  });
});

describe('memory store listLocationsPage', () => {
  async function seedStore(n: number) {
    const store = createMemoryStore({ locations: [], needs: [] });
    for (let i = 0; i < n; i++) {
      await store.createLocation({
        nombre: `Zona ${i + 1}`,
        estado: i % 2 === 0 ? 'Carabobo' : 'Aragua',
        ciudad: 'Ciudad',
        status: i % 3 === 0 ? 'derrumbe' : 'dano_parcial',
      });
    }
    return store;
  }

  it('returns correct slice and total for page 0', async () => {
    const store = await seedStore(25);
    const { items, total } = await store.listLocationsPage({}, 0, 20);

    expect(total).toBe(25);
    expect(items).toHaveLength(20);
  });

  it('returns the last partial slice on page 1', async () => {
    const store = await seedStore(25);
    const { items, total } = await store.listLocationsPage({}, 20, 20);

    expect(total).toBe(25);
    expect(items).toHaveLength(5);
  });

  it('returns empty items when offset >= total', async () => {
    const store = await seedStore(5);
    const { items, total } = await store.listLocationsPage({}, 10, 20);

    expect(total).toBe(5);
    expect(items).toHaveLength(0);
  });

  it('applies filters BEFORE computing total and slicing', async () => {
    const store = await seedStore(50);
    // Half the locations have estado=Carabobo (indices 0,2,4,...) = 25 total
    const { items, total } = await store.listLocationsPage({ estado: 'Carabobo' }, 0, 20);

    expect(total).toBe(25);
    expect(items).toHaveLength(20);
    expect(items.every((l) => l.estado === 'Carabobo')).toBe(true);
  });

  it('total reflects filtered count not full count', async () => {
    const store = await seedStore(50);
    // derrumbe at indices 0,3,6,...,48 -> 17 items (0-based: 0,3,6,...,48 = floor(50/3)+1)
    const { total } = await store.listLocationsPage({ status: 'derrumbe' }, 0, 20);

    // Count manually: indices where i%3===0 out of 0..49 = 0,3,6,...,48 = 17 items
    expect(total).toBeGreaterThan(0);
    expect(total).toBeLessThan(50);
  });

  it('PAGE_SIZE constant is 20', () => {
    expect(PAGE_SIZE).toBe(20);
  });

  it('maintains sort order (most critical first) within a page', async () => {
    const store = createMemoryStore({ locations: [], needs: [] });
    await store.createLocation({
      nombre: 'Estable',
      estado: 'Carabobo',
      ciudad: 'Valencia',
      status: 'estable',
    });
    await store.createLocation({
      nombre: 'Derrumbe',
      estado: 'Carabobo',
      ciudad: 'Valencia',
      status: 'derrumbe',
    });

    const { items } = await store.listLocationsPage({}, 0, 20);

    expect(items[0].status).toBe('derrumbe');
    expect(items[1].status).toBe('estable');
  });
});
