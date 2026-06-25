import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  geocodeForwardAction,
  geocodeReverseAction,
} from '@/app/geocode-actions';

const TOKEN = 'pk.test_token_xyz789';

/** Minimal v6 forward response with a single rooftop-precise address. */
const FORWARD_FIXTURE = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'addr.miranda12',
      geometry: { type: 'Point', coordinates: [-66.8792, 10.4995] },
      properties: {
        feature_type: 'address',
        name: 'Avenida Francisco de Miranda 12',
        full_address:
          'Avenida Francisco de Miranda 12, Chacao, Distrito Capital, Venezuela',
        place_formatted: 'Chacao, Distrito Capital, Venezuela',
        match_code: { confidence: 'exact' },
        context: {
          region: { name: 'Distrito Capital', region_code: 'VE-A' },
          place: { name: 'Caracas' },
          neighborhood: { name: 'El Rosal' },
        },
      },
    },
  ],
};

/** Minimal v6 reverse response resolving a single place. */
const REVERSE_FIXTURE = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'addr.reverse1',
      geometry: { type: 'Point', coordinates: [-66.9, 10.5] },
      properties: {
        feature_type: 'address',
        name: 'Plaza Bolivar',
        full_address: 'Plaza Bolivar, Caracas, Distrito Capital, Venezuela',
        place_formatted: 'Caracas, Distrito Capital, Venezuela',
        match_code: { confidence: 'exact' },
        context: {
          region: { name: 'Distrito Capital', region_code: 'VE-A' },
          place: { name: 'Caracas' },
        },
      },
    },
  ],
};

/** Builds a fetch mock that resolves a Response-like object with the given body. */
function okResponse(body: unknown): { ok: true; json: () => Promise<unknown> } {
  return { ok: true, json: async () => body };
}

let originalFetch: typeof global.fetch;
let originalToken: string | undefined;

beforeEach(() => {
  originalFetch = global.fetch;
  originalToken = process.env.MAPBOX_TOKEN;
});

afterEach(() => {
  global.fetch = originalFetch;
  if (originalToken === undefined) {
    delete process.env.MAPBOX_TOKEN;
  } else {
    process.env.MAPBOX_TOKEN = originalToken;
  }
  vi.restoreAllMocks();
});

describe('geocodeForwardAction', () => {
  it('returns [] without calling fetch when the token is missing', async () => {
    delete process.env.MAPBOX_TOKEN;
    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof global.fetch;

    await expect(geocodeForwardAction('Caracas centro')).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns [] without calling fetch when the trimmed query is shorter than 3 chars', async () => {
    process.env.MAPBOX_TOKEN = TOKEN;
    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof global.fetch;

    await expect(geocodeForwardAction('  ab ')).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fetches and returns parsed suggestions when the token is present', async () => {
    process.env.MAPBOX_TOKEN = TOKEN;
    const fetchMock = vi.fn().mockResolvedValue(okResponse(FORWARD_FIXTURE));
    global.fetch = fetchMock as unknown as typeof global.fetch;

    const result = await geocodeForwardAction('Avenida Francisco');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(1);
    expect(result[0].estado).toBe('Distrito Capital');
    expect(result[0].ciudad).toBe('Caracas');
    expect(result[0].zona).toBe('El Rosal');
    expect(result[0].precision).toBe('exact');
    expect(result[0].lat).toBeCloseTo(10.4995);
    expect(result[0].lng).toBeCloseTo(-66.8792);
  });

  it('returns [] when the response is not ok', async () => {
    process.env.MAPBOX_TOKEN = TOKEN;
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: false, json: async () => ({}) });
    global.fetch = fetchMock as unknown as typeof global.fetch;

    await expect(geocodeForwardAction('Caracas centro')).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns [] when fetch rejects', async () => {
    process.env.MAPBOX_TOKEN = TOKEN;
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));
    global.fetch = fetchMock as unknown as typeof global.fetch;

    await expect(geocodeForwardAction('Caracas centro')).resolves.toEqual([]);
  });
});

describe('geocodeReverseAction', () => {
  it('returns null without calling fetch when the token is missing', async () => {
    delete process.env.MAPBOX_TOKEN;
    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof global.fetch;

    await expect(geocodeReverseAction(10.5, -66.9)).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns null without calling fetch for non-finite or out-of-range coordinates', async () => {
    process.env.MAPBOX_TOKEN = TOKEN;
    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof global.fetch;

    await expect(geocodeReverseAction(Number.NaN, -66.9)).resolves.toBeNull();
    await expect(geocodeReverseAction(10.5, Number.POSITIVE_INFINITY)).resolves.toBeNull();
    await expect(geocodeReverseAction(91, -66.9)).resolves.toBeNull();
    await expect(geocodeReverseAction(10.5, -181)).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fetches and returns a parsed reverse result when the token is present', async () => {
    process.env.MAPBOX_TOKEN = TOKEN;
    const fetchMock = vi.fn().mockResolvedValue(okResponse(REVERSE_FIXTURE));
    global.fetch = fetchMock as unknown as typeof global.fetch;

    const result = await geocodeReverseAction(10.5, -66.9);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).not.toBeNull();
    expect(result?.estado).toBe('Distrito Capital');
    expect(result?.ciudad).toBe('Caracas');
    expect(result?.precision).toBe('exact');
    expect(result?.label).toContain('Venezuela');
  });

  it('returns null when the response is not ok', async () => {
    process.env.MAPBOX_TOKEN = TOKEN;
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: false, json: async () => ({}) });
    global.fetch = fetchMock as unknown as typeof global.fetch;

    await expect(geocodeReverseAction(10.5, -66.9)).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns null when fetch rejects', async () => {
    process.env.MAPBOX_TOKEN = TOKEN;
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));
    global.fetch = fetchMock as unknown as typeof global.fetch;

    await expect(geocodeReverseAction(10.5, -66.9)).resolves.toBeNull();
  });
});
