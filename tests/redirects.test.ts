import { createRequire } from 'node:module';

import { describe, expect, it } from 'vitest';

import nextConfig from '@/next.config';

/**
 * Next.js compiles a redirect `source` with its own bundled path-to-regexp, so
 * matching the rule against that compiler is the only way to test the pattern
 * without booting a server. The public package would be a different major.
 */
const { pathToRegexp } = createRequire(import.meta.url)(
  'next/dist/compiled/path-to-regexp',
) as { pathToRegexp: (source: string) => RegExp };

async function shutdownRedirect() {
  const rules = (await nextConfig.redirects?.()) ?? [];
  expect(rules).toHaveLength(1);
  return rules[0];
}

async function matcher(): Promise<RegExp> {
  return pathToRegexp((await shutdownRedirect()).source);
}

describe('shutdown redirect', () => {
  it('sends every retired path to the transition page', async () => {
    expect((await shutdownRedirect()).destination).toBe('/');
  });

  /**
   * A 308 is cached by the browser forever, so anyone who visited while the
   * site was down could never reach a restored route again. Reversing the
   * shutdown has to stay possible.
   */
  it('redirects temporarily, so the shutdown stays reversible', async () => {
    expect((await shutdownRedirect()).permanent).toBe(false);
  });

  it('matches the routes that were retired', async () => {
    const matches = await matcher();

    for (const path of [
      '/telefonos',
      '/guia',
      '/reportar',
      '/recaudaciones',
      '/asistente',
      '/privacidad',
      '/api-docs',
      '/red-de-iniciativas',
      '/zona/1a2b3c',
      '/api/v1/zonas',
    ]) {
      expect(matches.test(path), `${path} should redirect`).toBe(true);
    }
  });

  /**
   * The home page is the destination, so matching it would be an infinite
   * redirect loop.
   */
  it('never matches the transition page itself', async () => {
    expect((await matcher()).test('/')).toBe(false);
  });

  /**
   * Redirects run before the filesystem, so every asset the page loads has to
   * be excluded or the page renders without its own JavaScript and styles.
   */
  it('never matches the build assets or the metadata routes', async () => {
    const matches = await matcher();

    for (const path of [
      '/_next/static/chunks/main.js',
      '/_next/static/css/app.css',
      '/_next/image',
      '/favicon.ico',
      '/icon.svg',
      '/manifest.webmanifest',
      '/sw.js',
      '/offline.html',
      '/robots.txt',
      '/sitemap.xml',
      '/opengraph-image',
      '/twitter-image',
      '/apple-icon',
    ]) {
      expect(matches.test(path), `${path} must still be served`).toBe(false);
    }
  });
});
