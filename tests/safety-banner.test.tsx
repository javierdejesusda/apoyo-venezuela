// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { SafetyBanner } from '@/components/safety-banner';

afterEach(() => {
  cleanup();
});

describe('SafetyBanner', () => {
  it('contains the required safety warning about damaged structures', () => {
    render(<SafetyBanner />);
    const text = document.body.textContent ?? '';
    expect(text).toContain('No entres a estructuras dañadas');
  });

  it('references emergencias', () => {
    render(<SafetyBanner />);
    const text = document.body.textContent ?? '';
    expect(text.toLowerCase()).toContain('emergencias');
  });

  it('has no close, dismiss or hide button', () => {
    render(<SafetyBanner />);
    const buttons = screen.queryAllByRole('button');
    for (const btn of buttons) {
      const label = (btn.textContent ?? '').toLowerCase();
      expect(label).not.toMatch(/cerrar|dismiss|ocultar|close/);
    }
  });

  it('has a link to /telefonos', () => {
    render(<SafetyBanner />);
    const link = screen.getByRole('link', { name: /tel[eé]fonos/i });
    expect(link.getAttribute('href')).toBe('/telefonos');
  });

  it('renders inside a complementary or region landmark', () => {
    render(<SafetyBanner />);
    const aside = screen.queryByRole('complementary');
    const region = screen.queryByRole('region');
    expect(aside ?? region).not.toBeNull();
  });
});
