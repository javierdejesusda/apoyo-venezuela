import { describe, expect, it } from 'vitest';

import { buildBackupFilename } from '../scripts/backup-db.mjs';

describe('buildBackupFilename', () => {
  it('builds a schema dump filename from a date', () => {
    expect(buildBackupFilename(new Date('2026-07-19T12:00:00Z'), 'schema')).toBe(
      'backup-2026-07-19-schema.sql',
    );
  });

  it('builds a data dump filename from a date', () => {
    expect(buildBackupFilename(new Date('2026-07-19T12:00:00Z'), 'data')).toBe(
      'backup-2026-07-19-data.sql',
    );
  });

  it('zero-pads single-digit month and day', () => {
    expect(buildBackupFilename(new Date('2026-01-05T00:00:00Z'), 'data')).toBe(
      'backup-2026-01-05-data.sql',
    );
  });
});
