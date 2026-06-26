// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { PersonasAtrapadasBadge, StatusBadge } from '@/components/status-badges';

afterEach(() => {
  cleanup();
});

describe('StatusBadge', () => {
  it('renders label "Daño grave" for dano_grave', () => {
    render(<StatusBadge status="dano_grave" />);
    expect(screen.getByText('Daño grave')).toBeTruthy();
  });

  it('renders label "Daño parcial" for dano_parcial', () => {
    render(<StatusBadge status="dano_parcial" />);
    expect(screen.getByText('Daño parcial')).toBeTruthy();
  });

  it('renders for derrumbe', () => {
    render(<StatusBadge status="derrumbe" />);
    expect(screen.getByText('Derrumbe')).toBeTruthy();
  });
});

describe('PersonasAtrapadasBadge', () => {
  it('renders a life-safety indicator with caveat for "si"', () => {
    const { container } = render(<PersonasAtrapadasBadge value="si" />);
    expect(screen.getByText(/Personas atrapadas/i)).toBeTruthy();
    expect(container.textContent).toContain('Reporte ciudadano sin verificar');
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('/telefonos');
  });

  it('renders nothing for "no"', () => {
    const { container } = render(<PersonasAtrapadasBadge value="no" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing for "no_se"', () => {
    const { container } = render(<PersonasAtrapadasBadge value="no_se" />);
    expect(container.firstChild).toBeNull();
  });
});
