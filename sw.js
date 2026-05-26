const CACHE_NAME = 'noodtolk-v1';
const ASSETS = [
  '/noodtolk.html',
  '/manifest.json'
];

// Installeer: cache de app-shell
self.addEventListener('install', (evt) => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activeer: verwijder oude caches
self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first voor app-shell, network-first voor API
self.addEventListener('fetch', (evt) => {
  const url = new URL(evt.request.url);

  // Anthropic API altijd via netwerk
  if (url.hostname === 'api.anthropic.com') {
    evt.respondWith(fetch(evt.request));
    return;
  }

  // Google Fonts altijd via netwerk
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('gstatic.com')) {
    evt.respondWith(fetch(evt.request).catch(() => new Response('')));
    return;
  }

  // App-shell: cache-first
  evt.respondWith(
    caches.match(evt.request).then(cached => {
      if (cached) return cached;
      return fetch(evt.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(evt.request, clone));
        }
        return response;
      }).catch(() => caches.match('/noodtolk.html'));
    })
  );
});
