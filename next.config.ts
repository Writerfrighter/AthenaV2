import type { NextConfig } from 'next';
// @ts-ignore
import withSerwistInit from '@serwist/next';

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      // Only apply redirects if we're on the expected domain
      ...(process.env.NEXTAUTH_URL?.includes('trcscouting.com') ? [
        {
          source: '/:path*',
          has: [
            {
              type: 'host',
              key: 'host',
              value: 'www.trcscouting.com'
            }
          ],
          destination: 'https://trcscouting.com/:path*',
          permanent: true
        }
      ] : [])
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Exclude database service from client-side bundles
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        // Add Node.js built-in modules
        'node:stream': false,
        'node:url': false,
        'node:crypto': false,
        'node:buffer': false,
        'node:util': false,
      };

      // Exclude mssql and related packages from client bundle
      config.externals = config.externals || [];
      config.externals.push({
        'mssql': 'mssql',
        'tedious': 'tedious',
        'node:stream': 'node:stream',
        'node:url': 'node:url',
      });
    }

    return config;
  },
};

const pwaConfig = {
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  additionalPrecacheEntries: [
    { url: '/dashboard', revision: null },
    { url: '/scout/matchscout', revision: null },
    { url: '/scout/pitscout', revision: null },
    { url: '/login', revision: null },
    { url: '/signup', revision: null },
  ],
  disable: false,
};

export default withSerwistInit(pwaConfig)(nextConfig);

// Prevent build manifest issues: always exclude app-build-manifest.json from serwist precache
