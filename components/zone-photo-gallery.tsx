'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { X } from 'lucide-react';

import { ZonePhoto } from '@/components/zone-photo';
import { transformedFotoUrl } from '@/lib/data/foto-url';

/**
 * Square-thumbnail photo grid that opens the full, uncropped photo in an
 * accessible lightbox on tap. Thumbnails stay cropped to a tidy square grid;
 * the dialog shows the whole image (object-contain) so no evidence is hidden.
 */
export function ZonePhotoGallery({
  fotos,
  zoneName,
}: {
  fotos: string[];
  zoneName: string;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [entered, setEntered] = useState(false);
  const [fullFailed, setFullFailed] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setActiveIndex(null);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (activeIndex === null) return;
    closeRef.current?.focus();
    const frame = requestAnimationFrame(() => setEntered(true));
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      setEntered(false);
    };
  }, [activeIndex, close]);

  return (
    <>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {fotos.map((foto, index) => (
          <li key={`${foto}-${index}`}>
            <button
              type="button"
              onClick={(event) => {
                triggerRef.current = event.currentTarget;
                setFullFailed(false);
                setActiveIndex(index);
              }}
              aria-label={`Ampliar foto ${index + 1} de ${fotos.length} de la zona ${zoneName}`}
              className="block w-full cursor-pointer rounded-xl transition-transform active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
            >
              <ZonePhoto src={foto} alt={`Foto de la zona ${zoneName}`} />
            </button>
          </li>
        ))}
      </ul>

      {activeIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Foto ampliada de la zona ${zoneName}`}
          onClick={close}
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 transition-opacity duration-200 motion-reduce:transition-none ${
            entered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label="Cerrar foto"
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <X className="h-6 w-6" aria-hidden />
          </button>

          {fullFailed ? (
            <p className="text-sm text-white/80">Foto no disponible</p>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={transformedFotoUrl(fotos[activeIndex], { width: 1600, quality: 80 })}
              alt={`Foto ampliada de la zona ${zoneName}`}
              onClick={(event) => event.stopPropagation()}
              onError={() => setFullFailed(true)}
              className="img-outline max-h-[90vh] max-w-full rounded-xl object-contain"
            />
          )}
        </div>
      )}
    </>
  );
}
