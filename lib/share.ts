import { CAMPAIGN_HASHTAG } from '@/lib/constants';

export interface SharePayload {
  text: string;
  url: string;
}

export function buildHomeSharePayload(origin: string): SharePayload {
  return {
    text: `Apoya a las zonas afectadas por el terremoto en Venezuela. Reporta necesidades y consulta ayuda zona por zona. ${CAMPAIGN_HASHTAG}`,
    url: `${origin}/`,
  };
}

export function buildZoneSharePayload(
  zone: { id: string; nombre: string; ciudad: string },
  origin: string,
): SharePayload {
  return {
    text: `${zone.nombre} (${zone.ciudad}) necesita ayuda tras el terremoto. Consulta las necesidades reportadas y colabora. ${CAMPAIGN_HASHTAG}`,
    url: `${origin}/zona/${zone.id}`,
  };
}

export function buildWhatsAppUrl(payload: SharePayload): string {
  const combined = `${payload.text} ${payload.url}`;
  return `https://wa.me/?text=${encodeURIComponent(combined)}`;
}

export function buildTelegramUrl(payload: SharePayload): string {
  return (
    `https://t.me/share/url?url=${encodeURIComponent(payload.url)}` +
    `&text=${encodeURIComponent(payload.text)}`
  );
}
