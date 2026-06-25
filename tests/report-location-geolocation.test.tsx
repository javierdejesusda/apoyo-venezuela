// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ReportLocationForm from '@/components/report-location-form';

vi.mock('@/app/actions', () => ({ createLocationAction: vi.fn() }));
vi.mock('@/app/geocode-actions', () => ({ geocodeReverseAction: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/lib/data/supabase-browser', () => ({ getBrowserSupabase: () => null }));
vi.mock('@/components/location-picker', () => ({
  default: () => <div data-testid="location-picker" />,
}));

const SAFARI_IOS =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const WHATSAPP_IOS =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 WhatsApp/2.23.17.78';

const getCurrentPosition = vi.fn();

function setUserAgent(ua: string): void {
  Object.defineProperty(navigator, 'userAgent', { configurable: true, value: ua });
}

/** Make the next getCurrentPosition call reject with the given error code. */
function rejectWith(code: number): void {
  getCurrentPosition.mockImplementation(
    (_success: PositionCallback, errorCb?: PositionErrorCallback) => {
      errorCb?.({ code } as GeolocationPositionError);
    },
  );
}

function clickUseMyLocation(): void {
  fireEvent.click(screen.getByRole('button', { name: /usar mi ubicación/i }));
}

beforeEach(() => {
  getCurrentPosition.mockReset();
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: { getCurrentPosition },
  });
});

afterEach(() => {
  cleanup();
});

describe('ReportLocationForm geolocation errors', () => {
  it('guides in-app browser users to a real browser instead of failing blindly', async () => {
    setUserAgent(WHATSAPP_IOS);
    rejectWith(1);
    render(<ReportLocationForm />);

    clickUseMyLocation();

    expect(await screen.findByText(/navegador interno de WhatsApp/i)).toBeInTheDocument();
  });

  it('explains a denied permission in plain Safari and offers the map fallback', async () => {
    setUserAgent(SAFARI_IOS);
    rejectWith(1);
    render(<ReportLocationForm />);

    clickUseMyLocation();

    const alert = await screen.findByText(/permiso de ubicación/i);
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent(/mapa/i);
  });

  it('caps the lookup with a timeout so iOS cannot hang forever', () => {
    setUserAgent(SAFARI_IOS);
    rejectWith(2);
    render(<ReportLocationForm />);

    clickUseMyLocation();

    const options = getCurrentPosition.mock.calls[0]?.[2];
    expect(options).toMatchObject({ timeout: expect.any(Number) });
    expect(options.timeout).toBeGreaterThan(0);
  });
});
