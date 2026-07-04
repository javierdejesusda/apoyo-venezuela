'use client';

import { useState } from 'react';

/**
 * A single zone photo from Supabase Storage with a layout-preserving fallback.
 * Photos are downscaled and WebP-encoded once at upload/import time and served
 * raw from the public bucket, so there is no per-request image transformation
 * (which Supabase bills per unique image) and no second remote host. The grid
 * renders a square via CSS `object-cover`; the browser scales the single stored
 * copy. On blocked or degraded networks the *.supabase.co request fails; onError
 * swaps in a neutral tile so the photo grid never collapses.
 */
export function ZonePhoto({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label="Foto no disponible"
        className="img-outline flex aspect-square w-full items-center justify-center rounded-xl bg-surface-2 text-center text-xs text-ink-faint"
      >
        Foto no disponible
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className="img-outline aspect-square w-full rounded-xl object-cover"
    />
  );
}
