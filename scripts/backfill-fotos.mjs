/**
 * Recompress every photo already stored in the public `fotos` bucket to a
 * capped WebP, in place. New uploads and re-hosted import photos are already
 * WebP-encoded at write time; this backfills the objects that predate that
 * change so the app can serve them raw (no billed Supabase image transformation)
 * without shipping multi-megabyte originals over egress.
 *
 * Each object is overwritten at its existing path, so the URLs stored in
 * `locations.fotos` stay valid (the extension is cosmetic - browsers honor the
 * `image/webp` content-type). Idempotent: objects already stored as WebP are
 * skipped, so re-running is safe and only touches what is left.
 *
 * Usage:
 *   node scripts/backfill-fotos.mjs --dry-run
 *   node scripts/backfill-fotos.mjs --limit 50
 *   node scripts/backfill-fotos.mjs --concurrency 4
 *
 * Env: SUPABASE_URL plus SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY).
 */
import { createClient } from '@supabase/supabase-js';

import { requireEnv, requireServiceKey } from './lib/env.mjs';
import { resizeToWebp } from './lib/image-resize.mjs';

const BUCKET = 'fotos';
const LIST_PAGE = 100;

function parseArgs(argv) {
  const args = { limit: null, dryRun: false, concurrency: 4 };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--limit') args.limit = Number(argv[(i += 1)]);
    else if (a === '--concurrency') args.concurrency = Number(argv[(i += 1)]);
  }
  return args;
}

/**
 * Walk the bucket breadth-first and yield every file object with its full path.
 * Supabase `list` is per-prefix, not recursive: entries with no `metadata` are
 * folders to descend into, entries with `metadata` are files.
 */
async function listAllObjects(supabase) {
  const files = [];
  const prefixes = [''];
  while (prefixes.length > 0) {
    const prefix = prefixes.shift();
    let offset = 0;
    for (;;) {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .list(prefix, { limit: LIST_PAGE, offset });
      if (error) throw error;
      if (!data || data.length === 0) break;
      for (const entry of data) {
        const path = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.metadata) files.push({ path, metadata: entry.metadata });
        else prefixes.push(path);
      }
      if (data.length < LIST_PAGE) break;
      offset += LIST_PAGE;
    }
  }
  return files;
}

async function recompress(supabase, path) {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error) throw error;
  const source = Buffer.from(await data.arrayBuffer());
  const webp = await resizeToWebp(source);
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, webp, { contentType: 'image/webp', upsert: true });
  if (upErr) throw upErr;
  return { before: source.length, after: webp.length };
}

async function pool(items, concurrency, mapper) {
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next;
      next += 1;
      await mapper(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const url = requireEnv('SUPABASE_URL');
  const serviceKey = requireServiceKey();
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  const all = await listAllObjects(supabase);
  const pending = all.filter((f) => f.metadata?.mimetype !== 'image/webp');
  const targets = args.limit ? pending.slice(0, args.limit) : pending;
  console.error(
    `Bucket has ${all.length} objects; ${pending.length} not yet WebP; processing ${targets.length}${args.dryRun ? ' [DRY RUN]' : ''}`,
  );

  const summary = { converted: 0, failed: 0, bytesBefore: 0, bytesAfter: 0 };
  await pool(targets, args.dryRun ? 1 : args.concurrency, async (file) => {
    if (args.dryRun) {
      console.error(`  ~ would recompress ${file.path} (${file.metadata?.mimetype ?? 'unknown'})`);
      return;
    }
    try {
      const { before, after } = await recompress(supabase, file.path);
      summary.converted += 1;
      summary.bytesBefore += before;
      summary.bytesAfter += after;
      console.error(`  + ${file.path}  ${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB`);
    } catch (err) {
      summary.failed += 1;
      console.error(`  ! FAILED ${file.path}: ${err.message}`);
    }
  });

  console.log(JSON.stringify(summary));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
