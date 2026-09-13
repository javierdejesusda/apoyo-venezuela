import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * `vercel.json` holds the two deployment settings that decide what this project
 * costs while nobody is using it, and both fail silently if they are changed:
 * nothing in the build output or the test suite would otherwise notice.
 *
 * The site runs on the Vercel free tier, so the binding constraint is idle cost
 * rather than traffic. Builds are the last recurring consumer: every push to any
 * branch triggers a full preview build, and the ISR write budget guarded by
 * `isr-budget.test.ts` already covers the other one.
 */
interface VercelConfig {
  crons?: Array<{ path: string; schedule: string }>;
  git?: { deploymentEnabled?: boolean | Record<string, boolean> };
}

function readVercelConfig(): VercelConfig {
  return JSON.parse(readFileSync(join(process.cwd(), 'vercel.json'), 'utf8')) as VercelConfig;
}

describe('keep-alive cron', () => {
  /**
   * Supabase Free pauses a project after roughly seven days without API
   * activity, which takes the whole site down with it. This cron is the only
   * thing keeping the database awake, so it is load-bearing despite looking
   * like an easy invocation to save.
   */
  it('still schedules the keep-alive ping', () => {
    const crons = readVercelConfig().crons ?? [];
    const keepAlive = crons.find((cron) => cron.path === '/api/cron/keep-alive');

    expect(keepAlive, 'removing this cron pauses Supabase within a week').toBeDefined();
  });

  /** Vercel Hobby rejects a deployment whose cron runs more than once a day. */
  it('runs at most once a day', () => {
    const crons = readVercelConfig().crons ?? [];

    for (const cron of crons) {
      const [minute, hour] = cron.schedule.split(' ');
      expect(minute, `${cron.path} must pin a minute`).not.toContain('*');
      expect(hour, `${cron.path} must pin an hour`).not.toContain('*');
    }
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
