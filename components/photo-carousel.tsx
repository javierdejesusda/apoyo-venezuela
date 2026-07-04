'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

import { ZonePhoto } from '@/components/zone-photo';

/**
 * Inline carousel for a zone's photo set in list-card context.
 * Zero photos renders nothing; one photo renders the image without controls;
 * two or more photos add prev/next buttons and a position indicator.
 */
export function PhotoCarousel({ fotos }: { fotos: string[] }) {
  const [index, setIndex] = useState(0);

  if (fotos.length === 0) return null;

  if (fotos.length === 1) {
    return <ZonePhoto src={fotos[0]} alt="Foto del reporte" />;
  }

  function handlePrev(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i === 0 ? fotos.length - 1 : i - 1));
  }

  function handleNext(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i === fotos.length - 1 ? 0 : i + 1));
  }

  const controlClass = [
    'flex items-center justify-center',
    'h-6 w-6 rounded-lg',
    'bg-surface/90 border border-border',
    'text-ink-soft shadow-pop backdrop-blur-sm',
    'transition-[color,transform] hover:text-ink active:scale-[0.94]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600',
  ].join(' ');

  return (
    <div className="relative">
      <ZonePhoto src={fotos[index]} alt="Foto del reporte" />

      <div className="absolute inset-x-0 bottom-1.5 flex items-center justify-between px-1.5">
        <button type="button" aria-label="Foto anterior" onClick={handlePrev} className={controlClass}>
          <ChevronLeft size={12} aria-hidden />
        </button>

        <span
          aria-live="polite"
          className="rounded-full bg-black/55 px-1.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm"
        >
          Foto {index + 1} de {fotos.length}
        </span>

        <button type="button" aria-label="Foto siguiente" onClick={handleNext} className={controlClass}>
          <ChevronRight size={12} aria-hidden />
        </button>
      </div>
    </div>
  );
}
