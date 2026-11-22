import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Isolate Playwright build files from normal Next.js development.
  ...(process.env.E2E_TEST_MODE === "true" ? { distDir: ".next-e2e" } : {}),

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**"
      },
      {
        protocol: "http",
        hostname: "**"
      }
    ]
  }
};

export default nextConfig;
