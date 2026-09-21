import { describe, expect, it } from 'vitest';

import manifest from '@/app/manifest';
import { alt as openGraphAlt } from '@/app/opengraph-image';
import sitemap from '@/app/sitemap';
import { alt as twitterAlt } from '@/app/twitter-image';

/**
 * Everything the site still tells the outside world about itself. Each of these
 * used to advertise routes that no longer exist, and nothing in the build would
 * notice a stale entry: a sitemap pointing at `/telefonos` just hands crawlers
 * a redirect, and an install prompt would open a page that is gone.
 */
describe('sitemap', () => {
  it('lists only the transition page', () => {
    expect(sitemap().map((entry) => entry.url)).toEqual([
      expect.stringMatching(/\/$/),
    ]);
  });
});

describe('web app manifest', () => {
  it('starts on the only page that is left', () => {
    expect(manifest().start_url).toBe('/');
  });

  it('advertises no retired destination', () => {
    const serialized = JSON.stringify(manifest());

    for (const retired of ['/reportar', '/telefonos', '/guia', '/zona', '/recaudaciones']) {
      expect(serialized, `${retired} no longer exists`).not.toContain(retired);
    }
  });

  it('describes the transition rather than the map', () => {
    expect(manifest().description).not.toMatch(/reporta/i);
  });
});

describe('social share cards', () => {
  it('describe the transition rather than the map', () => {
    for (const alt of [openGraphAlt, twitterAlt]) {
      expect(alt).not.toMatch(/coordinaci[oó]n de ayuda/i);
      expect(alt).toMatch(/dej[oó] de operar/i);
    }
  });
});
