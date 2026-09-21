// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { EmergencyCallButton } from '@/components/emergency-call-button';
import { PRIMARY_SHORTCODE } from '@/lib/data/emergency-shortcodes';
import { telHref } from '@/lib/utils';

afterEach(() => {
  cleanup();
});

/**
 * The header shortcut can only dial one number, so it dials the declared
 * primary. It must not present that code as the line for every caller: the
 * page body carries the per-carrier alternatives, and a visitor who reads only
 * this button would otherwise never learn their own network needs another one.
 */
describe('emergency call button', () => {
  it('dials the declared primary shortcode', () => {
    render(<EmergencyCallButton />);

    expect(screen.getByRole('link').getAttribute('href')).toBe(
      telHref(PRIMARY_SHORTCODE.code),
    );
  });

  it('names the carrier in its accessible name', () => {
    render(<EmergencyCallButton />);

    expect(screen.getByRole('link').getAttribute('aria-label')).toContain(
      PRIMARY_SHORTCODE.carrier,
    );
  });

  /**
   * A sighted visitor never reads the accessible name, so the carrier has to
   * be in the visible label too. Without it the loudest element on the page
   * still claims a single national number.
   */
  it('names the carrier in its visible label', () => {
    const { container } = render(<EmergencyCallButton />);

    expect(container.textContent).toContain(PRIMARY_SHORTCODE.carrier);
  });
});
