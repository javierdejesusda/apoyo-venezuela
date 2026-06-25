'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Truck, Check, Undo2 } from 'lucide-react';

import type { NeedRecord, NeedStatus } from '@/lib/data/types';
import { updateNeedStatusAction } from '@/app/actions';
import { formatRelativeTime } from '@/lib/utils';
import { CategoryChip, UrgencyPill, NeedStatusBadge } from '@/components/status-badges';
import { Button } from '@/components/ui/button';

interface NeedItemProps {
  need: NeedRecord;
  locationId: string;
}

/**
 * One-step rollback target for each status, so a mistaken click can be undone
 * by exactly one step. `pendiente` is the first state and has no previous, so
 * it is intentionally absent (no undo control is shown).
 */
const PREVIOUS_STATUS: Partial<Record<NeedStatus, NeedStatus>> = {
  en_camino: 'pendiente',
  cubierto: 'en_camino',
};

/** Accessible label describing where the undo sends each status back to. */
const UNDO_LABEL: Partial<Record<NeedStatus, string>> = {
  en_camino: 'Deshacer: volver a pendiente',
  cubierto: 'Deshacer: volver a en camino',
};

export function NeedItem({ need, locationId }: NeedItemProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const previousStatus = PREVIOUS_STATUS[need.status];

  function handleStatusUpdate(status: NeedStatus) {
    setError(null);
    startTransition(async () => {
      const result = await updateNeedStatusAction({ id: need.id, status, locationId });
      if (!result.ok) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <CategoryChip categoria={need.categoria} />
        <UrgencyPill urgencia={need.urgencia} />
        <NeedStatusBadge status={need.status} />
        <span className="ml-auto text-xs text-ink-faint">
          {formatRelativeTime(need.updatedAt)}
        </span>
      </div>

      <p className="text-sm text-ink leading-relaxed">{need.descripcion}</p>

      {need.cantidad && (
        <p className="text-xs text-ink-soft">
          Cantidad: <span className="font-medium text-ink">{need.cantidad}</span>
        </p>
      )}

      {error && (
        <p className="text-xs font-medium text-danger" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {need.status === 'pendiente' && (
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => handleStatusUpdate('en_camino')}
            aria-label="Marcar como en camino"
            className="min-h-[44px]"
          >
            <Truck className="h-3.5 w-3.5" aria-hidden />
            Lo voy a llevar
          </Button>
        )}

        {need.status === 'en_camino' && (
          <Button
            variant="secondary"
            size="sm"
            disabled={isPending}
            onClick={() => handleStatusUpdate('cubierto')}
            aria-label="Marcar como entregado"
            className="min-h-[44px]"
          >
            <Check className="h-3.5 w-3.5" aria-hidden />
            Entregado
          </Button>
        )}

        {need.status === 'cubierto' && (
          <div className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-medium text-success">
            <Check className="h-3.5 w-3.5" aria-hidden />
            Necesidad cubierta
          </div>
        )}

        {previousStatus && (
          <Button
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={() => handleStatusUpdate(previousStatus)}
            aria-label={UNDO_LABEL[need.status]}
            className="min-h-[44px] text-ink-soft"
          >
            <Undo2 className="h-3.5 w-3.5" aria-hidden />
            Deshacer
          </Button>
        )}
      </div>
    </div>
  );
}
