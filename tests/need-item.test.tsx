// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { NeedItem } from '@/components/need-item';
import type { NeedRecord, NeedStatus } from '@/lib/data/types';

// Hoisted so the vi.mock factories (which are lifted above imports) can close
// over the same spy instances the tests assert on.
const { updateNeedStatusAction, refresh } = vi.hoisted(() => ({
  updateNeedStatusAction: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('@/app/actions', () => ({ updateNeedStatusAction }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));

function makeNeed(status: NeedStatus): NeedRecord {
  return {
    id: 'need_1',
    locationId: 'zona_1',
    categoria: 'agua',
    descripcion: 'Agua potable para 20 personas',
    urgencia: 'alta',
    status,
    createdAt: '2026-06-25T00:00:00.000Z',
    updatedAt: '2026-06-25T00:00:00.000Z',
  };
}

beforeEach(() => {
  updateNeedStatusAction.mockReset();
  updateNeedStatusAction.mockResolvedValue({ ok: true, data: undefined });
  refresh.mockReset();
});

afterEach(() => {
  cleanup();
});

describe('NeedItem one-step undo', () => {
  it('offers no undo control for a pending need (it is already the first state)', () => {
    render(<NeedItem need={makeNeed('pendiente')} locationId="zona_1" />);
    expect(screen.queryByRole('button', { name: /deshacer/i })).toBeNull();
  });

  it('reverts an "en camino" need one step back to "pendiente"', async () => {
    render(<NeedItem need={makeNeed('en_camino')} locationId="zona_1" />);
    fireEvent.click(screen.getByRole('button', { name: /deshacer/i }));
    await waitFor(() =>
      expect(updateNeedStatusAction).toHaveBeenCalledWith({
        id: 'need_1',
        status: 'pendiente',
        locationId: 'zona_1',
      }),
    );
  });

  it('reverts a "cubierto" need one step back to "en camino"', async () => {
    render(<NeedItem need={makeNeed('cubierto')} locationId="zona_1" />);
    fireEvent.click(screen.getByRole('button', { name: /deshacer/i }));
    await waitFor(() =>
      expect(updateNeedStatusAction).toHaveBeenCalledWith({
        id: 'need_1',
        status: 'en_camino',
        locationId: 'zona_1',
      }),
    );
  });

  it('refreshes the route after a successful undo', async () => {
    render(<NeedItem need={makeNeed('cubierto')} locationId="zona_1" />);
    fireEvent.click(screen.getByRole('button', { name: /deshacer/i }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });
});
