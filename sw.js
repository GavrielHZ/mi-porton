const CACHE_NAME = 'porton-cache-v2';
const MQTT_CDN = 'https://unpkg.com/mqtt/dist/mqtt.min.js';
const ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json',
  MQTT_CDN
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        await cache.addAll(ASSETS);
      } catch (e) {
        // Si algún recurso externo falla (ej. CDN), continúa con los demás
        const internal = ASSETS.filter(a => a.startsWith('/'));
        await cache.addAll(internal);
      }
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map(k => k !== CACHE_NAME ? caches.delete(k) : null)))
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Para recursos estáticos: cache-first
  if (request.method === 'GET' && ASSETS.some(a => request.url.endsWith(a))) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
    return;
  }
  // Para el script de MQTT en CDN: cache-first con fallback a red y guardar en caché
  if (request.method === 'GET' && request.url.startsWith(MQTT_CDN)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((resp) => {
          const respClone = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, respClone));
          return resp;
        });
      })
    );
    return;
  }
  // Para /abrir y otras rutas dinámicas: network-first
  event.respondWith(
    fetch(request).catch(() => caches.match('/index.html'))
  );
});
