// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const listFundraisers = vi.fn();

vi.mock('@/lib/data/store', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/data/store')>();
  return {
    ...mod,
    getStore: () => ({ listFundraisers }) as unknown as ReturnType<typeof mod.getStore>,
  };
});

vi.mock('@/components/add-fundraiser-form', () => ({
  AddFundraiserForm: () => <div data-testid="add-fundraiser-form" />,
}));

const { default: RecaudacionesPage } = await import('@/app/recaudaciones/page');

afterEach(() => {
  cleanup();
  listFundraisers.mockReset();
});

describe('RecaudacionesPage', () => {
  it('renders a load-error note, not the empty state, when the store fails', async () => {
    // With ISR a failed render is cached and served to every visitor, so a
    // store failure must never masquerade as "there are no campaigns".
    listFundraisers.mockRejectedValue(new Error('supabase caido'));
    render(await RecaudacionesPage());
    expect(screen.getByRole('status')).toHaveTextContent(/no pudimos cargar/i);
    expect(screen.queryByText(/aún no hay recaudaciones/i)).toBeNull();
  });

  it('renders the genuine empty state when the store returns no campaigns', async () => {
    listFundraisers.mockResolvedValue([]);
    render(await RecaudacionesPage());
    expect(screen.getByText(/aún no hay recaudaciones/i)).toBeInTheDocument();
    expect(screen.queryByRole('status')).toBeNull();
  });
});
