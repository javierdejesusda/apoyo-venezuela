import { describe, expect, it } from 'vitest';

import { magnitudeStyle } from '@/lib/sismos/magnitude';

describe('magnitudeStyle', () => {
  it('grows the epicenter radius with magnitude', () => {
    const small = magnitudeStyle(3);
    const medium = magnitudeStyle(4.5);
    const large = magnitudeStyle(6);
    expect(small.radiusPx).toBeLessThan(medium.radiusPx);
    expect(medium.radiusPx).toBeLessThan(large.radiusPx);
  });

  it('keeps the radius within sane bounds across the magnitude range', () => {
    expect(magnitudeStyle(0).radiusPx).toBeGreaterThanOrEqual(8);
    expect(magnitudeStyle(9).radiusPx).toBeLessThanOrEqual(36);
  });

  it('assigns hotter colors to stronger quakes', () => {
    expect(magnitudeStyle(3).color).not.toBe(magnitudeStyle(5.5).color);
  });

  it('only pulses strong quakes (M4.5+)', () => {
    expect(magnitudeStyle(4.4).pulse).toBe(false);
    expect(magnitudeStyle(4.5).pulse).toBe(true);
    expect(magnitudeStyle(6).pulse).toBe(true);
  });
});
