import { describe, expect, it } from 'vitest';

import { buildUsgsQuery, VENEZUELA_BBOX } from '@/lib/sismos/query';

describe('buildUsgsQuery', () => {
  // 2026-06-27T12:00:00.000Z
  const now = Date.UTC(2026, 5, 27, 12, 0, 0);

  it('targets the USGS FDSN event endpoint with GeoJSON format', () => {
    const url = new URL(buildUsgsQuery({ now }));
    expect(url.origin + url.pathname).toBe(
      'https://earthquake.usgs.gov/fdsnws/event/1/query',
    );
    expect(url.searchParams.get('format')).toBe('geojson');
  });

  it('constrains the query to the Venezuela bounding box', () => {
    const url = new URL(buildUsgsQuery({ now }));
    expect(url.searchParams.get('minlatitude')).toBe(String(VENEZUELA_BBOX.minLat));
    expect(url.searchParams.get('maxlatitude')).toBe(String(VENEZUELA_BBOX.maxLat));
    expect(url.searchParams.get('minlongitude')).toBe(String(VENEZUELA_BBOX.minLng));
    expect(url.searchParams.get('maxlongitude')).toBe(String(VENEZUELA_BBOX.maxLng));
  });

  it('applies sensible defaults: M3+, newest first, capped at 50', () => {
    const url = new URL(buildUsgsQuery({ now }));
    expect(url.searchParams.get('minmagnitude')).toBe('3');
    expect(url.searchParams.get('orderby')).toBe('time');
    expect(url.searchParams.get('limit')).toBe('50');
  });

  it('derives starttime from now minus the requested window (default 7 days)', () => {
    const url = new URL(buildUsgsQuery({ now }));
    // 7 days before 2026-06-27T12:00:00Z is 2026-06-20T12:00:00Z.
    expect(url.searchParams.get('starttime')).toBe('2026-06-20T12:00:00.000Z');
  });

  it('honours overrides for window, magnitude and limit', () => {
    const url = new URL(
      buildUsgsQuery({ now, days: 1, minMagnitude: 4.5, limit: 10 }),
    );
    expect(url.searchParams.get('starttime')).toBe('2026-06-26T12:00:00.000Z');
    expect(url.searchParams.get('minmagnitude')).toBe('4.5');
    expect(url.searchParams.get('limit')).toBe('10');
  });
});
