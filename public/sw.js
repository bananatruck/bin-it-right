// Bin It Right service worker: keeps the app usable offline after the first visit.
// Everything the app needs (code, fonts, the rules dataset) is same-origin and static.
// GitHub Pages serves every project of an account from one origin, so this worker only
// ever touches caches whose names start with its own prefix.
const PREFIX = 'bin-it-right-'
const CACHE = `${PREFIX}v2`
const SCOPE = self.registration.scope

const inScope = (url) => typeof url === 'string' && url.startsWith(SCOPE)
// Module scripts and fonts are requested with an Origin header, the precached copies without one,
// and servers may answer with "Vary: Origin". The files are static and hashed, so Vary is ignored.
const MATCH = { ignoreVary: true }

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(['./', './index.html'])).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith(PREFIX) && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

// The page sends the files it has already loaded (scripts, styles, fonts), so the very first
// visit is enough to work offline. Only files inside this app's scope are cached.
self.addEventListener('message', (event) => {
  const data = event.data
  if (data === null || typeof data !== 'object' || data.type !== 'precache' || !Array.isArray(data.urls)) return
  const urls = data.urls.filter(inScope)
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(urls)))
})

// Network first for pages (so a new deploy shows up), cache first for hashed assets.
// Only successful responses are stored, so an error page never replaces the saved app.
self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone()
            // waitUntil keeps the worker alive until the copy is stored; a failed write only loses the update.
            event.waitUntil(caches.open(CACHE).then((cache) => cache.put('./index.html', copy)).catch(() => undefined))
            return response
          }
          return caches.match('./index.html', MATCH).then((cached) => cached ?? response)
        })
        .catch(() => caches.match('./index.html', MATCH).then((cached) => cached ?? Response.error())),
    )
    return
  }
  event.respondWith(
    caches.match(request, MATCH).then(
      (cached) =>
        cached ??
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone()
            event.waitUntil(caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => undefined))
          }
          return response
        }),
    ),
  )
})
