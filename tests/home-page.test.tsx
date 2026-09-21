// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import * as homePageModule from '@/app/page';
import HomePage, { CATEGORY_ICONS } from '@/app/page';
import { EMERGENCY_SHORTCODES } from '@/lib/data/emergency-shortcodes';
import {
  CENTRAL_PLATFORM,
  INITIATIVE_CATEGORIES,
} from '@/lib/data/red-iniciativas';
import { telHref } from '@/lib/utils';

afterEach(() => {
  cleanup();
});

describe('home page rendering', () => {
  /**
   * The page frames the change as the work moving on, not as a site dying.
   * Leading with the shutdown would tell a visitor in need to give up, when
   * what they actually need is where to go next.
   */
  it('names the destination in the level-1 heading', () => {
    render(<HomePage />);

    expect(
      screen.getByRole('heading', { level: 1, name: new RegExp(CENTRAL_PLATFORM.name, 'i') }),
    ).toBeTruthy();
  });

  it('does not lead with the site having stopped', () => {
    render(<HomePage />);

    expect(
      screen.getByRole('heading', { level: 1 }).textContent,
    ).not.toMatch(/dejó de operar|fuera de servicio/i);
  });

  it('still says plainly that the map and reports are not here any more', () => {
    const { container } = render(<HomePage />);

    expect(container.textContent).toMatch(/ya no est[aá]n disponibles aqu[ií]/i);
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

  /**
   * The page credits the initiatives, never the people behind them. Naming an
   * individual on a page nobody is maintaining turns a volunteer into a
   * permanent, unasked-for point of contact.
   */
  it('names no individual organizer', () => {
    const { container } = render(<HomePage />);

    expect(container.textContent).not.toMatch(/liderada por|Perdomo/i);
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

  it('offers an emergency number for every carrier, not just one', () => {
    render(<HomePage />);

    for (const entry of EMERGENCY_SHORTCODES) {
      const matches = screen
        .getAllByRole('link')
        .filter((link) => link.getAttribute('href') === telHref(entry.code));
      expect(matches.length).toBe(1);
    }
  });

  it('says which network each emergency code is dialled from', () => {
    const { container } = render(<HomePage />);

    for (const entry of EMERGENCY_SHORTCODES) {
      expect(container.textContent).toContain(entry.carrier);
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
