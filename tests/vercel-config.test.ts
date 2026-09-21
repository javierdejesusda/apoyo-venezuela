import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * `vercel.json` holds the deployment settings that decide what this project
 * costs while nobody is using it, and they fail silently if they are changed:
 * nothing in the build output would otherwise notice.
 *
 * The site is a single static page now, so the only thing left that can consume
 * anything on its own is a scheduled job or an automatic build.
 */
interface VercelConfig {
  crons?: Array<{ path: string; schedule: string }>;
  git?: { deploymentEnabled?: boolean | Record<string, boolean> };
}

function readVercelConfig(): VercelConfig {
  return JSON.parse(readFileSync(join(process.cwd(), 'vercel.json'), 'utf8')) as VercelConfig;
}

describe('scheduled jobs', () => {
  /**
   * The keep-alive cron existed to stop Supabase Free from pausing the project.
   * Nothing reads that database through this deployment any more, and the route
   * the cron called is gone, so a surviving schedule would only spend function
   * invocations calling a path that returns a redirect.
   */
  it('schedules nothing, since no route is left to call', () => {
    expect(readVercelConfig().crons ?? []).toEqual([]);
  });
});

describe('automatic deployments', () => {
  /**
   * A preview build runs the full install, build and deploy pipeline, so an
   * ordinary branch push costs the same as shipping. Nobody reviews previews on
   * this project, which makes them pure waste.
   */
  it('does not build preview deployments for branch pushes', () => {
    const deploymentEnabled = readVercelConfig().git?.deploymentEnabled;

    expect(deploymentEnabled, 'git.deploymentEnabled must be configured').toBeDefined();
    expect(typeof deploymentEnabled).toBe('object');
    expect((deploymentEnabled as Record<string, boolean>)['**']).toBe(false);
  });

  /**
   * Vercel deploys a branch when it matches at least one rule set to `true`, so
   * naming `main` explicitly keeps production shipping on merge even though the
   * catch-all pattern also matches it.
   */
  it('still deploys production on merge to main', () => {
    const deploymentEnabled = readVercelConfig().git?.deploymentEnabled as Record<string, boolean>;

    expect(deploymentEnabled.main).toBe(true);
  });
});
