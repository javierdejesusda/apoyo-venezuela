import { beforeEach, describe, expect, it, vi } from 'vitest';

const from = vi.fn();
const rpc = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ from, rpc }),
}));

import { createSupabaseStore } from '@/lib/data/supabase-store';

function makeStore() {
  return createSupabaseStore('https://example.supabase.co', 'anon-key');
}

const LOCATION_ROW = {
  id: 'loc_1',
  nombre: 'Sector El Cementerio',
  estado: 'Yaracuy',
  ciudad: 'San Felipe',
  zona: null,
  lat: null,
  lng: null,
  status: 'derrumbe',
  descripcion: null,
  contacto_nombre: null,
  contacto_telefono: null,
  fotos: null,
  created_at: '2026-06-25T00:00:00.000Z',
  updated_at: '2026-06-25T01:00:00.000Z',
};

const NEED_ROW = {
  id: 'need_1',
  location_id: 'loc_1',
  categoria: 'agua',
  descripcion: 'Agua potable',
  cantidad: null,
  urgencia: 'alta',
  status: 'pendiente',
  created_at: '2026-06-25T00:30:00.000Z',
  updated_at: '2026-06-25T00:30:00.000Z',
};

beforeEach(() => {
  from.mockReset();
  rpc.mockReset();
});

describe('supabase store listLocations', () => {
  it('loads locations with their needs embedded in a single query', async () => {
    const order = vi
      .fn()
      .mockResolvedValue({ data: [{ ...LOCATION_ROW, needs: [NEED_ROW] }], error: null });
    const select = vi.fn(() => ({ order }));
    from.mockReturnValue({ select });

    const result = await makeStore().listLocations();

    expect(from).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledWith('locations');
    expect(from).not.toHaveBeenCalledWith('needs');
    expect(select).toHaveBeenCalledWith('*, needs(*)');
    expect(result).toHaveLength(1);
    expect(result[0].needs).toHaveLength(1);
    expect(result[0].needs[0].locationId).toBe('loc_1');
    expect(result[0].summary.urgentes).toBe(1);
  });
});

describe('supabase store getLocation', () => {
  it('loads a single location with its needs embedded', async () => {
    const maybeSingle = vi
      .fn()
      .mockResolvedValue({ data: { ...LOCATION_ROW, needs: [NEED_ROW] }, error: null });
    const eq = vi.fn(() => ({ maybeSingle }));
    const select = vi.fn(() => ({ eq }));
    from.mockReturnValue({ select });

    const result = await makeStore().getLocation('loc_1');

    expect(from).toHaveBeenCalledTimes(1);
    expect(select).toHaveBeenCalledWith('*, needs(*)');
    expect(eq).toHaveBeenCalledWith('id', 'loc_1');
    expect(result?.needs[0].locationId).toBe('loc_1');
  });
});

describe('supabase store createNeed', () => {
  it('inserts the need without a separate locations update', async () => {
    const single = vi.fn().mockResolvedValue({ data: { ...NEED_ROW }, error: null });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    from.mockReturnValue({ insert });

    const result = await makeStore().createNeed({
      locationId: 'loc_1',
      categoria: 'agua',
      descripcion: 'Agua potable',
      urgencia: 'alta',
    });

    expect(from).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledWith('needs');
    expect(result.id).toBe('need_1');
  });
});

describe('supabase store createLocation', () => {
  it('inserts fuente_reporte and tipo_construccion when provided', async () => {
    const single = vi
      .fn()
      .mockResolvedValue({ data: { ...LOCATION_ROW }, error: null });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    from.mockReturnValue({ insert });

    await makeStore().createLocation({
      nombre: 'Zona',
      estado: 'Carabobo',
      ciudad: 'Valencia',
      status: 'dano_parcial',
      fuente_reporte: 'vecino',
      tipo_construccion: 'edificio de concreto',
    });

    const payload = (insert.mock.calls[0] as unknown as [Record<string, unknown>])[0];
    expect(payload.fuente_reporte).toBe('vecino');
    expect(payload.tipo_construccion).toBe('edificio de concreto');
  });

  it('retries without fuente_reporte when that column is missing from the database', async () => {
    const missingFuenteError = { message: 'column "fuente_reporte" of relation "locations" does not exist' };
    const single = vi
      .fn()
      .mockResolvedValueOnce({ data: null, error: missingFuenteError })
      .mockResolvedValue({ data: { ...LOCATION_ROW }, error: null });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    from.mockReturnValue({ insert });

    const result = await makeStore().createLocation({
      nombre: 'Zona',
      estado: 'Carabobo',
      ciudad: 'Valencia',
      status: 'dano_parcial',
      fuente_reporte: 'vecino',
    });

    expect(insert).toHaveBeenCalledTimes(2);
    const retryPayload = (insert.mock.calls[1] as unknown as [Record<string, unknown>])[0];
    expect(retryPayload.fuente_reporte).toBeUndefined();
    expect(result.id).toBe('loc_1');
  });

  it('retries without tipo_construccion when that column is missing from the database', async () => {
    const missingTipoError = { message: 'column "tipo_construccion" of relation "locations" does not exist' };
    const single = vi
      .fn()
      .mockResolvedValueOnce({ data: null, error: missingTipoError })
      .mockResolvedValue({ data: { ...LOCATION_ROW }, error: null });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    from.mockReturnValue({ insert });

    const result = await makeStore().createLocation({
      nombre: 'Zona',
      estado: 'Carabobo',
      ciudad: 'Valencia',
      status: 'dano_parcial',
      tipo_construccion: 'casa',
    });

    expect(insert).toHaveBeenCalledTimes(2);
    const retryPayload = (insert.mock.calls[1] as unknown as [Record<string, unknown>])[0];
    expect(retryPayload.tipo_construccion).toBeUndefined();
    expect(result.id).toBe('loc_1');
  });

  it('eventually saves the report even when multiple optional columns are missing', async () => {
    const missingFuenteError = { message: 'column "fuente_reporte" of relation "locations" does not exist' };
    const missingTipoError = { message: 'column "tipo_construccion" of relation "locations" does not exist' };
    const single = vi
      .fn()
      .mockResolvedValueOnce({ data: null, error: missingFuenteError })
      .mockResolvedValueOnce({ data: null, error: missingTipoError })
      .mockResolvedValue({ data: { ...LOCATION_ROW }, error: null });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    from.mockReturnValue({ insert });

    const result = await makeStore().createLocation({
      nombre: 'Zona',
      estado: 'Carabobo',
      ciudad: 'Valencia',
      status: 'dano_parcial',
      fuente_reporte: 'vecino',
      tipo_construccion: 'casa',
    });

    expect(insert).toHaveBeenCalledTimes(3);
    expect(result.id).toBe('loc_1');
  });

  it('maps fuente_reporte and tipo_construccion from the returned row', async () => {
    const rowWithMeta = {
      ...LOCATION_ROW,
      fuente_reporte: 'organismo',
      tipo_construccion: 'edificio de concreto',
    };
    const single = vi.fn().mockResolvedValue({ data: rowWithMeta, error: null });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    from.mockReturnValue({ insert });

    const result = await makeStore().createLocation({
      nombre: 'Zona',
      estado: 'Carabobo',
      ciudad: 'Valencia',
      status: 'dano_parcial',
      fuente_reporte: 'organismo',
      tipo_construccion: 'edificio de concreto',
    });

    expect(result.fuente_reporte).toBe('organismo');
    expect(result.tipo_construccion).toBe('edificio de concreto');
  });
});

describe('supabase store getClusterForLocation', () => {
  const MEMBER_ROW_DERRUMBE = {
    id: 'loc_a',
    nombre: 'Torre A',
    estado: 'Miranda',
    ciudad: 'Caracas',
    zona: null,
    lat: 10.49,
    lng: -66.87,
    accuracy_m: null,
    status: 'derrumbe',
    personas_atrapadas: 'si',
    fotos: ['url1'],
    fuente_reporte: null,
    tipo_construccion: null,
    descripcion: null,
    contacto_nombre: null,
    contacto_telefono: null,
    created_at: '2026-06-01T00:00:00Z',
    updated_at: '2026-06-02T00:00:00Z',
  };

  const MEMBER_ROW_ESTABLE = {
    id: 'loc_b',
    nombre: 'Torre B',
    estado: 'Miranda',
    ciudad: 'Caracas',
    zona: null,
    lat: 10.49,
    lng: -66.87,
    accuracy_m: null,
    status: 'estable',
    personas_atrapadas: 'no',
    fotos: ['url2'],
    fuente_reporte: null,
    tipo_construccion: null,
    descripcion: null,
    contacto_nombre: null,
    contacto_telefono: null,
    created_at: '2026-06-01T01:00:00Z',
    updated_at: '2026-06-01T01:00:00Z',
  };

  const UPDATE_ROW = {
    id: 'upd_1',
    cluster_id: 'cl_1',
    kind: 'report_added',
    note: null,
    created_at: '2026-06-01T00:00:00Z',
  };

  it('returns null and does not throw when RPC returns an error (fail-open)', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'permission denied' } });

    const result = await makeStore().getClusterForLocation('loc_a');

    expect(rpc).toHaveBeenCalledWith('get_cluster_for_location', { loc_id: 'loc_a' });
    expect(result).toBeNull();
  });

  it('returns null when RPC returns empty members array', async () => {
    rpc.mockResolvedValue({ data: { members: [], updates: [] }, error: null });

    const result = await makeStore().getClusterForLocation('loc_a');

    expect(result).toBeNull();
  });

  it('maps two snake_case member rows into a correct ClusterCanonicalView', async () => {
    rpc.mockResolvedValue({
      data: {
        members: [MEMBER_ROW_DERRUMBE, MEMBER_ROW_ESTABLE],
        updates: [UPDATE_ROW],
      },
      error: null,
    });

    const result = await makeStore().getClusterForLocation('loc_a');

    expect(result).not.toBeNull();
    // Most-severe member wins (derrumbe rank 0 < estable rank 4).
    expect(result?.status).toBe('derrumbe');
    expect(result?.memberCount).toBe(2);
    // 'si' wins over 'no'.
    expect(result?.personas_atrapadas).toBe('si');
    // Photo union: url1 from derrumbe member, url2 from estable member.
    expect(result?.fotos).toEqual(['url1', 'url2']);
    // Timeline entry mapped from update row.
    expect(result?.timeline).toHaveLength(1);
    expect(result?.timeline[0].kind).toBe('report_added');
    expect(result?.timeline[0].createdAt).toBe('2026-06-01T00:00:00Z');
    // No verificado field.
    expect('verificado' in (result as object)).toBe(false);
  });
});

describe('supabase store status updates go through validated RPCs', () => {
  it('updateLocationStatus calls set_location_status and maps the row', async () => {
    rpc.mockResolvedValue({ data: { ...LOCATION_ROW, status: 'estable' }, error: null });

    const result = await makeStore().updateLocationStatus('loc_1', 'estable');

    expect(rpc).toHaveBeenCalledWith('set_location_status', {
      loc_id: 'loc_1',
      new_status: 'estable',
    });
    expect(result?.status).toBe('estable');
  });

  it('updateLocationStatus returns null when the RPC matches no row', async () => {
    rpc.mockResolvedValue({ data: null, error: null });

    const result = await makeStore().updateLocationStatus('missing', 'estable');

    expect(result).toBeNull();
  });

  it('updateNeedStatus calls set_need_status and maps the row', async () => {
    rpc.mockResolvedValue({ data: { ...NEED_ROW, status: 'cubierto' }, error: null });

    const result = await makeStore().updateNeedStatus('need_1', 'cubierto');

    expect(rpc).toHaveBeenCalledWith('set_need_status', {
      need_id: 'need_1',
      new_status: 'cubierto',
    });
    expect(result?.status).toBe('cubierto');
  });
});
