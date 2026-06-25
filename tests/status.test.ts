import { describe, expect, it } from 'vitest';

import {
  categoryMeta,
  contactCategoryMeta,
  needStatusMeta,
  statusMeta,
  toneClasses,
  urgencyMeta,
} from '@/lib/status';
import {
  CONTACT_CATEGORIES,
  EMERGENCY_STATUSES,
  NEED_CATEGORIES,
  NEED_STATUSES,
  URGENCIES,
} from '@/lib/data/types';

describe('status metadata', () => {
  it('has an entry with a label and icon for every emergency status', () => {
    for (const s of EMERGENCY_STATUSES) {
      expect(statusMeta[s].label.length).toBeGreaterThan(0);
      expect(statusMeta[s].icon).toBeDefined();
    }
  });

  it('covers every urgency, need status, category and contact category', () => {
    for (const u of URGENCIES) expect(urgencyMeta[u].label.length).toBeGreaterThan(0);
    for (const n of NEED_STATUSES) expect(needStatusMeta[n].label.length).toBeGreaterThan(0);
    for (const c of NEED_CATEGORIES) expect(categoryMeta[c].label.length).toBeGreaterThan(0);
    for (const c of CONTACT_CATEGORIES) expect(contactCategoryMeta[c].label.length).toBeGreaterThan(0);
  });
});

describe('toneClasses', () => {
  it('returns class strings for each tone', () => {
    for (const tone of ['danger', 'warning', 'success', 'neutral', 'brand'] as const) {
      const classes = toneClasses(tone);
      expect(typeof classes.text).toBe('string');
      expect(typeof classes.bg).toBe('string');
      expect(classes.text.length).toBeGreaterThan(0);
    }
  });
});
