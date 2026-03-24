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

async function revalidateAppShell() {
  const cache = await caches.open(CACHE_NAME);
  const cached = (await cache.match('/index.html')) || (await cache.match('/'));
  try {
    const networkRes = await fetch('/index.html', { cache: 'no-store' });
    if (!networkRes.ok) return;

    if (cached) {
      const oldEtag = cached.headers.get('etag');
      const newEtag = networkRes.headers.get('etag');
      let changed = false;
      if (oldEtag && newEtag) {
        changed = oldEtag !== newEtag;
      } else {
        const [oldText, newText] = await Promise.all([
          cached.clone().text(),
          networkRes.clone().text(),
        ]);
        changed = oldText !== newText;
      }

      if (changed) {
        await cache.put('/index.html', networkRes.clone());
        await cache.put('/', networkRes.clone());
        const clients = await self.clients.matchAll({
          type: 'window',
          includeUncontrolled: false,
        });
        for (const client of clients) {
          client.navigate(client.url);
        }
        return;
      }
    } else {
      await cache.put('/index.html', networkRes.clone());
      await cache.put('/', networkRes.clone());
    }
  } catch {
    /* offline or network error */
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.mode === 'navigate' && url.origin === self.location.origin) {
    event.waitUntil(revalidateAppShell());
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached =
          (await cache.match('/index.html')) || (await cache.match('/'));
        if (cached) return cached;

        try {
          const response = await fetch(request);
          if (response.ok) return response;
        } catch {
          /* offline or network error */
        }
        return (
          (await cache.match('/index.html')) ||
          (await cache.match('/')) ||
          new Response('', { status: 504, statusText: 'Offline' })
        );
      })(),
    );
    return;
  }

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
});
