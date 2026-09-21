import {
  Building2,
  ClipboardList,
  ExternalLink,
  Globe,
  HandCoins,
  HardHat,
  Hospital,
  Info,
  Megaphone,
  Package,
  PawPrint,
  Phone,
  Siren,
  Stethoscope,
  Tent,
  TriangleAlert,
  Truck,
  UserSearch,
  Utensils,
  type LucideIcon,
} from 'lucide-react';

import { PageHeader } from '@/components/page-header';
import { VenezuelaSilhouette } from '@/components/ui/venezuela-silhouette';
import { EMERGENCY_SHORTCODES } from '@/lib/data/emergency-shortcodes';
import { CENTRAL_PLATFORM, INITIATIVE_CATEGORIES } from '@/lib/data/red-iniciativas';
import { toneClasses, type Tone } from '@/lib/status';
import { cn, telHref } from '@/lib/utils';

/**
 * Lucide icon per category slug; kept here so the data layer stays UI-free.
 * Exported so a test can assert every category has a mapped icon (the render
 * falls back to a generic globe, which would otherwise hide a missing entry).
 */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'personas-desaparecidas': UserSearch,
  'danos-estructurales': Building2,
  'apoyo-presencial-rescate': Siren,
  'inspeccion-habitabilidad': HardHat,
  'centros-de-acopio': Package,
  'insumos-por-zona': ClipboardList,
  'donaciones-y-pagos': HandCoins,
  'centros-de-alimentacion': Utensils,
  'refugios-y-alojamiento': Tent,
  'pacientes-en-hospitales': Hospital,
  mascotas: PawPrint,
  'logistica-y-transporte': Truck,
  'apoyo-medico-psicologico': Stethoscope,
};

/** Strip the protocol and any trailing slash for compact link display. */
function stripProtocol(url: string) {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-border bg-surface p-4 md:p-5', className)}>
      {children}
    </div>
  );
}

/** Icon chip, heading and description used to title each page section. */
function SectionHeader({
  icon: Icon,
  title,
  description,
  id,
  tone = 'brand',
  level = 'h3',
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  id?: string;
  tone?: Tone;
  level?: 'h2' | 'h3';
}) {
  const Heading = level;
  return (
    <div className="mb-4 flex items-start gap-3">
      <span
        className={cn(
          'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
          toneClasses(tone).solid,
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div>
        <Heading
          id={id}
          className={cn('font-semibold text-ink', level === 'h2' ? 'text-xl' : 'text-lg')}
        >
          {title}
        </Heading>
        <p className="mt-0.5 text-sm text-ink-soft">{description}</p>
      </div>
    </div>
  );
}

/** A row of accessible, thumb-sized links to external initiatives. */
function InitiativeLinks({ urls }: { urls: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {urls.map((url) => (
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm font-medium text-brand-600 transition-colors hover:border-brand-300 hover:bg-brand-50"
        >
          <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="max-w-[220px] truncate">{stripProtocol(url)}</span>
          <ExternalLink className="h-3 w-3 shrink-0 text-ink-faint" aria-hidden />
        </a>
      ))}
    </div>
  );
}

/**
 * The only page this deployment still serves. It is deliberately static: no
 * store, no fetch and no revalidation window, so an idle site costs nothing.
 * Its whole job is to hand visitors over to the initiative network, with the
 * central platform as the primary destination.
 */
export default function HomePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-12 py-6">
      <PageHeader
        icon={Info}
        eyebrow="Nueva etapa"
        title={`Ahora trabajamos en ${CENTRAL_PLATFORM.name}`}
        description={`El esfuerzo que empezó aquí tras el sismo de junio de 2026 se sumó a ${CENTRAL_PLATFORM.name}, donde la red de iniciativas se coordina en un solo lugar. Allí continúa el trabajo, y aquí abajo tienes todos los canales.`}
      />

      <aside
        aria-label="Qué cambió"
        className="flex items-start gap-3 rounded-2xl border border-warning/25 bg-warning/10 p-4 md:p-5"
      >
        <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden />
        <div className="space-y-2 text-sm leading-relaxed text-ink-soft">
          <p>
            El mapa de zonas afectadas, los reportes y los teléfonos de emergencia ya no
            están disponibles aquí. Esa coordinación se hace ahora en la red.
          </p>
          <p>
            Si necesitas ayuda o quieres apoyar, empieza por {CENTRAL_PLATFORM.name} o usa
            los canales que se listan más abajo.
          </p>
          <p className="font-semibold text-ink">
            Ante una emergencia que ponga en riesgo la vida, el número depende de tu
            operadora:
          </p>
          <ul className="flex flex-wrap gap-2">
            {EMERGENCY_SHORTCODES.map((entry) => (
              <li key={entry.code}>
                <a
                  href={telHref(entry.code)}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-danger/30 bg-surface px-3 py-2 text-sm transition-colors hover:border-danger/60"
                >
                  <Phone className="h-4 w-4 shrink-0 text-danger" aria-hidden />
                  <span className="font-semibold text-danger">{entry.code}</span>
                  <span className="text-ink-soft">{entry.carrier}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <section aria-labelledby="plataforma-central-heading">
        <div className="relative overflow-hidden rounded-3xl border border-hero-border bg-hero p-6 md:p-8">
          <span
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-12 text-hero-silhouette"
          >
            <VenezuelaSilhouette className="h-64 w-64" />
          </span>

          <div className="relative space-y-4">
            <p className="eyebrow text-hero-ink-faint">Plataforma central</p>
            <h2
              id="plataforma-central-heading"
              className="font-display text-2xl font-semibold tracking-tight text-hero-ink sm:text-3xl"
            >
              Continúa en {CENTRAL_PLATFORM.name}
            </h2>
            <p className="max-w-prose text-hero-ink-soft">
              {CENTRAL_PLATFORM.name} reúne y enlaza cada esfuerzo de esta red en un solo
              lugar, para que encuentres el canal correcto sin recorrer sitio por sitio.
            </p>
            <a
              href={CENTRAL_PLATFORM.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[48px] items-center gap-2 rounded-2xl bg-brand-600 px-5 py-3 text-base font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-brand-700 active:scale-[0.96]"
            >
              <Globe className="h-4 w-4 shrink-0" aria-hidden />
              {stripProtocol(CENTRAL_PLATFORM.url)}
              <ExternalLink className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            </a>
          </div>
        </div>
      </section>

      <section aria-labelledby="categorias-heading" className="space-y-8">
        <h2 id="categorias-heading" className="text-xl font-semibold text-ink">
          Iniciativas por tipo de ayuda
        </h2>
        {INITIATIVE_CATEGORIES.map((category) => {
          const Icon = CATEGORY_ICONS[category.slug] ?? Globe;
          return (
            <div key={category.slug} id={category.slug} className="scroll-mt-24">
              <SectionHeader
                icon={Icon}
                title={category.title}
                description={category.description}
              />
              <Card>
                <InitiativeLinks urls={category.urls} />
              </Card>
            </div>
          );
        })}
      </section>

      <section aria-label="Nota final">
        <Card className="border-border bg-surface-2">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-900/30">
              <Megaphone className="h-4 w-4" aria-hidden />
            </span>
            <div className="space-y-2 text-sm leading-relaxed text-ink-soft">
              <p>
                Comparte esta red. Cada persona que la recibe puede sumarse al esfuerzo o
                apoyar a quienes más lo necesitan.
              </p>
              <p>
                Verifica la información en cada canal antes de actuar o compartirla. Estos
                enlaces llevan a sitios externos administrados por cada iniciativa.
              </p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
