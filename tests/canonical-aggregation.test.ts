import { describe, expect, it } from 'vitest';

import type { LocationRecord, ZoneUpdate } from '@/lib/data/types';
import { deriveCanonicalView } from '@/lib/data/zone-cluster';

function makeLocation(overrides: Partial<LocationRecord> = {}): LocationRecord {
  return {
    id: 'loc-1',
    nombre: 'Torre A',
    estado: 'Miranda',
    ciudad: 'Caracas',
    lat: 10.49,
    lng: -66.87,
    status: 'dano_parcial',
    personas_atrapadas: 'no',
    fotos: [],
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
    ...overrides,
  };
}

function makeUpdate(overrides: Partial<ZoneUpdate> = {}): ZoneUpdate {
  return {
    id: 'upd-1',
    clusterId: 'cl-1',
    kind: 'report_added',
    note: null,
    createdAt: '2026-06-01T00:00:00Z',
    ...overrides,
  };
}

describe('deriveCanonicalView precondition', () => {
  it('throws a descriptive error when called with an empty members array', () => {
    expect(() => deriveCanonicalView([], [])).toThrow(
      'deriveCanonicalView requires at least one member',
    );
  });
});

describe('deriveCanonicalView', () => {
  it('most severe status wins: derrumbe beats dano_parcial', () => {
    const members = [
      makeLocation({ id: 'a', status: 'dano_parcial' }),
      makeLocation({ id: 'b', status: 'derrumbe' }),
    ];
    const view = deriveCanonicalView(members, []);
    expect(view.status).toBe('derrumbe');
  });

  it('personas_atrapadas is si when any member is si', () => {
    const members = [
      makeLocation({ id: 'a', personas_atrapadas: 'no' }),
      makeLocation({ id: 'b', personas_atrapadas: 'si' }),
    ];
    const view = deriveCanonicalView(members, []);
    expect(view.personas_atrapadas).toBe('si');
  });

  it('personas_atrapadas is no_se when no si but one no_se', () => {
    const members = [
      makeLocation({ id: 'a', personas_atrapadas: 'no' }),
      makeLocation({ id: 'b', personas_atrapadas: 'no_se' }),
    ];
    const view = deriveCanonicalView(members, []);
    expect(view.personas_atrapadas).toBe('no_se');
  });

  it('personas_atrapadas is no when all members are no', () => {
    const members = [
      makeLocation({ id: 'a', personas_atrapadas: 'no' }),
      makeLocation({ id: 'b', personas_atrapadas: 'no' }),
    ];
    const view = deriveCanonicalView(members, []);
    expect(view.personas_atrapadas).toBe('no');
  });

  it('fotos is union of all member fotos without duplicates, first-seen order', () => {
    const members = [
      makeLocation({ id: 'a', fotos: ['url1', 'url2'] }),
      makeLocation({ id: 'b', fotos: ['url2', 'url3'] }),
    ];
    const view = deriveCanonicalView(members, []);
    expect(view.fotos).toEqual(['url1', 'url2', 'url3']);
  });

  it('updatedAt is the latest member updatedAt', () => {
    const members = [
      makeLocation({ id: 'a', updatedAt: '2026-06-01T00:00:00Z' }),
      makeLocation({ id: 'b', updatedAt: '2026-06-03T00:00:00Z' }),
    ];
    const view = deriveCanonicalView(members, []);
    expect(view.updatedAt).toBe('2026-06-03T00:00:00Z');
  });

  it('canonicalLocationId is the most-severe member id (re-elected, never relies on stored canonical)', () => {
    const members = [
      makeLocation({ id: 'stable-loc', status: 'estable' }),
      makeLocation({ id: 'severe-loc', status: 'derrumbe' }),
    ];
    const view = deriveCanonicalView(members, []);
    expect(view.canonicalLocationId).toBe('severe-loc');
  });

  it('memberCount equals members.length', () => {
    const members = [
      makeLocation({ id: 'a' }),
      makeLocation({ id: 'b' }),
      makeLocation({ id: 'c' }),
    ];
    const view = deriveCanonicalView(members, []);
    expect(view.memberCount).toBe(3);
  });

  it('a cluster of 3 members produces ONE canonical view, not 3', () => {
    const members = [
      makeLocation({ id: 'a', status: 'dano_parcial' }),
      makeLocation({ id: 'b', status: 'dano_grave' }),
      makeLocation({ id: 'c', status: 'estable' }),
    ];
    const result = deriveCanonicalView(members, []);
    expect(typeof result).toBe('object');
    expect(result.memberCount).toBe(3);
  });

  it('output has no verificado property', () => {
    const members = [makeLocation()];
    const view = deriveCanonicalView(members, []) as unknown as Record<string, unknown>;
    expect('verificado' in view).toBe(false);
    expect('Verificado' in view).toBe(false);
  });

  it('source LocationRecords are not mutated', () => {
    const members = [
      makeLocation({ id: 'a', status: 'dano_parcial', fotos: ['url1'] }),
      makeLocation({ id: 'b', status: 'derrumbe', fotos: ['url2'] }),
    ];
    const originalFotosA = [...(members[0].fotos ?? [])];
    const originalFotosB = [...(members[1].fotos ?? [])];
    const originalStatusA = members[0].status;
    const originalStatusB = members[1].status;
    deriveCanonicalView(members, []);
    expect(members[0].fotos).toEqual(originalFotosA);
    expect(members[1].fotos).toEqual(originalFotosB);
    expect(members[0].status).toBe(originalStatusA);
    expect(members[1].status).toBe(originalStatusB);
  });

  it('timeline is sorted chronologically ascending by createdAt', () => {
    const updates = [
      makeUpdate({ id: 'u2', createdAt: '2026-06-03T00:00:00Z', kind: 'status_changed' }),
      makeUpdate({ id: 'u1', createdAt: '2026-06-01T00:00:00Z', kind: 'report_added' }),
    ];
    const view = deriveCanonicalView([makeLocation()], updates);
    expect(view.timeline[0].createdAt).toBe('2026-06-01T00:00:00Z');
    expect(view.timeline[1].createdAt).toBe('2026-06-03T00:00:00Z');
  });
});
