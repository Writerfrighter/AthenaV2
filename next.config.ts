import type { NextConfig } from 'next';
import withPWA from 'next-pwa';

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      // Only apply redirects if we're on the expected domain
      ...(process.env.NEXTAUTH_URL?.includes('noahf.dev') ? [
        {
          source: '/:path*',
          has: [
            {
              type: 'host',
              key: 'host',
              value: 'www.noahf.dev'
            }
          ],
          destination: 'https://noahf.dev/:path*',
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
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: !isProd,
  // Only include runtime caching in production
  runtimeCaching: isProd ? require('./runtimeCaching') : [],
  // Prevent build manifest issues: always exclude app-build-manifest.json from next-pwa precache
  buildExcludes: [/.*\.js\.map$/, /app-build-manifest\.json$/],
};

export default withPWA(pwaConfig)(nextConfig);
