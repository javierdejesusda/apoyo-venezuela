import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Vercel bills ISR by cache writes, not reads: each background regeneration of
 * a path is one write. The ceiling is therefore `paths x windows per month`,
 * independent of traffic, so a short window on a route with thousands of paths
 * is what exhausts the allowance. Next.js requires `revalidate` to be a literal
 * in each segment, so this test reads the values that actually ship.
 */
const SECONDS_PER_DAY = 86_400;
const DAYS_PER_MONTH = 30;

/** Included ISR Writes per month on the Vercel free tier. */
const FREE_ISR_WRITES_PER_MONTH = 200_000;

/** Rows in `locations`, one per `/zona/<id>` path. From the 2026-07-19 dump. */
const ZONE_PATHS = 2_119;

/** Reads a numeric constant straight out of a source file. */
function literalConstant(file: string, name: string): number {
  const source = readFileSync(join(process.cwd(), file), 'utf8');
  const match = source.match(new RegExp(`^(?:export )?const ${name} = (\\d+);$`, 'm'));
  if (!match) throw new Error(`No literal ${name} in ${file}`);
  return Number(match[1]);
}

const revalidateOf = (pageFile: string) => literalConstant(pageFile, 'revalidate');

function monthlyWriteCeiling(paths: number, revalidateSeconds: number): number {
  if (paths <= 0) return 0;
  return paths * Math.ceil((SECONDS_PER_DAY / revalidateSeconds) * DAYS_PER_MONTH);
}

function siteWriteCeiling(zonePaths: number): number {
  return (
    monthlyWriteCeiling(zonePaths, revalidateOf('app/zona/[id]/page.tsx')) +
    monthlyWriteCeiling(1, revalidateOf('app/recaudaciones/page.tsx'))
  );
}

describe('monthlyWriteCeiling', () => {
  it('counts one write per path per revalidation window', () => {
    expect(monthlyWriteCeiling(1, 86_400)).toBe(30);
    expect(monthlyWriteCeiling(10, 3_600)).toBe(7_200);
  });

  it('returns zero when no path is cached', () => {
    expect(monthlyWriteCeiling(0, 300)).toBe(0);
  });
});

describe('configured revalidation windows', () => {
  it('keeps the site inside the free ISR Write allowance', () => {
    expect(siteWriteCeiling(ZONE_PATHS)).toBeLessThan(FREE_ISR_WRITES_PER_MONTH);
  });

  it('still fits if the number of zones doubles', () => {
    expect(siteWriteCeiling(ZONE_PATHS * 2)).toBeLessThan(FREE_ISR_WRITES_PER_MONTH);
  });

  it('keeps zones on a longer window than the listing page', () => {
    expect(revalidateOf('app/zona/[id]/page.tsx')).toBeGreaterThan(
      revalidateOf('app/recaudaciones/page.tsx'),
    );
  });
});
