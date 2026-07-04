/**
 * Client-side photo downscaling and WebP re-encoding, done once before upload so
 * photos are served raw from the public bucket instead of through Supabase's
 * image-transformation endpoint (which bills per unique origin image). A single
 * capped-and-compressed copy is stored and reused everywhere: cards, map
 * previews, and the full-size lightbox. Re-encoding on a canvas also drops any
 * residual metadata, so this doubles as an EXIF/GPS strip.
 */

/** Longest-edge cap, in pixels. Large enough for a crisp lightbox on high-DPR
 * phones and desktops, small enough that a stored WebP stays a few hundred KB. */
export const FOTO_MAX_EDGE = 1600;

/** WebP encoder quality (0-1). 0.72 keeps report photos legible at a fraction
 * of the original bytes. */
export const FOTO_WEBP_QUALITY = 0.72;

/**
 * Contain-fit target dimensions for an image whose longest edge is capped at
 * `maxEdge`. Never upscales - a photo already within the cap keeps its size -
 * and rounds to whole pixels. Zero dimensions pass through untouched so a
 * failed decode never divides by zero.
 *
 * @param width Source width in pixels.
 * @param height Source height in pixels.
 * @param maxEdge Longest-edge cap; defaults to {@link FOTO_MAX_EDGE}.
 * @returns The scaled `{ width, height }`.
 */
export function computeResizeDimensions(
  width: number,
  height: number,
  maxEdge: number = FOTO_MAX_EDGE,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest === 0 || longest <= maxEdge) return { width, height };
  const scale = maxEdge / longest;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/**
 * Swap a file's extension to match the re-encoded MIME type. The canvas only
 * ever produces WebP or, when the browser cannot encode WebP, PNG (the spec's
 * fallback), so those are the only two cases.
 */
function withExtension(name: string, mime: string): string {
  const ext = mime === 'image/png' ? 'png' : 'webp';
  const base = name.replace(/\.[^./\\]+$/, '');
  return `${base || 'foto'}.${ext}`;
}

/**
 * Downscale a picked photo to at most {@link FOTO_MAX_EDGE} on its longest side
 * and re-encode it in the browser, preferring WebP. Returns `null` when the
 * environment cannot decode or encode the image (no canvas, decode error), so
 * the caller can fall back to the original file - an emergency report photo must
 * still upload even if it cannot be optimized here. When the browser cannot
 * encode WebP it falls back to PNG per the canvas spec; the returned `File`
 * carries whatever MIME the canvas actually produced.
 *
 * @param file The user-selected image file.
 * @returns A downscaled `File`, or `null` if resizing is unavailable.
 */
export async function resizeImageToWebp(file: File): Promise<File | null> {
  if (typeof document === 'undefined' || typeof createImageBitmap !== 'function') {
    return null;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return null;
  }

  try {
    const { width, height } = computeResizeDimensions(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/webp', FOTO_WEBP_QUALITY);
    });
    if (!blob) return null;

    return new File([blob], withExtension(file.name, blob.type), {
      type: blob.type,
      lastModified: file.lastModified,
    });
  } catch {
    return null;
  } finally {
    bitmap.close();
  }
}
