// sw.js — DataVault Service Worker (Optimized for Nuriddin)
const APP_VERSION = 'v1.0.0';
const STATIC_CACHE  = `datavault-static-${APP_VERSION}`;

// ─── BU YERDA MANZILLARNI TO'G'IRLADIM ──────────────────────────────────────────
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json',
  '/icon-192x192.png', // Papkasiz, to'g'ridan-to'g'ri ism
  '/icon-512x512.png'  // Papkasiz, to'g'ridan-to'g'ri ism
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== STATIC_CACHE).map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});
