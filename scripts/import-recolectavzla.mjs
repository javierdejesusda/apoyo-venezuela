/**
 * Import collection-center data from recolectavzla.com into our schema:
 * each center becomes a `locations` row and each (capped) tipo becomes a
 * `needs` row attached to that center's location. Photos are re-hosted into
 * our `fotos` Storage bucket.
 *
 * The source is a public API with no authentication required.
 * Approximately 47 records as of June 2026.
 *
 * Idempotent: every imported location carries source_ref (`recolecta:<id>`,
 * unique partial index) and every need carries source_ref
 * (`recolecta:<id>:<tipo>`), so re-running never duplicates rows.
 *
 * PII decisions (locked):
 * - cedula and correo are NEVER stored.
 * - telefono and responsable are kept.
 *
 * Credentials come from the environment (never committed):
 *   SUPABASE_URL, SUPABASE_SECRET_KEY (preferred, falls back to SUPABASE_SERVICE_ROLE_KEY) - our project (write target)
 *   RECOLECTA_BASE  (default: https://recolectavzla.com)
 *
 * Usage:
 *   node --env-file=.env.local scripts/import-recolectavzla.mjs --dry-run
 *   node --env-file=.env.local scripts/import-recolectavzla.mjs --limit 5
 *   node --env-file=.env.local scripts/import-recolectavzla.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { requireEnv, requireServiceKey } from './lib/env.mjs';
import { rehostPhoto } from './lib/rehost-photo.mjs';

import {
  capTipos,
  transformCenter,
  transformNeed,
} from './recolectavzla-transform.mjs';

const SOURCE_BASE = process.env.RECOLECTA_BASE ?? 'https://recolectavzla.com';
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

/** Fetch the full list of collection centers from the source API. */
async function fetchCenters() {
  const res = await fetch(`${SOURCE_BASE}/api/centers`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`source fetch /api/centers ${res.status}: ${await res.text()}`);
  const body = await res.json();
  if (!Array.isArray(body?.centers)) {
    throw new Error(`unexpected response shape: ${JSON.stringify(body).slice(0, 200)}`);
  }
  return body.centers;
}

async function upsertCenter(supabase, center, { dryRun }) {
  const { location, sourceRef, sourceFotoUrl, tiposResult } = transformCenter(center);

  if (tiposResult.wasCapped) {
    console.error(
      `  ~ tipos capped for "${center.nombre}" (${center.id}): ` +
        `[${tiposResult.original.join(', ')}] -> [${tiposResult.capped.join(', ')}]`,
    );
  }

  const { data: existing, error: selErr } = await supabase
    .from('locations')
    .select('id')
    .eq('source_ref', sourceRef)
    .maybeSingle();
  if (selErr) throw selErr;
  if (existing) return { status: 'skipped', id: existing.id, tiposResult };

  if (dryRun) {
    return {
      status: 'dry-run',
      id: null,
      location,
      sourceFotoUrl,
      tiposResult,
    };
  }

  const fotos = [];
  if (sourceFotoUrl) {
    try {
      fotos.push(
        await rehostPhoto(supabase, {
          bucket: BUCKET,
          path: `recolecta/${center.id}.webp`,
          fetchUrl: sourceFotoUrl,
          ua: UA,
        }),
      );
    } catch (err) {
      console.error(`  photo failed (${center.id}): ${err.message}`);
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
      contacto_nombre: location.contacto_nombre ?? null,
      contacto_telefono: location.contacto_telefono ?? null,
      fotos,
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
      if (again) return { status: 'skipped', id: again.id, tiposResult };
    }
    throw error;
  }

  return { status: 'inserted', id: data.id, fotos: fotos.length, tiposResult };
}

async function insertNeed(supabase, centerId, tipo, center, locationId, { dryRun }) {
  const { need, sourceRef } = transformNeed(centerId, tipo, center);

  const { data: existing, error: selErr } = await supabase
    .from('needs')
    .select('id')
    .eq('source_ref', sourceRef)
    .maybeSingle();
  if (selErr) throw selErr;
  if (existing) return { status: 'skipped' };
  if (dryRun) return { status: 'dry-run' };

  const { error } = await supabase.from('needs').insert({
    location_id: locationId,
    categoria: need.categoria,
    descripcion: need.descripcion,
    cantidad: null,
    urgencia: need.urgencia,
    status: need.status,
    source_ref: sourceRef,
  });
  if (error) {
    if (error.code === '23505') return { status: 'skipped' };
    throw error;
  }
  return { status: 'inserted' };
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
  const serviceKey = requireServiceKey();
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  const allCenters = await fetchCenters();
  const end = args.limit != null ? args.offset + args.limit : allCenters.length;
  const centers = allCenters.slice(args.offset, end);

  console.error(
    `Centers ${centers.length} (offset ${args.offset}, limit ${args.limit ?? 'all'})` +
      `${args.dryRun ? ' [DRY RUN]' : ''}`,
  );

  const summary = {
    centersInserted: 0,
    centersSkipped: 0,
    needsInserted: 0,
    needsSkipped: 0,
    tiposCapped: 0,
    failed: 0,
    photos: 0,
  };
  const locationByCenterId = new Map();

  await pool(centers, args.concurrency, async (center) => {
    try {
      const r = await upsertCenter(supabase, center, { dryRun: args.dryRun });
      if (r.tiposResult?.wasCapped) summary.tiposCapped += 1;

      if (r.id) locationByCenterId.set(center.id, r.id);

      if (r.status === 'inserted') {
        summary.centersInserted += 1;
        summary.photos += r.fotos ?? 0;
        console.error(`  + center ${r.id}  "${center.nombre}"  (${r.fotos ?? 0} fotos)`);
      } else if (r.status === 'skipped') {
        summary.centersSkipped += 1;
      } else if (r.status === 'dry-run') {
        console.error(
          `  ~ "${center.nombre}" -> ${r.location.estado} / ${center.tipos?.join(', ')} ` +
            `(foto: ${r.sourceFotoUrl ? 'si' : 'no'})`,
        );
      }
    } catch (err) {
      summary.failed += 1;
      console.error(`  ! CENTER FAILED "${center?.nombre}" (${center?.id}): ${err.message}`);
    }
  });

  // Insert needs for each center, using the capped tipos from transformCenter.
  await pool(centers, args.concurrency, async (center) => {
    const locationId = locationByCenterId.get(center.id);
    if (!locationId && !args.dryRun) return;

    const { capped } = capTipos(
      Array.isArray(center?.tipos) ? center.tipos : [],
      center?.descripcion ?? '',
    );

    for (const tipo of capped) {
      try {
        const r = await insertNeed(
          supabase,
          center.id,
          tipo,
          center,
          locationId,
          { dryRun: args.dryRun },
        );
        if (r.status === 'inserted') summary.needsInserted += 1;
        else if (r.status === 'skipped') summary.needsSkipped += 1;
      } catch (err) {
        summary.failed += 1;
        console.error(
          `  ! NEED FAILED "${center?.nombre}" tipo=${tipo} (${center?.id}): ${err.message}`,
        );
      }
    }
  });

  console.log(JSON.stringify(summary));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
