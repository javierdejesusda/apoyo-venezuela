import { describe, expect, it } from 'vitest';

import { availableStateOptions } from '@/lib/data/selectors';
import { VENEZUELA_STATES } from '@/lib/data/types';

describe('availableStateOptions', () => {
  it('returns all 24 canonical states even when locations is empty', () => {
    const result = availableStateOptions([]);
    expect(result).toHaveLength(VENEZUELA_STATES.length);
    for (const state of VENEZUELA_STATES) {
      expect(result).toContain(state);
    }
  });

  it('includes an off-list estado present in the data', () => {
    const result = availableStateOptions([{ estado: 'Estado Fantasma' }]);
    expect(result).toContain('Estado Fantasma');
    // canonical states are still present
    expect(result.length).toBeGreaterThan(VENEZUELA_STATES.length);
  });

  it('does not duplicate when a data estado is already canonical', () => {
    const result = availableStateOptions([{ estado: 'Aragua' }, { estado: 'Aragua' }]);
    const count = result.filter((s) => s === 'Aragua').length;
    expect(count).toBe(1);
    expect(result).toHaveLength(VENEZUELA_STATES.length);
  });

  it('result is sorted by es locale', () => {
    const result = availableStateOptions([{ estado: 'Estado Fantasma' }]);
    const sorted = [...result].sort((a, b) => a.localeCompare(b, 'es'));
    expect(result).toEqual(sorted);
  });
});
