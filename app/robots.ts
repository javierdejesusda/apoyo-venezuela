import type { MetadataRoute } from 'next'

import { SITE_URL } from '@/lib/constants'

/**
 * Crawlers that sweep every URL on a site for training corpora or backlink
 * indexes. With one `/zona/<id>` path per report, a single pass costs thousands
 * of ISR regenerations and sends nobody to the site, so they are disallowed.
 * Search and answer engines that surface the site to people are not listed.
 */
const BULK_CRAWLERS = [
  'AhrefsBot',
  'Amazonbot',
  'Bytespider',
  'CCBot',
  'ClaudeBot',
  'DataForSeoBot',
  'Diffbot',
  'DotBot',
  'ImagesiftBot',
  'MJ12bot',
  'SemrushBot',
  'GPTBot',
  'meta-externalagent',
  'omgilibot',
]

/** Seconds between requests asked of compliant crawlers, to cap burst sweeps. */
const CRAWL_DELAY_SECONDS = 10

/**
 * Paths kept out of every crawl. `/zona/` is one path per report and so is
 * almost the entire URL surface of the site; letting crawlers sweep it costs a
 * cache regeneration per report while ranking nobody, since people arrive
 * through the map on the home page rather than through a single report. `/api/`
 * is for programmatic clients and has nothing to index.
 */
const CRAWLER_EXCLUDED_PATHS = ['/zona/', '/api/']

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: CRAWLER_EXCLUDED_PATHS,
        crawlDelay: CRAWL_DELAY_SECONDS,
      },
      {
        userAgent: BULK_CRAWLERS,
        disallow: '/',
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
