import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The hub has no home page of its own: the course guide is where everyone starts
  async redirects() {
    return [{ source: "/", destination: "/course", permanent: false }];
  },
};

export default nextConfig;
