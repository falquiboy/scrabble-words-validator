const CACHE_NAME = 'maslexico-offline-v4';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/maslexico-icon.png',
  '/sql-wasm.wasm',
  '/lexicon/manifest.json',
];

const getBuiltAssets = (html) =>
  [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((match) => match[1]);

const cacheAppShell = async () => {
  const cache = await caches.open(CACHE_NAME);
  const [pageResponse, dictionaryResponse] = await Promise.all([
    fetch('/index.html', { cache: 'reload' }),
    fetch('/lexicon/manifest.json', { cache: 'reload' }),
  ]);
  const html = await pageResponse.clone().text();
  const dictionary = await dictionaryResponse.clone().json();
  const builtAssets = getBuiltAssets(html);
  const dictionaryAssets = Object.values(dictionary.lengths).map((shard) => shard.url);

  await cache.put('/index.html', pageResponse.clone());
  await cache.put('/', pageResponse);
  await cache.put('/lexicon/manifest.json', dictionaryResponse);
  await cache.addAll([...new Set([...CORE_ASSETS.slice(2), ...builtAssets])]);
  for (const asset of dictionaryAssets) await cache.add(asset);
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
        .then(async (response) => {
          const cache = await caches.open(CACHE_NAME);
          const html = await response.clone().text();
          await cache.put('/index.html', response.clone());
          await cache.addAll([...new Set(getBuiltAssets(html))]);
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // The Trie worker carries runtime behavior but has a stable URL. Prefer the
  // network so an installed PWA does not keep an older worker indefinitely;
  // retain the cached copy only as the offline fallback.
  if (url.pathname === '/trie-builder.worker.js') {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then(async (response) => {
          if (!response.ok) {
            return (await caches.match(request)) || response;
          }

          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
          return response;
        })
        .catch(async (error) => {
          const cached = await caches.match(request);
          if (cached) return cached;
          throw error;
        })
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
