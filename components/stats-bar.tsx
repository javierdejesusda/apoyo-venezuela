import { Building2, MapPin, Package, TriangleAlert } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface GlobalStats {
  zonas: number;
  derrumbes: number;
  urgentes: number;
  necesidadesAbiertas: number;
}

const TILES = [
  { key: 'zonas', label: 'Zonas activas', icon: MapPin, color: 'text-brand-600' },
  { key: 'derrumbes', label: 'Derrumbes', icon: Building2, color: 'text-danger' },
  { key: 'urgentes', label: 'Urgentes', icon: TriangleAlert, color: 'text-warning' },
  { key: 'necesidadesAbiertas', label: 'Necesidades abiertas', icon: Package, color: 'text-ink' },
] as const;

/** Compact aggregate counts shown above the map on the home screen. */
export function StatsBar({ stats, className }: { stats: GlobalStats; className?: string }) {
  return (
    <dl className={cn('grid grid-cols-2 gap-2 sm:grid-cols-4', className)}>
      {TILES.map((tile) => {
        const Icon = tile.icon;
        return (
          <div key={tile.key} className="rounded-2xl border border-border bg-surface p-3">
            <div className="flex items-center gap-1.5 text-ink-soft">
              <Icon className={cn('h-4 w-4', tile.color)} aria-hidden />
              <dt className="text-xs font-medium">{tile.label}</dt>
            </div>
            <dd className="tabular mt-1 text-2xl font-semibold text-ink">{stats[tile.key]}</dd>
          </div>
        );
      })}
    </dl>
  );
}
