/** Offline application-shell cache and same-origin runtime request strategy. */
const VERSION = 'ukrt-2027-v20';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/tokens.css',
  './css/base.css',
  './css/app.css',
  './css/print.css',
  './js/app.js',
  './js/router.js',
  './js/store.js',
  './js/repository.js',
  './js/validator.js',
  './js/theme.js',
  './js/navigation.js',
  './js/migrations.js',
  './js/config.js',
  './js/mode.js',
  './js/utils.js',
  './js/icons.js',
  './js/components.js',
  './js/views.js',
  './data/trip.json',
  './data/trip.schema.json',
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
    event.respondWith(Promise.race([
      fetch(request),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Navigation timeout')), 3000))
    ]).catch(() => caches.match('./index.html')));
    return;
  }

  if (url.pathname.endsWith('/data/trip.json')) {
    event.respondWith(fetch(request).then(response => {
      if (response.ok) caches.open(VERSION).then(cache => cache.put(request, response.clone()));
      return response;
    }).catch(() => caches.match(request)));
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
