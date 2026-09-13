import { describe, expect, it } from 'vitest';

import { parseRevalidatePaths } from '@/lib/api/revalidate-paths';

const ZONE = '/zona/3f1c9b2e-4a5d-4e6f-8a7b-9c0d1e2f3a4b';

describe('parseRevalidatePaths', () => {
  it('accepts the listing paths', () => {
    expect(parseRevalidatePaths({ paths: ['/', '/recaudaciones'] })).toEqual([
      '/',
      '/recaudaciones',
    ]);
  });

  it('accepts a zone path addressed by uuid', () => {
    expect(parseRevalidatePaths({ paths: [ZONE] })).toEqual([ZONE]);
  });

  it('drops duplicates so one path is never revalidated twice', () => {
    expect(parseRevalidatePaths({ paths: ['/', '/'] })).toEqual(['/']);
  });

  it('rejects a zone path whose id is not a uuid', () => {
    expect(parseRevalidatePaths({ paths: ['/zona/not-a-uuid'] })).toBeNull();
  });

  it('rejects paths outside the allowlist', () => {
    expect(parseRevalidatePaths({ paths: ['/reportar'] })).toBeNull();
    expect(parseRevalidatePaths({ paths: ['/zona/../../etc'] })).toBeNull();
  });

  it('rejects a missing, empty or malformed body', () => {
    expect(parseRevalidatePaths(null)).toBeNull();
    expect(parseRevalidatePaths({})).toBeNull();
    expect(parseRevalidatePaths({ paths: [] })).toBeNull();
    expect(parseRevalidatePaths({ paths: '/' })).toBeNull();
    expect(parseRevalidatePaths({ paths: [1] })).toBeNull();
  });

  it('rejects a batch larger than the cap so one call cannot burn the budget', () => {
    const many = Array.from({ length: 51 }, (_, i) => `/zona/${'0'.repeat(8)}-0000-0000-0000-${String(i).padStart(12, '0')}`);
    expect(parseRevalidatePaths({ paths: many })).toBeNull();
  });
});
