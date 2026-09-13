/**
 * On-demand revalidation endpoint for maintainer tooling.
 *
 * Pages are cached for a long time to keep the Vercel ISR write budget within
 * the free tier, so a change made outside the app would otherwise stay visible
 * until the window expires. `npm run delete-report` calls this after deleting a
 * row so the report stops being readable at its own URL right away; any other
 * tool that writes to Supabase directly should call it for the same reason.
 *
 * Unlike the keep-alive cron, a missing CRON_SECRET denies the request instead
 * of allowing it: every regeneration is a billed write, so an unauthenticated
 * caller could exhaust exactly the budget this endpoint exists to protect.
 */
import { revalidatePath } from 'next/cache';

import { parseRevalidatePaths } from '@/lib/api/revalidate-paths';

export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ ok: false }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const paths = parseRevalidatePaths(body);
  if (!paths) {
    return Response.json({ ok: false, error: 'invalid_paths' }, { status: 400 });
  }

  for (const path of paths) revalidatePath(path);

  return Response.json({ ok: true, revalidated: paths });
}
