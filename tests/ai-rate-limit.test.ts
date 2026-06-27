import { describe, expect, it } from 'vitest';

import { clientIp, createRateLimiter } from '@/lib/ai/rate-limit';

describe('createRateLimiter', () => {
  it('allows a request under the window limit', () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 60_000 });

    const result = limiter.check('127.0.0.1');

    expect(result.ok).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it('blocks a request when the limit is exceeded', () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 60_000 });

    limiter.check('127.0.0.1');
    limiter.check('127.0.0.1');
    const result = limiter.check('127.0.0.1');

    expect(result.ok).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('resets the count after the window expires', () => {
    let now = 0;
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000, now: () => now });

    limiter.check('127.0.0.1');
    limiter.check('127.0.0.1'); // blocked

    now = 60_001;
    const result = limiter.check('127.0.0.1');

    expect(result.ok).toBe(true);
  });

  it('isolates counts per key', () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000 });

    limiter.check('1.1.1.1');
    limiter.check('1.1.1.1'); // blocked

    const result = limiter.check('2.2.2.2');

    expect(result.ok).toBe(true);
  });

  it('returns the correct retryAfterSeconds when blocked', () => {
    let now = 0;
    const limiter = createRateLimiter({ limit: 1, windowMs: 30_000, now: () => now });

    limiter.check('127.0.0.1'); // consumes the only slot; windowStart = 0
    now = 10_000;
    const result = limiter.check('127.0.0.1'); // blocked at t=10s

    expect(result.ok).toBe(false);
    // window expires at t=30s; now is t=10s → 20 s remaining
    expect(result.retryAfterSeconds).toBe(20);
  });

  it('evicts expired entries so the window map does not grow unbounded', () => {
    let now = 0;
    const limiter = createRateLimiter({ limit: 5, windowMs: 1_000, now: () => now });

    limiter.check('a');
    limiter.check('b');
    expect(limiter.size()).toBe(2);

    now = 1_001; // both windows have expired

    limiter.check('c');

    expect(limiter.size()).toBe(1);
  });
});

describe('clientIp', () => {
  it('reads the first value from x-forwarded-for', () => {
    const headers = new Headers({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' });

    expect(clientIp(headers)).toBe('1.2.3.4');
  });

  it('falls back to x-real-ip when x-forwarded-for is absent', () => {
    const headers = new Headers({ 'x-real-ip': '9.9.9.9' });

    expect(clientIp(headers)).toBe('9.9.9.9');
  });

  it('prefers the platform-trusted x-real-ip over x-forwarded-for', () => {
    const headers = new Headers({
      'x-real-ip': '9.9.9.9',
      'x-forwarded-for': '1.2.3.4, 5.6.7.8',
    });

    expect(clientIp(headers)).toBe('9.9.9.9');
  });

  it("returns 'unknown' when no IP header is present", () => {
    const headers = new Headers();

    expect(clientIp(headers)).toBe('unknown');
  });
});
