import { describe, expect, it } from 'vitest';

import { createMemoryStore } from '@/lib/data/memory-store';
import { DuplicateFundraiserError } from '@/lib/data/fundraiser-url';
import type { Fundraiser } from '@/lib/data/types';

const SEED_URL =
  'https://gofundme.com/f/emergency-relief-for-venezuela-earthquake-victims';

function makeFundraiser(overrides: Partial<Fundraiser> & { url: string }): Fundraiser {
  const ts = '2026-06-25T00:00:00.000Z';
  return {
    id: 'seed_x',
    titulo: 'Campaña de ejemplo',
    descripcion: 'Descripción de ejemplo suficientemente larga.',
    createdAt: ts,
    updatedAt: ts,
    ...overrides,
  };
}

describe('memory store fundraisers', () => {
  it('includes the provided campaign in the default seed', async () => {
    const store = createMemoryStore();
    const list = await store.listFundraisers();
    expect(list.some((f) => f.url === SEED_URL)).toBe(true);
  });

  it('has no fundraisers when given an explicit empty seed', async () => {
    const store = createMemoryStore({ locations: [], needs: [] });
    expect(await store.listFundraisers()).toEqual([]);
  });

  it('creates a fundraiser and returns the stored record', async () => {
    const store = createMemoryStore({ locations: [], needs: [] });
    const created = await store.createFundraiser({
      titulo: 'Ayuda para Yaracuy',
      descripcion: 'Recaudación para familias afectadas en San Felipe.',
      url: 'https://www.gofundme.com/f/yaracuy',
      organizador: 'Vecinos de San Felipe',
    });
    expect(created.id).toBeTruthy();
    expect(created.organizador).toBe('Vecinos de San Felipe');
    const list = await store.listFundraisers();
    expect(list).toHaveLength(1);
    expect(list[0].url).toBe('https://www.gofundme.com/f/yaracuy');
  });

  it('lists fundraisers newest first by createdAt', async () => {
    const store = createMemoryStore({
      locations: [],
      needs: [],
      fundraisers: [
        makeFundraiser({
          url: 'https://www.gofundme.com/f/older',
          createdAt: '2026-06-20T00:00:00.000Z',
        }),
        makeFundraiser({
          url: 'https://www.gofundme.com/f/newer',
          createdAt: '2026-06-24T00:00:00.000Z',
        }),
      ],
    });
    const list = await store.listFundraisers();
    expect(list.map((f) => f.url)).toEqual([
      'https://www.gofundme.com/f/newer',
      'https://www.gofundme.com/f/older',
    ]);
  });

  it('rejects a duplicate normalized url', async () => {
    const store = createMemoryStore({
      locations: [],
      needs: [],
      fundraisers: [makeFundraiser({ url: 'https://www.gofundme.com/f/dup' })],
    });
    await expect(
      store.createFundraiser({
        titulo: 'Otra campaña',
        descripcion: 'Intento de publicar un enlace ya existente.',
        url: 'https://www.gofundme.com/f/dup',
      }),
    ).rejects.toBeInstanceOf(DuplicateFundraiserError);
  });
});
