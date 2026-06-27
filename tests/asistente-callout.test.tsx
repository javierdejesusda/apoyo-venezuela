// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { AsistenteCallout } from '@/components/asistente-callout';

afterEach(() => {
  cleanup();
});

describe('AsistenteCallout', () => {
  it('renders a link to /asistente', () => {
    render(<AsistenteCallout />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/asistente');
  });

  it('contains Spanish label text for the assistant', () => {
    render(<AsistenteCallout />);

    const text = document.body.textContent ?? '';
    expect(text.toLowerCase()).toMatch(/asistente|ayuda|pregunta/);
  });
});
