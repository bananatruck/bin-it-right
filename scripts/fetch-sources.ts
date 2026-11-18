// Fetches every official City of Long Beach page the dataset cites, then writes:
//   data/snapshots/<id>.txt   the extracted text that rule quotes are checked against
//   src/data/sources.json     the manifest: url, title, format, fetch time, sha256, snapshot path
//
// Usage: pnpm sources:fetch            (fetch all sources)
//        pnpm sources:fetch lb-paint   (fetch only the listed ids, keep the rest)
//
// PDF text extraction needs `pdftotext` from poppler-utils on PATH.
// This script talks to the live City website, so it is run by hand, never in CI.

import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { htmlToText, extractMainContent } from './extract.ts'

interface SourceSpec {
  id: string
  url: string
  title: string
  format: 'html' | 'pdf'
}

const LB = 'https://www.longbeach.gov'
const DOCS = `${LB}/globalassets/long-beach-recycles/media-library/documents`

export const SOURCES: SourceSpec[] = [
  { id: 'lb-3stream-pdf', format: 'pdf', title: 'Trash, Recycling, and Organics Guidelines (English and Spanish)', url: `${DOCS}/3-streamguidelines_remediated` },
  { id: 'lb-recycle-pdf', format: 'pdf', title: 'Recycling Guidelines (English and Spanish)', url: `${DOCS}/recycling/recycleguidelines_remediated` },
  { id: 'lb-trash-pdf', format: 'pdf', title: 'Trash Guidelines (English and Spanish)', url: `${DOCS}/refuse/trashguidelines_remediated` },
  { id: 'lb-recycling-guidelines', format: 'html', title: 'Recycling Guidelines', url: `${LB}/lbrecycles/recycling/recycling-guidelines/` },
  { id: 'lb-recycling-faqs', format: 'html', title: 'Recycling Collection FAQs', url: `${LB}/lbrecycles/recycling/recycling-collection-faqs/` },
  { id: 'lb-refuse-101', format: 'html', title: 'Refuse Collection 101', url: `${LB}/lbrecycles/refuse/curbside-collection/refuse-collection-101/` },
  { id: 'lb-green-cart', format: 'html', title: 'Residential Organics (Green Cart) Collection', url: `${LB}/lbrecycles/yard-trimmings-food-scraps/residential-yard-trimmings-and-food-scraps-collection/` },
  { id: 'lb-organics-101', format: 'html', title: 'Organics 101: Feed the Green, Not the Landfill', url: `${LB}/lbrecycles/news/organics-101-feed-the-green-not-the-landfill/` },
  { id: 'lb-hazardous-waste-101', format: 'html', title: 'Hazardous Waste 101', url: `${LB}/lbrecycles/hazardous-waste-101/` },
  { id: 'lb-hhw', format: 'html', title: 'Household Hazardous Waste', url: `${LB}/lbrecycles/hazardous-waste-101/household-hazardous-waste/` },
  { id: 'lb-ewaste', format: 'html', title: 'E-Waste', url: `${LB}/lbrecycles/hazardous-waste-101/ewaste/` },
  { id: 'lb-universal-waste', format: 'html', title: 'Universal Waste', url: `${LB}/lbrecycles/hazardous-waste-101/universal-waste/` },
  { id: 'lb-medical-waste', format: 'html', title: 'Medical Waste', url: `${LB}/lbrecycles/hazardous-waste-101/medical-waste/` },
  { id: 'lb-paint', format: 'html', title: 'Paint', url: `${LB}/lbrecycles/hazardous-waste-101/paint-use-recycling/` },
  { id: 'lb-motor-oil', format: 'html', title: 'Used Motor Oil', url: `${LB}/lbrecycles/hazardous-waste-101/used-motor-oil-recycling/` },
  { id: 'lb-tires', format: 'html', title: 'Tires', url: `${LB}/lbrecycles/hazardous-waste-101/tire-recycling/` },
  { id: 'lb-special-collection', format: 'html', title: 'Special Collection 101', url: `${LB}/lbrecycles/refuse/special-collections/special-collection-101/` },
  { id: 'lb-mattress', format: 'html', title: '24/7 Mattress Drop-Off', url: `${LB}/pw/services/247-mattress-drop-off/` },
  { id: 'lb-treecycling', format: 'html', title: 'Annual Holiday Treecycling Drop-Off Program', url: `${LB}/lbrecycles/news/2027-holiday-treecycling/` },
  { id: 'lb-donation-guide', format: 'html', title: 'Donation Guide', url: `${LB}/lbrecycles/waste-reduction/reduce-waste/donation-guide/` },
]

const defaultRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

export interface ManifestEntry extends SourceSpec {
  publisher: 'City of Long Beach'
  fetchedAt: string
  sha256: string
  snapshot: string
}

interface Fetched {
  entry: ManifestEntry
  snapshotText: string
}

export interface RefreshOptions {
  root?: string
  specs?: SourceSpec[]
  only?: ReadonlySet<string>
  fetchImpl?: typeof fetch
  log?: (line: string) => void
}

function pdfToText(path: string): string {
  return execFileSync('pdftotext', ['-raw', '-enc', 'UTF-8', path, '-'], { encoding: 'utf8' })
}

// Fetches one source into memory. The raw download goes to data/raw/ (git-ignored cache) because
// pdftotext reads from a file; nothing that the app or the tests read is written here.
async function fetchOne(spec: SourceSpec, root: string, fetchImpl: typeof fetch): Promise<Fetched> {
  const response = await fetchImpl(spec.url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; bin-it-right source fetcher)' },
    redirect: 'follow',
  })
  if (!response.ok) throw new Error(`${spec.id}: HTTP ${String(response.status)} for ${spec.url}`)
  const bytes = Buffer.from(await response.arrayBuffer())
  const fetchedAt = new Date().toISOString()
  const sha256 = createHash('sha256').update(bytes).digest('hex')

  let text: string
  if (spec.format === 'pdf') {
    if (!bytes.subarray(0, 5).toString('latin1').startsWith('%PDF')) {
      throw new Error(`${spec.id}: expected a PDF, got something else`)
    }
    const rawPath = join(root, 'data', 'raw', `${spec.id}.pdf`)
    writeFileSync(rawPath, bytes)
    text = pdfToText(rawPath)
  } else {
    text = extractMainContent(htmlToText(bytes.toString('utf8')))
    if (text.length < 200) throw new Error(`${spec.id}: main content not found`)
  }

  const header = [
    `Source: ${spec.title}`,
    `URL: ${spec.url}`,
    `Publisher: City of Long Beach`,
    `Fetched: ${fetchedAt}`,
    `SHA-256 of raw ${spec.format.toUpperCase()}: ${sha256}`,
    '---',
  ].join('\n')
  const snapshot = `data/snapshots/${spec.id}.txt`
  return {
    entry: { ...spec, publisher: 'City of Long Beach', fetchedAt, sha256, snapshot },
    snapshotText: `${header}\n${text.trim()}\n`,
  }
}

// Fetches every source first and writes snapshots and the manifest only if all of them succeeded,
// so a failure halfway never leaves new snapshots next to an old manifest.
export async function refresh(options: RefreshOptions = {}): Promise<ManifestEntry[]> {
  const root = options.root ?? defaultRoot
  const specs = options.specs ?? SOURCES
  const only = options.only ?? new Set<string>()
  const fetchImpl = options.fetchImpl ?? fetch
  const log = options.log ?? ((line: string) => { console.log(line) })
  const manifestPath = join(root, 'src', 'data', 'sources.json')
  mkdirSync(join(root, 'data', 'snapshots'), { recursive: true })
  mkdirSync(join(root, 'data', 'raw'), { recursive: true })
  const previous: ManifestEntry[] = existsSync(manifestPath)
    ? (JSON.parse(readFileSync(manifestPath, 'utf8')) as ManifestEntry[])
    : []

  const result: ManifestEntry[] = []
  const pending: Fetched[] = []
  for (const spec of specs) {
    const kept = previous.find((entry) => entry.id === spec.id)
    if (only.size > 0 && !only.has(spec.id) && kept) {
      result.push(kept)
      continue
    }
    const fetched = await fetchOne(spec, root, fetchImpl)
    log(`fetched ${fetched.entry.id} ${fetched.entry.sha256.slice(0, 12)} ${fetched.entry.url}`)
    pending.push(fetched)
    result.push(fetched.entry)
  }

  for (const fetched of pending) writeFileSync(join(root, fetched.entry.snapshot), fetched.snapshotText)
  writeFileSync(manifestPath, `${JSON.stringify(result, null, 2)}\n`)
  log(`wrote ${String(result.length)} sources to src/data/sources.json`)
  return result
}

if (import.meta.main) {
  await refresh({ only: new Set(process.argv.slice(2)) })
}
