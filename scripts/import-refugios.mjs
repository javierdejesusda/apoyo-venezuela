/**
 * Import shelter and food/aid-center data into our schema. Two endpoints of a
 * public read-only edge API are consumed:
 *   - /refugios       (shelters)      -> `locations` rows
 *   - /centros-comida (food centers)  -> `locations` rows + optional `needs`
 *
 * Only GET requests are ever issued. The API also exposes POST/PATCH/DELETE;
 * this importer must never call those.
 *
 * Reporter PII (reporter_name, reporter_contact) is dropped in the transform:
 * contacto_nombre is always null and only the institutional aid line is kept.
 *
 * Idempotent: every row carries a source_ref (refugios:{id} for locations,
 * refugios:need:{id} for needs) so re-running or overlapping slices never
 * duplicate records.
 *
 * Credentials from the environment (never committed):
 *   REFUGIOS_BASE              (default: the public functions base below)
 *   REFUGIOS_KEY               (default: publishable/public key below)
 *   SUPABASE_URL               - our project write target (skipped in dry-run)
 *   SUPABASE_SECRET_KEY        - preferred write key (falls back to service_role)
 *
 * Usage:
 *   node scripts/import-refugios.mjs --dry-run
 *   node --env-file=.env.local scripts/import-refugios.mjs --limit 10 --dry-run
 *   node --env-file=.env.local scripts/import-refugios.mjs
 */
import { argv } from 'node:process';
import { pathToFileURL } from 'node:url';

import { createClient } from '@supabase/supabase-js';

import { requireEnv, requireServiceKey } from './lib/env.mjs';
import { transformRefugio } from './refugios-transform.mjs';

const REFUGIOS_BASE =
  process.env.REFUGIOS_BASE ?? 'https://jewiqrfjotzbwsmiomjx.supabase.co/functions/v1';
const REFUGIOS_KEY =
  process.env.REFUGIOS_KEY ?? 'sb_publishable_WNTOe9Kw-3DNEPhNV4ISng__6QiDLQo';
const PAGE_SIZE = 100;
const PAGE_DELAY_MS = 300;

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

/** GET a single page of a resource. Never issues any non-GET method. */
async function fetchPage(resource, page) {
  const res = await fetch(
    `${REFUGIOS_BASE}/${resource}?page=${page}&page_size=${PAGE_SIZE}`,
    {
      method: 'GET',
      headers: { apikey: REFUGIOS_KEY, Accept: 'application/json' },
    },
  );
  if (!res.ok) throw new Error(`source fetch /${resource} ${res.status}: ${await res.text()}`);
  return res.json();
}

/**
 * Page through a resource until the API reports no more pages, returning all
 * rows. Termination follows pagination.has_more, with a short-page guard so a
 * missing flag still stops the loop.
 */
async function fetchAll(resource) {
  const rows = [];
  let page = 1;
  while (true) {
    const body = await fetchPage(resource, page);
    const data = Array.isArray(body?.data) ? body.data : [];
    rows.push(...data);
    const hasMore = body?.pagination?.has_more === true && data.length > 0;
    if (!hasMore || data.length < PAGE_SIZE) break;
    page += 1;
    await new Promise((r) => setTimeout(r, PAGE_DELAY_MS));
  }
  return rows;
}

async function upsertLocation(supabase, location, sourceRef) {
  const { data: existing, error: selErr } = await supabase
    .from('locations')
    .select('id')
    .eq('source_ref', sourceRef)
    .maybeSingle();
  if (selErr) throw selErr;
  if (existing) return { status: 'skipped', id: existing.id };

  const { data, error } = await supabase
    .from('locations')
    .insert({
      nombre: location.nombre,
      estado: location.estado,
      ciudad: location.ciudad,
      zona: location.zona,
      lat: location.lat,
      lng: location.lng,
      status: location.status,
      descripcion: location.descripcion,
      contacto_nombre: location.contacto_nombre,
      contacto_telefono: location.contacto_telefono,
      fotos: location.fotos,
      source_ref: sourceRef,
    })
    .select('id')
    .single();
  if (error) {
    if (error.code === '23505') {
      const { data: again } = await supabase
        .from('locations')
        .select('id')
        .eq('source_ref', sourceRef)
        .maybeSingle();
      if (again) return { status: 'skipped', id: again.id };
    }
    throw error;
  }
  return { status: 'inserted', id: data.id };
}

async function insertNeed(supabase, need, locationId, needRef) {
  const { data: existing, error: selErr } = await supabase
    .from('needs')
    .select('id')
    .eq('source_ref', needRef)
    .maybeSingle();
  if (selErr) throw selErr;
  if (existing) return { status: 'skipped' };

  const { error } = await supabase.from('needs').insert({
    location_id: locationId,
    categoria: need.categoria,
    descripcion: need.descripcion,
    cantidad: need.cantidad,
    urgencia: need.urgencia,
    status: need.status,
    source_ref: needRef,
  });
  if (error) {
    if (error.code === '23505') return { status: 'skipped' };
    throw error;
  }
  return { status: 'inserted' };
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

  let supabase = null;
  if (!args.dryRun) {
    supabase = createClient(requireEnv('SUPABASE_URL'), requireServiceKey(), {
      auth: { persistSession: false },
    });
  }

  console.error('Fetching refugios...');
  const refugios = await fetchAll('refugios');
  console.error('Fetching centros-comida...');
  const comidas = await fetchAll('centros-comida');

  const allRows = [...refugios, ...comidas];
  const end = args.limit != null ? args.offset + args.limit : allRows.length;
  const slice = allRows.slice(args.offset, end);

  console.error(
    `Records ${slice.length} of ${allRows.length} ` +
      `(refugios ${refugios.length}, centros-comida ${comidas.length}; ` +
      `offset ${args.offset}, limit ${args.limit ?? 'all'})${args.dryRun ? ' [DRY RUN]' : ''}`,
  );

  const summary = {
    locationsInserted: 0,
    locationsSkipped: 0,
    needsInserted: 0,
    needsSkipped: 0,
    failed: 0,
  };

  await pool(slice, args.concurrency, async (record) => {
    const { location, need, sourceRef, needSourceRef } = transformRefugio(record);
    try {
      if (args.dryRun) {
        console.error(
          `  ~ "${location.nombre}" -> ${location.estado} / ${location.ciudad}` +
            `${need ? ` (+1 need: ${need.categoria})` : ''}`,
        );
        summary.locationsInserted += 1;
        if (need) summary.needsInserted += 1;
        return;
      }

      const locResult = await upsertLocation(supabase, location, sourceRef);
      if (locResult.status === 'inserted') {
        summary.locationsInserted += 1;
        console.error(`  + location ${locResult.id}  "${location.nombre}"`);
      } else {
        summary.locationsSkipped += 1;
      }

      const locationId = locResult.id;
      if (!locationId || !need) return;

      const needResult = await insertNeed(supabase, need, locationId, needSourceRef);
      if (needResult.status === 'inserted') summary.needsInserted += 1;
      else if (needResult.status === 'skipped') summary.needsSkipped += 1;
    } catch (err) {
      summary.failed += 1;
      console.error(`  ! RECORD FAILED "${location?.nombre}" (${record?.id}): ${err.message}`);
    }
  });

  console.log(JSON.stringify(summary));
}

const isEntryPoint = argv[1] && import.meta.url === pathToFileURL(argv[1]).href;
if (isEntryPoint) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
