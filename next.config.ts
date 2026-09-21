import type { NextConfig } from "next";

/**
 * Paths that must keep resolving after the shutdown. Redirects are checked
 * before the filesystem, so anything left out of this list is sent to `/` and
 * the transition page loses its own scripts, styles, icons and metadata.
 * Written as character classes rather than escapes because path-to-regexp
 * consumes a backslash before it reaches the regular expression.
 */
const SERVED_PATHS = [
  "_next/",
  "favicon[.]ico",
  "icon[.]svg",
  "manifest[.]webmanifest",
  "sw[.]js",
  "offline[.]html",
  "robots[.]txt",
  "sitemap[.]xml",
  "opengraph-image",
  "twitter-image",
  "apple-icon",
].join("|");

/**
 * Every other path, at any depth. The trailing `+` (not `*`) is what keeps `/`
 * out of the match: the transition page is the destination, so matching it
 * would redirect the page to itself forever.
 */
const RETIRED_PATHS = `/:path((?!${SERVED_PATHS}).+)`;

const nextConfig: NextConfig = {
  // Ship the Bricolage wordmark font with the social-image routes, which read
  // it from disk when rendering the OpenGraph and Twitter cards.
  outputFileTracingIncludes: {
    "/opengraph-image": ["./assets/fonts/**"],
    "/twitter-image": ["./assets/fonts/**"],
  },
  // Serve the service worker fresh so the kill switch reaches visitors who
  // still have the old caching worker registered.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: RETIRED_PATHS,
        destination: "/",
        // 307, never 308: browsers cache a permanent redirect indefinitely, so
        // a 308 would keep people off a restored route long after the site
        // came back.
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
