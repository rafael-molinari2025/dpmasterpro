import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
  // Necessário para xlsx e node-forge no servidor
  serverExternalPackages: ["xlsx", "node-forge", "nodemailer"],
};

export default nextConfig;
