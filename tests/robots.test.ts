import { describe, expect, it } from 'vitest';

import robots from '@/app/robots';

function rulesFor(userAgent: string) {
  const { rules } = robots();
  const list = Array.isArray(rules) ? rules : [rules];
  return list.filter((rule) => {
    const agents = Array.isArray(rule.userAgent) ? rule.userAgent : [rule.userAgent];
    return agents.includes(userAgent);
  });
}

function isBlocked(userAgent: string): boolean {
  return rulesFor(userAgent).some((rule) => rule.disallow === '/');
}

describe('robots', () => {
  it('keeps the site itself crawlable by search and answer engines', () => {
    const [wildcard] = rulesFor('*');
    expect(wildcard.allow).toBe('/');
    expect(isBlocked('Googlebot')).toBe(false);
    expect(isBlocked('bingbot')).toBe(false);
  });

  it('keeps crawlers off the per-report pages and the API', () => {
    const [wildcard] = rulesFor('*');
    const disallow = Array.isArray(wildcard.disallow)
      ? wildcard.disallow
      : [wildcard.disallow];
    expect(disallow).toContain('/zona/');
    expect(disallow).toContain('/api/');
  });

  it('blocks bulk SEO and AI training crawlers', () => {
    for (const agent of ['AhrefsBot', 'SemrushBot', 'CCBot', 'ClaudeBot', 'Bytespider']) {
      expect(isBlocked(agent), `${agent} should be disallowed`).toBe(true);
    }
  });

  it('throttles unidentified crawlers with a crawl delay', () => {
    const [wildcard] = rulesFor('*');
    expect(wildcard.crawlDelay).toBeGreaterThanOrEqual(10);
  });

  it('still advertises the sitemap and canonical host', () => {
    const result = robots();
    expect(result.sitemap).toMatch(/\/sitemap\.xml$/);
    expect(result.host).toBeTruthy();
  });
});
