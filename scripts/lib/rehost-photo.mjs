import { resizeToWebp } from './image-resize.mjs';

/**
 * Download a source image, downscale and WebP-encode it, then upload it to a
 * public bucket at `path` and return its public URL. Storing a capped WebP lets
 * the app serve the photo raw (no billed Supabase image transformation) while
 * keeping egress low.
 *
 * Throws on a failed fetch or a non-image content-type; importers catch per
 * photo so one bad image never aborts the row insert.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase Write client.
 * @param {{ bucket: string, path: string, fetchUrl: string, ua: string }} opts
 *   Target `bucket`/`path`, the resolved `fetchUrl` to download, and the
 *   `ua` (User-Agent) to send.
 * @returns {Promise<string>} The public URL of the stored WebP.
 */
export async function rehostPhoto(supabase, { bucket, path, fetchUrl, ua }) {
  const res = await fetch(fetchUrl, { headers: { 'User-Agent': ua } });
  if (!res.ok) throw new Error(`photo fetch ${res.status}`);
  const contentType = res.headers.get('content-type') || 'image/jpeg';
  if (!/^image\//i.test(contentType)) {
    throw new Error(`non-image content-type ${contentType}`);
  }
  const source = Buffer.from(await res.arrayBuffer());
  const buffer = await resizeToWebp(source);
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, { contentType: 'image/webp', upsert: true });
  if (error) throw error;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
