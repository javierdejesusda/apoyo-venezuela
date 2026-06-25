import type { MetadataRoute } from 'next'

import { SITE_URL } from '@/lib/constants'

const BUILD_DATE = '2026-06-25';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: BUILD_DATE,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/reportar`,
      lastModified: BUILD_DATE,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/telefonos`,
      lastModified: BUILD_DATE,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/guia`,
      lastModified: BUILD_DATE,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ]
}
