import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fixes Turbopack "multiple lockfiles" warning — points to this package as the root
  serverExternalPackages: [],
};

export default nextConfig;
