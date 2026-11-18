// @vitest-environment node
// Runs public/sw.js against in-memory fakes of the service-worker globals.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { runInNewContext } from 'node:vm'

type Handler = (event: Record<string, unknown>) => void

function loadWorker(fetchImpl: (request: Request) => Promise<Response>) {
  const stores = new Map<string, Map<string, Response>>()
  const handlers = new Map<string, Handler>()
  const matchOptions: Array<{ ignoreVary?: boolean } | undefined> = []
  const open = (name: string) => {
    let store = stores.get(name)
    if (store === undefined) {
      store = new Map()
      stores.set(name, store)
    }
    const s = store
    const key = (request: Request | string) => new URL(typeof request === 'string' ? request : request.url, 'https://example.github.io/bin-it-right/').href
    return Promise.resolve({
      put: (request: Request | string, response: Response) => { s.set(key(request), response); return Promise.resolve() },
      match: (request: Request | string) => Promise.resolve(s.get(key(request))),
      addAll: (requests: string[]) => { for (const r of requests) s.set(key(r), new Response(`cached ${r}`)); return Promise.resolve() },
    })
  }
  const caches = {
    open,
    keys: () => Promise.resolve([...stores.keys()]),
    delete: (name: string) => Promise.resolve(stores.delete(name)),
    match: async (request: Request | string, options?: { ignoreVary?: boolean }) => {
      matchOptions.push(options)
      for (const name of stores.keys()) {
        const hit = await (await open(name)).match(request)
        if (hit !== undefined) return hit
      }
      return undefined
    },
  }
  const self = {
    location: new URL('https://example.github.io/bin-it-right/sw.js'),
    registration: { scope: 'https://example.github.io/bin-it-right/' },
    addEventListener: (type: string, handler: Handler) => { handlers.set(type, handler) },
    skipWaiting: () => Promise.resolve(),
    clients: { claim: () => Promise.resolve() },
  }
  const source = readFileSync(join(import.meta.dirname, '..', '..', 'public', 'sw.js'), 'utf8')
  runInNewContext(source, { self, caches, fetch: fetchImpl, URL, Response, Array, Promise })
  const waited: Array<Promise<unknown>> = []
  const fire = async (type: string, extra: Record<string, unknown> = {}) => {
    const waits: Array<Promise<unknown>> = []
    let responded: Promise<Response> | undefined
    handlers.get(type)?.({ ...extra, waitUntil: (p: Promise<unknown>) => { waits.push(p); waited.push(p) }, respondWith: (p: Promise<Response>) => { responded = p } })
    await Promise.all(waits)
    return responded === undefined ? undefined : await responded
  }
  return { stores, open, fire, matchOptions, waited }
}

const navigate = (url: string) => ({ url, method: 'GET', mode: 'navigate', clone: () => navigate(url) }) as unknown as Request

describe('service worker (round 2 review)', () => {
  it('leaves caches of other apps on the same origin alone', async () => {
    const worker = loadWorker(() => Promise.resolve(new Response('ok')))
    await worker.open('another-app-cache')
    await worker.open('bin-it-right-v0')
    await worker.fire('install')
    await worker.fire('activate')
    expect([...worker.stores.keys()]).toContain('another-app-cache')
    expect([...worker.stores.keys()]).not.toContain('bin-it-right-v0')
  })

  it('does not replace the saved app page with an error page', async () => {
    const worker = loadWorker(() => Promise.resolve(new Response('not found', { status: 404 })))
    await worker.fire('install')
    const request = navigate('https://example.github.io/bin-it-right/')
    const event = { request }
    await worker.fire('fetch', event)
    await new Promise((resolve) => setTimeout(resolve, 0))
    const [name] = [...worker.stores.keys()]
    const saved = await (await worker.open(name ?? '')).match('./index.html')
    expect(await saved?.text()).toBe('cached ./index.html')
  })

  it('precaches the files the page already loaded when the page asks it to', async () => {
    const worker = loadWorker(() => Promise.resolve(new Response('ok')))
    await worker.fire('install')
    await worker.fire('message', {
      data: { type: 'precache', urls: ['https://example.github.io/bin-it-right/assets/index.js', 'https://elsewhere.example/x.js'] },
    })
    const [name] = [...worker.stores.keys()]
    const cache = await worker.open(name ?? '')
    expect(await cache.match('https://example.github.io/bin-it-right/assets/index.js')).toBeDefined()
    expect(await cache.match('https://elsewhere.example/x.js')).toBeUndefined()
  })

  it('matches cached assets regardless of Vary, so precached files serve module requests offline', async () => {
    const worker = loadWorker(() => Promise.resolve(new Response('ok')))
    await worker.fire('install')
    const asset = new Request('https://example.github.io/bin-it-right/assets/index.js')
    await worker.fire('fetch', { request: asset })
    expect(worker.matchOptions).toContainEqual(expect.objectContaining({ ignoreVary: true }))
  })

  it('keeps the worker alive until each cache write finishes', async () => {
    const worker = loadWorker(() => Promise.resolve(new Response('ok')))
    await worker.fire('install')
    const before = worker.waited.length
    await worker.fire('fetch', { request: new Request('https://example.github.io/bin-it-right/assets/new.js') })
    await worker.fire('fetch', { request: navigate('https://example.github.io/bin-it-right/') })
    expect(worker.waited.length - before).toBe(2)
  })
})
