import { describe, expect, it } from 'vitest';

import { formatPlaceEs, relativeTimeEs } from '@/lib/sismos/format';

describe('relativeTimeEs', () => {
  const now = Date.UTC(2026, 5, 27, 12, 0, 0);
  const ago = (ms: number) => relativeTimeEs(now - ms, now);

  it('reads "justo ahora" within the last minute', () => {
    expect(ago(0)).toBe('justo ahora');
    expect(ago(59_000)).toBe('justo ahora');
  });

  it('reads minutes under an hour', () => {
    expect(ago(60_000)).toBe('hace 1 min');
    expect(ago(59 * 60_000)).toBe('hace 59 min');
  });

  it('reads hours under a day', () => {
    expect(ago(60 * 60_000)).toBe('hace 1 h');
    expect(ago(23 * 60 * 60_000)).toBe('hace 23 h');
  });

  it('reads days beyond that', () => {
    expect(ago(24 * 60 * 60_000)).toBe('hace 1 d');
    expect(ago(6 * 24 * 60 * 60_000)).toBe('hace 6 d');
  });

  it('clamps a future timestamp to "justo ahora"', () => {
    expect(relativeTimeEs(now + 10_000, now)).toBe('justo ahora');
  });
});

describe('formatPlaceEs', () => {
  it('translates the "X km DIR of PLACE" pattern to Spanish', () => {
    expect(formatPlaceEs('54 km N of El Limón, Venezuela')).toBe(
      '54 km al N de El Limón, Venezuela',
    );
    expect(formatPlaceEs('12 km SSW of Caracas')).toBe('12 km al SSW de Caracas');
  });

  it('leaves places that do not match the pattern unchanged', () => {
    expect(formatPlaceEs('Venezuela region')).toBe('Venezuela region');
    expect(formatPlaceEs('')).toBe('');
  });
});
