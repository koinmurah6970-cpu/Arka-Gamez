import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    // Covers are immutable once uploaded -- cache optimized variants at the
    // edge for a year instead of the 60s default, so repeat admin browsing
    // doesn't keep re-resizing the same 1000+ covers.
    minimumCacheTTL: 31536000,
  },
};

export default nextConfig;
