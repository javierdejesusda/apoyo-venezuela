import { cn } from '@/lib/utils';

interface SeismicLoaderProps {
  label?: string;
  className?: string;
}

/**
 * Radiating "epicenter" loader - the page's recurring seismic device, reused
 * for the map and empty states so loading reads as part of the subject's world
 * rather than a generic spinner.
 */
export function SeismicLoader({ label, className }: SeismicLoaderProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 text-ink-faint', className)}>
      <span className="relative flex h-12 w-12 items-center justify-center" aria-hidden>
        <span className="seismic-ring absolute inset-0 rounded-full border border-brand-500/50" />
        <span
          className="seismic-ring absolute inset-0 rounded-full border border-brand-500/50"
          style={{ animationDelay: '0.8s' }}
        />
        <span
          className="seismic-ring absolute inset-0 rounded-full border border-brand-500/50"
          style={{ animationDelay: '1.6s' }}
        />
        <span className="h-2 w-2 rounded-full bg-brand-600" />
      </span>
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}
