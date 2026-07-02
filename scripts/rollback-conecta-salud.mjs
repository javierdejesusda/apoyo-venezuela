/**
 * Reverse the conecta-salud import, SCOPED to that source only. Deletes every
 * location whose source_ref starts with 'conecta-salud:'; needs attached to
 * those locations are removed by the on-delete-cascade FK. Other imports and
 * organic rows are never touched.
 *
 * Credentials from the environment: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 *
 * Usage:
 *   node --env-file=.env.local scripts/rollback-conecta-salud.mjs        # dry run
 *   node --env-file=.env.local scripts/rollback-conecta-salud.mjs --yes  # delete
 */
import { createClient } from '@supabase/supabase-js';

import { SOURCE_PREFIX } from './conecta-salud-transform.mjs';

const LOCATION_MATCH = `${SOURCE_PREFIX}:%`;
const NEED_MATCH = `${SOURCE_PREFIX}:need:%`;

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return value;
}

async function main() {
  const confirm = process.argv.includes('--yes');
  const supabase = createClient(
    requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false } },
  );

  const [
    { data: locs, error: locErr },
    { count: needCount, error: needErr },
  ] = await Promise.all([
    supabase.from('locations').select('id').like('source_ref', LOCATION_MATCH),
    supabase
      .from('needs')
      .select('*', { count: 'exact', head: true })
      .like('source_ref', NEED_MATCH),
  ]);
  if (locErr) throw locErr;
  if (needErr) throw needErr;

  console.error(
    `conecta-salud locations to delete: ${locs.length} (needs ~${needCount}, cascade)`,
  );

  if (!confirm) {
    console.error('Dry run. Re-run with --yes to delete.');
    console.log(JSON.stringify({ locations: locs.length, needs: needCount, deleted: false }));
    return;
  }

  const { error: delErr } = await supabase
    .from('locations')
    .delete()
    .like('source_ref', LOCATION_MATCH);
  if (delErr) throw delErr;

  console.error(`Deleted ${locs.length} locations (and their needs by cascade).`);
  console.log(JSON.stringify({ locations: locs.length, needs: needCount, deleted: true }));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
