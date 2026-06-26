import { describe, expect, it } from 'vitest';

import {
  areClusterable,
  haversineMeters,
  isProximate,
  nameSimilarity,
  NAME_SIMILARITY_THRESHOLD,
  PROXIMITY_RADIUS_M,
} from '@/lib/data/clustering';

// Two locations ~100 m apart in Caracas (well within 150 m radius).
const NEAR_A = { lat: 10.4880, lng: -66.8791 };
const NEAR_B = { lat: 10.4889, lng: -66.8791 };

// Two locations ~300 m apart (beyond 150 m radius).
const FAR_A = { lat: 10.4880, lng: -66.8791 };
const FAR_B = { lat: 10.4907, lng: -66.8791 };

describe('haversineMeters', () => {
  it('returns 0 for identical coordinates', () => {
    expect(haversineMeters(10.0, -66.0, 10.0, -66.0)).toBe(0);
  });

  it('returns ~100 m for two nearby points', () => {
    const d = haversineMeters(NEAR_A.lat, NEAR_A.lng, NEAR_B.lat, NEAR_B.lng);
    expect(d).toBeGreaterThan(50);
    expect(d).toBeLessThan(150);
  });

  it('returns ~300 m for two distant points', () => {
    const d = haversineMeters(FAR_A.lat, FAR_A.lng, FAR_B.lat, FAR_B.lng);
    expect(d).toBeGreaterThan(200);
    expect(d).toBeLessThan(400);
  });
});

describe('PROXIMITY_RADIUS_M', () => {
  it('is 150', () => {
    expect(PROXIMITY_RADIUS_M).toBe(150);
  });
});

describe('NAME_SIMILARITY_THRESHOLD', () => {
  it('is 0.45', () => {
    expect(NAME_SIMILARITY_THRESHOLD).toBe(0.45);
  });
});

describe('nameSimilarity', () => {
  it('returns 1 for identical strings', () => {
    expect(nameSimilarity('Edificio Central', 'Edificio Central')).toBe(1);
  });

  it('returns 0 for completely disjoint strings', () => {
    // 'abc' and 'xyz' share no trigrams
    expect(nameSimilarity('abc', 'xyz')).toBe(0);
  });

  it('returns a value above threshold for similar names', () => {
    const score = nameSimilarity('Torre Miramar', 'Torre Miramar Sur');
    expect(score).toBeGreaterThanOrEqual(NAME_SIMILARITY_THRESHOLD);
  });

  it('returns a value below threshold for clearly different names', () => {
    const score = nameSimilarity('Parque Central', 'Quinta Las Flores');
    expect(score).toBeLessThan(NAME_SIMILARITY_THRESHOLD);
  });

  it('is case-insensitive', () => {
    expect(nameSimilarity('EDIFICIO', 'edificio')).toBe(1);
  });
});

describe('isProximate', () => {
  it('returns true for two points within radius', () => {
    expect(isProximate(NEAR_A, NEAR_B)).toBe(true);
  });

  it('returns false for two points beyond radius', () => {
    expect(isProximate(FAR_A, FAR_B)).toBe(false);
  });

  it('returns false when first location has null lat', () => {
    expect(isProximate({ lat: null, lng: -66.0 }, NEAR_B)).toBe(false);
  });

  it('returns false when first location has null lng', () => {
    expect(isProximate({ lat: 10.0, lng: null }, NEAR_B)).toBe(false);
  });

  it('returns false when second location has null lat', () => {
    expect(isProximate(NEAR_A, { lat: null, lng: -66.0 })).toBe(false);
  });

  it('returns false when second location has null lng', () => {
    expect(isProximate(NEAR_A, { lat: 10.0, lng: null })).toBe(false);
  });

  it('does not throw when coordinates are null', () => {
    expect(() => isProximate({ lat: null, lng: null }, { lat: null, lng: null })).not.toThrow();
  });

  it('respects a custom radius', () => {
    // NEAR_A and NEAR_B are ~100 m apart; with radius 50 they should be NOT proximate.
    expect(isProximate(NEAR_A, NEAR_B, 50)).toBe(false);
    // With radius 200 they should be proximate.
    expect(isProximate(NEAR_A, NEAR_B, 200)).toBe(true);
  });
});

describe('areClusterable', () => {
  const similarNombre = { nombre: 'Torre Miramar' };
  const differentNombre = { nombre: 'Quinta Las Flores' };

  it('returns true when near AND similar name', () => {
    expect(areClusterable({ ...NEAR_A, nombre: 'Torre Miramar' }, { ...NEAR_B, nombre: 'Torre Miramar Sur' })).toBe(true);
  });

  it('returns false when near but dissimilar name', () => {
    expect(areClusterable(
      { ...NEAR_A, ...similarNombre },
      { ...NEAR_B, ...differentNombre },
    )).toBe(false);
  });

  it('returns false when similar name but far apart', () => {
    expect(areClusterable(
      { ...FAR_A, ...similarNombre },
      { ...FAR_B, ...similarNombre },
    )).toBe(false);
  });

  it('does NOT cluster a borderline name pair (0.3 <= similarity < 0.45) even when proximate', () => {
    // 'Torre Galipan' vs 'Torre Petare' score ~0.43: these are distinct
    // buildings that only share the generic "Torre " prefix. The old 0.3
    // threshold merged them; the 0.45 threshold must keep them apart.
    const a = { ...NEAR_A, nombre: 'Torre Galipan' };
    const b = { ...NEAR_B, nombre: 'Torre Petare' };
    const score = nameSimilarity(a.nombre, b.nombre);
    expect(score).toBeGreaterThanOrEqual(0.3);
    expect(score).toBeLessThan(0.45);
    expect(isProximate(a, b)).toBe(true);
    expect(areClusterable(a, b)).toBe(false);
  });

  it('returns false when null coords on first location', () => {
    expect(areClusterable(
      { lat: null, lng: null, nombre: 'Torre Miramar' },
      { ...NEAR_B, nombre: 'Torre Miramar' },
    )).toBe(false);
  });

  it('returns false when null coords on second location', () => {
    expect(areClusterable(
      { ...NEAR_A, nombre: 'Torre Miramar' },
      { lat: null, lng: null, nombre: 'Torre Miramar' },
    )).toBe(false);
  });

  it('does not throw when coordinates are null', () => {
    expect(() =>
      areClusterable(
        { lat: null, lng: null, nombre: 'A' },
        { lat: null, lng: null, nombre: 'A' },
      ),
    ).not.toThrow();
  });
});
