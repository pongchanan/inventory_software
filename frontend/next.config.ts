import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    // The Next.js server runs inside Railway and CAN reach .railway.internal.
    // The browser cannot — so we proxy all /api/* through Next.js itself.
    // Browser → https://frontend.railway.app/api/*
    //   → Next.js server (Railway internal) → http://backend.railway.internal:PORT/api/*
    const backendUrl = process.env.BACKEND_URL ?? "http://127.0.0.1:3000";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
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
};

export default nextConfig;
