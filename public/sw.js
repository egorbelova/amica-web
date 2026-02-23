const CACHE_NAME = 'app-cache-v3';
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
];

const STATIC_PATHS = ['/assets/'];

// ---------- INSTALL ----------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

// ---------- FETCH ----------
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Навигация (SPA) -> всегда отдаём index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then((cached) => {
        const networkFetch = fetch(request)
          .then((response) => {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put('/index.html', response.clone());
            });
            return response;
          })
          .catch(() => cached);

        return cached || networkFetch;
      }),
    );
    return;
  }

  // Проверка, является ли запрос статическим файлом
  const isStatic =
    STATIC_PATHS.some((path) => url.pathname.startsWith(path)) ||
    STATIC_EXTENSIONS.some((ext) => url.pathname.endsWith(ext));

  // Кэширование API и статических ресурсов
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
          return cachedResponse; // fallback, если сеть не доступна
        }
      })(),
    );
    return;
  }

  // Все остальные запросы просто через сеть
  // event.respondWith(fetch(request));
});
