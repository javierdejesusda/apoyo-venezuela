import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Fundraiser, LocationWithNeeds, NeedRecord } from '@/lib/data/types';

const mockListLocationsPage = vi.fn();
const mockListLocations = vi.fn();
const mockGetLocation = vi.fn();
const mockListFundraisers = vi.fn();

vi.mock('@/lib/data/store', () => ({
  getStore: () => ({
    isDemo: false,
    listLocations: mockListLocations,
    listLocationsPage: mockListLocationsPage,
    getLocation: mockGetLocation,
    createLocation: vi.fn(),
    updateLocationStatus: vi.fn(),
    createNeed: vi.fn(),
    updateNeedStatus: vi.fn(),
    listFundraisers: mockListFundraisers,
    createFundraiser: vi.fn(),
    checkReportQuota: vi.fn(),
    getClusterForLocation: vi.fn(),
  }),
  PAGE_SIZE: 20,
}));

import { GET as getZonas, OPTIONS as optionsZonas } from '@/app/api/v1/zonas/route';
import { GET as getZona } from '@/app/api/v1/zonas/[id]/route';
import { GET as getPedidos } from '@/app/api/v1/pedidos/route';
import { GET as getCampanas } from '@/app/api/v1/campanas/route';
import { GET as getEstadisticas } from '@/app/api/v1/estadisticas/route';
import { GET as getOpenapi } from '@/app/api/v1/openapi.json/route';

function need(over: Partial<NeedRecord> = {}): NeedRecord {
  return {
    id: 'n1',
    locationId: 'l1',
    categoria: 'agua',
    descripcion: 'Agua potable',
    urgencia: 'media',
    status: 'pendiente',
    createdAt: '2026-06-25T00:00:00Z',
    updatedAt: '2026-06-25T00:00:00Z',
    ...over,
  };
}

function loc(id: string, over: Partial<LocationWithNeeds> = {}): LocationWithNeeds {
  return {
    id,
    nombre: `Zona ${id}`,
    estado: 'Carabobo',
    ciudad: 'Valencia',
    lat: 10.123456,
    lng: -66.987654,
    status: 'dano_parcial',
    contactoNombre: 'Ana',
    contactoTelefono: '+58 412 1112233',
    fotos: [],
    createdAt: '2026-06-25T00:00:00Z',
    updatedAt: '2026-06-25T00:00:00Z',
    needs: [],
    summary: { total: 0, pendientes: 0, enCamino: 0, cubiertos: 0, urgentes: 0 },
    ...over,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe('GET /api/v1/zonas', () => {
  it('returns a data envelope of public zonas with pagination', async () => {
    mockListLocationsPage.mockResolvedValue({ items: [loc('l1')], total: 1 });
    const res = await getZonas(new Request('http://localhost/api/v1/zonas'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe('l1');
    expect(body.pagination).toEqual({ total: 1, nextCursor: null });
  });

  it('reduces coordinate precision and never returns internal columns', async () => {
    mockListLocationsPage.mockResolvedValue({ items: [loc('l1')], total: 1 });
    const res = await getZonas(new Request('http://localhost/api/v1/zonas'));
    const body = await res.json();

    expect(body.data[0].ubicacion).toEqual({ lat: 10.123, lng: -66.988, precisionAprox: '~110m' });
    expect(body.data[0]).not.toHaveProperty('contactoTelefono');
    expect(body.data[0]).not.toHaveProperty('source_ref');
  });

  it('NEVER carries contacto on the bulk list (PII is detail-only)', async () => {
    mockListLocationsPage.mockResolvedValue({ items: [loc('l1')], total: 1 });
    const res = await getZonas(new Request('http://localhost/api/v1/zonas'));
    const body = await res.json();
    // No contacto object at all, and no reporter name/phone under any key.
    // (The top-level `nombre` is the ZONE name, not contact PII, and must stay.)
    expect(body.data[0]).not.toHaveProperty('contacto');
    expect(body.data[0]).not.toHaveProperty('telefono');
    expect(body.data[0]).not.toHaveProperty('contactoNombre');
    expect(body.data[0]).not.toHaveProperty('contactoTelefono');
    expect(body.data[0].nombre).toBe('Zona l1');
  });

  it('sends CORS and cache headers', async () => {
    mockListLocationsPage.mockResolvedValue({ items: [], total: 0 });
    const res = await getZonas(new Request('http://localhost/api/v1/zonas'));
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Cache-Control')).toContain('s-maxage=600');
  });

  it('defaults to a page size of 20 and forwards cursor', async () => {
    mockListLocationsPage.mockResolvedValue({ items: [], total: 0 });
    await getZonas(new Request('http://localhost/api/v1/zonas?cursor=40'));
    expect(mockListLocationsPage).toHaveBeenCalledWith({}, 40, 20);
  });

  it('honors a custom limit but caps it at 100', async () => {
    mockListLocationsPage.mockResolvedValue({ items: [], total: 0 });
    await getZonas(new Request('http://localhost/api/v1/zonas?limit=500'));
    expect(mockListLocationsPage).toHaveBeenCalledWith({}, 0, 100);
  });

  it('forwards valid filters and drops invalid ones', async () => {
    mockListLocationsPage.mockResolvedValue({ items: [], total: 0 });
    await getZonas(
      new Request('http://localhost/api/v1/zonas?estado=Carabobo&status=bogus&urgencia=alta'),
    );
    expect(mockListLocationsPage).toHaveBeenCalledWith(
      expect.objectContaining({ estado: 'Carabobo', urgencia: 'alta' }),
      0,
      20,
    );
    expect(mockListLocationsPage).toHaveBeenCalledWith(
      expect.not.objectContaining({ status: expect.anything() }),
      0,
      20,
    );
  });

  it('computes nextCursor when more pages remain', async () => {
    const items = Array.from({ length: 20 }, (_, i) => loc(`l${i}`));
    mockListLocationsPage.mockResolvedValue({ items, total: 50 });
    const res = await getZonas(new Request('http://localhost/api/v1/zonas'));
    const body = await res.json();
    expect(body.pagination.nextCursor).toBe(20);
  });

  it('answers OPTIONS preflight with 204', async () => {
    const res = await optionsZonas();
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toBe('GET, OPTIONS');
  });
});

describe('GET /api/v1/zonas/[id]', () => {
  it('returns a single public zona', async () => {
    const id = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
    mockGetLocation.mockResolvedValue(loc('l1', { needs: [need()] }));
    const res = await getZona(new Request(`http://localhost/api/v1/zonas/${id}`), {
      params: Promise.resolve({ id }),
    });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data.id).toBe('l1');
    expect(body.data.pedidos).toHaveLength(1);
    // Detail endpoint mirrors the web zona page: it DOES include contacto.
    expect(body.data.contacto).toEqual({ nombre: 'Ana', telefono: '+58 412 1112233' });
  });

  it('returns a 404 error envelope when the zona is missing', async () => {
    mockGetLocation.mockResolvedValue(null);
    const res = await getZona(new Request('http://localhost/api/v1/zonas/3f2504e0-4f89-41d3-9a0c-0305e82c3301'), {
      params: Promise.resolve({ id: '3f2504e0-4f89-41d3-9a0c-0305e82c3301' }),
    });
    const body = await res.json();
    expect(res.status).toBe(404);
    expect(body.error.code).toBe('not_found');
  });

  it('returns 404 for a malformed (non-UUID) id without hitting the store', async () => {
    const res = await getZona(new Request('http://localhost/api/v1/zonas/nope'), {
      params: Promise.resolve({ id: 'nope' }),
    });
    const body = await res.json();
    expect(res.status).toBe(404);
    expect(body.error.code).toBe('not_found');
    expect(mockGetLocation).not.toHaveBeenCalled();
  });
});

describe('GET /api/v1/pedidos', () => {
  it('flattens needs across zonas with parent context', async () => {
    mockListLocations.mockResolvedValue([
      loc('l1', { needs: [need({ id: 'n1', categoria: 'agua' })] }),
      loc('l2', { needs: [need({ id: 'n2', categoria: 'medicinas' })] }),
    ]);
    const res = await getPedidos(new Request('http://localhost/api/v1/pedidos'));
    const body = await res.json();
    expect(body.data).toHaveLength(2);
    expect(body.data[0]).toMatchObject({ id: 'n1', zonaId: 'l1', ciudad: 'Valencia' });
    expect(body.pagination.total).toBe(2);
    // Pedidos derive from needs + minimal zona context; they never carry contacto PII.
    expect(body.data[0]).not.toHaveProperty('contacto');
    expect(body.data[0]).not.toHaveProperty('telefono');
  });

  it('returns a 500 error envelope with CORS when the store throws', async () => {
    mockListLocations.mockRejectedValue(new Error('supabase down'));
    const res = await getPedidos(new Request('http://localhost/api/v1/pedidos'));
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body.error.code).toBe('internal_error');
    expect(body.error.message).not.toContain('supabase');
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('filters by categoria at the need level', async () => {
    mockListLocations.mockResolvedValue([
      loc('l1', {
        needs: [need({ id: 'n1', categoria: 'agua' }), need({ id: 'n2', categoria: 'medicinas' })],
      }),
    ]);
    const res = await getPedidos(
      new Request('http://localhost/api/v1/pedidos?categoria=medicinas'),
    );
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe('n2');
  });

  it('paginates the flattened list', async () => {
    mockListLocations.mockResolvedValue([
      loc('l1', {
        needs: Array.from({ length: 5 }, (_, i) => need({ id: `n${i}` })),
      }),
    ]);
    const res = await getPedidos(new Request('http://localhost/api/v1/pedidos?limit=2'));
    const body = await res.json();
    expect(body.data).toHaveLength(2);
    expect(body.pagination).toEqual({ total: 5, nextCursor: 2 });
  });
});

describe('GET /api/v1/campanas', () => {
  it('returns public campanas', async () => {
    const f: Fundraiser = {
      id: 'f1',
      titulo: 'Ayuda',
      descripcion: 'Fondos',
      url: 'https://www.gofundme.com/f/x',
      createdAt: '2026-06-25T00:00:00Z',
      updatedAt: '2026-06-25T00:00:00Z',
    };
    mockListFundraisers.mockResolvedValue([f]);
    const res = await getCampanas();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data[0]).toMatchObject({ id: 'f1', url: 'https://www.gofundme.com/f/x' });
    // Uniform collection envelope: campanas carries the same pagination shape.
    expect(body.pagination).toEqual({ total: 1, nextCursor: null });
  });
});

describe('GET /api/v1/estadisticas', () => {
  it('returns aggregate counts', async () => {
    mockListLocations.mockResolvedValue([
      loc('l1', { status: 'derrumbe', needs: [need({ urgencia: 'alta' })] }),
    ]);
    const res = await getEstadisticas();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data.zonas).toBe(1);
    expect(body.data.zonasPorStatus.derrumbe).toBe(1);
    expect(body.data.pedidosTotales).toBe(1);
  });
});

describe('GET /api/v1/openapi.json', () => {
  it('serves a valid OpenAPI 3.1 document describing the endpoints', async () => {
    const res = await getOpenapi();
    const doc = await res.json();
    expect(doc.openapi).toMatch(/^3\.1/);
    expect(doc.paths['/api/v1/zonas']).toBeDefined();
    expect(doc.paths['/api/v1/zonas/{id}']).toBeDefined();
    expect(doc.paths['/api/v1/pedidos']).toBeDefined();
    expect(doc.paths['/api/v1/campanas']).toBeDefined();
    expect(doc.paths['/api/v1/estadisticas']).toBeDefined();
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });
});
