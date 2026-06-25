import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ship the Bricolage wordmark font with the social-image routes, which read
  // it from disk when rendering the OpenGraph and Twitter cards.
  outputFileTracingIncludes: {
    "/opengraph-image": ["./assets/fonts/**"],
    "/twitter-image": ["./assets/fonts/**"],
  },
};

export default nextConfig;
