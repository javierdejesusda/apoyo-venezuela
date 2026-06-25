// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
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
  it('renders the instant map skeleton, not the heavy Leaflet map, on first paint', () => {
    const { container } = render(<HomeExplorer locations={[loc()]} states={['Carabobo']} />);

    // The cheap skeleton paints synchronously.
    expect(screen.getByTestId('map-skeleton')).toBeInTheDocument();
    // next/dynamic(ssr:false) defers the heavy chunk, so Leaflet is not rendered yet.
    expect(container.querySelector('.leaflet-container')).toBeNull();
  });
});
