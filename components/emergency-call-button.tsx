import { Phone } from 'lucide-react';

import { PRIMARY_SHORTCODE } from '@/lib/data/emergency-shortcodes';
import { cn, telHref } from '@/lib/utils';

/**
 * Header shortcut to the emergency line. A single button can only dial one
 * number, so it dials the declared primary and names the network that code
 * works from, in the visible label and not only in the accessible name: this
 * is the loudest element on the page, and a bare code here would keep
 * claiming a single national number that does not exist. The page body lists
 * the alternatives for the other carriers.
 */
export function EmergencyCallButton({ className }: { className?: string }) {
  return (
    <a
      href={telHref(PRIMARY_SHORTCODE.code)}
      aria-label={`Llamar al ${PRIMARY_SHORTCODE.code}, emergencias desde ${PRIMARY_SHORTCODE.carrier}`}
      className={cn(
        'inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-danger px-4 text-sm font-semibold text-white shadow-card transition-transform duration-150 hover:brightness-105 active:scale-[0.96]',
        className,
      )}
    >
      <Phone className="h-4 w-4 shrink-0" aria-hidden />
      <span>
        {PRIMARY_SHORTCODE.code}
        <span className="ml-1 font-normal opacity-80">{PRIMARY_SHORTCODE.carrier}</span>
      </span>
    </a>
  );
}
