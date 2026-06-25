import { describe, expect, it, vi } from 'vitest';

import { DuplicateFundraiserError } from '@/lib/data/fundraiser-url';

const single = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      insert: () => ({
        select: () => ({ single }),
      }),
    }),
  }),
}));

import { createSupabaseStore } from '@/lib/data/supabase-store';

const INPUT = {
  titulo: 'Ayuda para San Felipe',
  descripcion: 'Recaudacion para familias afectadas por el terremoto.',
  url: 'https://gofundme.com/f/san-felipe',
};

describe('supabase store createFundraiser', () => {
  it('maps a Postgres unique violation (23505) to DuplicateFundraiserError', async () => {
    single.mockResolvedValueOnce({ data: null, error: { code: '23505' } });
    const store = createSupabaseStore('https://example.supabase.co', 'anon-key');
    await expect(store.createFundraiser(INPUT)).rejects.toBeInstanceOf(
      DuplicateFundraiserError,
    );
  });

  it('rethrows a non-unique-violation error unchanged', async () => {
    const dbError = { code: '42P01', message: 'relation does not exist' };
    single.mockResolvedValueOnce({ data: null, error: dbError });
    const store = createSupabaseStore('https://example.supabase.co', 'anon-key');
    await expect(store.createFundraiser(INPUT)).rejects.toBe(dbError);
  });

  it('maps the stored row to the domain fundraiser on success', async () => {
    single.mockResolvedValueOnce({
      data: {
        id: 'fr_1',
        titulo: INPUT.titulo,
        descripcion: INPUT.descripcion,
        url: INPUT.url,
        organizador: null,
        created_at: '2026-06-25T00:00:00.000Z',
        updated_at: '2026-06-25T00:00:00.000Z',
      },
      error: null,
    });
    const store = createSupabaseStore('https://example.supabase.co', 'anon-key');
    const created = await store.createFundraiser(INPUT);
    expect(created.id).toBe('fr_1');
    expect(created.organizador).toBeUndefined();
    expect(created.createdAt).toBe('2026-06-25T00:00:00.000Z');
  });
});
