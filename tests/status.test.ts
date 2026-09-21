import { describe, expect, it } from 'vitest';

import {
  TONE_HEX,
  categoryMeta,
  needStatusMeta,
  statusMeta,
  toneClasses,
  urgencyMeta,
} from '@/lib/status';
import {
  EMERGENCY_STATUSES,
  NEED_CATEGORIES,
  NEED_STATUSES,
  URGENCIES,
} from '@/lib/data/types';

describe('EMERGENCY_STATUSES', () => {
  it('contains exactly the 5 severity values and not the legacy danado', () => {
    const statuses = [...EMERGENCY_STATUSES];
    expect(statuses).toContain('derrumbe');
    expect(statuses).toContain('dano_grave');
    expect(statuses).toContain('dano_parcial');
    expect(statuses).toContain('desconocido');
    expect(statuses).toContain('estable');
    expect(statuses).not.toContain('danado');
    expect(statuses).toHaveLength(5);
  });
});

describe('status metadata', () => {
  it('has an entry with a label and icon for every emergency status', () => {
    for (const s of EMERGENCY_STATUSES) {
      expect(statusMeta[s].label.length).toBeGreaterThan(0);
      expect(statusMeta[s].icon).toBeDefined();
    }
  });

  it('has entries for dano_grave and dano_parcial but not danado', () => {
    expect(statusMeta['dano_grave']).toBeDefined();
    expect(statusMeta['dano_parcial']).toBeDefined();
    // danado key should not exist
    expect((statusMeta as Record<string, unknown>)['danado']).toBeUndefined();
  });

  it('uses correctly accented Spanish labels for the new severity values', () => {
    // Enum values stay ASCII; user-facing labels use proper es_VE orthography.
    expect(statusMeta['dano_grave'].label).toBe('Daño grave');
    expect(statusMeta['dano_parcial'].label).toBe('Daño parcial');
  });

  it('covers every urgency, need status and category', () => {
    for (const u of URGENCIES) expect(urgencyMeta[u].label.length).toBeGreaterThan(0);
    for (const n of NEED_STATUSES) expect(needStatusMeta[n].label.length).toBeGreaterThan(0);
    for (const c of NEED_CATEGORIES) expect(categoryMeta[c].label.length).toBeGreaterThan(0);
  });
});

describe('toneClasses', () => {
  it('returns class strings for each tone', () => {
    for (const tone of ['danger', 'warning', 'success', 'neutral', 'brand', 'severe'] as const) {
      const classes = toneClasses(tone);
      expect(typeof classes.text).toBe('string');
      expect(typeof classes.bg).toBe('string');
      expect(classes.text.length).toBeGreaterThan(0);
    }
  });

  it('uses accessible on-soft text tokens for the semaphore tones', () => {
    expect(toneClasses('danger').text).toBe('text-tone-danger-text');
    expect(toneClasses('warning').text).toBe('text-tone-warning-text');
    expect(toneClasses('success').text).toBe('text-tone-success-text');
    expect(toneClasses('brand').text).toBe('text-tone-brand-text');
  });

  it('keeps the base semaphore tone for dots and solids', () => {
    expect(toneClasses('danger').dot).toBe('bg-danger');
    expect(toneClasses('warning').dot).toBe('bg-warning');
    expect(toneClasses('success').dot).toBe('bg-success');
    expect(toneClasses('danger').solid).toBe('bg-danger text-white');
  });

  it('returns a non-null object with all required keys for severe tone', () => {
    const classes = toneClasses('severe');
    expect(classes).not.toBeNull();
    expect(typeof classes.text).toBe('string');
    expect(typeof classes.bg).toBe('string');
    expect(typeof classes.border).toBe('string');
    expect(typeof classes.dot).toBe('string');
    expect(typeof classes.solid).toBe('string');
    expect(classes.text.length).toBeGreaterThan(0);
  });
});

describe('TONE_HEX', () => {
  it('has a hex value for the severe tone', () => {
    expect(TONE_HEX['severe']).toBeDefined();
    expect(typeof TONE_HEX['severe']).toBe('string');
    expect(TONE_HEX['severe'].startsWith('#')).toBe(true);
  });
});
