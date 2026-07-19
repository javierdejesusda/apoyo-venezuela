import { describe, expect, it } from 'vitest';

import { buildBackupFilename } from '../scripts/backup-db.mjs';

describe('buildBackupFilename', () => {
  it('formats a date as backup-YYYY-MM-DD.sql', () => {
    expect(buildBackupFilename(new Date('2026-07-19T12:00:00Z'))).toBe('backup-2026-07-19.sql');
  });

  it('zero-pads single-digit month and day', () => {
    expect(buildBackupFilename(new Date('2026-01-05T00:00:00Z'))).toBe('backup-2026-01-05.sql');
  });
});
