// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StaleDataBanner } from '@/components/stale-data-banner';

describe('StaleDataBanner', () => {
  it('keeps an empty live region mounted when connectivity is healthy', () => {
    render(<StaleDataBanner />);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('warns that data may be outdated when offline', () => {
    render(<StaleDataBanner offline />);
    const region = screen.getByRole('status');
    expect(region).toHaveTextContent(/sin conexi/i);
    expect(region).toHaveTextContent(/desactualizad/i);
  });

  it('warns when live updates are unavailable but the device is online', () => {
    render(<StaleDataBanner liveUpdatesDown />);
    const region = screen.getByRole('status');
    expect(region).toHaveTextContent(/actualizaciones en vivo/i);
    expect(region).toHaveTextContent(/desactualizad/i);
  });
});
