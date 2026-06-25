import { Phone } from 'lucide-react';

import { cn, telHref } from '@/lib/utils';

/** Always-available shortcut to dial the national emergency line (911). */
export function EmergencyCallButton({ className }: { className?: string }) {
  return (
    <a
      href={telHref('911')}
      aria-label="Llamar al 911, línea de emergencias"
      className={cn(
        'inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-danger px-4 text-sm font-semibold text-white shadow-card transition-transform duration-150 hover:brightness-105 active:scale-[0.96]',
        className,
      )}
    >
      <Phone className="h-4 w-4" aria-hidden />
      <span>Emergencia 911</span>
    </a>
  );
}
