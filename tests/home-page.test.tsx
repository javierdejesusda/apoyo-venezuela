// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import * as homePageModule from '@/app/page';
import HomePage, { CATEGORY_ICONS } from '@/app/page';
import {
  CENTRAL_PLATFORM,
  INITIATIVE_CATEGORIES,
  INITIATIVE_LEAD,
} from '@/lib/data/red-iniciativas';

afterEach(() => {
  cleanup();
});

describe('home page rendering', () => {
  it('announces the transition in the level-1 heading', () => {
    render(<HomePage />);

    expect(
      screen.getByRole('heading', { level: 1, name: /dejó de operar/i }),
    ).toBeTruthy();
  });

  it('tells people the coordination continues in the initiative network', () => {
    const { container } = render(<HomePage />);

    expect(container.textContent).toMatch(/red de iniciativas/i);
  });

  it('promotes the central platform as the primary destination', () => {
    render(<HomePage />);

    const central = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href') === CENTRAL_PLATFORM.url);
    expect(central.length).toBe(1);
    expect(central[0]).toHaveAttribute('target', '_blank');
    expect(central[0]).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('keeps crediting the lead organizer of the network', () => {
    const { container } = render(<HomePage />);

    expect(container.textContent).toContain(INITIATIVE_LEAD);
  });

  it('maps an icon for every category slug', () => {
    for (const category of INITIATIVE_CATEGORIES) {
      expect(CATEGORY_ICONS).toHaveProperty(category.slug);
    }
  });

  it('renders a heading for every category', () => {
    render(<HomePage />);

    for (const category of INITIATIVE_CATEGORIES) {
      expect(screen.getByRole('heading', { name: category.title })).toBeTruthy();
    }
  });

  it('renders every initiative link with safe external-link attributes', () => {
    render(<HomePage />);

    const allUrls = INITIATIVE_CATEGORIES.flatMap((c) => c.urls);
    for (const url of allUrls) {
      const matches = screen
        .getAllByRole('link')
        .filter((link) => link.getAttribute('href') === url);
      expect(matches.length).toBeGreaterThan(0);
      for (const link of matches) {
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      }
    }
  });

  it('keeps the closing note asking people to verify each channel', () => {
    const { container } = render(<HomePage />);

    expect(container.textContent).toMatch(/verifica la informaci[oó]n en cada canal/i);
  });
});

/**
 * The deployment exists only to serve this one page, so anything that turns it
 * back into a rendered-on-demand or revalidated route reintroduces the cost the
 * shutdown was meant to remove.
 */
describe('home page cost surface', () => {
  it('exports no revalidation window', () => {
    expect(homePageModule).not.toHaveProperty('revalidate');
  });

  it('exports no dynamic rendering override', () => {
    expect(homePageModule).not.toHaveProperty('dynamic');
    expect(homePageModule).not.toHaveProperty('fetchCache');
  });

  it('renders synchronously, so it cannot await a data source', () => {
    expect(HomePage.constructor.name).toBe('Function');
  });
});
