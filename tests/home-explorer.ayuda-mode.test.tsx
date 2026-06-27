// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

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

describe('HomeExplorer ayuda mode — default soloConPedidos filtering', () => {
  it('shows only zones with open needs on the map in the default ayuda state', async () => {
    const withNeeds = locWithNeeds('has-needs');
    const withoutNeeds = locWithoutNeeds('no-needs');
    const allZones = [withNeeds, withoutNeeds];

    render(
      <HomeExplorer
        initialLocations={allZones.slice(0, 1)}
        initialMapLocations={allZones}
        initialTotal={allZones.length}
        states={['Carabobo']}
      />,
    );

    // Default ayuda mode: map receives only the 1 zone with open needs.
    // findByTestId is needed because the dynamic MapView resolves asynchronously.
    const pinCount = await screen.findByTestId('map-pin-count');
    expect(pinCount.textContent).toBe('1');
  });

  it('count label reflects filtered count in default ayuda mode', () => {
    const withNeeds = locWithNeeds('has-needs');
    const withoutNeeds = locWithoutNeeds('no-needs');
    const allZones = [withNeeds, withoutNeeds];

    render(
      <HomeExplorer
        initialLocations={allZones.slice(0, 1)}
        initialMapLocations={allZones}
        initialTotal={allZones.length}
        states={['Carabobo']}
      />,
    );

    // The result count label should say "1 zona con pedidos", not "2 zonas con pedidos".
    expect(screen.getByText(/1\s+zona/i)).toBeInTheDocument();
  });

  it('excludes a no-pedidos zone name from the default ayuda list view', () => {
    const withNeeds = locWithNeeds('has-needs');
    const withoutNeeds = locWithoutNeeds('no-needs');
    const allZones = [withNeeds, withoutNeeds];

    const { getByRole, queryByText } = render(
      <HomeExplorer
        initialLocations={allZones}
        initialMapLocations={allZones}
        initialTotal={allZones.length}
        states={['Carabobo']}
      />,
    );

    // Switch to list view.
    const listaTab = getByRole('tab', { name: 'Lista' });
    listaTab.click();

    // The zone with no needs must not appear in the list.
    expect(queryByText(/Zona sin pedidos no-needs/i)).toBeNull();
  });
});
