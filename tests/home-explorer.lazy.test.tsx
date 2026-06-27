// @vitest-environment jsdom
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HomeExplorer } from '@/components/home-explorer';
import { PAGE_SIZE } from '@/lib/data/store';
import type { LocationWithNeeds } from '@/lib/data/types';

// When the MapView dynamic import resolves in later tests (the critical-path
// test is the first to trigger the lazy load and caches it), the real component
// calls two APIs that do not exist in jsdom. Mock both so the component can
// render without throwing.
vi.mock('@/components/theme-provider', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  useTheme: () => ({ theme: 'light' as const, resolvedTheme: 'light' as const, setTheme: vi.fn() }),
}));

// `usePrefersReducedMotion` and `usePrefersDark` call window.matchMedia which
// jsdom lacks. Return safe defaults so MapView can render without throwing.
vi.mock('@/lib/use-prefers-dark', () => ({
  useMediaQuery: () => false,
  usePrefersDark: () => false,
  usePrefersReducedMotion: () => false,
}));

interface ZonasResponse {
  items: LocationWithNeeds[];
  total: number;
  nextCursor: number | null;
}

// Zones default to having one open need so they pass the ayuda soloConPedidos
// filter that seeded state applies on mount.
function loc(id: string, over: Partial<LocationWithNeeds> = {}): LocationWithNeeds {
  return {
    id,
    nombre: `Zona ${id}`,
    estado: 'Carabobo',
    ciudad: 'Valencia',
    lat: 10.2,
    lng: -67.6,
    status: 'dano_parcial',
    fotos: [],
    createdAt: '2026-06-24T22:10:00Z',
    updatedAt: '2026-06-24T22:10:00Z',
    needs: [],
    summary: { total: 1, pendientes: 1, enCamino: 0, cubiertos: 0, urgentes: 0 },
    ...over,
  };
}

function makeLocations(n: number, override: Partial<LocationWithNeeds> = {}): LocationWithNeeds[] {
  return Array.from({ length: n }, (_, i) => loc(`l${i + 1}`, override));
}

// ---------------------------------------------------------------------------
// Critical-path JS (existing baseline)
// ---------------------------------------------------------------------------

describe('HomeExplorer critical-path JS', () => {
  it('defaults to the map, painting the cheap skeleton on first load while deferring the heavy Leaflet chunk', () => {
    const { container } = render(
      <HomeExplorer initialLocations={[loc('l1')]} initialTotal={1} states={['Carabobo']} />,
    );

    // The map is the default view, so the cheap skeleton paints on first load...
    expect(screen.getByTestId('map-skeleton')).toBeInTheDocument();
    expect(container.querySelector('.leaflet-container')).toBeNull();

    // Switching to the list tab drops the map skeleton entirely.
    fireEvent.click(screen.getByRole('tab', { name: 'Lista' }));
    expect(screen.queryByTestId('map-skeleton')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Pagination (list)
// ---------------------------------------------------------------------------

describe('HomeExplorer pagination', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows initial locations without a "Ver mas" button when all fit in one page', () => {
    const locs = makeLocations(5);
    render(<HomeExplorer initialLocations={locs} initialTotal={5} states={['Carabobo']} />);

    expect(screen.queryByRole('button', { name: /m[aá]s/i })).toBeNull();
  });

  it('shows "Ver mas" button with remaining count when total exceeds page size', async () => {
    // Pass the full set as initialMapLocations so the seeded state
    // reflects the complete count, making remaining > 0 on first paint.
    const allLocs = makeLocations(PAGE_SIZE + 10);
    render(
      <HomeExplorer
        initialLocations={allLocs.slice(0, PAGE_SIZE)}
        initialMapLocations={allLocs}
        initialTotal={PAGE_SIZE + 10}
        states={['Carabobo']}
      />,
    );
    await act(async () => {});
    // Map is the default view; switch to list to see pagination controls.
    fireEvent.click(screen.getByRole('tab', { name: 'Lista' }));

    const btn = screen.getByRole('button', { name: /m[aá]s/i });
    expect(btn).toBeInTheDocument();
    expect(btn.textContent).toMatch(/10/);
  });

  it('button label uses the accented "mas" with tilde', async () => {
    const allLocs = makeLocations(PAGE_SIZE + 5);
    render(
      <HomeExplorer
        initialLocations={allLocs.slice(0, PAGE_SIZE)}
        initialMapLocations={allLocs}
        initialTotal={PAGE_SIZE + 5}
        states={['Carabobo']}
      />,
    );
    await act(async () => {});
    // Map is the default view; switch to list to see the button.
    fireEvent.click(screen.getByRole('tab', { name: 'Lista' }));

    const btn = screen.getByRole('button', { name: /m[aá]s/i });
    expect(btn.textContent).toContain('más');
  });

  it('clicking "Ver mas" fetches the next page and appends items', async () => {
    const allLocs = makeLocations(PAGE_SIZE + 5);
    const nextPage = makeLocations(5).map((l) => ({ ...l, id: `next-${l.id}` }));

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ items: nextPage, total: PAGE_SIZE + 5, nextCursor: null }),
    });

    render(
      <HomeExplorer
        initialLocations={allLocs.slice(0, PAGE_SIZE)}
        initialMapLocations={allLocs}
        initialTotal={PAGE_SIZE + 5}
        states={['Carabobo']}
      />,
    );

    await act(async () => {});
    // Map is the default view; switch to list to interact with pagination.
    fireEvent.click(screen.getByRole('tab', { name: 'Lista' }));

    const btn = screen.getByRole('button', { name: /m[aá]s/i });
    fireEvent.click(btn);

    await waitFor(() => {
      // The mount all=true call also fires, so use toHaveBeenCalledWith to find
      // any call that used the cursor offset rather than asserting exact call count.
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining(`cursor=${PAGE_SIZE}`));
    });

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /m[aá]s/i })).toBeNull();
    });
  });

  it('results region has aria-live polite for accessibility', () => {
    render(
      <HomeExplorer initialLocations={[loc('l1')]} initialTotal={1} states={['Carabobo']} />,
    );

    // The aria-live region is in the list panel; map is the default view,
    // so switch to list first (initialTotal=1 <= PAGE_SIZE means no mount fetch).
    fireEvent.click(screen.getByRole('tab', { name: 'Lista' }));

    expect(document.querySelector('[aria-live="polite"]')).toBeInTheDocument();
  });

  it('filter change fetches from cursor 0 when initialTotal exceeds PAGE_SIZE', async () => {
    const initial = makeLocations(PAGE_SIZE);
    const filtered = [loc('lf1', { estado: 'Aragua' })];

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ items: filtered, total: 1, nextCursor: null }),
    });

    render(
      <HomeExplorer
        initialLocations={initial}
        initialTotal={PAGE_SIZE + 1}
        states={['Carabobo', 'Aragua']}
      />,
    );

    // Flush any pending effects so the view is stable before switching.
    await act(async () => {});
    // Switch to list view so the filter change dispatches cursor=0 (not all=true).
    fireEvent.click(screen.getByRole('tab', { name: 'Lista' }));

    const estadoSelect = screen.getByRole('combobox', { name: /estado/i });
    fireEvent.change(estadoSelect, { target: { value: 'Aragua' } });

    await waitFor(
      () => {
        expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('estado=Aragua'));
        expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('cursor=0'));
      },
      { timeout: 1500 },
    );
  });

  it('client-side filter is used when initialTotal fits in one page (no fetch)', () => {
    const initial = makeLocations(5);
    render(
      <HomeExplorer initialLocations={initial} initialTotal={5} states={['Carabobo', 'Aragua']} />,
    );

    const estadoSelect = screen.getByRole('combobox', { name: /estado/i });
    fireEvent.change(estadoSelect, { target: { value: 'Aragua' } });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Map - all=true fetch
// ---------------------------------------------------------------------------

describe('HomeExplorer map view', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('switching to map view when total exceeds PAGE_SIZE fetches all=true', async () => {
    const allLocs = makeLocations(PAGE_SIZE + 5);

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ items: allLocs, total: PAGE_SIZE + 5, nextCursor: null }),
    });

    render(
      <HomeExplorer
        initialLocations={makeLocations(PAGE_SIZE)}
        initialTotal={PAGE_SIZE + 5}
        states={['Carabobo']}
      />,
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Mapa' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('all=true'));
    });
  });

  it('switching to map view when total fits in one page does not fetch', () => {
    render(
      <HomeExplorer initialLocations={makeLocations(5)} initialTotal={5} states={['Carabobo']} />,
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Mapa' }));

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('list view still shows bounded page with "Ver mas" after switching back from map', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        items: makeLocations(PAGE_SIZE + 5),
        total: PAGE_SIZE + 5,
        nextCursor: null,
      }),
    });

    const allLocs = makeLocations(PAGE_SIZE + 5);
    render(
      <HomeExplorer
        initialLocations={allLocs.slice(0, PAGE_SIZE)}
        initialMapLocations={allLocs}
        initialTotal={PAGE_SIZE + 5}
        states={['Carabobo']}
      />,
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Mapa' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    // Switch back to list; the map fetch may still be in flight (loading=true),
    // which shows "Cargando..." instead of "Ver mas". waitFor retries until the
    // fetch resolves and loading clears.
    fireEvent.click(screen.getByRole('tab', { name: 'Lista' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /m[aá]s/i })).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

describe('HomeExplorer fetch error handling', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('ok=false response leaves prior data intact and clears loading', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });

    const allLocs = makeLocations(PAGE_SIZE + 5);
    render(
      <HomeExplorer
        initialLocations={allLocs.slice(0, PAGE_SIZE)}
        initialMapLocations={allLocs}
        initialTotal={PAGE_SIZE + 5}
        states={['Carabobo', 'Aragua']}
      />,
    );

    // Flush any pending effects.
    await act(async () => {});
    // Switch to list view to see the "Ver mas" button.
    fireEvent.click(screen.getByRole('tab', { name: 'Lista' }));

    const estadoSelect = screen.getByRole('combobox', { name: /estado/i });
    fireEvent.change(estadoSelect, { target: { value: 'Aragua' } });

    await waitFor(() => expect(fetchMock).toHaveBeenCalled(), { timeout: 1500 });
    await waitFor(() => expect(screen.queryByText('Cargando...')).toBeNull());

    // Prior "Ver mas" must remain (data not blanked by error)
    expect(screen.getByRole('button', { name: /m[aá]s/i })).toBeInTheDocument();
  });

  it('rejected fetch leaves prior data intact and does not throw', async () => {
    fetchMock.mockRejectedValue(new Error('network error'));

    const allLocs = makeLocations(PAGE_SIZE + 5);
    render(
      <HomeExplorer
        initialLocations={allLocs.slice(0, PAGE_SIZE)}
        initialMapLocations={allLocs}
        initialTotal={PAGE_SIZE + 5}
        states={['Carabobo', 'Aragua']}
      />,
    );

    // Flush any pending effects.
    await act(async () => {});
    // Switch to list view to see the "Ver mas" button.
    fireEvent.click(screen.getByRole('tab', { name: 'Lista' }));

    const estadoSelect = screen.getByRole('combobox', { name: /estado/i });
    fireEvent.change(estadoSelect, { target: { value: 'Aragua' } });

    await waitFor(() => expect(fetchMock).toHaveBeenCalled(), { timeout: 1500 });
    await waitFor(() => expect(screen.queryByText('Cargando...')).toBeNull());

    expect(screen.getByRole('button', { name: /m[aá]s/i })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Latest-wins guard
// ---------------------------------------------------------------------------

describe('HomeExplorer latest-wins guard', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('stale fetch (A) resolving after newer fetch (B) does not overwrite B result', async () => {
    // Fetch A: its .json() is deferred until we call resolveAJson.
    let resolveAJson!: (data: ZonasResponse) => void;
    const aJson = new Promise<ZonasResponse>((r) => {
      resolveAJson = r;
    });

    fetchMock
      .mockReturnValueOnce({ ok: true, json: () => aJson }) // fetch A: deferred
      .mockReturnValueOnce({
        ok: true,
        json: async (): Promise<ZonasResponse> => ({ items: [], total: 0, nextCursor: null }),
      }); // fetch B: total=0, resolves immediately

    render(
      <HomeExplorer
        initialLocations={makeLocations(PAGE_SIZE)}
        initialTotal={PAGE_SIZE + 10}
        states={['Carabobo', 'Aragua', 'Miranda']}
      />,
    );

    // The default map renders from the embedded set, so no fetch fires on mount.
    expect(fetchMock).toHaveBeenCalledTimes(0);

    const select = screen.getByRole('combobox', { name: /estado/i });

    // Dispatch A: filter change in mapa view dispatches all=true (call #1).
    fireEvent.change(select, { target: { value: 'Aragua' } });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1); // fetch A in flight

    // Dispatch B while A is still in flight (call #2).
    fireEvent.change(select, { target: { value: 'Miranda' } });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2); // fetch A + fetch B

    // Flush microtasks so fetch B (immediate) applies its result.
    await act(async () => {});

    // Switch to list view to verify total via the "Ver mas" button.
    // Switching view does NOT fire a new fetch (only mapa->mapa dispatches).
    fireEvent.click(screen.getByRole('tab', { name: 'Lista' }));

    // B applied: total=0 -> no "Ver mas".
    expect(screen.queryByRole('button', { name: /m[aá]s/i })).toBeNull();

    // Now resolve fetch A late (stale; requestId 1 < current 2).
    await act(async () => {
      resolveAJson({ items: makeLocations(PAGE_SIZE), total: PAGE_SIZE + 10, nextCursor: PAGE_SIZE });
    });

    // A's result must be discarded - "Ver mas" must remain absent.
    expect(screen.queryByRole('button', { name: /m[aá]s/i })).toBeNull();
  });
});
