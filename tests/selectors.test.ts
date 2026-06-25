import { describe, expect, it } from 'vitest';

import {
  applyFilters,
  buildSummary,
  sortLocations,
  withSummary,
} from '@/lib/data/selectors';
import type { LocationRecord, NeedRecord } from '@/lib/data/types';

const baseLocation = (over: Partial<LocationRecord>): LocationRecord => ({
  id: 'l1',
  nombre: 'Zona',
  estado: 'Carabobo',
  ciudad: 'Valencia',
  lat: 10,
  lng: -68,
  status: 'danado',
  createdAt: '2026-06-24T22:10:00Z',
  updatedAt: '2026-06-24T22:10:00Z',
  ...over,
});

const need = (over: Partial<NeedRecord>): NeedRecord => ({
  id: 'n1',
  locationId: 'l1',
  categoria: 'agua',
  descripcion: 'Agua potable',
  urgencia: 'media',
  status: 'pendiente',
  createdAt: '2026-06-24T22:10:00Z',
  updatedAt: '2026-06-24T22:10:00Z',
  ...over,
});

describe('buildSummary', () => {
  it('counts needs by status and flags urgent uncovered needs', () => {
    const summary = buildSummary([
      need({ id: 'a', urgencia: 'alta', status: 'pendiente' }),
      need({ id: 'b', urgencia: 'alta', status: 'cubierto' }),
      need({ id: 'c', urgencia: 'media', status: 'en_camino' }),
    ]);
    expect(summary.total).toBe(3);
    expect(summary.pendientes).toBe(1);
    expect(summary.enCamino).toBe(1);
    expect(summary.cubiertos).toBe(1);
    // only the uncovered alta need counts as urgent
    expect(summary.urgentes).toBe(1);
  });
});

describe('applyFilters', () => {
  const locations = [
    withSummary(baseLocation({ id: 'a', estado: 'Carabobo', status: 'derrumbe' }), [
      need({ id: 'n1', locationId: 'a', categoria: 'rescate', urgencia: 'alta' }),
    ]),
    withSummary(baseLocation({ id: 'b', estado: 'Yaracuy', status: 'estable' }), [
      need({ id: 'n2', locationId: 'b', categoria: 'agua', urgencia: 'baja' }),
    ]),
  ];

  it('filters by estado', () => {
    expect(applyFilters(locations, { estado: 'Yaracuy' }).map((l) => l.id)).toEqual(['b']);
  });

  it('filters by status', () => {
    expect(applyFilters(locations, { status: 'derrumbe' }).map((l) => l.id)).toEqual(['a']);
  });

  it('filters by need category', () => {
    expect(applyFilters(locations, { categoria: 'rescate' }).map((l) => l.id)).toEqual(['a']);
  });

  it('filters by urgent-only', () => {
    expect(applyFilters(locations, { soloUrgentes: true }).map((l) => l.id)).toEqual(['a']);
  });

  it('filters by free text across name and city', () => {
    const withText = applyFilters(locations, { texto: 'valencia' });
    expect(withText.length).toBe(2);
    expect(applyFilters(locations, { texto: 'noexiste' }).length).toBe(0);
  });

  it('returns all when no filters provided', () => {
    expect(applyFilters(locations).length).toBe(2);
  });
});

describe('sortLocations', () => {
  it('puts collapse + urgent zones before stable ones', () => {
    const stable = withSummary(baseLocation({ id: 'stable', status: 'estable' }), []);
    const collapse = withSummary(baseLocation({ id: 'collapse', status: 'derrumbe' }), [
      need({ id: 'x', locationId: 'collapse', urgencia: 'alta', status: 'pendiente' }),
    ]);
    const sorted = sortLocations([stable, collapse]);
    expect(sorted[0].id).toBe('collapse');
  });
});
