import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DuplicateFundraiserError } from '@/lib/data/fundraiser-url';

const { createFundraiser } = vi.hoisted(() => ({
  createFundraiser: vi.fn(),
}));

vi.mock('@/lib/data/store', () => ({
  getStore: () => ({ createFundraiser }),
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { createFundraiserAction } from '@/app/actions';

const VALID = {
  titulo: 'Ayuda para San Felipe',
  descripcion: 'Recaudación para familias afectadas por el terremoto.',
  url: 'https://www.gofundme.com/f/san-felipe?utm_source=whatsapp#share',
  organizador: 'Vecinos de San Felipe',
};

beforeEach(() => {
  createFundraiser.mockReset();
  createFundraiser.mockResolvedValue({ id: 'recaudacion_1' });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('createFundraiserAction', () => {
  it('rejects a non-gofundme url with a field error', async () => {
    const result = await createFundraiserAction({
      ...VALID,
      url: 'https://example.com/f/scam',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors?.url).toMatch(/GoFundMe/i);
    }
    expect(createFundraiser).not.toHaveBeenCalled();
  });

  it('rejects too-short title and description with field errors', async () => {
    const result = await createFundraiserAction({
      ...VALID,
      titulo: 'ab',
      descripcion: 'corto',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors?.titulo).toBeTruthy();
      expect(result.fieldErrors?.descripcion).toBeTruthy();
    }
    expect(createFundraiser).not.toHaveBeenCalled();
  });

  it('accepts a valid submission and persists the normalized url', async () => {
    const result = await createFundraiserAction(VALID);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.id).toBe('recaudacion_1');
    }
    expect(createFundraiser).toHaveBeenCalledWith(
      expect.objectContaining({
        titulo: 'Ayuda para San Felipe',
        url: 'https://gofundme.com/f/san-felipe',
        organizador: 'Vecinos de San Felipe',
      }),
    );
  });

  it('maps a duplicate url to a field error', async () => {
    createFundraiser.mockRejectedValueOnce(
      new DuplicateFundraiserError('https://www.gofundme.com/f/san-felipe'),
    );
    const result = await createFundraiserAction(VALID);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors?.url).toBe('Esta recaudacion ya esta publicada.');
    }
  });
});
