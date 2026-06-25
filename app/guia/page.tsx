import {
  BadgeCheck,
  BookOpen,
  Building,
  CheckCircle,
  ExternalLink,
  Globe,
  Info,
  MapPin,
  Megaphone,
  Phone,
  ShieldCheck,
  ThumbsDown,
  ThumbsUp,
  TriangleAlert,
  Users,
} from 'lucide-react';
import type { Metadata } from 'next';

import { MissingPersonsLink } from '@/components/missing-persons-link';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { aidOrganizations, shelters, supplyGuidance } from '@/lib/data/resources';
import type { ResourceItem } from '@/lib/data/types';
import { toneClasses, type Tone } from '@/lib/status';
import { cn, telHref } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Guia de ayuda',
};

/** Label and tone for each supply category. */
const SUPPLY_CATEGORY_META: Record<
  string,
  { label: string; tone: 'success' | 'brand' | 'danger' | 'warning' | 'neutral' }
> = {
  necesario: { label: 'Necesario', tone: 'success' },
  util: { label: 'Util', tone: 'brand' },
  evitar: { label: 'Evitar', tone: 'danger' },
};

function SectionHeading({
  id,
  icon: Icon,
  title,
  subtitle,
  tone = 'brand',
}: {
  id: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  title: string;
  subtitle?: string;
  tone?: Tone;
}) {
  return (
    <div className="mb-6 flex items-start gap-3">
      <span
        className={cn(
          'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
          toneClasses(tone).solid,
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div>
        <h2 id={id} className="text-xl font-semibold text-ink">
          {title}
        </h2>
        {subtitle && <p className="mt-0.5 text-sm text-ink-soft">{subtitle}</p>}
      </div>
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-border bg-surface p-4 md:p-5', className)}>
      {children}
    </div>
  );
}

function SupplyItem({
  item,
  tone,
}: {
  item: ResourceItem;
  tone: 'success' | 'brand' | 'danger' | 'warning' | 'neutral';
}) {
  const isAvoid = tone === 'danger' || tone === 'warning';
  const iconEl = isAvoid ? (
    <ThumbsDown
      className="mt-0.5 h-4 w-4 shrink-0 text-danger"
      aria-hidden
    />
  ) : (
    <ThumbsUp
      className="mt-0.5 h-4 w-4 shrink-0 text-success"
      aria-hidden
    />
  );
  return (
    <div className="flex gap-3 py-3">
      {iconEl}
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{item.name}</p>
        {item.description && (
          <p className="mt-0.5 text-sm text-ink-soft">{item.description}</p>
        )}
      </div>
    </div>
  );
}

function OrgCard({ item }: { item: ResourceItem }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-ink">{item.name}</h3>
            {item.verified && (
              <Badge tone="success" icon={BadgeCheck} size="sm">
                Verificado
              </Badge>
            )}
          </div>
          {item.category && (
            <p className="mt-0.5 text-xs text-ink-faint">{item.category}</p>
          )}
        </div>
      </div>
      {item.description && (
        <p className="mt-2 text-sm text-ink-soft">{item.description}</p>
      )}
      {item.phones && item.phones.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {item.phones.map((phone) => (
            <a
              key={phone}
              href={telHref(phone)}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm font-medium text-brand-600 transition-colors hover:border-brand-300 hover:bg-brand-50"
            >
              <Phone className="h-3.5 w-3.5" aria-hidden />
              {phone}
            </a>
          ))}
        </div>
      )}
      {item.urls && item.urls.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {item.urls.map((url) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm font-medium text-brand-600 transition-colors hover:border-brand-300 hover:bg-brand-50"
            >
              <Globe className="h-3.5 w-3.5" aria-hidden />
              <span className="max-w-[200px] truncate">{url.replace(/^https?:\/\//, '')}</span>
              <ExternalLink className="h-3 w-3 shrink-0 text-ink-faint" aria-hidden />
            </a>
          ))}
        </div>
      )}
    </Card>
  );
}

function ShelterCard({ item }: { item: ResourceItem }) {
  return (
    <Card>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <Building className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <h3 className="font-semibold text-ink">{item.name}</h3>
          {item.category && (
            <span className="text-xs capitalize text-ink-faint">{item.category}</span>
          )}
        </div>
        {item.verified === false && (
          <Badge tone="warning" size="sm" className="ml-auto shrink-0">
            Sin verificar
          </Badge>
        )}
      </div>
      {item.description && (
        <p className="mt-3 text-sm text-ink-soft">{item.description}</p>
      )}
      {item.location && (
        <div className="mt-2 flex items-center gap-1.5 text-sm text-ink-soft">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-faint" aria-hidden />
          <span>{item.location}</span>
        </div>
      )}
      {item.urls && item.urls.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {item.urls.map((url) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-ink-soft transition-colors hover:border-brand-300 hover:text-brand-600"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="max-w-[220px] truncate">{url.replace(/^https?:\/\//, '')}</span>
            </a>
          ))}
        </div>
      )}
      {item.source && (
        <p className="mt-3 border-t border-border pt-3 text-xs text-ink-faint">
          Fuente: {item.source}
        </p>
      )}
    </Card>
  );
}

export default function GuiaPage() {
  /** Group supplyGuidance by category. */
  const supplyByCategory = supplyGuidance.reduce<Record<string, ResourceItem[]>>((acc, item) => {
    const cat = item.category ?? 'otro';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  /** Ordered groups: necesario first, then util, then evitar, then any unknown. */
  const knownCategories = ['necesario', 'util', 'evitar'];
  const unknownCategories = Object.keys(supplyByCategory).filter(
    (c) => !knownCategories.includes(c),
  );
  const neededCategories = ['necesario', 'util'].filter((c) => supplyByCategory[c]);
  const avoidCategories = ['evitar'].filter((c) => supplyByCategory[c]);

  return (
    <div className="mx-auto max-w-2xl space-y-12 py-6">
      <PageHeader
        icon={BookOpen}
        eyebrow="Guía"
        title="Cómo ayudar, sin estorbar"
        description="Datos del sismo, qué donar y qué evitar, refugios, organizaciones verificadas y personas desaparecidas."
      />

      <section aria-labelledby="sismo-heading">
        <SectionHeading
          id="sismo-heading"
          icon={TriangleAlert}
          title="Datos del sismo"
          subtitle="Información factual sobre el terremoto del 24 de junio de 2026"
          tone="danger"
        />
        <Card>
          <div className="space-y-3 text-sm text-ink-soft leading-relaxed">
            <p>
              El{' '}
              <strong className="text-ink">24 de junio de 2026</strong> Venezuela fue afectada
              por un doble sismo de magnitudes aproximadas{' '}
              <strong className="text-ink">M7.1 y M7.5</strong>. La zona más afectada fue{' '}
              <strong className="text-ink">Yaracuy</strong> (San Felipe y Yumare) y{' '}
              <strong className="text-ink">la costa de Carabobo</strong>. Los efectos también
              se sintieron con fuerza en{' '}
              <strong className="text-ink">Caracas, Aragua y La Guaira</strong>.
            </p>
            <p>
              El gobierno declaró estado de emergencia nacional y activó el sistema de
              búsqueda, rescate y atención a damnificados a través de Protección Civil y los
              Cuerpos de Bomberos.
            </p>
            <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 p-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
              <p className="text-warning">
                <strong>Verifica antes de compartir.</strong> La situación evoluciona
                rápidamente. Confirma la información con fuentes oficiales antes de
                difundirla.
              </p>
            </div>
          </div>
        </Card>
      </section>

      <section aria-labelledby="donaciones-heading">
        <SectionHeading
          id="donaciones-heading"
          icon={ShieldCheck}
          title="Qué donar y qué evitar"
          subtitle="Recomendaciones basadas en estándares internacionales de respuesta a desastres"
          tone="success"
        />

        {neededCategories.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-3 flex items-center gap-2 text-[17px] font-semibold text-ink">
              <CheckCircle className="h-4 w-4 text-success" aria-hidden />
              Lo que se necesita
            </h3>
            <Card>
              <div className="divide-y divide-border">
                {neededCategories.flatMap((cat) => {
                  const meta = SUPPLY_CATEGORY_META[cat] ?? {
                    label: cat,
                    tone: 'neutral' as const,
                  };
                  return (supplyByCategory[cat] ?? []).map((item) => (
                    <SupplyItem
                      key={item.name}
                      item={item}
                      tone={meta.tone}
                    />
                  ));
                })}
              </div>
            </Card>
          </div>
        )}

        {avoidCategories.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-3 flex items-center gap-2 text-[17px] font-semibold text-ink">
              <TriangleAlert className="h-4 w-4 text-danger" aria-hidden />
              Qué evitar
            </h3>
            <Card className="border-danger/20">
              <div className="divide-y divide-border">
                {avoidCategories.flatMap((cat) =>
                  (supplyByCategory[cat] ?? []).map((item) => (
                    <SupplyItem key={item.name} item={item} tone="danger" />
                  )),
                )}
              </div>
            </Card>
          </div>
        )}

        {unknownCategories.length > 0 && (
          <div>
            <h3 className="mb-3 text-[17px] font-semibold text-ink">Recomendaciones</h3>
            <Card>
              <ul className="divide-y divide-border">
                {unknownCategories.flatMap((cat) =>
                  (supplyByCategory[cat] ?? []).map((item) => (
                    <li key={item.name} className="py-3">
                      <p className="text-sm font-medium text-ink">{item.name}</p>
                      {item.description && (
                        <p className="mt-0.5 text-sm text-ink-soft">{item.description}</p>
                      )}
                    </li>
                  )),
                )}
              </ul>
            </Card>
          </div>
        )}
      </section>

      <section aria-labelledby="refugios-heading">
        <SectionHeading
          id="refugios-heading"
          icon={Building}
          title="Refugios y centros de acopio"
          subtitle="Información actualizada según la cobertura disponible al 24-jun-2026"
          tone="neutral"
        />
        <div className="space-y-4">
          {shelters.map((shelter) => (
            <ShelterCard key={shelter.name} item={shelter} />
          ))}
        </div>
      </section>

      <section aria-labelledby="organizaciones-heading">
        <SectionHeading
          id="organizaciones-heading"
          icon={Users}
          title="Organizaciones de ayuda"
          subtitle="Canales verificados para donar o coordinar asistencia"
          tone="neutral"
        />
        <div className="space-y-4">
          {aidOrganizations.map((org) => (
            <OrgCard key={org.name} item={org} />
          ))}
        </div>
      </section>

      <section aria-labelledby="desaparecidos-heading">
        <SectionHeading
          id="desaparecidos-heading"
          icon={Users}
          title="Personas desaparecidas"
          subtitle="Reporta o consulta personas desaparecidas tras el sismo"
          tone="neutral"
        />
        <MissingPersonsLink variant="card" />
      </section>

      <section aria-label="Nota de cierre">
        <Card className="border-border bg-surface-2">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-900/30">
              <Megaphone className="h-4 w-4" aria-hidden />
            </span>
            <div className="space-y-2 text-sm text-ink-soft leading-relaxed">
              <p>
                <strong className="text-ink">Apoyo Venezuela</strong> es una iniciativa
                ciudadana <strong className="text-ink">sin afiliación política</strong> de
                ningún tipo. Su único propósito es facilitar la coordinación de ayuda
                humanitaria.
              </p>
              <p>
                Verifica la información antes de actuar o compartirla. En casos de peligro
                inminente, llama al{' '}
                <a
                  href={telHref('911')}
                  className="font-semibold text-danger underline underline-offset-2"
                >
                  911
                </a>
                .
              </p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
