import { describe, expect, it } from 'vitest';

import {
  CENTRAL_PLATFORM,
  INITIATIVE_CATEGORIES,
} from '@/lib/data/red-iniciativas';

describe('red de iniciativas data', () => {
  it('lists every published category from the source message', () => {
    expect(INITIATIVE_CATEGORIES).toHaveLength(13);
  });

  it('points to redquipu as the central platform', () => {
    expect(CENTRAL_PLATFORM.url).toBe('https://redquipu.com');
    expect(CENTRAL_PLATFORM.name.length).toBeGreaterThan(0);
  });

  it('gives every category a unique slug', () => {
    const slugs = INITIATIVE_CATEGORIES.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('gives every category a slug, title, description and at least one link', () => {
    for (const category of INITIATIVE_CATEGORIES) {
      expect(category.slug).toMatch(/^[a-z0-9-]+$/);
      expect(category.title.length).toBeGreaterThan(0);
      expect(category.description.length).toBeGreaterThan(0);
      expect(category.urls.length).toBeGreaterThan(0);
    }
  });

  it('only carries absolute https links', () => {
    const allUrls = INITIATIVE_CATEGORIES.flatMap((c) => c.urls);
    expect(allUrls.length).toBeGreaterThan(0);
    for (const url of allUrls) {
      expect(url).toMatch(/^https:\/\//);
      expect(() => new URL(url)).not.toThrow();
    }
  });

  it('never links back to this site, which no longer serves data', () => {
    const allUrls = INITIATIVE_CATEGORIES.flatMap((c) => c.urls);
    expect(allUrls.some((url) => /apoyovenezuela\.com/i.test(url))).toBe(false);
  });

  it('does not repeat a link within the same category', () => {
    for (const category of INITIATIVE_CATEGORIES) {
      expect(new Set(category.urls).size).toBe(category.urls.length);
    }
  });
});
