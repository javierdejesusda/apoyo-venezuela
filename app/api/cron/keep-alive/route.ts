/**
 * Daily keep-alive cron endpoint. Issues the cheapest backend round-trip so a
 * Supabase Free project does not auto-pause after a stretch of inactivity.
 * Scheduled by Vercel Cron (GET) in vercel.json.
 */
import { getStore } from '@/lib/data/store';

export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ ok: false }, { status: 401 });
  }

  try {
    await getStore().ping();
  } catch (error) {
    console.error('keep-alive ping failed', error);
    return Response.json({ ok: false }, { status: 500 });
  }

  return Response.json({ ok: true });
}
