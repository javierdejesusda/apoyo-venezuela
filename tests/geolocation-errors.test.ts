import { describe, expect, it } from 'vitest';

import {
  detectInAppBrowser,
  geolocationErrorMessage,
} from '@/lib/geolocation/errors';

// Real-world iOS user agent strings. The in-app browsers append an app token
// to an otherwise Safari-looking string; plain Safari never carries one.
const UA = {
  safariIOS:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  chromeAndroid:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
  whatsapp:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 WhatsApp/2.23.17.78',
  instagram:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 302.0.0.0 (iPhone13,2; iOS 16_6; en_US)',
  facebook:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/430.0.0.32.115]',
  messenger:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/MessengerForiOS;FBAV/430.0.0.0]',
  facebookAndroid:
    'Mozilla/5.0 (Linux; Android 13; SM-G991B Build/TP1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/119.0.0.0 Mobile Safari/537.36 [FBAN/EMA;FBLC/es_LA]',
};

describe('detectInAppBrowser', () => {
  it('flags WhatsApp', () => {
    expect(detectInAppBrowser(UA.whatsapp)).toBe('WhatsApp');
  });

  it('flags Instagram', () => {
    expect(detectInAppBrowser(UA.instagram)).toBe('Instagram');
  });

  it('flags the Facebook app', () => {
    expect(detectInAppBrowser(UA.facebook)).toBe('Facebook');
  });

  it('flags Messenger as Facebook', () => {
    expect(detectInAppBrowser(UA.messenger)).toBe('Facebook');
  });

  it('flags the Facebook app on Android (WebView, not Custom Tabs)', () => {
    expect(detectInAppBrowser(UA.facebookAndroid)).toBe('Facebook');
  });

  it('returns null for real iOS Safari', () => {
    expect(detectInAppBrowser(UA.safariIOS)).toBeNull();
  });

  it('returns null for Chrome on Android', () => {
    expect(detectInAppBrowser(UA.chromeAndroid)).toBeNull();
  });

  it('returns null for an empty user agent', () => {
    expect(detectInAppBrowser('')).toBeNull();
  });
});

describe('geolocationErrorMessage', () => {
  it('prioritizes the in-app browser case over the error code', () => {
    const msg = geolocationErrorMessage({ code: 1 }, 'WhatsApp');
    expect(msg).toContain('WhatsApp');
    expect(msg).toMatch(/Safari|Chrome/);
    expect(msg).toContain('mapa');
  });

  it('keeps the in-app guidance OS-neutral (Android users have Chrome, not Safari)', () => {
    const msg = geolocationErrorMessage({ code: 1 }, 'Instagram');
    expect(msg).toContain('Safari');
    expect(msg).toContain('Chrome');
    // No Safari-only menu instruction, which would strand Android users.
    expect(msg).not.toContain('Abrir en Safari');
  });

  it('explains a denied permission and offers the map fallback', () => {
    const msg = geolocationErrorMessage({ code: 1 }, null);
    expect(msg.toLowerCase()).toContain('permiso');
    expect(msg).toContain('mapa');
  });

  it('handles an unavailable position with the map fallback', () => {
    const msg = geolocationErrorMessage({ code: 2 }, null);
    expect(msg).toContain('mapa');
  });

  it('handles a timeout by inviting a retry', () => {
    const msg = geolocationErrorMessage({ code: 3 }, null);
    expect(msg.toLowerCase()).toMatch(/de nuevo|nuevamente|intenta/);
    expect(msg).toContain('mapa');
  });

  it('falls back to a generic message for an unknown code', () => {
    const msg = geolocationErrorMessage({ code: 99 }, null);
    expect(msg).toContain('mapa');
  });

  it('never contains an em dash', () => {
    for (const code of [1, 2, 3, 99]) {
      expect(geolocationErrorMessage({ code }, null)).not.toContain('—');
    }
    expect(geolocationErrorMessage({ code: 1 }, 'Instagram')).not.toContain('—');
  });
});
