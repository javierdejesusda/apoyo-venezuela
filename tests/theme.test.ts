import { describe, expect, it } from 'vitest';

import { nextTheme, normalizeTheme, THEME_STORAGE_KEY, themeInitScript } from '@/lib/theme';

describe('normalizeTheme', () => {
  it('keeps an explicit dark preference', () => {
    expect(normalizeTheme('dark')).toBe('dark');
  });

  it('keeps an explicit light preference', () => {
    expect(normalizeTheme('light')).toBe('light');
  });

  it('defaults to light when nothing is stored', () => {
    expect(normalizeTheme(null)).toBe('light');
    expect(normalizeTheme(undefined)).toBe('light');
  });

  it('defaults to light for any unrecognized value', () => {
    expect(normalizeTheme('system')).toBe('light');
    expect(normalizeTheme('')).toBe('light');
    expect(normalizeTheme('DARK')).toBe('light');
  });
});

describe('nextTheme', () => {
  it('flips light to dark', () => {
    expect(nextTheme('light')).toBe('dark');
  });

  it('flips dark to light', () => {
    expect(nextTheme('dark')).toBe('light');
  });
});

describe('THEME_STORAGE_KEY', () => {
  it('is the namespaced apoyo key', () => {
    expect(THEME_STORAGE_KEY).toBe('apoyo-theme');
  });
});

describe('themeInitScript', () => {
  /** Executes the no-flash script against mock browser globals. */
  function run(script: string, getItem: () => string | null): string | undefined {
    const element = { dataset: {} as Record<string, string | undefined> };
    const documentMock = { documentElement: element };
    const storageMock = { getItem };
    new Function('localStorage', 'document', script)(storageMock, documentMock);
    return element.dataset.theme;
  }

  it('applies a stored dark preference before paint', () => {
    expect(run(themeInitScript(), () => 'dark')).toBe('dark');
  });

  it('applies light when nothing is stored', () => {
    expect(run(themeInitScript(), () => null)).toBe('light');
  });

  it('falls back to light for unknown stored values', () => {
    expect(run(themeInitScript(), () => 'sepia')).toBe('light');
  });

  it('reads from the shared storage key', () => {
    expect(themeInitScript()).toContain(THEME_STORAGE_KEY);
  });

  it('never throws when storage access is blocked', () => {
    expect(() =>
      run(themeInitScript(), () => {
        throw new Error('blocked');
      }),
    ).not.toThrow();
  });
});
