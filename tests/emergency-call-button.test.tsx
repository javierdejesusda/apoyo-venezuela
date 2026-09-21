// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { EmergencyCallButton } from '@/components/emergency-call-button';
import { EMERGENCY_SHORTCODES } from '@/lib/data/emergency-shortcodes';

afterEach(() => {
  cleanup();
});

/**
 * The header shortcut can only dial one number, so it takes the first entry of
 * the shared list. It must not present that code as the line for every caller:
 * the page body carries the per-carrier alternatives, and a label implying a
 * single national number would strand anyone on another network.
 */
describe('emergency call button', () => {
  const primary = EMERGENCY_SHORTCODES[0];

  it('dials the primary shortcode from the shared source of truth', () => {
    render(<EmergencyCallButton />);

    expect(screen.getByRole('link').getAttribute('href')).toBe(primary.href);
  });

  it('names the carrier the shortcut works from in its accessible name', () => {
    render(<EmergencyCallButton />);

    expect(screen.getByRole('link').getAttribute('aria-label')).toContain(primary.carrier);
  });

  it('never claims to be the line for every network', () => {
    const { container } = render(<EmergencyCallButton />);

    expect(container.textContent).not.toMatch(/l[ií]nea de emergencias$/i);
  });
});
