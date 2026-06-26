import Link from 'next/link';
import { TriangleAlert } from 'lucide-react';

/** Persistent safety advisory shown on every page. Cannot be dismissed. */
export function SafetyBanner() {
  return (
    <aside
      aria-label="Aviso de seguridad"
      className="flex items-start gap-3 border-b border-danger/30 bg-danger/10 px-4 py-3 text-sm text-ink"
    >
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden />
      <p>
        <strong>No entres a estructuras dañadas.</strong>{' '}
        Si hay riesgo inmediato, llama a los servicios de emergencias.{' '}
        <Link
          href="/telefonos"
          className="font-medium underline underline-offset-2 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/50 rounded"
        >
          Ver teléfonos de emergencia
        </Link>
        .
      </p>
    </aside>
  );
}
