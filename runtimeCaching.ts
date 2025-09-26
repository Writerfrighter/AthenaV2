// runtimeCaching configuration for serwist
// Use serializable handler strings ('NetworkFirst' / 'CacheFirst') so serwist can embed
// these rules into the generated service worker.
module.exports = [
  // Cache JS/CSS/Next.js static assets
  {
    urlPattern: /^\/_next\/static\//,
    handler: 'NetworkFirst',
    options: {
      cacheName: 'next-static-assets',
      expiration: { maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 },
      cacheableResponse: { statuses: [0, 200] },
    },
  },

  // Offline support for scouting pages (more permissive regex to match trailing slash / query)
  {
    urlPattern: /^\/scout\/(?:matchscout|pitscout)(?:\/|$|\?)/,
    handler: 'NetworkFirst',
    options: {
      cacheName: 'scouting-pages',
      networkTimeoutSeconds: 3,
      cacheableResponse: { statuses: [0, 200] },
    },
  },

  // Cache images (including TRCLogo.webp) with a Cache First strategy for offline availability
  {
    urlPattern: /\.(?:png|jpg|jpeg|webp|svg|gif)$/,
    handler: 'CacheFirst',
    options: {
      cacheName: 'images',
      expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 },
      cacheableResponse: { statuses: [0, 200] },
    },
  },
];
