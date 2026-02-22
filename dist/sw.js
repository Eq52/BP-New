// Bismuth Player - Service Worker for PWA
const CACHE_NAME = 'bismuth-player-v2';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/index-B-vaY2Bj.js',
  './assets/index-pR9io1LO.css',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './icons/icon-192x192.svg',
  './placeholder.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((err) => {
        console.error('[SW] Failed to cache static assets:', err);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle placeholder.png specifically - serve from cache only
  if (url.pathname.endsWith('/placeholder.png')) {
    event.respondWith(
      caches.match('./placeholder.png').then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch('./placeholder.png');
      })
    );
    return;
  }

  // Skip cross-origin requests (except for images)
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Return cached response if found
      if (cachedResponse) {
        // Fetch new version in background
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, networkResponse.clone());
              });
            }
          })
          .catch(() => {
            // Network failed, but we have cached version
          });
        return cachedResponse;
      }

      // Not in cache, fetch from network
      return fetch(request)
        .then((networkResponse) => {
          // Cache successful responses
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch((error) => {
          console.error('[SW] Fetch failed:', error);
          // Return offline fallback if available
          if (request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          // Return placeholder for image requests
          if (request.destination === 'image') {
            return caches.match('./placeholder.png');
          }
          throw error;
        });
    })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
