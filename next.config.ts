import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Supabase Auth·middleware·cookies() 사용 — static export 불가
  images: {
    unoptimized: true,
  },
  typescript: {
    // ignoreBuildErrors: true,
  },
};

export default nextConfig;
