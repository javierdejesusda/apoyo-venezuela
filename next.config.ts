import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ship the Bricolage wordmark font with the social-image routes, which read
  // it from disk when rendering the OpenGraph and Twitter cards.
  outputFileTracingIncludes: {
    "/opengraph-image": ["./assets/fonts/**"],
    "/twitter-image": ["./assets/fonts/**"],
  },
  // Serve the service worker fresh so updates roll out on the next visit.
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
};

export default nextConfig;
