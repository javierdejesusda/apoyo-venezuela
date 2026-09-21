import { Phone } from 'lucide-react';

import { EMERGENCY_SHORTCODES } from '@/lib/data/emergency-shortcodes';
import { cn } from '@/lib/utils';

/**
 * Header shortcut to the emergency line. A single button can only dial one
 * number, so it takes the first entry of EMERGENCY_SHORTCODES and says which
 * network that code works from. The page body lists the alternatives, because
 * no one code reaches emergency services on every Venezuelan carrier.
 */
export function EmergencyCallButton({ className }: { className?: string }) {
  const [primary] = EMERGENCY_SHORTCODES;

  return (
    <a
      href={primary.href}
      aria-label={`Llamar al ${primary.code}, emergencias desde ${primary.carrier}`}
      className={cn(
        'inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-danger px-4 text-sm font-semibold text-white shadow-card transition-transform duration-150 hover:brightness-105 active:scale-[0.96]',
        className,
      )}
    >
      <Phone className="h-4 w-4" aria-hidden />
      <span>Emergencia {primary.code}</span>
    </a>
  );
}
