const CACHE_NAME = 'athena-cache-v1';
const URLS_TO_CACHE = [
    '/pit_scouting',
    '/game_scouting',
    '/static/script.js',
    '/static/style.css',
    '/static/images/favicon.ico',
    '/static/images/TRC+Logo.png',
    '/static/fonts/Inter-Regular.ttf',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js',
    'https://unpkg.com/dexie/dist/dexie.js'
];

// Install event: cache the specified URLs
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(URLS_TO_CACHE))
    );
    self.skipWaiting();
});

// Activate event: clean up old caches if any
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                        .map(key => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

// Fetch event: serve from cache if offline
self.addEventListener('fetch', event => {
    const { request } = event;
    if (URLS_TO_CACHE.some(url => request.url.endsWith(url))) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    // Update local cache with fresh response
                    const responseClone = response.clone();
                    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(request, responseClone)));
                    return response;
                })
                .catch(() => caches.match(request))
        );
    } else {
        event.respondWith(
            caches.match(request)
                .then(response => response || fetch(request))
        );
    }
});