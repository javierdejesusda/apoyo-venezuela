// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { OpenSourceCallout } from '@/components/open-source-callout';
import { GITHUB_URL } from '@/lib/constants';

afterEach(() => {
  cleanup();
});

describe('OpenSourceCallout', () => {
  it('tells visitors the project is open source', () => {
    render(<OpenSourceCallout />);
    expect(screen.getByText(/código abierto/i)).toBeTruthy();
  });

  it('links to the GitHub repository with a contribution call to action', () => {
    render(<OpenSourceCallout />);
    const link = screen.getByRole('link', { name: /contribuir en github/i });
    expect(link.getAttribute('href')).toBe(GITHUB_URL);
  });

  it('opens the repository in a new tab without leaking the opener', () => {
    render(<OpenSourceCallout />);
    const link = screen.getByRole('link', { name: /contribuir en github/i });
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });
});
