import Link from 'next/link';

import { Siren } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type {
  EmergencyStatus,
  NeedCategory,
  NeedStatus,
  PersonasAtrapadas,
  Urgency,
} from '@/lib/data/types';
import {
  categoryMeta,
  needStatusMeta,
  statusMeta,
  toneClasses,
  urgencyMeta,
} from '@/lib/status';

type BadgeSize = 'sm' | 'md';
type BadgeVariant = 'soft' | 'solid' | 'outline';

export function StatusBadge({
  status,
  size = 'md',
  variant = 'soft',
}: {
  status: EmergencyStatus;
  size?: BadgeSize;
  variant?: BadgeVariant;
}) {
  const m = statusMeta[status];
  return (
    <Badge tone={m.tone} icon={m.icon} size={size} variant={variant}>
      {m.label}
    </Badge>
  );
}

export function UrgencyPill({
  urgencia,
  size = 'sm',
}: {
  urgencia: Urgency;
  size?: BadgeSize;
}) {
  const m = urgencyMeta[urgencia];
  return (
    <Badge tone={m.tone} icon={m.icon} size={size}>
      {m.label}
    </Badge>
  );
}

export function NeedStatusBadge({
  status,
  size = 'sm',
}: {
  status: NeedStatus;
  size?: BadgeSize;
}) {
  const m = needStatusMeta[status];
  return (
    <Badge tone={m.tone} icon={m.icon} size={size}>
      {m.label}
    </Badge>
  );
}

export function CategoryChip({
  categoria,
  size = 'sm',
}: {
  categoria: NeedCategory;
  size?: BadgeSize;
}) {
  const m = categoryMeta[categoria];
  return (
    <Badge tone={m.tone} icon={m.icon} size={size}>
      {m.label}
    </Badge>
  );
}

/**
 * Life-safety indicator shown when a zone reports trapped persons.
 * Only renders for value 'si'; returns null for 'no' and 'no_se'.
 *
 * IMPORTANT: this is NEVER a "Verificado" badge. The caveat explicitly states
 * "Reporte ciudadano sin verificar" to prevent false authority.
 */
export function PersonasAtrapadasBadge({ value }: { value: PersonasAtrapadas }) {
  if (value !== 'si') return null;

  const { bg, border, text } = toneClasses('danger');

  return (
    <div className={`rounded-xl border px-3 py-2.5 ${border} ${bg}`}>
      <div className="flex items-center gap-2">
        <Siren className={`h-4 w-4 shrink-0 ${text}`} aria-hidden />
        <span className={`text-sm font-semibold ${text}`}>Personas atrapadas</span>
      </div>
      <p className="mt-1 text-xs text-ink-soft">
        Reporte ciudadano sin verificar. Llama a emergencias si es una situación de riesgo.{' '}
        <Link href="/telefonos" className="font-medium text-brand-600 underline hover:no-underline">
          Ver teléfonos de emergencia
        </Link>
      </p>
    </div>
  );
}
