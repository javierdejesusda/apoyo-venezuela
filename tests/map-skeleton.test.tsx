// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MapSkeleton } from '@/components/ui/map-skeleton';

describe('MapSkeleton', () => {
  it('paints instantly with an accessible loading status and no leaflet DOM', () => {
    const { container } = render(<MapSkeleton />);

    const skeleton = screen.getByTestId('map-skeleton');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status', { name: /cargando mapa/i })).toBeInTheDocument();
    // The skeleton must never pull in the heavy Leaflet DOM.
    expect(container.querySelector('.leaflet-container')).toBeNull();
  });
});
