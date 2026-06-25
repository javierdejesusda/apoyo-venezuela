import Link from 'next/link';

import { MapPinned } from 'lucide-react';

import { buttonClasses } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex flex-col items-center gap-5 max-w-md w-full">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
          <MapPinned className="h-7 w-7 text-brand-600" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <p className="text-5xl font-semibold text-ink-faint">404</p>
          <h1 className="text-xl font-semibold text-ink">Página no encontrada</h1>
          <p className="text-sm text-ink-soft">
            La página que buscas no existe o fue movida. Usa los enlaces de
            abajo para encontrar lo que necesitas.
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full sm:flex-row sm:justify-center">
          <Link href="/" className={buttonClasses('primary', 'md')}>
            Ir al inicio
          </Link>
          <Link href="/telefonos" className={buttonClasses('outline', 'md')}>
            Teléfonos de emergencia
          </Link>
        </div>
      </div>
    </div>
  );
}
