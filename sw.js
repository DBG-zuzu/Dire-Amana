const CACHE_NAME = 'amana-hub-v1';
const STATIC_CACHE = 'amana-static-v1';
const DYNAMIC_CACHE = 'amana-dynamic-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/og-image.png',
  '/placeholder.svg',
  '/script.js',
  '/styles.css'
];

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then(cache => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Create dynamic cache
      caches.open(DYNAMIC_CACHE)
    ])
  );
});

// Activate Service Worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [STATIC_CACHE, DYNAMIC_CACHE];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch Event Strategy
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // Return cached response if found
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then(response => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache the new response in dynamic cache
          caches.open(DYNAMIC_CACHE)
            .then(cache => {
              // Only cache GET requests
              if (event.request.method === 'GET') {
                cache.put(event.request, responseToCache);
              }
            });

          return response;
        })
        .catch(() => {
          // Return offline fallback for HTML requests
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/offline.html');
          }
        });
    })
  );
});

// Handle API requests
self.addEventListener('fetch', event => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone the response
          const responseToCache = response.clone();

          // Cache the API response
          caches.open(DYNAMIC_CACHE)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        })
        .catch(() => {
          // Return cached API response if available
          return caches.match(event.request);
        })
    );
  }
});

// Periodic cache cleanup
self.addEventListener('message', event => {
  if (event.data === 'CLEAN_CACHES') {
    caches.open(DYNAMIC_CACHE).then(cache => {
      cache.keys().then(requests => {
        requests.forEach(request => {
          // Delete items older than 7 days
          cache.match(request).then(response => {
            const date = new Date(response.headers.get('date'));
            if (Date.now() - date.getTime() > 7 * 24 * 60 * 60 * 1000) {
              cache.delete(request);
            }
          });
        });
      });
    });
  }
});