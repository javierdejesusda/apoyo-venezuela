import Link from 'next/link';
import { Users } from 'lucide-react';

/** Civic guidance callout: stay away from collapse sites, let rescue teams work. */
export function RescueAdvisory() {
  return (
    <aside
      aria-label="Consejo de seguridad ciudadana"
      className="rounded-xl border border-warning/30 bg-warning/10 p-4"
    >
      <div className="flex items-start gap-3">
        <Users className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden />
        <div className="min-w-0 space-y-2">
          <p className="font-display text-sm font-semibold text-ink">
            Deja que los equipos de rescate trabajen
          </p>
          <ul className="space-y-1 text-sm text-ink-soft">
            <li>
              No vayas a zonas de derrumbe. Tu presencia bloquea el acceso a personas atrapadas
              y pone mas vidas en riesgo.
            </li>
            <li>
              Evita acercarte a los sitios afectados sin coordinacion. Los rescatistas
              profesionales necesitan espacio y tiempo para operar.
            </li>
            <li>
              Canaliza tu ayuda a traves de los centros de acopio oficiales, donde llega a
              quienes mas la necesitan.
            </li>
          </ul>
          <Link
            href="/guia"
            className="inline-flex items-center gap-1 rounded text-sm font-medium text-brand-600 underline underline-offset-2 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 dark:text-brand-400"
          >
            Ver centros de acopio y como ayudar
          </Link>
        </div>
      </div>
    </aside>
  );
}
