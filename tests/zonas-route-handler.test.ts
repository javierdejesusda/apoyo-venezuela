import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { LocationWithNeeds } from '@/lib/data/types';

const mockListLocationsPage = vi.fn();

vi.mock('@/lib/data/store', () => ({
  getStore: () => ({
    isDemo: false,
    listLocations: vi.fn(),
    listLocationsPage: mockListLocationsPage,
    getLocation: vi.fn(),
    createLocation: vi.fn(),
    updateLocationStatus: vi.fn(),
    createNeed: vi.fn(),
    updateNeedStatus: vi.fn(),
    listFundraisers: vi.fn(),
    createFundraiser: vi.fn(),
    checkReportQuota: vi.fn(),
  }),
  PAGE_SIZE: 20,
}));

import { GET } from '@/app/api/zonas/route';

function loc(id: string, over: Partial<LocationWithNeeds> = {}): LocationWithNeeds {
  return {
    id,
    nombre: `Zona ${id}`,
    estado: 'Carabobo',
    ciudad: 'Valencia',
    lat: null,
    lng: null,
    status: 'dano_parcial',
    fotos: [],
    createdAt: '2026-06-25T00:00:00Z',
    updatedAt: '2026-06-25T00:00:00Z',
    needs: [],
    summary: { total: 0, pendientes: 0, enCamino: 0, cubiertos: 0, urgentes: 0 },
    ...over,
  };
}

beforeEach(() => {
  mockListLocationsPage.mockReset();
});

describe('GET /api/zonas', () => {
  it('returns up to PAGE_SIZE items with correct shape when no params', async () => {
    const items = [loc('l1'), loc('l2')];
    mockListLocationsPage.mockResolvedValue({ items, total: 2 });

    const req = new Request('http://localhost/api/zonas');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ items, total: 2, nextCursor: null });
  });

  it('strips reporter contact PII (name + phone) from the returned items', async () => {
    const withContact = loc('l1', {
      contactoNombre: 'Ana Reportera',
      contactoTelefono: '+58 412 1234567',
    });
    mockListLocationsPage.mockResolvedValue({ items: [withContact], total: 1 });

    const req = new Request('http://localhost/api/zonas');
    const res = await GET(req);
    const body = await res.json();

    expect(body.items).toHaveLength(1);
    expect(body.items[0]).not.toHaveProperty('contactoTelefono');
    expect(body.items[0]).not.toHaveProperty('contactoNombre');
    // Non-PII fields the map/list need are untouched.
    expect(body.items[0].nombre).toBe('Zona l1');
    expect(body.items[0].status).toBe('dano_parcial');
  });

  it('passes estado filter to the store', async () => {
    mockListLocationsPage.mockResolvedValue({ items: [], total: 0 });

    const req = new Request('http://localhost/api/zonas?estado=Carabobo');
    await GET(req);

    expect(mockListLocationsPage).toHaveBeenCalledWith(
      expect.objectContaining({ estado: 'Carabobo' }),
      0,
      20,
    );
  });

  it('passes status filter to the store', async () => {
    mockListLocationsPage.mockResolvedValue({ items: [], total: 0 });

    const req = new Request('http://localhost/api/zonas?status=dano_grave');
    await GET(req);

    expect(mockListLocationsPage).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'dano_grave' }),
      0,
      20,
    );
  });

  it('passes urgencia filter as string to the store', async () => {
    mockListLocationsPage.mockResolvedValue({ items: [], total: 0 });

    const req = new Request('http://localhost/api/zonas?urgencia=alta');
    await GET(req);

    expect(mockListLocationsPage).toHaveBeenCalledWith(
      expect.objectContaining({ urgencia: 'alta' }),
      0,
      20,
    );
  });

  it('does not forward an invalid urgencia value to the store', async () => {
    mockListLocationsPage.mockResolvedValue({ items: [], total: 0 });

    const req = new Request('http://localhost/api/zonas?urgencia=foo');
    await GET(req);

    expect(mockListLocationsPage).toHaveBeenCalledWith(
      expect.not.objectContaining({ urgencia: expect.anything() }),
      0,
      20,
    );
  });

  it('applies cursor offset for pagination and returns nextCursor', async () => {
    const items = Array.from({ length: 5 }, (_, i) => loc(`l${21 + i}`));
    mockListLocationsPage.mockResolvedValue({ items, total: 30 });

    const req = new Request('http://localhost/api/zonas?cursor=20');
    const res = await GET(req);
    const body = await res.json();

    expect(mockListLocationsPage).toHaveBeenCalledWith({}, 20, 20);
    // cursor(20) + items.length(5) = 25 < total(30) -> nextCursor = 25
    expect(body.nextCursor).toBe(25);
  });

  it('returns nextCursor when more pages exist', async () => {
    const items = Array.from({ length: 20 }, (_, i) => loc(`l${i + 1}`));
    mockListLocationsPage.mockResolvedValue({ items, total: 50 });

    const req = new Request('http://localhost/api/zonas');
    const res = await GET(req);
    const body = await res.json();

    // cursor(0) + 20 = 20 < 50 -> nextCursor = 20
    expect(body.nextCursor).toBe(20);
  });

  it('returns null nextCursor when on the last page', async () => {
    const items = [loc('l4'), loc('l5')];
    mockListLocationsPage.mockResolvedValue({ items, total: 5 });

    const req = new Request('http://localhost/api/zonas?cursor=3');
    const res = await GET(req);
    const body = await res.json();

    // cursor(3) + 2 = 5, which equals total(5) - not less, so null
    expect(body.nextCursor).toBeNull();
  });

  it('filtering is applied before pagination: 5 matches -> total 5, nextCursor null', async () => {
    const items = Array.from({ length: 5 }, (_, i) =>
      loc(`l${i + 1}`, { status: 'derrumbe' }),
    );
    mockListLocationsPage.mockResolvedValue({ items, total: 5 });

    const req = new Request('http://localhost/api/zonas?status=derrumbe');
    const res = await GET(req);
    const body = await res.json();

    expect(body.items).toHaveLength(5);
    expect(body.total).toBe(5);
    expect(body.nextCursor).toBeNull();
  });

  it('parses ciudad param even though filtering lands in a later PR', async () => {
    mockListLocationsPage.mockResolvedValue({ items: [], total: 0 });

    const req = new Request('http://localhost/api/zonas?ciudad=Valencia');
    await GET(req);

    expect(mockListLocationsPage).toHaveBeenCalledWith(
      expect.objectContaining({ ciudad: 'Valencia' }),
      0,
      20,
    );
  });
});

describe('GET /api/zonas with all=true', () => {
  it('returns every matching item without slicing and nextCursor is null', async () => {
    const allItems = Array.from({ length: 25 }, (_, i) => loc(`l${i + 1}`));
    mockListLocationsPage.mockResolvedValue({ items: allItems, total: 25 });

    const req = new Request('http://localhost/api/zonas?all=true');
    const res = await GET(req);
    const body = await res.json();

    expect(body.items).toHaveLength(25);
    expect(body.total).toBe(25);
    expect(body.nextCursor).toBeNull();
  });

  it('passes Infinity as the limit so the store returns everything', async () => {
    mockListLocationsPage.mockResolvedValue({ items: [], total: 0 });

    const req = new Request('http://localhost/api/zonas?all=true');
    await GET(req);

    expect(mockListLocationsPage).toHaveBeenCalledWith({}, 0, Infinity);
  });

  it('still applies filters when all=true', async () => {
    mockListLocationsPage.mockResolvedValue({ items: [], total: 0 });

    const req = new Request('http://localhost/api/zonas?all=true&status=derrumbe');
    await GET(req);

    expect(mockListLocationsPage).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'derrumbe' }),
      0,
      Infinity,
    );
  });

  it('default behavior (no all param) still uses PAGE_SIZE limit', async () => {
    mockListLocationsPage.mockResolvedValue({ items: [loc('l1')], total: 1 });

    const req = new Request('http://localhost/api/zonas');
    await GET(req);

    expect(mockListLocationsPage).toHaveBeenCalledWith({}, 0, 20);
  });
});

describe('GET /api/zonas soloConPedidos filter', () => {
  it('passes soloConPedidos:true to the store when param is "true"', async () => {
    mockListLocationsPage.mockResolvedValue({ items: [], total: 0 });

    const req = new Request('http://localhost/api/zonas?soloConPedidos=true');
    await GET(req);

    expect(mockListLocationsPage).toHaveBeenCalledWith(
      expect.objectContaining({ soloConPedidos: true }),
      0,
      20,
    );
  });

  it('does not set soloConPedidos when param is absent', async () => {
    mockListLocationsPage.mockResolvedValue({ items: [], total: 0 });

    const req = new Request('http://localhost/api/zonas');
    await GET(req);

    expect(mockListLocationsPage).toHaveBeenCalledWith(
      expect.not.objectContaining({ soloConPedidos: expect.anything() }),
      0,
      20,
    );
  });

  it('does not set soloConPedidos when param is "false"', async () => {
    mockListLocationsPage.mockResolvedValue({ items: [], total: 0 });

    const req = new Request('http://localhost/api/zonas?soloConPedidos=false');
    await GET(req);

    expect(mockListLocationsPage).toHaveBeenCalledWith(
      expect.not.objectContaining({ soloConPedidos: expect.anything() }),
      0,
      20,
    );
  });
});
