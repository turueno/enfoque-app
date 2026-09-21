import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["node:sqlite"],
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3001",
        "127.0.0.1:3001",
        "192.168.100.12:3001",
        "*.trycloudflare.com",
        "*.up.railway.app",
        "*.railway.app"
      ],
    },
  },
  async rewrites() {
    return [
      { source: '/procesos', destination: '/frentes' },
      { source: '/procesos/:id', destination: '/frentes/:id' },
    ];
  },
};

export default nextConfig;
