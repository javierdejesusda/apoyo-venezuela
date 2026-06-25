import { describe, expect, it } from 'vitest';

import {
  resolveMapCoords,
  STATE_CENTROIDS,
  STATE_FALLBACK_RADIUS_M,
  stateCentroid,
} from '@/lib/data/geo';
import { VENEZUELA_STATES } from '@/lib/data/types';
import { APPROXIMATE_THRESHOLD_M } from '@/lib/geocoding/types';

describe('STATE_CENTROIDS', () => {
  it('has exactly 24 entries matching VENEZUELA_STATES', () => {
    expect(Object.keys(STATE_CENTROIDS).length).toBe(VENEZUELA_STATES.length);
    for (const state of VENEZUELA_STATES) {
      expect(STATE_CENTROIDS).toHaveProperty(state);
    }
  });

  it('every entry has numeric lat and lng', () => {
    for (const [state, coords] of Object.entries(STATE_CENTROIDS)) {
      expect(typeof coords.lat, `${state}.lat`).toBe('number');
      expect(typeof coords.lng, `${state}.lng`).toBe('number');
    }
  });
});

describe('stateCentroid', () => {
  it('returns coordinates for a known state', () => {
    const result = stateCentroid('Carabobo');
    expect(result).not.toBeNull();
    expect(result?.lat).toBeCloseTo(10.162);
    expect(result?.lng).toBeCloseTo(-68.0077);
  });

  it('returns null for an unknown state', () => {
    expect(stateCentroid('Atlantis')).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(stateCentroid('')).toBeNull();
  });
});

describe('resolveMapCoords', () => {
  it('returns exact coords with approximate=false when both lat and lng are set', () => {
    const result = resolveMapCoords({ lat: 10.5, lng: -66.9, estado: 'Distrito Capital' });
    expect(result).toEqual({ lat: 10.5, lng: -66.9, approximate: false, accuracyM: 0 });
  });

  it('falls back to estado centroid with approximate=true when lat is null', () => {
    const result = resolveMapCoords({ lat: null, lng: null, estado: 'Distrito Capital' });
    expect(result).not.toBeNull();
    expect(result?.approximate).toBe(true);
    expect(result?.lat).toBeCloseTo(10.4806);
    expect(result?.lng).toBeCloseTo(-66.9036);
  });

  it('falls back to estado centroid when only lat is null', () => {
    const result = resolveMapCoords({ lat: null, lng: -66.9, estado: 'Miranda' });
    expect(result).not.toBeNull();
    expect(result?.approximate).toBe(true);
  });

  it('falls back to estado centroid when only lng is null', () => {
    const result = resolveMapCoords({ lat: 10.3, lng: null, estado: 'Miranda' });
    expect(result).not.toBeNull();
    expect(result?.approximate).toBe(true);
  });

  it('returns null when coords are null and estado is unknown', () => {
    const result = resolveMapCoords({ lat: null, lng: null, estado: 'Atlantis' });
    expect(result).toBeNull();
  });

  it('returns null when coords are null and estado is empty', () => {
    const result = resolveMapCoords({ lat: null, lng: null, estado: '' });
    expect(result).toBeNull();
  });

  it('uses provided coords even when a valid estado is given', () => {
    const result = resolveMapCoords({ lat: 1.0, lng: -60.0, estado: 'Carabobo' });
    expect(result).toEqual({ lat: 1.0, lng: -60.0, approximate: false, accuracyM: 0 });
  });
});

describe('resolveMapCoords accuracy', () => {
  it('keeps exact coords with a small accuracy as not approximate', () => {
    const result = resolveMapCoords({
      lat: 10.5,
      lng: -66.9,
      estado: 'Distrito Capital',
      accuracyM: 40,
    });
    expect(result).toEqual({
      lat: 10.5,
      lng: -66.9,
      approximate: false,
      accuracyM: 40,
    });
  });

  it('marks coords as approximate once accuracyM reaches the threshold', () => {
    const result = resolveMapCoords({
      lat: 10.5,
      lng: -66.9,
      estado: 'Distrito Capital',
      accuracyM: APPROXIMATE_THRESHOLD_M,
    });
    expect(result?.approximate).toBe(true);
    expect(result?.accuracyM).toBe(APPROXIMATE_THRESHOLD_M);
  });

  it('defaults accuracyM to 0 for exact coords without an accuracy', () => {
    const result = resolveMapCoords({ lat: 10.5, lng: -66.9, estado: 'Miranda' });
    expect(result?.approximate).toBe(false);
    expect(result?.accuracyM).toBe(0);
  });

  it('uses STATE_FALLBACK_RADIUS_M on the estado centroid fallback', () => {
    expect(STATE_FALLBACK_RADIUS_M).toBe(60000);
    const result = resolveMapCoords({ lat: null, lng: null, estado: 'Miranda' });
    expect(result?.approximate).toBe(true);
    expect(result?.accuracyM).toBe(STATE_FALLBACK_RADIUS_M);
  });

  it('returns null on the fallback path when the estado is unknown', () => {
    const result = resolveMapCoords({
      lat: null,
      lng: null,
      estado: 'Atlantis',
      accuracyM: 50,
    });
    expect(result).toBeNull();
  });
});
