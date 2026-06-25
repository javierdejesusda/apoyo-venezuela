import { Badge } from '@/components/ui/badge';
import type {
  EmergencyStatus,
  NeedCategory,
  NeedStatus,
  Urgency,
} from '@/lib/data/types';
import {
  categoryMeta,
  needStatusMeta,
  statusMeta,
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
