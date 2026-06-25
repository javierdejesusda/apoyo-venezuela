// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { FundraiserCard } from '@/components/fundraiser-card';
import type { Fundraiser } from '@/lib/data/types';

function makeFundraiser(overrides: Partial<Fundraiser> = {}): Fundraiser {
  const ts = '2026-06-25T00:00:00.000Z';
  return {
    id: 'recaudacion_1',
    titulo: 'Ayuda para San Felipe',
    descripcion: 'Recaudación para familias afectadas por el terremoto.',
    url: 'https://www.gofundme.com/f/san-felipe',
    createdAt: ts,
    updatedAt: ts,
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

describe('FundraiserCard', () => {
  it('renders the title, description and host trust label', () => {
    render(<FundraiserCard fundraiser={makeFundraiser()} />);
    expect(screen.getByText('Ayuda para San Felipe')).toBeInTheDocument();
    expect(
      screen.getByText(/familias afectadas por el terremoto/i),
    ).toBeInTheDocument();
    expect(screen.getByText('gofundme.com')).toBeInTheDocument();
  });

  it('links to the campaign in a new, safe tab', () => {
    render(<FundraiserCard fundraiser={makeFundraiser()} />);
    const link = screen.getByRole('link', { name: /ver y donar en gofundme/i });
    expect(link).toHaveAttribute('href', 'https://www.gofundme.com/f/san-felipe');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('shows the organizer when present and omits it otherwise', () => {
    const { rerender } = render(
      <FundraiserCard fundraiser={makeFundraiser({ organizador: 'Vecinos de San Felipe' })} />,
    );
    expect(screen.getByText(/Vecinos de San Felipe/)).toBeInTheDocument();

    rerender(<FundraiserCard fundraiser={makeFundraiser({ organizador: undefined })} />);
    expect(screen.queryByText(/Vecinos de San Felipe/)).toBeNull();
  });
});
