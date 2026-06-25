import { VenezuelaSilhouette } from '@/components/ui/venezuela-silhouette';
import { cn } from '@/lib/utils';

interface BrandMarkProps {
  className?: string;
  /** Adds a slow radiating ring behind the glyph (use on the hero / footer). */
  pulse?: boolean;
}

/**
 * Brand mark: the national silhouette of Venezuela on a signal-blue field - the
 * same identity as the favicon. Distinctly Venezuelan without using flag colors,
 * so it never competes with the emergency semaphore.
 */
export function BrandMark({ className, pulse = false }: BrandMarkProps) {
  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-card',
        'h-9 w-9',
        className,
      )}
    >
      {pulse && (
        <span
          aria-hidden
          className="seismic-ring pointer-events-none absolute inset-0 rounded-xl border border-white/40"
        />
      )}
      <VenezuelaSilhouette className="h-[70%] w-[70%] text-white" />
    </span>
  );
}
