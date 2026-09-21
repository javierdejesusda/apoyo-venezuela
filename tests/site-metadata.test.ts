import { describe, expect, it } from 'vitest';

import manifest from '@/app/manifest';
import { alt as openGraphAlt } from '@/app/opengraph-image';
import sitemap from '@/app/sitemap';
import { CENTRAL_PLATFORM } from '@/lib/data/red-iniciativas';
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
  /**
   * A shared link is often the only thing someone reads, so the card has to
   * name where the work moved to. Leading with the site having stopped would
   * read as "nothing to do here" to someone who still needs help.
   */
  it('name the destination rather than the map', () => {
    for (const alt of [openGraphAlt, twitterAlt]) {
      expect(alt).not.toMatch(/coordinaci[oó]n de ayuda/i);
      expect(alt).toMatch(new RegExp(CENTRAL_PLATFORM.name, 'i'));
    }
  });

  it('do not lead with the site having stopped', () => {
    for (const alt of [openGraphAlt, twitterAlt]) {
      expect(alt).not.toMatch(/dej[oó] de operar|fuera de servicio/i);
    }
  });
});
