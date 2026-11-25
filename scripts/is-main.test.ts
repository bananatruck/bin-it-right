// @vitest-environment node
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'
import { isMain } from './is-main.ts'

describe('script entrypoints', () => {
  it('runs a directly invoked script when import.meta.main is unavailable', () => {
    const url = pathToFileURL(resolve('scripts/fetch-sources.ts')).href
    expect(isMain({ url }, 'scripts/fetch-sources.ts')).toBe(true)
    expect(isMain({ url }, resolve('scripts/fetch-sources.ts'))).toBe(true)
  })

  it('keeps imported helpers safe and handles a process without an entrypoint', () => {
    const url = pathToFileURL(resolve('scripts/record-demo.ts')).href
    expect(isMain({ url }, 'scripts/record-demo.test.ts')).toBe(false)
    expect(isMain({ url }, '')).toBe(false)
  })
})
