/**
 * Validation for the on-demand revalidation endpoint.
 *
 * Pages are cached for a long time so the Vercel ISR write budget survives
 * crawler traffic, which means a change made outside the app (a maintainer
 * running `npm run delete-report`, or a data importer writing straight to
 * Supabase) would otherwise stay visible until the window expires. Those
 * callers name the paths they invalidated instead. Every regeneration costs an
 * ISR write, so the input is an allowlist of shapes the app actually renders
 * and a bounded batch, never arbitrary caller-supplied paths.
 */
import { parseUuid } from './params';

const ZONE_PREFIX = '/zona/';

/** Paths with no dynamic segment that the app serves from the ISR cache. */
const LISTING_PATHS = new Set(['/', '/recaudaciones']);

/** Most paths one call may invalidate, so a single request cannot burn the budget. */
const MAX_PATHS = 50;

function isAllowed(path: string): boolean {
  if (LISTING_PATHS.has(path)) return true;
  if (!path.startsWith(ZONE_PREFIX)) return false;
  return parseUuid(path.slice(ZONE_PREFIX.length)) !== null;
}

/**
 * Validates a revalidation request body.
 *
 * Args:
 *   body: The parsed JSON body, expected to be `{ paths: string[] }`.
 *
 * Returns:
 *   The deduplicated paths to revalidate, or null when the body is malformed,
 *   empty, over the batch cap, or names a path outside the allowlist.
 */
export function parseRevalidatePaths(body: unknown): string[] | null {
  if (typeof body !== 'object' || body === null) return null;

  const { paths } = body as { paths?: unknown };
  if (!Array.isArray(paths) || paths.length === 0 || paths.length > MAX_PATHS) return null;
  if (!paths.every((path) => typeof path === 'string' && isAllowed(path))) return null;

  return [...new Set(paths as string[])];
}
