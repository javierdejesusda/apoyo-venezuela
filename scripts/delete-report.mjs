#!/usr/bin/env node
/**
 * Admin/ops tool to remove an erroneous emergency report from production.
 *
 * The public app intentionally cannot delete: it is an open, no-login tool and
 * RLS blocks deletes by design (see supabase/migrations/20260625000000_init.sql).
 * This script is run by a maintainer and leans on the already-authenticated
 * Supabase CLI (`supabase login` + `supabase link`), so it needs no
 * service_role key. It removes the location's Storage photos first, then
 * deletes the row; its needs go away via `on delete cascade`.
 *
 * Usage:
 *   node scripts/delete-report.mjs --find "San Bernardino"   # list candidates
 *   node scripts/delete-report.mjs <location-uuid>           # preview, confirm, delete
 *   node scripts/delete-report.mjs <location-uuid> --yes     # skip the confirmation
 */
import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline';
import { pathToFileURL } from 'node:url';

const BUCKET = 'fotos';
const PUBLIC_MARKER = `/storage/v1/object/public/${BUCKET}/`;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True when `id` is a syntactically valid UUID (safe to inline into SQL). */
export function isValidLocationId(id) {
  return typeof id === 'string' && UUID_RE.test(id);
}

/**
 * Maps a stored photo URL to its object key inside the `fotos` bucket, or null
 * when the URL is not a Storage object (e.g. demo-mode `data:` URLs, or any
 * URL outside the bucket).
 */
export function fotoUrlToStoragePath(url) {
  if (typeof url !== 'string') return null;
  const at = url.indexOf(PUBLIC_MARKER);
  if (at === -1) return null;
  const rest = url.slice(at + PUBLIC_MARKER.length).split(/[?#]/)[0];
  if (!rest) return null;
  try {
    return decodeURIComponent(rest);
  } catch {
    return rest;
  }
}

/** Escapes a value for inlining inside a single-quoted SQL string literal. */
export function escapeSqlLiteral(value) {
  return String(value).replace(/'/g, "''");
}

/** Builds the `ss://` URI the Supabase CLI uses to address a bucket object. */
export function buildStorageUri(path) {
  return `ss:///${BUCKET}/${path}`;
}

function runSupabase(args) {
  const result = spawnSync('supabase', args, { encoding: 'utf8' });
  if (result.error) {
    throw new Error(
      `No se pudo ejecutar 'supabase'. ¿Está instalado, autenticado (supabase login) ` +
        `y enlazado (supabase link)? Detalle: ${result.error.message}`,
    );
  }
  return result;
}

/** Runs a SQL query against the linked project and returns its rows. */
function query(sql) {
  const result = runSupabase(['db', 'query', '--linked', '--output', 'json', sql]);
  if (result.status !== 0) {
    throw new Error(result.stderr?.trim() || result.stdout?.trim() || 'supabase db query falló.');
  }
  return JSON.parse(result.stdout).rows ?? [];
}

function removeStorageObject(path) {
  const result = runSupabase([
    'storage',
    'rm',
    '--experimental',
    '--linked',
    '--yes',
    buildStorageUri(path),
  ]);
  return result.status === 0;
}

function confirm(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(/^(y|yes|s|si|sí)$/i.test(answer.trim()));
    });
  });
}

function findCandidates(text) {
  const t = escapeSqlLiteral(text);
  return query(
    `select id, nombre, zona, ciudad, estado, status, contacto_nombre, updated_at
     from public.locations
     where nombre ilike '%${t}%' or zona ilike '%${t}%'
        or ciudad ilike '%${t}%' or contacto_nombre ilike '%${t}%'
     order by updated_at desc limit 50;`,
  );
}

const USAGE = [
  'Uso:',
  '  node scripts/delete-report.mjs --find "<texto>"        Buscar candidatos',
  '  node scripts/delete-report.mjs <location-uuid>          Previsualizar y borrar',
  '  node scripts/delete-report.mjs <location-uuid> --yes    Borrar sin confirmar',
].join('\n');

async function main(argv) {
  const args = argv.slice(2);

  const findAt = args.indexOf('--find');
  if (findAt !== -1) {
    const text = args[findAt + 1];
    if (!text) {
      console.error('Falta el texto a buscar.\n' + USAGE);
      process.exitCode = 1;
      return;
    }
    const rows = findCandidates(text);
    if (rows.length === 0) {
      console.log('Sin coincidencias.');
      return;
    }
    console.table(rows);
    console.log(`\n${rows.length} resultado(s). Copia el id y corre: node scripts/delete-report.mjs <id>`);
    return;
  }

  const yes = args.includes('--yes');
  const id = args.find((a) => !a.startsWith('--'));
  if (!id) {
    console.error(USAGE);
    process.exitCode = 1;
    return;
  }
  if (!isValidLocationId(id)) {
    console.error(`Id inválido: "${id}". Debe ser un UUID. Usa --find "<texto>" para buscarlo.`);
    process.exitCode = 1;
    return;
  }

  const rows = query(
    `select id, nombre, zona, ciudad, estado, status, contacto_nombre, contacto_telefono, fotos
     from public.locations where id = '${id}';`,
  );
  if (rows.length === 0) {
    console.error(`No existe ningún reporte con id ${id}. Quizá ya fue borrado.`);
    process.exitCode = 1;
    return;
  }

  const loc = rows[0];
  const fotos = Array.isArray(loc.fotos) ? loc.fotos : [];
  const needsCount = query(`select count(*)::int as n from public.needs where location_id = '${id}';`)[0]?.n ?? 0;

  console.log('Vas a borrar este reporte:');
  console.table([
    {
      id: loc.id,
      nombre: loc.nombre,
      zona: loc.zona,
      ciudad: loc.ciudad,
      estado: loc.estado,
      status: loc.status,
      contacto: loc.contacto_nombre,
    },
  ]);
  console.log(`  Necesidades asociadas (se borran por cascade): ${needsCount}`);
  console.log(`  Fotos en Storage a eliminar: ${fotos.length}`);

  if (!yes) {
    const ok = await confirm('¿Confirmas el borrado? Esta acción no se puede deshacer [y/N]: ');
    if (!ok) {
      console.log('Cancelado. No se borró nada.');
      return;
    }
  }

  const paths = fotos.map(fotoUrlToStoragePath).filter(Boolean);
  let removed = 0;
  for (const path of paths) {
    if (removeStorageObject(path)) removed += 1;
    else console.warn(`  Aviso: no se pudo borrar la foto ${path} (continúo con el resto).`);
  }

  const deleted = query(`delete from public.locations where id = '${id}' returning id;`);
  if (deleted.length === 0) {
    console.error('La fila no se borró (no encontrada en el delete). Revísalo manualmente.');
    process.exitCode = 1;
    return;
  }

  console.log(
    `\nListo. Reporte ${id} borrado. Fotos eliminadas: ${removed}/${fotos.length}. ` +
      `Necesidades borradas por cascade: ${needsCount}.`,
  );
}

const invokedDirectly = import.meta.url === pathToFileURL(process.argv[1] ?? '').href;
if (invokedDirectly) {
  main(process.argv).catch((err) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
  });
}
