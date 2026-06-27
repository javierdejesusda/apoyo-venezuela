// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { RescueAdvisory } from '@/components/rescue-advisory';

afterEach(() => {
  cleanup();
});

describe('RescueAdvisory', () => {
  it('tells visitors to let rescue teams work', () => {
    render(<RescueAdvisory />);
    const text = document.body.textContent ?? '';
    expect(text.toLowerCase()).toContain('equipos de rescate');
    expect(text.toLowerCase()).toContain('rescatistas');
  });

  it('mentions centros de acopio', () => {
    render(<RescueAdvisory />);
    const text = document.body.textContent ?? '';
    expect(text.toLowerCase()).toContain('centros de acopio');
  });

  it('has no close, dismiss or hide button', () => {
    render(<RescueAdvisory />);
    const buttons = screen.queryAllByRole('button');
    for (const btn of buttons) {
      const label = (btn.textContent ?? '').toLowerCase();
      expect(label).not.toMatch(/cerrar|dismiss|ocultar|close/);
    }
  });

  it('has a link to /guia', () => {
    render(<RescueAdvisory />);
    const link = screen.getByRole('link', { name: /centros de acopio/i });
    expect(link.getAttribute('href')).toBe('/guia');
  });

  it('renders inside a complementary or region landmark', () => {
    render(<RescueAdvisory />);
    const aside = screen.queryByRole('complementary');
    const region = screen.queryByRole('region');
    expect(aside ?? region).not.toBeNull();
  });

  it('has an aria-label distinct from SafetyBanner', () => {
    render(<RescueAdvisory />);
    // SafetyBanner uses "Aviso de seguridad" — this advisory must be distinct
    const landmark = screen.queryByRole('complementary') ?? screen.queryByRole('region');
    expect(landmark?.getAttribute('aria-label')).not.toBe('Aviso de seguridad');
  });
});
