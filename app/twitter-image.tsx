import { OG_SIZE, renderOgImage } from '@/lib/og-image';

export const size = OG_SIZE;
export const contentType = 'image/png';
export const alt = 'Apoyo Venezuela ahora trabaja en Red Quipu, la red de iniciativas continúa';

export default function Image(): Response {
  return renderOgImage();
}
