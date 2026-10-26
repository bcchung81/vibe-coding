import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // the gallery is the home page now; keep old links working
  async redirects() {
    return [{ source: "/gallery", destination: "/", permanent: false }];
  },
};

export default nextConfig;
