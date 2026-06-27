// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HomeExplorer } from '@/components/home-explorer';
import type { LocationWithNeeds } from '@/lib/data/types';

// Stub the Leaflet map so we can inspect which locations it receives.
vi.mock('@/components/map-view', () => ({
  default: ({ locations }: { locations: LocationWithNeeds[] }) => (
    <div data-testid="map-pin-count">{locations.length}</div>
  ),
}));

afterEach(() => {
  cleanup();
});

function locWithNeeds(id: string): LocationWithNeeds {
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
  };
}

function locWithoutNeeds(id: string): LocationWithNeeds {
  return {
    id,
    nombre: `Zona sin pedidos ${id}`,
    estado: 'Carabobo',
    ciudad: 'Valencia',
    lat: 10.3,
    lng: -67.7,
    status: 'dano_parcial',
    fotos: [],
    createdAt: '2026-06-24T22:10:00Z',
    updatedAt: '2026-06-24T22:10:00Z',
    needs: [],
    summary: { total: 0, pendientes: 0, enCamino: 0, cubiertos: 0, urgentes: 0 },
  };
}

describe('HomeExplorer danos mode — default view shows all zones', () => {
  it('shows all zones on the map in the default danos state', async () => {
    const withNeeds = locWithNeeds('has-needs');
    const withoutNeeds = locWithoutNeeds('no-needs');
    const allZones = [withNeeds, withoutNeeds];

    render(
      <HomeExplorer
        initialLocations={allZones}
        initialMapLocations={allZones}
        initialTotal={allZones.length}
        states={['Carabobo']}
      />,
    );

    // Default danos mode: map receives all zones — no soloConPedidos filter.
    // findByTestId waits for the dynamic MapView to resolve.
    const pinCount = await screen.findByTestId('map-pin-count');
    expect(pinCount.textContent).toBe('2');
  });

  it('count label reflects total count in default danos mode', async () => {
    const withNeeds = locWithNeeds('has-needs');
    const withoutNeeds = locWithoutNeeds('no-needs');
    const allZones = [withNeeds, withoutNeeds];

    render(
      <HomeExplorer
        initialLocations={allZones}
        initialMapLocations={allZones}
        initialTotal={allZones.length}
        states={['Carabobo']}
      />,
    );

    // Both zones are in scope; result count should say "2 zona…".
    expect(screen.getByText(/2\s+zona/i)).toBeInTheDocument();
  });

  it('includes zones without open needs in the default danos list view', () => {
    const withNeeds = locWithNeeds('has-needs');
    const withoutNeeds = locWithoutNeeds('no-needs');
    const allZones = [withNeeds, withoutNeeds];

    render(
      <HomeExplorer
        initialLocations={allZones}
        initialMapLocations={allZones}
        initialTotal={allZones.length}
        states={['Carabobo']}
      />,
    );

    // fireEvent.click flushes pending React state so the list is visible immediately.
    fireEvent.click(screen.getByRole('tab', { name: 'Lista' }));

    // The zone with no open needs must appear in the danos default list.
    expect(screen.getByText(/Zona sin pedidos no-needs/i)).toBeInTheDocument();
  });
});

describe('HomeExplorer ayuda mode — ?m=ayuda deep-link applies soloConPedidos', () => {
  beforeEach(() => {
    // Simulate a deep-link to /?m=ayuda. We only need window.location.search;
    // window.history.replaceState (called by handleModeChange) stays on window.history.
    vi.stubGlobal('location', { search: '?m=ayuda' });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('deep-linking ?m=ayuda shows only zones with open needs on the map', async () => {
    const withNeeds = locWithNeeds('has-needs');
    const withoutNeeds = locWithoutNeeds('no-needs');
    const allZones = [withNeeds, withoutNeeds];

    render(
      <HomeExplorer
        initialLocations={allZones}
        initialMapLocations={allZones}
        initialTotal={allZones.length}
        states={['Carabobo']}
      />,
    );

    // After the URL-sync effect fires, ayuda mode applies soloConPedidos.
    // Only the zone with open needs passes the filter -> pin count drops to 1.
    await waitFor(() => {
      expect(screen.getByTestId('map-pin-count').textContent).toBe('1');
    });
  });

  it('deep-linking ?m=ayuda excludes zones without open needs from list view', async () => {
    const withNeeds = locWithNeeds('has-needs');
    const withoutNeeds = locWithoutNeeds('no-needs');
    const allZones = [withNeeds, withoutNeeds];

    render(
      <HomeExplorer
        initialLocations={allZones}
        initialMapLocations={allZones}
        initialTotal={allZones.length}
        states={['Carabobo']}
      />,
    );

    // Wait for the URL-sync effect to apply the ayuda soloConPedidos invariant.
    await waitFor(() => {
      expect(screen.getByTestId('map-pin-count').textContent).toBe('1');
    });

    // fireEvent.click flushes pending React state so the list is visible immediately.
    fireEvent.click(screen.getByRole('tab', { name: 'Lista' }));

    // The zone with no open needs must not appear after the ayuda switch.
    expect(screen.queryByText(/Zona sin pedidos no-needs/i)).toBeNull();
  });
});
