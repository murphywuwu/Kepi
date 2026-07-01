import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Playwright and some dev proxies hit 127.0.0.1 — allow HMR/client bundles. */
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
