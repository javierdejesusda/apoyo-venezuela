import Link from 'next/link';
import { ChevronLeft, MapPinOff } from 'lucide-react';

import { buttonClasses } from '@/components/ui/button';

export default function ZonaNotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 pb-24 pt-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-2">
        <MapPinOff className="h-8 w-8 text-ink-faint" aria-hidden />
      </div>

      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-ink">Zona no encontrada</h1>
        <p className="text-sm text-ink-soft">
          La zona que buscas no existe o fue eliminada. Verifica el enlace e intenta de nuevo.
        </p>
      </div>

      <Link href="/" className={buttonClasses('primary', 'md')}>
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Volver al mapa
      </Link>
    </div>
  );
}
