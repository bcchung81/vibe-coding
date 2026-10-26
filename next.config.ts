import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Korean font for the serverless Chromium that captures first screens (saving on /me starts a capture)
  outputFileTracingIncludes: { "/me": ["./fonts/**"] },
  // the gallery is the home page now; keep old links working
  async redirects() {
    return [{ source: "/gallery", destination: "/", permanent: false }];
  },
};

export default nextConfig;
