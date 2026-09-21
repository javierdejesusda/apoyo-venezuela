import { describe, expect, it } from 'vitest';

import { EMERGENCY_SHORTCODES, PRIMARY_SHORTCODE } from '@/lib/data/emergency-shortcodes';

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

  /**
   * List order is a display decision. Deriving the header shortcut from it
   * would mean a presentation change silently altered which number a tap
   * places, so the primary is declared on its own and reused in the list.
   */
  it('declares the primary code independently of the list order', () => {
    expect(EMERGENCY_SHORTCODES).toContain(PRIMARY_SHORTCODE);
  });
});
