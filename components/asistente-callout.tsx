import Link from 'next/link';
import { MessageCircle } from 'lucide-react';

import { cn } from '@/lib/utils';

interface AsistenteCalloutProps {
  className?: string;
}

/** Home callout card linking to the AI assistant page. */
export function AsistenteCallout({ className }: AsistenteCalloutProps) {
  return (
    <Link
      href="/asistente"
      className={cn(
        'group flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4 shadow-card transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lift active:scale-[0.99] dark:border-brand-900 dark:bg-brand-900/20',
        className,
      )}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
        <MessageCircle className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block font-semibold text-ink">
          Asistente de ayuda
        </span>
        <span className="mt-0.5 block text-sm text-ink-soft">
          Pregunta dónde llevar agua, medicinas o alimentos. Respuestas basadas en el mapa.
        </span>
      </span>
    </Link>
  );
}
