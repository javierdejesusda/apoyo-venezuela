// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { HomeExplorer } from '@/components/home-explorer';
import type { LocationWithNeeds } from '@/lib/data/types';

function loc(over: Partial<LocationWithNeeds> = {}): LocationWithNeeds {
  return {
    id: 'l1',
    nombre: 'Zona Centro',
    estado: 'Carabobo',
    ciudad: 'Valencia',
    lat: 10.2,
    lng: -67.6,
    status: 'danado',
    fotos: [],
    createdAt: '2026-06-24T22:10:00Z',
    updatedAt: '2026-06-24T22:10:00Z',
    needs: [],
    summary: { total: 0, pendientes: 0, enCamino: 0, cubiertos: 0, urgentes: 0 },
    ...over,
  };
}

describe('HomeExplorer critical-path JS', () => {
  it('defaults to the map, painting the cheap skeleton on first load while deferring the heavy Leaflet chunk', () => {
    const { container } = render(<HomeExplorer locations={[loc()]} states={['Carabobo']} />);

    // The map is the default view, so the cheap skeleton paints on first load...
    expect(screen.getByTestId('map-skeleton')).toBeInTheDocument();
    // ...while next/dynamic(ssr:false) still defers the heavy Leaflet chunk.
    expect(container.querySelector('.leaflet-container')).toBeNull();

    // Switching to the list tab drops the map skeleton entirely.
    fireEvent.click(screen.getByRole('tab', { name: 'Lista' }));
    expect(screen.queryByTestId('map-skeleton')).toBeNull();
  });
});
