#!/usr/bin/env node
/**
 * Local database backup for the Supabase Free tier, which has no automated
 * backups.
 *
 * Like scripts/delete-report.mjs, this leans on the already-authenticated
 * Supabase CLI (`supabase login` + `supabase link`), so it needs no
 * service_role key. It dumps the linked project into backups/<dated>.sql.
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

/** Builds the dated dump filename (e.g. backup-2026-07-19.sql) from a Date. */
export function buildBackupFilename(date) {
  return `backup-${date.toISOString().slice(0, 10)}.sql`;
}

async function main() {
  mkdirSync(BACKUP_DIR, { recursive: true });
  const file = `${BACKUP_DIR}/${buildBackupFilename(new Date())}`;
  const result = runSupabase(['db', 'dump', '--linked', '-f', file]);
  if (result.status !== 0) {
    throw new Error(result.stderr?.trim() || result.stdout?.trim() || 'supabase db dump falló.');
  }
  console.log(`\nListo. Backup guardado en ${file}.`);
}

const invokedDirectly = import.meta.url === pathToFileURL(process.argv[1] ?? '').href;
if (invokedDirectly) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
  });
}
