import type { NextConfig } from 'next';
import withPWA from 'next-pwa';

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
      },
    ],
  },
};

const pwaConfig = {
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: !isProd,
  // Only include runtime caching in production
  runtimeCaching: isProd ? require('./runtimeCaching') : [],
  // Prevent build manifest issues in development
  buildExcludes: isProd ? [] : [/.*\.js\.map$/, /app-build-manifest\.json$/],
};

export default withPWA(pwaConfig)(nextConfig);
