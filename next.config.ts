import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // upload preview round-trips the full parsed dataset as JSON
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
