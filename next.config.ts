import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  devIndicators: false,
  experimental: {
    // Permite chamar Server Actions com payload maior (notas longas, etc).
    serverActions: { bodySizeLimit: "2mb" },
  },
};

export default nextConfig;
