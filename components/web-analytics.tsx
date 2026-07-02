import Script from 'next/script';

/**
 * Loads Cloudflare Web Analytics so every route reports an anonymous page view.
 * Cloudflare's beacon is cookie-less and collects no personal data, which suits
 * an emergency-aid app, and the free tier is unmetered.
 *
 * The beacon token is public (it ships in the client HTML) but is read from
 * `NEXT_PUBLIC_CF_BEACON_TOKEN` so the beacon only loads where it is configured.
 * Returns nothing when the token is absent (local dev and previews), keeping
 * those environments out of the production stats.
 */
export function WebAnalytics() {
  const token = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN;
  if (!token) {
    return null;
  }

  return (
    <Script
      id="cloudflare-web-analytics"
      strategy="afterInteractive"
      src="https://static.cloudflareinsights.com/beacon.min.js"
      data-cf-beacon={JSON.stringify({ token })}
    />
  );
}
