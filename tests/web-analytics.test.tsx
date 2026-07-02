// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Render next/script as a plain <script> so the test can assert the attributes
// our component passes, without pulling in the Next.js runtime.
vi.mock('next/script', () => ({
  default: (props: { src?: string; 'data-cf-beacon'?: string }) => (
    <script
      defer
      data-testid="cf-beacon"
      src={props.src}
      data-cf-beacon={props['data-cf-beacon']}
    />
  ),
}));

import { WebAnalytics } from '@/components/web-analytics';

const TOKEN_ENV = 'NEXT_PUBLIC_CF_BEACON_TOKEN';

afterEach(() => {
  cleanup();
  delete process.env[TOKEN_ENV];
});

describe('WebAnalytics', () => {
  it('renders nothing when the Cloudflare beacon token is not configured', () => {
    delete process.env[TOKEN_ENV];
    const { container } = render(<WebAnalytics />);
    expect(container).toBeEmptyDOMElement();
  });

  it('loads the Cloudflare Web Analytics beacon with the configured token', () => {
    process.env[TOKEN_ENV] = 'test-token-123';
    render(<WebAnalytics />);
    const beacon = screen.getByTestId('cf-beacon');
    expect(beacon).toHaveAttribute('src', 'https://static.cloudflareinsights.com/beacon.min.js');
    expect(beacon.getAttribute('data-cf-beacon')).toBe(JSON.stringify({ token: 'test-token-123' }));
  });
});
