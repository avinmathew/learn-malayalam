const CACHE_NAME = 'learn-malayalam-shell-v1'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(['/', '/index.html'])),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return
  }

  const url = new URL(event.request.url)

  if (url.origin !== self.location.origin) {
    return
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      if (event.request.mode === 'navigate') {
        try {
          const networkResponse = await fetch(event.request)
          cache.put('/index.html', networkResponse.clone())
          return networkResponse
        } catch {
          return cache.match('/index.html')
        }
      }

      const cachedResponse = await cache.match(event.request)

      if (cachedResponse) {
        void fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(event.request, networkResponse.clone())
            }
          })
          .catch(() => undefined)

        return cachedResponse
      }

      const networkResponse = await fetch(event.request)

      if (networkResponse.ok) {
        cache.put(event.request, networkResponse.clone())
      }

      return networkResponse
    }),
  )
})