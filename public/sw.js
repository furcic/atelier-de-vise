const CACHE_PREFIX = `atelier-${new URL(self.registration.scope).pathname}-offline-`;
const CACHE = `${CACHE_PREFIX}v4`;
const offline = new URL('offline.html', self.registration.scope).href;
const logo = new URL('logo.svg', self.registration.scope).href;
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll([offline, logo])));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE).map(key => caches.delete(key))
  )));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  if (event.request.url === logo) {
    event.respondWith(fetch(event.request).catch(() => caches.match(logo)));
    return;
  }
  if (event.request.mode === 'navigate') event.respondWith(fetch(event.request).catch(() => caches.match(offline)));
});
