import { describe, expect, it } from 'vitest';

import { parseUsgsFeed } from '@/lib/sismos/parse';

const feature = (over: Record<string, unknown> = {}) => {
  const { properties: pOver, geometry: gOver, ...rest } = over;
  return {
    type: 'Feature',
    id: 'us6000t8k6',
    geometry: gOver ?? { type: 'Point', coordinates: [-67.5993, 10.8, 10] },
    ...rest,
    properties: {
      mag: 4.7,
      place: '54 km N of El Limón, Venezuela',
      time: 1782512171931,
      type: 'earthquake',
      url: 'https://earthquake.usgs.gov/earthquakes/eventpage/us6000t8k6',
      ...((pOver as object) ?? {}),
    },
  };
};

const collection = (features: unknown[]) => ({
  type: 'FeatureCollection',
  metadata: { count: features.length },
  features,
});

describe('parseUsgsFeed', () => {
  it('maps a USGS GeoJSON feature into a Sismo (lon/lat order, depth in km)', () => {
    const [sismo] = parseUsgsFeed(collection([feature()]));
    expect(sismo).toEqual({
      id: 'us6000t8k6',
      magnitude: 4.7,
      place: '54 km N of El Limón, Venezuela',
      time: 1782512171931,
      lat: 10.8,
      lng: -67.5993,
      depthKm: 10,
      url: 'https://earthquake.usgs.gov/earthquakes/eventpage/us6000t8k6',
    });
  });

  it('returns the most recent earthquake first', () => {
    const older = feature({ id: 'a', properties: { time: 1000 } });
    const newer = feature({ id: 'b', properties: { time: 5000 } });
    const ids = parseUsgsFeed(collection([older, newer])).map((s) => s.id);
    expect(ids).toEqual(['b', 'a']);
  });

  it('skips features missing a magnitude or coordinates', () => {
    const noMag = feature({ id: 'm', properties: { mag: null } });
    const noCoords = feature({ id: 'c', geometry: { type: 'Point', coordinates: [] } });
    const result = parseUsgsFeed(collection([noMag, noCoords, feature()]));
    expect(result.map((s) => s.id)).toEqual(['us6000t8k6']);
  });

  it('returns an empty array for a malformed or empty payload', () => {
    expect(parseUsgsFeed(null)).toEqual([]);
    expect(parseUsgsFeed({})).toEqual([]);
    expect(parseUsgsFeed({ features: 'nope' })).toEqual([]);
    expect(parseUsgsFeed(collection([]))).toEqual([]);
  });
});
