import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  // Avoid picking up a lockfile higher in the home directory.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
