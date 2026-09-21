import type { MetadataRoute } from 'next'

import { SITE_URL } from '@/lib/constants'

/** Date the site was replaced by the transition page. */
const SHUTDOWN_DATE = '2026-09-21';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: SHUTDOWN_DATE,
      changeFrequency: 'yearly',
      priority: 1.0,
    },
  ]
}
