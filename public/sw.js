const CACHE_NAME = 'app-cache-' + '__BUILD_HASH__';

const STATIC_ASSETS = ['/'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }),
  );

  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

const STATIC_EXTENSIONS = [
  // '.js',
  // 'tsx',
  // 'ts',
  // '.css',
  // '.scss',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.svg',
  '.woff2',
  '.woff',
  '.ttf',
  // '.html',
  '.json',
  '.xml',
  '.txt',
  '.ico',
  // '.webmanifest',
];

const STATIC_PATHS = ['/assets/'];

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put('/index.html', clone);
          });
          return response;
        })
        .catch(() => caches.match('/index.html')),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        if (
          response &&
          response.status === 200 &&
          (response.type === 'basic' || response.type === 'cors')
        ) {
          const url = new URL(request.url);
          const isStatic =
            STATIC_EXTENSIONS.some((ext) => url.pathname.endsWith(ext)) ||
            STATIC_PATHS.some((path) => url.pathname.startsWith(path));

          if (isStatic) {
            const responseClone = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, responseClone));
          }
        }
        return response;
      });
    }),
  );
});
