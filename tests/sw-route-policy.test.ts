import { describe, expect, it } from 'vitest';

import { classifyRequest } from '@/lib/sw-route-policy';

const ORIGIN = 'https://apoyovenezuela.com';

describe('classifyRequest', () => {
  it('serves the static life-safety routes cache-first', () => {
    expect(classifyRequest(`${ORIGIN}/telefonos`, 'GET', true)).toBe('precache-shell');
    expect(classifyRequest(`${ORIGIN}/guia`, 'GET', true)).toBe('precache-shell');
  });

  it('treats the home and zone pages as network-first dynamic data', () => {
    expect(classifyRequest(`${ORIGIN}/`, 'GET', true)).toBe('network-first-dynamic');
    expect(classifyRequest(`${ORIGIN}/zona/abc-123`, 'GET', true)).toBe('network-first-dynamic');
  });

  it('serves build assets cache-first', () => {
    expect(classifyRequest(`${ORIGIN}/_next/static/chunks/main.js`, 'GET', true)).toBe(
      'static-asset',
    );
    expect(classifyRequest(`${ORIGIN}/icon.svg`, 'GET', true)).toBe('static-asset');
    expect(classifyRequest(`${ORIGIN}/manifest.webmanifest`, 'GET', true)).toBe('static-asset');
  });

  it('passes cross-origin requests (fonts, CDNs) through without caching', () => {
    expect(classifyRequest('https://fonts.gstatic.com/x.woff2', 'GET', false)).toBe('network-only');
  });

  it('never caches Supabase calls or mutations: they fail closed when offline', () => {
    expect(classifyRequest('https://abc.supabase.co/rest/v1/locations', 'GET', false)).toBe(
      'network-only',
    );
    expect(classifyRequest(`${ORIGIN}/`, 'POST', true)).toBe('network-only');
    expect(classifyRequest(`${ORIGIN}/zona/abc`, 'POST', true)).toBe('network-only');
  });

  it('fails closed on a malformed URL or non-canonical method', () => {
    expect(classifyRequest('not-a-url', 'GET', true)).toBe('network-only');
    expect(classifyRequest(`${ORIGIN}/`, 'post', true)).toBe('network-only');
  });
});
