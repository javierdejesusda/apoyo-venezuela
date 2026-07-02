/**
 * Import medical-supply shortage data from conecta-salud into our schema:
 * each distinct hospital becomes a `locations` row and each insumo row becomes
 * a `needs` row attached to that hospital's location.
 *
 * The source is a public Supabase REST API (publishable key, no PII).
 * Idempotent via source_ref on locations (conecta-salud:hosp:{slug}) and needs
 * (conecta-salud:need:{uuid}).
 *
 * Credentials from the environment:
 *   CONECTA_SALUD_URL          (default: https://yruqgiazeqoytayimrba.supabase.co)
 *   CONECTA_SALUD_KEY          (default: publishable key below)
 *   SUPABASE_URL               - our project write target (skipped in dry-run)
 *   SUPABASE_SERVICE_ROLE_KEY  - our project write target (skipped in dry-run)
 *
 * Usage:
 *   node scripts/import-conecta-salud.mjs --dry-run
 *   node --env-file=.env.local scripts/import-conecta-salud.mjs --limit 10
 *   node --env-file=.env.local scripts/import-conecta-salud.mjs
 */
import { createClient } from '@supabase/supabase-js';

import { mapHospitals } from './conecta-salud-transform.mjs';

const CONECTA_BASE =
  process.env.CONECTA_SALUD_URL ?? 'https://yruqgiazeqoytayimrba.supabase.co';
const CONECTA_KEY =
  process.env.CONECTA_SALUD_KEY ?? 'sb_publishable_KB-ViURA2B1m-pVN0kpsng_tCSsg0YI';

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

async function fetchNecesidades() {
  const res = await fetch(`${CONECTA_BASE}/rest/v1/necesidades?select=*`, {
    headers: {
      apikey: CONECTA_KEY,
      Authorization: `Bearer ${CONECTA_KEY}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error(`source fetch /necesidades ${res.status}: ${await res.text()}`);
  return res.json();
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

  const rows = await fetchNecesidades();
  const hospitals = mapHospitals(rows);
  const end = args.limit != null ? args.offset + args.limit : hospitals.length;
  const slice = hospitals.slice(args.offset, end);

  console.error(
    `Hospitals ${slice.length} of ${hospitals.length} (offset ${args.offset}, limit ${args.limit ?? 'all'})` +
      `${args.dryRun ? ' [DRY RUN]' : ''}`,
  );

  const summary = {
    locationsInserted: 0,
    locationsSkipped: 0,
    needsInserted: 0,
    needsSkipped: 0,
    failed: 0,
  };

  await pool(slice, args.concurrency, async (group) => {
    const { location, needs, sourceRef } = group;
    try {
      if (args.dryRun) {
        console.error(
          `  ~ "${location.nombre}" -> ${location.estado} / ${location.ciudad} (${needs.length} needs)`,
        );
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

      for (const need of needs) {
        try {
          const r = await insertNeed(supabase, need, locationId, need.sourceRef);
          if (r.status === 'inserted') summary.needsInserted += 1;
          else if (r.status === 'skipped') summary.needsSkipped += 1;
        } catch (err) {
          summary.failed += 1;
          console.error(
            `  ! NEED FAILED "${location.nombre}" ${need.sourceRef}: ${err.message}`,
          );
        }
      }
    } catch (err) {
      summary.failed += 1;
      console.error(`  ! HOSPITAL FAILED "${location?.nombre}": ${err.message}`);
    }
  });

  console.log(JSON.stringify(summary));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
