import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Supabase Auth·middleware·cookies() 사용 — static export 불가
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/auth',
        permanent: false,
      },
      {
        source: '/signup',
        destination: '/auth?mode=signup',
        permanent: false,
      },
    ];
  },
  images: {
    unoptimized: true,
  },
  typescript: {
    // ignoreBuildErrors: true,
  },
};

export default nextConfig;
