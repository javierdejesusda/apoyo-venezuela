'use client';

import Link from 'next/link';

import { RefreshCw, TriangleAlert } from 'lucide-react';

import { Button, buttonClasses } from '@/components/ui/button';

interface ErrorProps {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}

export default function Error({ error, unstable_retry }: ErrorProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex flex-col items-center gap-5 max-w-md w-full">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10">
          <TriangleAlert className="h-7 w-7 text-danger" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-ink">Algo salió mal</h1>
          <p className="text-sm text-ink-soft">
            Ocurrió un error al cargar esta página. Puedes intentarlo de nuevo o
            volver al inicio.
          </p>
          {error.digest && (
            <p className="text-xs text-ink-faint">
              Referencia: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 w-full sm:flex-row sm:justify-center">
          <Button variant="primary" size="md" onClick={unstable_retry}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Reintentar
          </Button>
          <Link href="/" className={buttonClasses('outline', 'md')}>
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
