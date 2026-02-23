const CACHE_NAME = 'app-cache';
const STATIC_ASSETS = ['/', '/index.html'];

const STATIC_EXTENSIONS = [
  '.js',
  '.ts',
  '.tsx',
  '.css',
  '.scss',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.svg',
  '.woff2',
  '.woff',
  '.ttf',
  '.json',
  '.xml',
  '.txt',
  '.ico',
];

const STATIC_PATHS = ['/assets/'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // if (request.mode === 'navigate') {
  //   event.respondWith(fetch(request));
  //   return;
  // }

  const isStatic =
    STATIC_PATHS.some((path) => url.pathname.startsWith(path)) ||
    STATIC_EXTENSIONS.some((ext) => url.pathname.endsWith(ext));

  if (isStatic || url.pathname.startsWith('/api/protected-file/')) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);
        if (cachedResponse) return cachedResponse;

        try {
          const response = await fetch(request);
          if (response && response.status === 200) {
            cache.put(request, response.clone());
          }
          return response;
        } catch (err) {
          return cachedResponse;
        }
      })(),
    );
    return;
  }

  // event.respondWith(fetch(request));
});
