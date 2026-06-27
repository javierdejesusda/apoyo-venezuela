/**
 * Reverse the ayudaencamino.com import, SCOPED to that source only. Deletes
 * every location whose `source_ref` points at ayudaencamino.com; the needs
 * attached to those locations are removed by the on-delete-cascade FK. Other
 * imports (e.g. terremotovenezuela.com) and organic rows are never touched.
 *
 * The import re-hosts no photos, so there is no storage to clean up.
 *
 * Credentials from the environment: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 *
 * Usage:
 *   node --env-file=.env.local scripts/rollback-ayudaencamino.mjs        # dry run
 *   node --env-file=.env.local scripts/rollback-ayudaencamino.mjs --yes  # delete
 */
import { createClient } from '@supabase/supabase-js';

const SOURCE_MATCH = '%ayudaencamino.com%';

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

  const { data: locs, error: locErr } = await supabase
    .from('locations')
    .select('id')
    .ilike('source_ref', SOURCE_MATCH);
  if (locErr) throw locErr;

  const { count: needCount, error: needErr } = await supabase
    .from('needs')
    .select('*', { count: 'exact', head: true })
    .ilike('source_ref', SOURCE_MATCH);
  if (needErr) throw needErr;

  console.error(`ayudaencamino locations to delete: ${locs.length} (needs ~${needCount}, cascade)`);

  if (!confirm) {
    console.error('Dry run. Re-run with --yes to delete.');
    console.log(JSON.stringify({ locations: locs.length, needs: needCount, deleted: false }));
    return;
  }

  const { error: delErr } = await supabase
    .from('locations')
    .delete()
    .ilike('source_ref', SOURCE_MATCH);
  if (delErr) throw delErr;

  console.error(`Deleted ${locs.length} locations (and their needs by cascade).`);
  console.log(JSON.stringify({ locations: locs.length, needs: needCount, deleted: true }));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
