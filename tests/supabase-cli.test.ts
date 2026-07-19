import type { SpawnSyncReturns } from 'node:child_process';

import { describe, expect, it, vi } from 'vitest';

vi.mock('node:child_process', () => ({ spawnSync: vi.fn() }));

import { spawnSync } from 'node:child_process';

import { runSupabase } from '../scripts/lib/supabase-cli.mjs';

function spawnResult(over: Partial<SpawnSyncReturns<string>>): SpawnSyncReturns<string> {
  return { pid: 1, output: [], stdout: '', stderr: '', status: 0, signal: null, ...over };
}

describe('runSupabase', () => {
  it('passes args through to the supabase CLI and returns the spawn result', () => {
    const result = spawnResult({ status: 0, stdout: 'ok' });
    vi.mocked(spawnSync).mockReturnValue(result);

    expect(runSupabase(['db', 'dump', '--linked'])).toBe(result);
    expect(spawnSync).toHaveBeenCalledWith('supabase', ['db', 'dump', '--linked'], {
      encoding: 'utf8',
    });
  });

  it('throws a helpful error when the supabase CLI cannot be spawned', () => {
    vi.mocked(spawnSync).mockReturnValue(spawnResult({ error: new Error('spawn supabase ENOENT') }));

    expect(() => runSupabase(['db', 'dump'])).toThrow(/No se pudo ejecutar 'supabase'/);
  });
});
