import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Prevent Turbopack from picking a parent folder when another lockfile exists nearby.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
