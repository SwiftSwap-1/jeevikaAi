// JeevikaAI Service Worker v1.3.0 - Core Assets & Offline Profile Cache Strategy
const CACHE_NAME = 'jeevika-static-v1.3.0';
const DATA_CACHE_NAME = 'jeevika-data-v1.3.0';
const OFFLINE_URL = '/';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/icons/icon-maskable-512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME && name !== DATA_CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Handle Offline Profile Data API or Caching requests
  if (url.pathname.includes('/api/offline-profile')) {
    if (event.request.method === 'POST' || event.request.method === 'PUT') {
      event.respondWith(
        (async () => {
          const clone = event.request.clone();
          const cache = await caches.open(DATA_CACHE_NAME);
          await cache.put('/api/offline-profile', clone);
          return fetch(event.request).catch(() => new Response(JSON.stringify({ success: true, offlineSaved: true }), { headers: { 'Content-Type': 'application/json' } }));
        })()
      );
      return;
    } else {
      event.respondWith(
        caches.match('/api/offline-profile').then((cached) => {
          if (cached) return cached;
          return fetch(event.request).catch(() => new Response(JSON.stringify(null), { headers: { 'Content-Type': 'application/json' } }));
        })
      );
      return;
    }
  }

  // Bypass other API requests to ensure fresh AI & network data when online
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({
          fallback: true,
          offline: true,
          message: 'Device is offline. Using local rule engine & cached profile.'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Navigation requests: Network-first, fallback to cache, then root
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // Static assets (CSS, JS, Fonts, Images): Cache-first with background revalidation
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {/* Ignore network errors while offline */});
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
    })
  );
});

// Background Push Notification Event Handlers for PWA
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'JeevikaAI Notification', body: 'New livelihood update available.' };
  const options = {
    body: data.body,
    icon: '/icons/icon-192.svg',
    badge: '/icons/icon-192.svg',
    data: { url: data.url || '/' }
  };
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
