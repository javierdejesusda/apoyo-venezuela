import { describe, expect, it } from 'vitest';

import { EMERGENCY_SHORTCODES } from '@/lib/data/emergency-shortcodes';

/**
 * The national emergency number in Venezuela depends on the caller's carrier,
 * and the transition page is the only screen left that can say so. Publishing
 * one code as if it worked everywhere would send people on another network to
 * a dead line during an emergency.
 */
describe('emergency shortcodes', () => {
  it('covers every carrier confirmed in the source data', () => {
    expect(EMERGENCY_SHORTCODES.map((entry) => entry.code)).toEqual([
      '911',
      '112',
      '*1',
      '171',
    ]);
  });

  it('names the network each code is dialled from', () => {
    expect(EMERGENCY_SHORTCODES.map((entry) => entry.carrier)).toEqual([
      'Movistar',
      'Digitel',
      'Movilnet',
      'línea fija CANTV',
    ]);
  });

  it('gives every code a dialable tel: target', () => {
    for (const entry of EMERGENCY_SHORTCODES) {
      expect(entry.href).toBe(`tel:${entry.code}`);
    }
  });
});
