import type { NextConfig } from "next";

// Check if this is a mobile build (Capacitor)
const isMobileBuild = process.env.MOBILE_BUILD === 'true';

console.log('[next.config] MOBILE_BUILD:', isMobileBuild);

const nextConfig: NextConfig = {
  // Disable image optimization (required for static export)
  images: {
    unoptimized: true,
  },

  // Skip type checking during build (handled separately)
  typescript: {
    ignoreBuildErrors: false,
  },
};

// Enable static export ONLY for mobile builds
if (isMobileBuild) {
  nextConfig.output = 'export';
  nextConfig.trailingSlash = true;
  console.log('[next.config] Static export enabled, output: export');
}

export default nextConfig;


