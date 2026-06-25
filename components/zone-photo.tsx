'use client';

import { useState } from 'react';

/**
 * A single zone photo from Supabase Storage with a layout-preserving fallback.
 * On blocked or degraded networks the *.supabase.co request fails; onError swaps
 * in a neutral tile so the photo grid never collapses. Raw <img> is intentional:
 * it avoids the image optimizer and a second remote dependency on a censored
 * network.
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
