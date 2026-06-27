/**
 * In-memory fixed-window rate limiter with per-key isolation.
 *
 * Best-effort and per-instance only: each serverless instance keeps its own
 * Map, so it does not enforce a global ceiling across instances. The real cost
 * ceiling must be an OpenAI-side spend limit; a durable shared store (KV) is
 * deferred to Tier 2.
 */

export interface RateLimitOutcome {
  ok: boolean;
  remaining: number;
  /** Seconds until the current window expires. Zero when ok === true. */
  retryAfterSeconds: number;
}

export interface RateLimiterConfig {
  /** Maximum requests allowed per window. */
  limit: number;
  /** Window duration in milliseconds. */
  windowMs: number;
  /** Clock function (defaults to Date.now). Inject for deterministic tests. */
  now?: () => number;
}

export interface RateLimiter {
  check(key: string): RateLimitOutcome;
  /** Number of tracked windows. Exposed for eviction and observability. */
  size(): number;
}

interface WindowState {
  count: number;
  windowStart: number;
}

/** Creates an isolated in-memory rate limiter instance. */
export function createRateLimiter(config: RateLimiterConfig): RateLimiter {
  const { limit, windowMs, now = Date.now } = config;
  const windows = new Map<string, WindowState>();

  function evictExpired(currentTime: number): void {
    for (const [key, state] of windows) {
      if (currentTime - state.windowStart >= windowMs) {
        windows.delete(key);
      }
    }
  }

  return {
    check(key: string): RateLimitOutcome {
      const currentTime = now();
      evictExpired(currentTime);
      const state = windows.get(key);

      if (!state || currentTime - state.windowStart >= windowMs) {
        windows.set(key, { count: 1, windowStart: currentTime });
        return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
      }

      if (state.count >= limit) {
        const expiresAt = state.windowStart + windowMs;
        const retryAfterMs = expiresAt - currentTime;
        return {
          ok: false,
          remaining: 0,
          retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
        };
      }

      state.count += 1;
      return { ok: true, remaining: limit - state.count, retryAfterSeconds: 0 };
    },
    size(): number {
      return windows.size;
    },
  };
}

/**
 * Extracts the client IP from standard proxy headers.
 *
 * Prefers x-real-ip because Vercel sets it to a single trusted client IP that
 * cannot be spoofed by the caller. Falls back to the first x-forwarded-for
 * value, then 'unknown'.
 */
export function clientIp(headers: Headers): string {
  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return 'unknown';
}
