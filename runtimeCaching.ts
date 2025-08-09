// runtimeCaching.js
const { NetworkFirst } = require('workbox-strategies');
const { CacheableResponsePlugin } = require('workbox-cacheable-response');
const { ExpirationPlugin } = require('workbox-expiration');

module.exports = [
  // Cache JS/CSS/Next.js static assets
  {
    urlPattern: /^\/_next\/static\//,
    handler: new NetworkFirst({
      cacheName: 'next-static-assets',
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 }),
      ],
    }),
  },

  // Offline support for /scout/matchscout and /scout/pitscout
  {
    urlPattern: /^\/scout\/(matchscout|pitscout)$/,
    handler: new NetworkFirst({
      cacheName: 'scouting-pages',
      networkTimeoutSeconds: 3,
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
      ],
    }),
  },
];
