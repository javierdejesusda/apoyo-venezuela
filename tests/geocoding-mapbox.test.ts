import { describe, expect, it } from 'vitest';

import { APPROXIMATE_THRESHOLD_M } from '@/lib/geocoding/types';
import {
  accuracyToMeters,
  buildForwardUrl,
  buildReverseUrl,
  normalizeEstado,
  parseForward,
  parseReverse,
} from '@/lib/geocoding/mapbox';

const TOKEN = 'pk.test_token_abc123';

/** Forward response for a rooftop-precise address in Caracas. */
const PRECISE_ADDRESS = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'dXJuOm1ieGFkcjphZGRyZXNz',
      geometry: { type: 'Point', coordinates: [-66.8792, 10.4995] },
      properties: {
        mapbox_id: 'dXJuOm1ieGFkcjphZGRyZXNz',
        feature_type: 'address',
        name: 'Avenida Francisco de Miranda 12',
        full_address:
          'Avenida Francisco de Miranda 12, Chacao, Distrito Capital, Venezuela',
        place_formatted: 'Chacao, Distrito Capital, Venezuela',
        coordinates: { longitude: -66.8792, latitude: 10.4995, accuracy: 'rooftop' },
        match_code: { address_number: 'matched', street: 'matched', confidence: 'exact' },
        context: {
          country: { name: 'Venezuela', country_code: 'VE' },
          region: { name: 'Distrito Capital', region_code: 'VE-A' },
          place: { name: 'Caracas' },
          locality: { name: 'Chacao' },
          neighborhood: { name: 'El Rosal' },
          address: { name: 'Avenida Francisco de Miranda 12' },
        },
      },
    },
  ],
};

/** Forward response for a city-level (place) match. */
const CITY_LEVEL = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'place.maracaibo',
      geometry: { type: 'Point', coordinates: [-71.6125, 10.6545] },
      properties: {
        feature_type: 'place',
        name: 'Maracaibo',
        full_address: 'Maracaibo, Zulia, Venezuela',
        place_formatted: 'Zulia, Venezuela',
        match_code: null,
        context: {
          region: { name: 'Zulia', region_code: 'VE-V' },
          place: { name: 'Maracaibo' },
        },
      },
    },
  ],
};

/** Forward response for a region-level match with an accented state name. */
const REGION_LEVEL = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'region.merida',
      geometry: { type: 'Point', coordinates: [-71.1561, 8.5891] },
      properties: {
        feature_type: 'region',
        name: 'Mérida',
        full_address: 'Mérida, Venezuela',
        context: { region: { name: 'Merida', region_code: 'VE-L' } },
      },
    },
  ],
};

/** Forward response whose region still uses the legacy "Vargas" name. */
const VARGAS_REGION = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'region.vargas',
      geometry: { type: 'Point', coordinates: [-67.0357, 10.6009] },
      properties: {
        feature_type: 'region',
        name: 'Vargas',
        context: { region: { name: 'Vargas', region_code: 'VE-X' } },
      },
    },
  ],
};

describe('buildForwardUrl', () => {
  it('targets the v6 forward endpoint with country, language, limit and autocomplete', () => {
    const url = new URL(buildForwardUrl('Caracas Centro', TOKEN));
    expect(url.pathname).toContain('/search/geocode/v6/forward');
    expect(url.searchParams.get('q')).toBe('Caracas Centro');
    expect(url.searchParams.get('country')).toBe('ve');
    expect(url.searchParams.get('language')).toBe('es');
    expect(url.searchParams.get('limit')).toBe('6');
    expect(url.searchParams.get('autocomplete')).toBe('true');
    expect(url.searchParams.get('access_token')).toBe(TOKEN);
  });

  it('biases results toward the Venezuela center via proximity (lng,lat)', () => {
    const url = new URL(buildForwardUrl('hospital', TOKEN));
    expect(url.searchParams.get('proximity')).toBe('-66.9,10.5');
  });

  it('includes country=ve, language=es and the raw token in the query string', () => {
    const raw = buildForwardUrl('clinica', TOKEN);
    expect(raw).toContain('country=ve');
    expect(raw).toContain('language=es');
    expect(raw).toContain(TOKEN);
  });
});

describe('buildReverseUrl', () => {
  it('targets the v6 reverse endpoint with longitude and latitude (not swapped)', () => {
    const url = new URL(buildReverseUrl(10.5, -66.9, TOKEN));
    expect(url.pathname).toContain('/search/geocode/v6/reverse');
    expect(url.searchParams.get('latitude')).toBe('10.5');
    expect(url.searchParams.get('longitude')).toBe('-66.9');
    expect(url.searchParams.get('country')).toBe('ve');
    expect(url.searchParams.get('language')).toBe('es');
    expect(url.searchParams.get('access_token')).toBe(TOKEN);
  });

  it('includes country=ve, language=es and the raw token in the query string', () => {
    const raw = buildReverseUrl(8.5, -71.1, TOKEN);
    expect(raw).toContain('country=ve');
    expect(raw).toContain('language=es');
    expect(raw).toContain(TOKEN);
  });
});

describe('normalizeEstado', () => {
  it('matches a canonical state exactly', () => {
    expect(normalizeEstado('Miranda')).toBe('Miranda');
  });

  it('matches accent- and case-insensitively', () => {
    expect(normalizeEstado('merida')).toBe('Mérida');
    expect(normalizeEstado('ANZOATEGUI')).toBe('Anzoátegui');
    expect(normalizeEstado('  bolivar ')).toBe('Bolívar');
  });

  it('maps the legacy "Vargas" name to canonical "La Guaira"', () => {
    expect(normalizeEstado('Vargas')).toBe('La Guaira');
  });

  it('keeps the current "La Guaira" spelling', () => {
    expect(normalizeEstado('La Guaira')).toBe('La Guaira');
  });

  it('returns null for an unknown or empty region', () => {
    expect(normalizeEstado('Lima')).toBeNull();
    expect(normalizeEstado('')).toBeNull();
    expect(normalizeEstado(null)).toBeNull();
    expect(normalizeEstado(undefined)).toBeNull();
  });
});

describe('accuracyToMeters', () => {
  it('maps feature types to an uncertainty radius', () => {
    expect(accuracyToMeters('address')).toBe(30);
    expect(accuracyToMeters('secondary_address')).toBe(30);
    expect(accuracyToMeters('street')).toBe(120);
    expect(accuracyToMeters('neighborhood')).toBe(400);
    expect(accuracyToMeters('postcode')).toBe(1500);
    expect(accuracyToMeters('locality')).toBe(1500);
    expect(accuracyToMeters('place')).toBe(4000);
    expect(accuracyToMeters('district')).toBe(12000);
    expect(accuracyToMeters('region')).toBe(60000);
  });

  it('defaults unknown feature types to a mid-range radius', () => {
    expect(accuracyToMeters('block')).toBe(2000);
    expect(accuracyToMeters('')).toBe(2000);
  });

  it('widens fine-grained matches flagged low confidence', () => {
    expect(accuracyToMeters('address', { confidence: 'low' })).toBe(400);
    expect(accuracyToMeters('street', { confidence: 'low' })).toBe(400);
  });

  it('does not narrow coarse matches on low confidence', () => {
    expect(accuracyToMeters('region', { confidence: 'low' })).toBe(60000);
  });

  it('keeps the base radius for non-low confidence', () => {
    expect(accuracyToMeters('address', { confidence: 'exact' })).toBe(30);
  });
});

describe('parseForward', () => {
  it('maps a precise address, converting [lng,lat] to lat/lng', () => {
    const [s] = parseForward(PRECISE_ADDRESS);
    expect(s.lat).toBeCloseTo(10.4995);
    expect(s.lng).toBeCloseTo(-66.8792);
    expect(s.estado).toBe('Distrito Capital');
    expect(s.ciudad).toBe('Caracas');
    expect(s.zona).toBe('El Rosal');
    expect(s.accuracyM).toBe(30);
    expect(s.precision).toBe('exact');
    expect(s.primary).toBe('Avenida Francisco de Miranda 12');
    expect(s.secondary).toBe('Caracas, Distrito Capital');
    expect(s.id).toBe('dXJuOm1ieGFkcjphZGRyZXNz');
    expect(s.label).toContain('Venezuela');
  });

  it('marks a city-level result as approximate with no zona', () => {
    const [s] = parseForward(CITY_LEVEL);
    expect(s.lat).toBeCloseTo(10.6545);
    expect(s.lng).toBeCloseTo(-71.6125);
    expect(s.estado).toBe('Zulia');
    expect(s.ciudad).toBe('Maracaibo');
    expect(s.zona).toBeNull();
    expect(s.accuracyM).toBe(4000);
    expect(s.precision).toBe('approximate');
  });

  it('marks a region-level result approximate and normalizes the accented state', () => {
    const [s] = parseForward(REGION_LEVEL);
    expect(s.estado).toBe('Mérida');
    expect(s.accuracyM).toBe(60000);
    expect(s.precision).toBe('approximate');
    expect(s.precision === 'approximate' && s.accuracyM >= APPROXIMATE_THRESHOLD_M).toBe(true);
  });

  it('maps the legacy Vargas region to La Guaira', () => {
    const [s] = parseForward(VARGAS_REGION);
    expect(s.estado).toBe('La Guaira');
  });

  it('skips malformed features and returns the valid ones', () => {
    const mixed = {
      features: [{}, null, 42, ...PRECISE_ADDRESS.features],
    };
    const result = parseForward(mixed);
    expect(result).toHaveLength(1);
    expect(result[0].estado).toBe('Distrito Capital');
  });

  it('returns [] for garbage or empty input', () => {
    expect(parseForward(null)).toEqual([]);
    expect(parseForward(undefined)).toEqual([]);
    expect(parseForward('nope')).toEqual([]);
    expect(parseForward({})).toEqual([]);
    expect(parseForward({ features: 'bad' })).toEqual([]);
    expect(parseForward({ features: [] })).toEqual([]);
  });
});

describe('parseReverse', () => {
  it('maps the first feature to a ReverseResult', () => {
    const r = parseReverse(PRECISE_ADDRESS);
    expect(r).not.toBeNull();
    expect(r?.estado).toBe('Distrito Capital');
    expect(r?.ciudad).toBe('Caracas');
    expect(r?.zona).toBe('El Rosal');
    expect(r?.accuracyM).toBe(30);
    expect(r?.precision).toBe('exact');
    expect(r?.label).toContain('Venezuela');
  });

  it('returns null for garbage or empty input', () => {
    expect(parseReverse(null)).toBeNull();
    expect(parseReverse('nope')).toBeNull();
    expect(parseReverse({})).toBeNull();
    expect(parseReverse({ features: [] })).toBeNull();
    expect(parseReverse({ features: [{}] })).toBeNull();
  });
});
