/**
 * Import relief-coordination data from ayudaencamino.com into our schema:
 * each organization becomes a `locations` row and each supply need becomes a
 * `needs` row attached to that organization's location.
 *
 * The source is a public Express API (same origin as the SPA); no key needed.
 * It has no coordinates, no photos and no building-damage status, so imported
 * locations are pinless, photoless and status 'desconocido'.
 *
 * Idempotent: every imported location carries source_ref (unique partial index)
 * and every imported need carries source_ref (added in the matching migration),
 * so re-running, overlapping slices, or parallel workers never duplicate.
 *
 * Credentials come from the environment (never committed):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   - our project (write target)
 *   AYUDAENCAMINO_BASE  (default: https://ayudaencamino.com)
 *
 * Usage:
 *   node --env-file=.env.local scripts/import-ayudaencamino.mjs --dry-run
 *   node --env-file=.env.local scripts/import-ayudaencamino.mjs --limit 3
 *   node --env-file=.env.local scripts/import-ayudaencamino.mjs
 */
import { createClient } from '@supabase/supabase-js';

import {
  isImportableNeed,
  isImportableOrg,
  transformNeed,
  transformOrg,
} from './ayudaencamino-transform.mjs';

const SOURCE_BASE = process.env.AYUDAENCAMINO_BASE ?? 'https://ayudaencamino.com';
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

async function fetchJson(path) {
  const res = await fetch(`${SOURCE_BASE}${path}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`source fetch ${path} ${res.status}: ${await res.text()}`);
  return res.json();
}

/**
 * Merge the org directory with the org records nested inside needs: the
 * directory carries `horario` while the nested copy carries `contactoEmail`.
 * Keyed by org id and sorted ascending for a stable, sliceable order.
 */
function collectOrgs(orgList, needs) {
  const byId = new Map();
  for (const org of orgList) byId.set(org.id, { ...org });
  for (const need of needs) {
    const nested = need.organizacion;
    if (!nested) continue;
    const existing = byId.get(nested.id) ?? {};
    byId.set(nested.id, {
      ...nested,
      ...existing,
      contactoEmail: existing.contactoEmail ?? nested.contactoEmail ?? null,
    });
  }
  return [...byId.values()].sort((a, b) => Number(a.id) - Number(b.id));
}

async function upsertLocation(supabase, org, { dryRun }) {
  const { location, sourceRef } = transformOrg(org);

  const { data: existing, error: selErr } = await supabase
    .from('locations')
    .select('id')
    .eq('source_ref', sourceRef)
    .maybeSingle();
  if (selErr) throw selErr;
  if (existing) return { status: 'skipped', id: existing.id };
  if (dryRun) return { status: 'dry-run', id: null, location };

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
      contacto_nombre: location.contactoNombre ?? null,
      contacto_telefono: location.contactoTelefono ?? null,
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

async function insertNeed(supabase, sourceNeed, locationId, { dryRun }) {
  const { need, sourceRef } = transformNeed(sourceNeed);

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
    cantidad: need.cantidad ?? null,
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
  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  const [orgList, open, fulfilled] = await Promise.all([
    fetchJson('/api/organizations'),
    fetchJson('/api/needs'),
    fetchJson('/api/needs?status=cumplida'),
  ]);
  const needsById = new Map();
  for (const n of [...open, ...fulfilled]) needsById.set(n.id, n);
  const allNeeds = [...needsById.values()];

  let orgs = collectOrgs(orgList, allNeeds).filter(isImportableOrg);
  const end = args.limit != null ? args.offset + args.limit : orgs.length;
  orgs = orgs.slice(args.offset, end);
  const orgIds = new Set(orgs.map((o) => o.id));

  console.error(
    `Orgs ${orgs.length} (offset ${args.offset}, limit ${args.limit ?? 'all'}); ` +
      `needs in scope ${allNeeds.filter((n) => orgIds.has(n.orgId)).length}` +
      `${args.dryRun ? ' [DRY RUN]' : ''}`,
  );

  const summary = {
    orgsInserted: 0,
    orgsSkipped: 0,
    needsInserted: 0,
    needsSkipped: 0,
    filtered: 0,
    failed: 0,
  };
  const locationByOrgId = new Map();

  await pool(orgs, args.concurrency, async (org) => {
    try {
      const r = await upsertLocation(supabase, org, { dryRun: args.dryRun });
      if (r.id) locationByOrgId.set(org.id, r.id);
      if (r.status === 'inserted') {
        summary.orgsInserted += 1;
        console.error(`  + org ${r.id}  ${org.nombre}`);
      } else if (r.status === 'skipped') {
        summary.orgsSkipped += 1;
      } else if (r.status === 'dry-run') {
        console.error(`  ~ org ${org.nombre} -> ${r.location.estado} / ${r.location.status}`);
      }
    } catch (err) {
      summary.failed += 1;
      console.error(`  ! ORG FAILED ${org?.nombre} (${org?.id}): ${err.message}`);
    }
  });

  const needs = allNeeds.filter((n) => orgIds.has(n.orgId));
  await pool(needs, args.concurrency, async (need) => {
    if (!isImportableNeed(need)) {
      summary.filtered += 1;
      return;
    }
    const locationId = locationByOrgId.get(need.orgId);
    if (!locationId && !args.dryRun) {
      summary.failed += 1;
      console.error(`  ! NEED skipped, no location for org ${need.orgId}: ${need.nombreArticulo}`);
      return;
    }
    try {
      const r = await insertNeed(supabase, need, locationId, { dryRun: args.dryRun });
      if (r.status === 'inserted') {
        summary.needsInserted += 1;
      } else if (r.status === 'skipped') {
        summary.needsSkipped += 1;
      }
    } catch (err) {
      summary.failed += 1;
      console.error(`  ! NEED FAILED ${need?.nombreArticulo} (${need?.id}): ${err.message}`);
    }
  });

  console.log(JSON.stringify(summary));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
