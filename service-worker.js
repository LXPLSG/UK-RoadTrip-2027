/** Offline application-shell cache and same-origin runtime request strategy. */
const VERSION = 'ukrt-2027-v3';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/tokens.css',
  './css/base.css',
  './css/app.css',
  './js/app.js',
  './js/router.js',
  './js/store.js',
  './js/repository.js',
  './js/validator.js',
  './js/theme.js',
  './js/utils.js',
  './js/icons.js',
  './js/components.js',
  './js/views.js',
  './data/trip.json',
  './assets/images/highlands-road.jpg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== VERSION).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('./index.html')));
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (!response || response.status !== 200) return response;
      const copy = response.clone();
      caches.open(VERSION).then(cache => cache.put(request, copy));
      return response;
    }))
  );
});
