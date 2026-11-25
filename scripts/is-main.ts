import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

// Node 24.0 and 24.1 lack import.meta.main. Compare the invoked path without running imports.
export function isMain(meta: { url: string }, entry = process.argv[1]): boolean {
  return entry !== undefined && entry !== '' && pathToFileURL(resolve(entry)).href === meta.url
}
