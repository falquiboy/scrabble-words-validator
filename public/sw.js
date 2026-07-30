const CACHE_NAME = 'maslexico-offline-v1';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/maslexico-icon.png',
  '/sql-wasm.wasm',
  '/lexicon.dbpack',
];

const cacheAppShell = async () => {
  const cache = await caches.open(CACHE_NAME);
  const pageResponse = await fetch('/index.html', { cache: 'reload' });
  const html = await pageResponse.clone().text();
  const builtAssets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)]
    .map((match) => match[1]);

  await cache.put('/index.html', pageResponse.clone());
  await cache.put('/', pageResponse);
  await cache.addAll([...new Set([...CORE_ASSETS.slice(2), ...builtAssets])]);
};

self.addEventListener('install', (event) => {
  event.waitUntil(cacheAppShell().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
    )
  );
});
