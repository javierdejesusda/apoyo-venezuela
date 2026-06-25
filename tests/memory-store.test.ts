import { describe, expect, it } from 'vitest';

import { createMemoryStore } from '@/lib/data/memory-store';

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
      status: 'danado',
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
      status: 'danado',
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
});
