import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Apoyo Venezuela',
    short_name: 'Apoyo VE',
    description:
      'Coordina ayuda tras el terremoto en Venezuela: reporta zonas, necesidades y consulta teléfonos de emergencia.',
    start_url: '/',
    display: 'standalone',
    lang: 'es',
    dir: 'ltr',
    // Dark background matches the app's dark-first UI; avoids flash of
    // white on slow-network launches.
    background_color: '#0c0e12',
    theme_color: '#1f47df',
    categories: ['utilities', 'social'],
    icons: [
      {
        src: '/icon.svg',
        type: 'image/svg+xml',
        sizes: 'any',
        purpose: 'any',
      },
    ],
  }
}
