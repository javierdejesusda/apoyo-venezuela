/** In-memory fixed-window rate limiter with per-key isolation. */

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
}

interface WindowState {
  count: number;
  windowStart: number;
}

/** Creates an isolated in-memory rate limiter instance. */
export function createRateLimiter(config: RateLimiterConfig): RateLimiter {
  const { limit, windowMs, now = Date.now } = config;
  const windows = new Map<string, WindowState>();

  return {
    check(key: string): RateLimitOutcome {
      const currentTime = now();
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
  };
}

/** Extracts the client IP from standard proxy headers. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return headers.get('x-real-ip') ?? 'unknown';
}
