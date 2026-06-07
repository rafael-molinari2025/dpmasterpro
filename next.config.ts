import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["dpmasterpro.primetitec.com.br", "localhost:3000"],
    },
  },
  serverExternalPackages: ["xlsx", "node-forge", "nodemailer"],
};

export default nextConfig;
