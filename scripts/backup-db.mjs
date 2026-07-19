#!/usr/bin/env node
/**
 * Local database backup for the Supabase Free tier, which has no automated
 * backups.
 *
 * Like scripts/delete-report.mjs, this leans on the already-authenticated
 * Supabase CLI (`supabase login` + `supabase link`), so it needs no
 * service_role key. `supabase db dump` writes schema only by default, so this
 * runs it twice: a schema dump and a `--data-only` dump. The data is the
 * valuable part (the schema is already versioned in supabase/migrations/).
 *
 * Dumps contain reporter contact PII and the repo is public, so backups/ is
 * gitignored and must never be committed.
 *
 * Usage:
 *   node scripts/backup-db.mjs
 */
import { mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

import { runSupabase } from './lib/supabase-cli.mjs';

const BACKUP_DIR = 'backups';

/**
 * Builds a dated dump filename from a Date and a kind, e.g.
 * buildBackupFilename(date, 'data') => 'backup-2026-07-19-data.sql'.
 */
export function buildBackupFilename(date, kind) {
  return `backup-${date.toISOString().slice(0, 10)}-${kind}.sql`;
}

function dump(label, args) {
  const result = runSupabase(['db', 'dump', '--linked', ...args]);
  if (result.status !== 0) {
    throw new Error(
      result.stderr?.trim() || result.stdout?.trim() || `supabase db dump (${label}) falló.`,
    );
  }
}

async function main() {
  mkdirSync(BACKUP_DIR, { recursive: true });
  const date = new Date();
  const schemaFile = `${BACKUP_DIR}/${buildBackupFilename(date, 'schema')}`;
  const dataFile = `${BACKUP_DIR}/${buildBackupFilename(date, 'data')}`;
  dump('schema', ['-f', schemaFile]);
  dump('data', ['--data-only', '--use-copy', '-f', dataFile]);
  console.log(`\nListo. Backups guardados en ${schemaFile} y ${dataFile}.`);
}

const invokedDirectly = import.meta.url === pathToFileURL(process.argv[1] ?? '').href;
if (invokedDirectly) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
  });
}
