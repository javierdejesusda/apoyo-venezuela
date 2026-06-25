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
