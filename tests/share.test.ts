import { describe, expect, it } from 'vitest';

import {
  buildHomeSharePayload,
  buildTelegramUrl,
  buildWhatsAppUrl,
  buildZoneSharePayload,
} from '@/lib/share';

const ORIGIN = 'https://apoyo.example';

describe('buildHomeSharePayload', () => {
  it('url equals origin + /', () => {
    const payload = buildHomeSharePayload(ORIGIN);
    expect(payload.url).toBe(`${ORIGIN}/`);
  });

  it('text is non-empty', () => {
    const payload = buildHomeSharePayload(ORIGIN);
    expect(payload.text.length).toBeGreaterThan(0);
  });

  it('text contains the campaign hashtag', () => {
    const payload = buildHomeSharePayload(ORIGIN);
    expect(payload.text).toContain('#TerremotoVenezuela');
  });
});

describe('buildZoneSharePayload', () => {
  const zone = { id: 'abc-123', nombre: 'Barrio La Vega', ciudad: 'Caracas' };

  it('url equals origin + /zona/{id}', () => {
    const payload = buildZoneSharePayload(zone, ORIGIN);
    expect(payload.url).toBe(`${ORIGIN}/zona/${zone.id}`);
  });

  it('text contains zone nombre', () => {
    const payload = buildZoneSharePayload(zone, ORIGIN);
    expect(payload.text).toContain(zone.nombre);
  });

  it('text contains zone ciudad', () => {
    const payload = buildZoneSharePayload(zone, ORIGIN);
    expect(payload.text).toContain(zone.ciudad);
  });

  it('text contains the campaign hashtag', () => {
    const payload = buildZoneSharePayload(zone, ORIGIN);
    expect(payload.text).toContain('#TerremotoVenezuela');
  });
});

describe('buildWhatsAppUrl', () => {
  it('starts with the WhatsApp share prefix', () => {
    const url = buildWhatsAppUrl({ text: 'Hola', url: 'https://apoyo.example/' });
    expect(url.startsWith('https://wa.me/?text=')).toBe(true);
  });

  it('encodes spaces so they do not appear as literal spaces', () => {
    const url = buildWhatsAppUrl({ text: 'Hola mundo', url: 'https://apoyo.example/' });
    expect(url).not.toContain(' ');
  });

  it('encodes # so it does not appear as a literal hash', () => {
    const url = buildWhatsAppUrl({ text: '#TerremotoVenezuela', url: 'https://apoyo.example/' });
    expect(url).not.toContain('#');
  });

  it('includes both text and url percent-encoded in the query', () => {
    const payload = { text: 'Ver zona', url: 'https://apoyo.example/zona/1' };
    const url = buildWhatsAppUrl(payload);
    const encoded = encodeURIComponent(`${payload.text} ${payload.url}`);
    expect(url).toBe(`https://wa.me/?text=${encoded}`);
  });
});

describe('buildTelegramUrl', () => {
  it('starts with the Telegram share prefix', () => {
    const url = buildTelegramUrl({ text: 'Hola', url: 'https://apoyo.example/' });
    expect(url.startsWith('https://t.me/share/url?')).toBe(true);
  });

  it('includes a percent-encoded url param', () => {
    const payload = { text: 'Hola', url: 'https://apoyo.example/zona/1' };
    const url = buildTelegramUrl(payload);
    expect(url).toContain(encodeURIComponent(payload.url));
  });

  it('includes a percent-encoded text param', () => {
    const payload = { text: '#TerremotoVenezuela ayuda', url: 'https://apoyo.example/' };
    const url = buildTelegramUrl(payload);
    expect(url).toContain(encodeURIComponent(payload.text));
  });

  it('does not contain literal # characters in the query', () => {
    const url = buildTelegramUrl({ text: '#TerremotoVenezuela', url: 'https://apoyo.example/' });
    const queryPart = url.slice(url.indexOf('?') + 1);
    expect(queryPart).not.toContain('#');
  });
});
