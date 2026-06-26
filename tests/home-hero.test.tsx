// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { HomeHero } from '@/components/home-hero';
import type { GlobalStats } from '@/lib/data/selectors';

const STATS: GlobalStats = {
  zonas: 3,
  derrumbes: 1,
  danoGrave: 1,
  danoParcial: 1,
  urgentes: 2,
  necesidadesAbiertas: 5,
};

afterEach(() => {
  cleanup();
});

describe('HomeHero', () => {
  it('renders the thesis headline and both primary actions', () => {
    render(<HomeHero stats={STATS} />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/Coordinemos la ayuda/i);
    expect(screen.getByRole('link', { name: /Reportar o pedir ayuda/i }).getAttribute('href')).toBe(
      '/reportar',
    );
    expect(
      screen.getByRole('link', { name: /Tel[eé]fonos de emergencia/i }).getAttribute('href'),
    ).toBe('/telefonos');
  });

  it('shows every global stat including damage counts in the semaphore ribbon', () => {
    render(<HomeHero stats={STATS} />);
    for (const label of [
      'Zonas activas',
      'Derrumbes',
      'Daño grave',
      'Daño parcial',
      'Necesidades urgentes',
      'Necesidades abiertas',
    ]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
  });

  // The hero map is a calm watermark again: the scattered earthquake markers
  // were removed, so nothing decorative is absolutely pinned over the silhouette
  // (the dots were the only elements positioned with an inline `left`).
  it('renders the map with no scattered position-pinned markers', () => {
    const { container } = render(<HomeHero stats={STATS} />);
    expect(container.querySelectorAll('[style*="left:"]')).toHaveLength(0);
  });

  // The situation board takes a distinct light treatment: the headline accent is
  // dark brand-blue on the light panel and only switches to the pale brand tint
  // in dark mode, so the highlight must be theme-aware rather than one fixed hue.
  it('uses a theme-aware accent for the headline highlight', () => {
    render(<HomeHero stats={STATS} />);
    const accent = screen.getByText('zona por zona');
    expect(accent.className).toMatch(/text-brand-600/);
    expect(accent.className).toMatch(/dark:text-brand-300/);
  });
});
