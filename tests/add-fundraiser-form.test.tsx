// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AddFundraiserForm } from '@/components/add-fundraiser-form';

const { createFundraiserAction, refresh } = vi.hoisted(() => ({
  createFundraiserAction: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('@/app/actions', () => ({ createFundraiserAction }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));

function fill(label: RegExp, value: string): void {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function fillValidForm(): void {
  fill(/título/i, 'Ayuda para San Felipe');
  fill(/enlace/i, 'https://www.gofundme.com/f/san-felipe');
  fill(/descripción/i, 'Recaudación para familias afectadas por el terremoto.');
}

beforeEach(() => {
  createFundraiserAction.mockReset();
  createFundraiserAction.mockResolvedValue({ ok: true, data: { id: 'recaudacion_1' } });
  refresh.mockReset();
});

afterEach(() => {
  cleanup();
});

describe('AddFundraiserForm', () => {
  it('renders the title, url, description and organizer fields', () => {
    render(<AddFundraiserForm />);
    expect(screen.getByLabelText(/título/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/enlace/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/descripción/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/organizador/i)).toBeInTheDocument();
  });

  it('shows a field error when the action rejects an invalid url', async () => {
    createFundraiserAction.mockResolvedValueOnce({
      ok: false,
      error: 'Revisa los datos del formulario.',
      fieldErrors: { url: 'Debe ser un enlace de GoFundMe (gofundme.com).' },
    });
    render(<AddFundraiserForm />);
    fillValidForm();
    fill(/enlace/i, 'https://example.com/f/scam');
    fireEvent.click(screen.getByRole('button', { name: /compartir|publicar/i }));

    const errorMessage = await screen.findByText(/Debe ser un enlace de GoFundMe/i);
    expect(errorMessage).toBeInTheDocument();
    // The error must be programmatically associated with its input (aria).
    expect(errorMessage).toHaveAttribute('id', 'fr-url-error');
    expect(screen.getByLabelText(/enlace/i)).toHaveAttribute(
      'aria-describedby',
      'fr-url-error',
    );
    expect(refresh).not.toHaveBeenCalled();
  });

  it('invokes the action and shows the success state on a valid submit', async () => {
    render(<AddFundraiserForm />);
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: /compartir|publicar/i }));

    await waitFor(() =>
      expect(createFundraiserAction).toHaveBeenCalledWith(
        expect.objectContaining({
          titulo: 'Ayuda para San Felipe',
          url: 'https://www.gofundme.com/f/san-felipe',
        }),
      ),
    );
    expect(await screen.findByRole('status')).toHaveTextContent(/gracias|publicada|lista/i);
    expect(refresh).toHaveBeenCalled();
  });
});
