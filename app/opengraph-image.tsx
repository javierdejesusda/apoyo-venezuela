import { OG_SIZE, renderOgImage } from '@/lib/og-image';

export const size = OG_SIZE;
export const contentType = 'image/png';
export const alt = 'Apoyo Venezuela - coordinación de ayuda tras el terremoto';

export default function Image(): Response {
  return renderOgImage();
}
