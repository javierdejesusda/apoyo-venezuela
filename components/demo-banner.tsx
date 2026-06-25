import { Info } from 'lucide-react';

/** Shown only in demo mode (no Supabase configured) so data is not mistaken as live. */
export function DemoBanner({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="flex items-center justify-center gap-2 bg-warning/10 px-4 py-2 text-xs text-warning">
      <Info className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="text-left">
        Modo demostración: datos de ejemplo, no se comparten. Conecta Supabase para datos en vivo.
      </span>
    </div>
  );
}
