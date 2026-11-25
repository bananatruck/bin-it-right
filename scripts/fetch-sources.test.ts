// @vitest-environment node
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { refresh } from './fetch-sources.ts'

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>()
  return { ...actual, renameSync: vi.fn(actual.renameSync) }
})

const page = (body: string) => `<html><body><div>menu</div><p>Home »</p><p>Test</p><p>${body}</p><p>Find Us Online:</p><p>footer</p></body></html>`
const longText = 'Rule text for the test page. '.repeat(20)

describe('refresh (round 2 review)', () => {
  let root = ''
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'bir-fetch-'))
    mkdirSync(join(root, 'src', 'data'), { recursive: true })
    mkdirSync(join(root, 'data', 'snapshots'), { recursive: true })
    writeFileSync(join(root, 'src', 'data', 'sources.json'), '[]\n')
    writeFileSync(join(root, 'data', 'snapshots', 'a.txt'), 'old snapshot\n')
  })
  afterEach(() => { rmSync(root, { recursive: true, force: true }) })

  const specs = [
    { id: 'a', url: 'https://www.longbeach.gov/a/', title: 'A', format: 'html' as const },
    { id: 'b', url: 'https://www.longbeach.gov/b/', title: 'B', format: 'html' as const },
  ]

  it('writes nothing when a later source fails', async () => {
    const fetchImpl = ((url: string) =>
      Promise.resolve(url.endsWith('/a/') ? new Response(page(longText)) : new Response('gone', { status: 500 }))) as typeof fetch
    await expect(refresh({ root, specs, fetchImpl, log: () => undefined })).rejects.toThrow('b: HTTP 500')
    expect(readFileSync(join(root, 'data', 'snapshots', 'a.txt'), 'utf8')).toBe('old snapshot\n')
    expect(readFileSync(join(root, 'src', 'data', 'sources.json'), 'utf8')).toBe('[]\n')
  })

  it('writes every snapshot and the manifest together when all sources succeed', async () => {
    const fetchImpl = (() => Promise.resolve(new Response(page(longText)))) as typeof fetch
    const result = await refresh({ root, specs, fetchImpl, log: () => undefined })
    expect(result.map((entry) => entry.id)).toEqual(['a', 'b'])
    expect(existsSync(join(root, 'data', 'snapshots', 'b.txt'))).toBe(true)
    expect(readFileSync(join(root, 'data', 'snapshots', 'a.txt'), 'utf8')).toContain('URL: https://www.longbeach.gov/a/')
    expect(JSON.parse(readFileSync(join(root, 'src', 'data', 'sources.json'), 'utf8')) as unknown[]).toHaveLength(2)
  })

  it('restores the previous snapshots and manifest if publishing fails partway (round 3 review)', async () => {
    const fetchImpl = (() => Promise.resolve(new Response(page(longText)))) as typeof fetch
    const failingWrite = (path: string, data: string) => {
      if (path.includes('sources.json') && data !== '[]\n') throw new Error('disk full')
      writeFileSync(path, data)
    }
    await expect(refresh({ root, specs, fetchImpl, log: () => undefined, writeFile: failingWrite })).rejects.toThrow('disk full')
    expect(readFileSync(join(root, 'data', 'snapshots', 'a.txt'), 'utf8')).toBe('old snapshot\n')
    expect(existsSync(join(root, 'data', 'snapshots', 'b.txt'))).toBe(false)
    expect(readFileSync(join(root, 'src', 'data', 'sources.json'), 'utf8')).toBe('[]\n')
  })

  it('restores replaced snapshots and removes new files when the manifest rename fails', async () => {
    const actual = await vi.importActual<typeof import('node:fs')>('node:fs')
    vi.mocked(renameSync)
      .mockImplementationOnce(actual.renameSync)
      .mockImplementationOnce(actual.renameSync)
      .mockImplementationOnce(() => { throw new Error('manifest rename failed') })
    await expect(refresh({
      root, specs, fetchImpl: () => Promise.resolve(new Response(page(longText))), log: () => undefined,
    })).rejects.toThrow('manifest rename failed')
    expect(readFileSync(join(root, 'data', 'snapshots', 'a.txt'), 'utf8')).toBe('old snapshot\n')
    expect(existsSync(join(root, 'data', 'snapshots', 'b.txt'))).toBe(false)
    expect(readFileSync(join(root, 'src', 'data', 'sources.json'), 'utf8')).toBe('[]\n')
    expect(readdirSync(join(root, 'data', 'snapshots'))).toEqual(['a.txt'])
    expect(readdirSync(join(root, 'src', 'data'))).toEqual(['sources.json'])
  })

  it('stages every file before replacing any original (round 3 follow-up)', async () => {
    const fetchImpl = (() => Promise.resolve(new Response(page(longText)))) as typeof fetch
    const written: string[] = []
    const spyWrite = (path: string, data: string) => {
      written.push(path)
      writeFileSync(path, data)
    }
    await refresh({ root, specs, fetchImpl, log: () => undefined, writeFile: spyWrite })
    expect(written.length).toBe(3)
    expect(written.every((path) => path.endsWith('.staging'))).toBe(true)
    expect(readdirSync(join(root, 'data', 'snapshots')).filter((name) => name.endsWith('.staging'))).toEqual([])
    expect(readFileSync(join(root, 'data', 'snapshots', 'a.txt'), 'utf8')).toContain('URL: https://www.longbeach.gov/a/')
  })
})

