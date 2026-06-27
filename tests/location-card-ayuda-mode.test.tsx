// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { LocationCard } from '@/components/location-card';
import type { LocationWithNeeds, NeedRecord } from '@/lib/data/types';

function makeLocation(overrides: Partial<LocationWithNeeds> = {}): LocationWithNeeds {
  const ts = '2026-06-25T00:00:00.000Z';
  return {
    id: 'loc_1',
    nombre: 'San Felipe centro',
    estado: 'Yaracuy',
    ciudad: 'San Felipe',
    zona: 'Centro',
    lat: null,
    lng: null,
    status: 'derrumbe',
    descripcion: 'Edificio con daños graves.',
    fotos: [],
    createdAt: ts,
    updatedAt: ts,
    needs: [],
    summary: { total: 4, pendientes: 4, enCamino: 0, cubiertos: 0, urgentes: 3 },
    ...overrides,
  };
}

function makeNeed(over: Partial<NeedRecord> = {}): NeedRecord {
  const ts = '2026-06-25T00:00:00.000Z';
  return {
    id: 'n1',
    locationId: 'loc_1',
    categoria: 'agua',
    descripcion: 'Agua potable',
    urgencia: 'alta',
    status: 'pendiente',
    createdAt: ts,
    updatedAt: ts,
    ...over,
  };
}

afterEach(() => {
  cleanup();
});

describe('LocationCard ayuda mode', () => {
  it('shows "Ver pedidos de ayuda" CTA in ayuda mode', () => {
    render(
      <LocationCard
        location={makeLocation({ needs: [makeNeed()] })}
        mode="ayuda"
      />,
    );
    expect(screen.getByText(/pedidos de ayuda/i)).toBeInTheDocument();
  });

  it('does not show PersonasAtrapadasBadge in ayuda mode', () => {
    const { container } = render(
      <LocationCard
        location={makeLocation({ personas_atrapadas: 'si' })}
        mode="ayuda"
      />,
    );
    expect(container.textContent).not.toContain('Reporte ciudadano sin verificar');
  });

  it('shows urgentes count prominently in ayuda mode', () => {
    render(
      <LocationCard
        location={makeLocation({
          summary: { total: 4, pendientes: 4, enCamino: 0, cubiertos: 0, urgentes: 3 },
        })}
        mode="ayuda"
      />,
    );
    expect(screen.getByText(/3.*urgente/i)).toBeInTheDocument();
  });

  it('shows "Ver zona" CTA by default (danos mode)', () => {
    render(<LocationCard location={makeLocation()} />);
    expect(screen.getByText(/Ver zona/i)).toBeInTheDocument();
    expect(screen.queryByText(/pedidos de ayuda/i)).toBeNull();
  });

  it('shows personas_atrapadas badge in danos mode (default)', () => {
    const { container } = render(
      <LocationCard location={makeLocation({ personas_atrapadas: 'si' })} />,
    );
    expect(container.textContent).toContain('Reporte ciudadano sin verificar');
  });
});
