/**
 * Import building damage reports from terremotovenezuela.com into our
 * `locations` table, re-hosting their photos into our `fotos` Storage bucket.
 *
 * Idempotent: every imported row carries `source_ref` (unique partial index),
 * so re-running, overlapping slices, or parallel workers never duplicate.
 *
 * Credentials come from the environment (never committed):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   - our project (write target)
 *   TERREMOTO_REST  (default: source PostgREST base)
 *   TERREMOTO_KEY   (source public anon/publishable key - shipped in their app)
 *
 * Usage:
 *   node scripts/import-terremoto.mjs --limit 10
 *   node scripts/import-terremoto.mjs --offset 100 --limit 100
 *   node scripts/import-terremoto.mjs --dry-run --limit 5
 */
import { createClient } from '@supabase/supabase-js';

import { isMissingPersonReport, toProxyUrl, transformBuilding } from './terremoto-transform.mjs';

const SOURCE_REST = process.env.TERREMOTO_REST ?? 'https://jckifxsdlnsvbztxydes.supabase.co/rest/v1';
const SOURCE_KEY = process.env.TERREMOTO_KEY ?? 'sb_publishable_i7iEDrCVZcSt0k3RGFrY4g_WrtZBB4w';
const SOURCE_TABLE = 'buildings';
const SOURCE_SELECT =
  'id,name,address,city,zone,lat,lng,damage_level,status,main_photo_url,media_urls,general_source,notes,trapped_names,has_missing_persons,last_updated_at,created_at';
const BUCKET = 'fotos';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

function parseArgs(argv) {
  const args = { limit: null, offset: 0, dryRun: false, concurrency: 4 };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--limit') args.limit = Number(argv[(i += 1)]);
    else if (a === '--offset') args.offset = Number(argv[(i += 1)]);
    else if (a === '--concurrency') args.concurrency = Number(argv[(i += 1)]);
  }
  return args;
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return value;
}

/** Fetch a stable, ordered slice of source rows. */
async function fetchSourceSlice(offset, limit) {
  const params = new URLSearchParams({
    select: SOURCE_SELECT,
    order: 'created_at.asc,id.asc',
  });
  const headers = {
    apikey: SOURCE_KEY,
    Authorization: `Bearer ${SOURCE_KEY}`,
    Accept: 'application/json',
    Prefer: 'count=exact',
  };
  if (limit != null) {
    headers.Range = `${offset}-${offset + limit - 1}`;
    headers['Range-Unit'] = 'items';
  }
  const res = await fetch(`${SOURCE_REST}/${SOURCE_TABLE}?${params}`, { headers });
  if (!res.ok) throw new Error(`source fetch ${res.status}: ${await res.text()}`);
  const rows = await res.json();
  // Without a Range header PostgREST silently caps at its max_rows (1000 on
  // Supabase), so guard the unbounded path against a half-imported source.
  if (limit == null) {
    const total = Number(res.headers.get('content-range')?.split('/')[1]);
    if (Number.isFinite(total) && rows.length < total) {
      throw new Error(`source returned ${rows.length} of ${total} rows; page with --offset/--limit`);
    }
  }
  return rows;
}

const EXT_BY_TYPE = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

function inferExt(url, contentType) {
  if (contentType && EXT_BY_TYPE[contentType.toLowerCase()]) return EXT_BY_TYPE[contentType.toLowerCase()];
  const m = String(url).match(/\.(jpe?g|png|webp|gif|avif)(?:\?|$)/i);
  return m ? m[1].toLowerCase().replace('jpeg', 'jpg') : 'jpg';
}

/** Download one source image and upload it to our public bucket; return URL. */
async function rehostPhoto(supabase, sourceId, index, srcUrl) {
  const res = await fetch(toProxyUrl(srcUrl), { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`photo ${res.status}`);
  const contentType = res.headers.get('content-type') || 'image/jpeg';
  if (!/^image\//i.test(contentType)) throw new Error(`non-image content-type ${contentType}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const path = `terremoto/${sourceId}-${index}.${inferExt(srcUrl, contentType)}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType, upsert: true });
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

async function processReport(supabase, row, { dryRun }) {
  if (isMissingPersonReport(row)) return { status: 'filtered', name: row?.name };

  const { location, sourceRef, sourceFotoUrls } = transformBuilding(row);

  const { data: existing, error: selErr } = await supabase
    .from('locations')
    .select('id')
    .eq('source_ref', sourceRef)
    .maybeSingle();
  if (selErr) throw selErr;
  if (existing) return { status: 'skipped', sourceRef, id: existing.id };

  if (dryRun) return { status: 'dry-run', sourceRef, fotos: sourceFotoUrls.length, location };

  const fotos = [];
  for (let i = 0; i < sourceFotoUrls.length; i += 1) {
    try {
      fotos.push(await rehostPhoto(supabase, row.id, i, sourceFotoUrls[i]));
    } catch (err) {
      console.error(`  photo failed (${row.id}#${i}): ${err.message}`);
    }
  }

  const { data, error } = await supabase
    .from('locations')
    .insert({
      nombre: location.nombre,
      estado: location.estado,
      ciudad: location.ciudad,
      zona: location.zona ?? null,
      lat: location.lat,
      lng: location.lng,
      accuracy_m: null,
      status: location.status,
      descripcion: location.descripcion ?? null,
      fotos,
      source_ref: sourceRef,
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') return { status: 'skipped', sourceRef };
    throw error;
  }
  return { status: 'inserted', sourceRef, id: data.id, fotos: fotos.length };
}

/** Run an async mapper over items with a bounded concurrency pool. */
async function pool(items, concurrency, mapper) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next;
      next += 1;
      results[i] = await mapper(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const url = requireEnv('SUPABASE_URL');
  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  const rows = await fetchSourceSlice(args.offset, args.limit);
  console.error(
    `Fetched ${rows.length} source rows (offset ${args.offset}, limit ${args.limit ?? 'all'})${args.dryRun ? ' [DRY RUN]' : ''}`,
  );

  const summary = { inserted: 0, skipped: 0, filtered: 0, failed: 0, photos: 0 };
  await pool(rows, args.dryRun ? 8 : args.concurrency, async (row) => {
    try {
      const r = await processReport(supabase, row, { dryRun: args.dryRun });
      if (r.status === 'inserted') {
        summary.inserted += 1;
        summary.photos += r.fotos ?? 0;
        console.error(`  + ${r.id}  ${row.name}  (${r.fotos} fotos)`);
      } else if (r.status === 'skipped') {
        summary.skipped += 1;
      } else if (r.status === 'filtered') {
        summary.filtered += 1;
        console.error(`  x filtered (se busca / missing person): ${r.name}`);
      } else if (r.status === 'dry-run') {
        console.error(`  ~ ${row.name} -> ${r.location.estado} / ${r.location.status} (${r.fotos} fotos)`);
      }
      return r;
    } catch (err) {
      summary.failed += 1;
      console.error(`  ! FAILED ${row?.name} (${row?.id}): ${err.message}`);
      return { status: 'failed', error: err.message };
    }
  });

  console.log(JSON.stringify(summary));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
