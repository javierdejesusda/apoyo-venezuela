import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Apoyo Venezuela',
    short_name: 'Apoyo VE',
    description:
      'El trabajo de Apoyo Venezuela continúa en Red Quipu, donde se coordina la red de iniciativas.',
    start_url: '/',
    scope: '/',
    display: 'browser',
    lang: 'es',
    dir: 'ltr',
    background_color: '#0a0c11',
    theme_color: '#1f47df',
    categories: ['utilities', 'social'],
    icons: [
      {
        src: '/icon.svg',
        type: 'image/svg+xml',
        sizes: 'any',
        purpose: 'any',
      },
      {
        src: '/icon.svg',
        type: 'image/svg+xml',
        sizes: 'any',
        purpose: 'maskable',
      },
    ],
  }
}
