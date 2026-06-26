// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { LocationCard } from '@/components/location-card';
import type { LocationWithNeeds } from '@/lib/data/types';

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
    descripcion: 'Ciudad muy cercana al epicentro. Daños estructurales graves.',
    fotos: [],
    createdAt: ts,
    updatedAt: ts,
    needs: [],
    summary: { total: 4, pendientes: 4, enCamino: 0, cubiertos: 0, urgentes: 3 },
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

describe('LocationCard', () => {
  it('renders the zone name, place and needs summary', () => {
    render(<LocationCard location={makeLocation()} />);
    expect(screen.getByText('San Felipe centro')).toBeInTheDocument();
    expect(screen.getByText('Centro, San Felipe, Yaracuy')).toBeInTheDocument();
    expect(screen.getByText(/necesidades/)).toBeInTheDocument();
  });

  it('lets the card shrink inside its grid track so it never overflows on mobile', () => {
    // CSS grid items default to `min-width: auto`, which expands the card to its
    // min-content width and breaks the inner truncate/line-clamp. The root link
    // must carry `min-w-0` so it can shrink to the column instead of overflowing.
    render(<LocationCard location={makeLocation()} />);
    const link = screen.getByRole('link', { name: /San Felipe centro/i });
    expect(link.className).toContain('min-w-0');
  });

  it('shows a single large cover photo (the first one) through the resizing endpoint', () => {
    const { container } = render(
      <LocationCard
        location={makeLocation({
          fotos: [
            'https://x.supabase.co/storage/v1/object/public/fotos/a.jpg',
            'https://x.supabase.co/storage/v1/object/public/fotos/b.jpg',
          ],
        })}
      />,
    );

    // Only the first photo is shown as a large cover; the rest live on the zone
    // page. The cover is decorative (alt=""), so it carries no accessible name.
    const imgs = container.querySelectorAll('img');
    expect(imgs).toHaveLength(1);
    expect(imgs[0].getAttribute('src')).toContain('/render/image/public/fotos/a.jpg');
    expect(imgs[0].getAttribute('src')).toContain('width=');
  });

  it('exposes the photo count to screen readers next to the cover', () => {
    render(
      <LocationCard
        location={makeLocation({
          fotos: [
            'https://x.supabase.co/storage/v1/object/public/fotos/a.jpg',
            'https://x.supabase.co/storage/v1/object/public/fotos/b.jpg',
            'https://x.supabase.co/storage/v1/object/public/fotos/c.jpg',
          ],
        })}
      />,
    );
    expect(screen.getByText('3 fotos')).toBeInTheDocument();
  });

  it('uses the singular label when the zone has a single photo', () => {
    render(
      <LocationCard
        location={makeLocation({
          fotos: ['https://x.supabase.co/storage/v1/object/public/fotos/a.jpg'],
        })}
      />,
    );
    expect(screen.getByText('1 foto')).toBeInTheDocument();
  });

  it('renders no cover photo when the zone has no photos', () => {
    const { container } = render(<LocationCard location={makeLocation({ fotos: [] })} />);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.queryByText(/\bfotos?\b/)).toBeNull();
  });

  it('shows the personas_atrapadas caveat when value is "si"', () => {
    const { container } = render(
      <LocationCard location={makeLocation({ personas_atrapadas: 'si' })} />,
    );
    expect(container.textContent).toContain('Reporte ciudadano sin verificar');
  });

  it('does not show the caveat when personas_atrapadas is "no"', () => {
    const { container } = render(
      <LocationCard location={makeLocation({ personas_atrapadas: 'no' })} />,
    );
    expect(container.textContent).not.toContain('Reporte ciudadano sin verificar');
  });

  it('does not show the caveat when personas_atrapadas is absent (treated as no_se)', () => {
    const { container } = render(
      <LocationCard location={makeLocation({ personas_atrapadas: undefined })} />,
    );
    expect(container.textContent).not.toContain('Reporte ciudadano sin verificar');
  });

  it('has no seismic-pulse class on a dano_grave card', () => {
    const { container } = render(
      <LocationCard location={makeLocation({ status: 'dano_grave' })} />,
    );
    expect(container.querySelector('.live-ping')).toBeNull();
  });
});
