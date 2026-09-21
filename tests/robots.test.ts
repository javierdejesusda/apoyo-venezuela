import { describe, expect, it } from 'vitest';

import robots from '@/app/robots';

describe('robots', () => {
  /**
   * The old rules kept crawlers off `/zona/` and blocked bulk SEO and AI
   * crawlers, because a single sweep of one path per report cost thousands of
   * ISR regenerations. There is one static page now, so a crawl costs nothing
   * and blocking anyone only makes the transition notice harder to find.
   */
  it('lets every crawler read the transition page', () => {
    const { rules } = robots();
    const list = Array.isArray(rules) ? rules : [rules];

    expect(list).toHaveLength(1);
    expect(list[0].userAgent).toBe('*');
    expect(list[0].allow).toBe('/');
    expect(list[0].disallow).toBeUndefined();
  });

  it('still advertises the sitemap and canonical host', () => {
    const result = robots();
    expect(result.sitemap).toMatch(/\/sitemap\.xml$/);
    expect(result.host).toBeTruthy();
  });
});
