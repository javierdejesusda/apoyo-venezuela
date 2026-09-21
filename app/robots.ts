import type { MetadataRoute } from 'next'

import { SITE_URL } from '@/lib/constants'

/**
 * The site is one static page, so a crawl costs nothing to serve. The earlier
 * rules disallowed `/zona/` and blocked bulk crawlers because a single sweep of
 * one path per report cost thousands of cache regenerations; none of that
 * exists any more, and keeping anyone out would only make the transition
 * notice harder to find for people following an old link.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
