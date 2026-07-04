import sharp from 'sharp';

/**
 * Downscale an image buffer so its longest edge is at most `maxEdge` and
 * re-encode it as WebP. Never enlarges a smaller image. Mirrors the client-side
 * resize in `lib/data/foto-resize.ts` so re-hosted import photos and user
 * uploads are stored at the same size and served raw from the public bucket,
 * with no per-request Supabase image transformation (which bills per unique
 * image).
 *
 * @param {Buffer} buffer Source image bytes.
 * @param {{ maxEdge?: number, quality?: number }} [options] Longest-edge cap
 *   (default 1600) and WebP quality 0-100 (default 72).
 * @returns {Promise<Buffer>} The resized WebP bytes.
 * @throws If the buffer cannot be decoded as an image.
 */
export async function resizeToWebp(buffer, { maxEdge = 1600, quality = 72 } = {}) {
  return sharp(buffer)
    .rotate() // honor EXIF orientation before the metadata is dropped
    .resize(maxEdge, maxEdge, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality })
    .toBuffer();
}
