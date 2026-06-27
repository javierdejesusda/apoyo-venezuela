import { describe, expect, it } from 'vitest';

import {
  STATUS_RANK,
  applyFilters,
  buildSummary,
  globalStats,
  sortLocations,
  withSummary,
} from '@/lib/data/selectors';
import type { LocationRecord, LocationWithNeeds, NeedRecord } from '@/lib/data/types';

const baseLocation = (over: Partial<LocationRecord>): LocationRecord => ({
  id: 'l1',
  nombre: 'Zona',
  estado: 'Carabobo',
  ciudad: 'Valencia',
  lat: 10,
  lng: -68,
  status: 'dano_parcial',
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

  it('filters by urgencia alta', () => {
    expect(applyFilters(locations, { urgencia: 'alta' }).map((l) => l.id)).toEqual(['a']);
  });

  it('filters by urgencia baja', () => {
    expect(applyFilters(locations, { urgencia: 'baja' }).map((l) => l.id)).toEqual(['b']);
  });

  it('filters by urgencia media', () => {
    const withMedia = [
      withSummary(baseLocation({ id: 'm', estado: 'Lara', ciudad: 'Barquisimeto', status: 'estable' }), [
        need({ id: 'nm', locationId: 'm', categoria: 'agua', urgencia: 'media' }),
      ]),
      ...locations,
    ];
    expect(applyFilters(withMedia, { urgencia: 'media' }).map((l) => l.id)).toEqual(['m']);
  });

  it('excludes a zone whose only matching-urgency need is cubierto', () => {
    const withCubierto = [
      withSummary(baseLocation({ id: 'x', estado: 'Lara', ciudad: 'Barquisimeto', status: 'estable' }), [
        need({ id: 'nx', locationId: 'x', urgencia: 'alta', status: 'cubierto' }),
      ]),
    ];
    expect(applyFilters(withCubierto, { urgencia: 'alta' }).map((l) => l.id)).toEqual([]);
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

describe('STATUS_RANK', () => {
  it('assigns rank 0 to derrumbe (most critical)', () => {
    expect(STATUS_RANK['derrumbe']).toBe(0);
  });

  it('assigns rank 1 to dano_grave', () => {
    expect(STATUS_RANK['dano_grave']).toBe(1);
  });

  it('assigns rank 2 to dano_parcial', () => {
    expect(STATUS_RANK['dano_parcial']).toBe(2);
  });

  it('assigns rank 3 to desconocido', () => {
    expect(STATUS_RANK['desconocido']).toBe(3);
  });

  it('assigns rank 4 to estable (least critical)', () => {
    expect(STATUS_RANK['estable']).toBe(4);
  });

  it('has strictly increasing ranks: derrumbe < dano_grave < dano_parcial < desconocido < estable', () => {
    expect(STATUS_RANK['derrumbe']).toBeLessThan(STATUS_RANK['dano_grave']);
    expect(STATUS_RANK['dano_grave']).toBeLessThan(STATUS_RANK['dano_parcial']);
    expect(STATUS_RANK['dano_parcial']).toBeLessThan(STATUS_RANK['desconocido']);
    expect(STATUS_RANK['desconocido']).toBeLessThan(STATUS_RANK['estable']);
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

  it('sorts derrumbe before dano_grave before dano_parcial before desconocido before estable', () => {
    const locs: LocationWithNeeds[] = [
      withSummary(baseLocation({ id: 'e', status: 'estable' }), []),
      withSummary(baseLocation({ id: 'd', status: 'desconocido' }), []),
      withSummary(baseLocation({ id: 'dp', status: 'dano_parcial' }), []),
      withSummary(baseLocation({ id: 'dg', status: 'dano_grave' }), []),
      withSummary(baseLocation({ id: 'r', status: 'derrumbe' }), []),
    ];
    const sorted = sortLocations(locs);
    expect(sorted.map((l) => l.id)).toEqual(['r', 'dg', 'dp', 'd', 'e']);
  });
});

describe('globalStats', () => {
  it('returns danoGrave and danoParcial counts alongside derrumbes', () => {
    const locs: LocationWithNeeds[] = [
      withSummary(baseLocation({ id: '1', status: 'derrumbe' }), []),
      withSummary(baseLocation({ id: '2', status: 'dano_grave' }), []),
      withSummary(baseLocation({ id: '3', status: 'dano_grave' }), []),
      withSummary(baseLocation({ id: '4', status: 'dano_parcial' }), []),
      withSummary(baseLocation({ id: '5', status: 'estable' }), []),
    ];
    const stats = globalStats(locs);
    expect(stats.zonas).toBe(5);
    expect(stats.derrumbes).toBe(1);
    expect(stats.danoGrave).toBe(2);
    expect(stats.danoParcial).toBe(1);
  });

  it('per-severity counts sum to total zones when all zones have a severity', () => {
    const locs: LocationWithNeeds[] = [
      withSummary(baseLocation({ id: '1', status: 'derrumbe' }), []),
      withSummary(baseLocation({ id: '2', status: 'dano_grave' }), []),
      withSummary(baseLocation({ id: '3', status: 'dano_parcial' }), []),
      withSummary(baseLocation({ id: '4', status: 'desconocido' }), []),
      withSummary(baseLocation({ id: '5', status: 'estable' }), []),
    ];
    const stats = globalStats(locs);
    const sum = stats.derrumbes + stats.danoGrave + stats.danoParcial;
    // derrumbes + danoGrave + danoParcial accounts for all non-estable non-desconocido
    expect(sum).toBe(3);
    expect(stats.zonas).toBe(5);
  });
});
