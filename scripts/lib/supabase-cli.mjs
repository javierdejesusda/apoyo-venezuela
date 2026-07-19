/**
 * Shared Supabase CLI runner for the maintainer ops scripts. Several scripts
 * shell out to the already-authenticated `supabase` CLI the same way, so this
 * lives in one place instead of being copy-pasted per script.
 */
import { spawnSync } from 'node:child_process';

/**
 * Runs the `supabase` CLI with the given args and returns the spawn result.
 * Throws a helpful error when the CLI itself cannot be spawned (not installed,
 * not authenticated, or not linked); callers inspect `result.status` for the
 * command's own exit code.
 */
export function runSupabase(args) {
  const result = spawnSync('supabase', args, { encoding: 'utf8' });
  if (result.error) {
    throw new Error(
      `No se pudo ejecutar 'supabase'. ¿Está instalado, autenticado (supabase login) ` +
        `y enlazado (supabase link)? Detalle: ${result.error.message}`,
    );
  }
  return result;
}
