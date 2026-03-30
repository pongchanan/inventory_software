import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
  } as any,
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "**",
      },
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  // Note: Turbopack is enabled by default in Next.js 16
  // It automatically handles code splitting and caching
};

export default nextConfig;
