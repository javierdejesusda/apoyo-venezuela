import { describe, expect, it } from 'vitest';

import { buildDirectionsLinks, buildGoogleMapsUrl, buildOsmUrl } from '@/lib/directions';

describe('buildGoogleMapsUrl', () => {
  it('returns a valid https URL', () => {
    const url = buildGoogleMapsUrl(10.5, -66.9);
    expect(url.startsWith('https://')).toBe(true);
  });

  it('destination contains lat,lng in that order', () => {
    const url = buildGoogleMapsUrl(10.5, -66.9);
    expect(url).toContain('10.5,-66.9');
  });

  it('uses Google Maps domain', () => {
    const url = buildGoogleMapsUrl(10.5, -66.9);
    expect(url).toContain('google.com/maps');
  });
});

describe('buildOsmUrl', () => {
  it('returns a valid https URL', () => {
    const url = buildOsmUrl(10.5, -66.9);
    expect(url.startsWith('https://')).toBe(true);
  });

  it('references the same coordinates', () => {
    const url = buildOsmUrl(10.5, -66.9);
    expect(url).toContain('10.5');
    expect(url).toContain('-66.9');
  });

  it('uses the OpenStreetMap domain', () => {
    const url = buildOsmUrl(10.5, -66.9);
    expect(url).toContain('openstreetmap.org');
  });
});

describe('buildDirectionsLinks', () => {
  it('returns google and osm links for valid coordinates', () => {
    const result = buildDirectionsLinks(10.5, -66.9);
    expect(result).not.toBeNull();
    expect(result!.google).toContain('google.com/maps');
    expect(result!.osm).toContain('openstreetmap.org');
  });

  it('returns null when lat is null', () => {
    expect(buildDirectionsLinks(null, -66.9)).toBeNull();
  });

  it('returns null when lng is null', () => {
    expect(buildDirectionsLinks(10.5, null)).toBeNull();
  });

  it('returns null when both are null', () => {
    expect(buildDirectionsLinks(null, null)).toBeNull();
  });

  it('returns null when lat is NaN', () => {
    expect(buildDirectionsLinks(NaN, -66.9)).toBeNull();
  });

  it('returns null when lng is NaN', () => {
    expect(buildDirectionsLinks(10.5, NaN)).toBeNull();
  });

  it('google link contains the coordinates', () => {
    const result = buildDirectionsLinks(10.5, -66.9);
    expect(result!.google).toContain('10.5,-66.9');
  });
});
