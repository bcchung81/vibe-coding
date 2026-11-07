import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Korean font for the serverless Chromium that captures first screens (saving on /me starts a capture)
  outputFileTracingIncludes: { "/me": ["./fonts/**"] },
  // Until day 1 the home page is the course guide; on day 1 it goes back to the gallery (/gallery) by changing this line
  async redirects() {
    return [{ source: "/", destination: "/course", permanent: false }];
  },
};

export default nextConfig;
