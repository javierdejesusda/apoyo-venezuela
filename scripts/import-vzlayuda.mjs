/**
 * Import relief requests from vzlayuda.com into our schema: each aviso of
 * tipo='necesidad' becomes one locations row and one needs row.
 *
 * Strategy: POST to /api/buscar for each term in QUERIES, dedupe by aviso.id,
 * then filter to importable, non-expired necesidades.
 *
 * Idempotent via source_ref on locations (vzlayuda:{id}) and needs
 * (vzlayuda:need:{id}).
 *
 * PII policy: contact info is never imported (gated at the transform layer).
 *
 * Credentials from the environment:
 *   VZLAYUDA_BASE              (default: https://vzlayuda.com)
 *   SUPABASE_URL               - our project write target (skipped in dry-run)
 *   SUPABASE_SERVICE_ROLE_KEY  - our project write target (skipped in dry-run)
 *
 * Usage (--limit caps how many search terms are queried, not avisos imported):
 *   node scripts/import-vzlayuda.mjs --dry-run
 *   node scripts/import-vzlayuda.mjs --dry-run --limit 3
 *   node --env-file=.env.local scripts/import-vzlayuda.mjs --limit 20
 *   node --env-file=.env.local scripts/import-vzlayuda.mjs
 */
import { createClient } from '@supabase/supabase-js';

import { isImportableAviso, transformAviso } from './vzlayuda-transform.mjs';

const VZLAYUDA_BASE = process.env.VZLAYUDA_BASE ?? 'https://vzlayuda.com';

const QUERIES = [
  'a', 'e', 'i', 'o', 'u',
  'de', 'la', 'ayuda', 'agua', 'comida', 'salud', 'medicina', 'rescate',
  'techo', 'casa', 'refugio', 'ropa', 'familia', 'insumos', 'transporte',
  'construccion', 'estructural', 'gas', 'luz', 'dinero', 'escombros',
  'derrumbe', 'emergencia', 'necesito', 'alojamiento', 'materiales',
  'electricidad', 'viveres', 'medicamentos',
];

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

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return value;
}

function isExpired(expiraEn) {
  if (!expiraEn) return false;
  const d = new Date(expiraEn);
  return !Number.isNaN(d.getTime()) && d < new Date();
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchQuery(query, { retries = 4, baseDelayMs = 1000 } = {}) {
  for (let attempt = 0; ; attempt += 1) {
    const res = await fetch(`${VZLAYUDA_BASE}/api/buscar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query, filtros: { tipo: 'necesidad' } }),
    });
    if (res.ok) {
      const body = await res.json();
      return Array.isArray(body?.avisos) ? body.avisos : [];
    }
    if (res.status === 429 && attempt < retries) {
      const retryAfter = Number(res.headers.get('retry-after'));
      const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : baseDelayMs * 2 ** attempt;
      console.error(`  . query "${query}" throttled (429), retry in ${waitMs}ms`);
      await sleep(waitMs);
      continue;
    }
    throw new Error(`buscar "${query}" ${res.status}: ${await res.text()}`);
  }
}

/**
 * Sweeps the search terms sequentially with a small gap between requests. The
 * source rate-limits aggressive bursts (HTTP 429), so this deliberately does
 * not fan out: ~34 terms at a polite pace finishes in well under a minute.
 */
async function fetchAll(queries, { gapMs = 1500 } = {}) {
  const seen = new Map();
  for (let i = 0; i < queries.length; i += 1) {
    const q = queries[i];
    try {
      const avisos = await fetchQuery(q);
      for (const a of avisos) {
        if (!seen.has(a.id)) seen.set(a.id, a);
      }
    } catch (err) {
      console.error(`  ! query "${q}" failed: ${err.message}`);
    }
    if (i < queries.length - 1) await sleep(gapMs);
  }
  return [...seen.values()];
}

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

async function main() {
  const args = parseArgs(process.argv.slice(2));

  let supabase = null;
  if (!args.dryRun) {
    supabase = createClient(
      requireEnv('SUPABASE_URL'),
      requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { persistSession: false } },
    );
  }

  const queries = args.limit != null ? QUERIES.slice(0, args.limit) : QUERIES;
  console.error(
    `Fetching ${queries.length} queries from vzlayuda.com` +
      `${args.dryRun ? ' [DRY RUN]' : ''}`,
  );

  const allAvisos = await fetchAll(queries);
  const importable = allAvisos.filter(
    (a) => isImportableAviso(a) && !isExpired(a.expira_en),
  );

  console.error(
    `Avisos: ${allAvisos.length} total, ${importable.length} importable after filter`,
  );

  const summary = {
    locationsInserted: 0,
    locationsSkipped: 0,
    needsInserted: 0,
    needsSkipped: 0,
    filtered: allAvisos.length - importable.length,
    failed: 0,
  };

  await pool(importable, args.concurrency, async (aviso) => {
    const { location, need, sourceRef, needSourceRef } = transformAviso(aviso);
    try {
      if (args.dryRun) {
        console.error(`  ~ "${location.nombre}" -> ${location.estado} / ${location.ciudad}`);
        return;
      }

      const locResult = await upsertLocation(supabase, location, sourceRef);
      const locationId = locResult.id;

      if (locResult.status === 'inserted') {
        summary.locationsInserted += 1;
        console.error(`  + location ${locationId}  "${location.nombre}"`);
      } else {
        summary.locationsSkipped += 1;
      }

      if (!locationId) return;

      const r = await insertNeed(supabase, need, locationId, needSourceRef);
      if (r.status === 'inserted') summary.needsInserted += 1;
      else if (r.status === 'skipped') summary.needsSkipped += 1;
    } catch (err) {
      summary.failed += 1;
      console.error(`  ! AVISO FAILED "${location?.nombre}" (${aviso?.id}): ${err.message}`);
    }
  });

  console.log(JSON.stringify(summary));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
