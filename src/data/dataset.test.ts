// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createMatcher } from '@/engine'
import { dataset, rawDataset } from './index'
import { DatasetSchema } from './schema'
import { validateDataset } from './validate'

const root = join(import.meta.dirname, '..', '..')
const readSnapshot = (path: string): string | undefined => {
  const full = join(root, path)
  return existsSync(full) ? readFileSync(full, 'utf8') : undefined
}

function clone(): { rules: Array<Record<string, unknown>> } & Record<string, unknown> {
  return structuredClone(rawDataset) as { rules: Array<Record<string, unknown>> } & Record<string, unknown>
}

describe('the real Long Beach dataset', () => {
  it('passes every provenance check against the saved City pages', () => {
    expect(validateDataset(rawDataset, readSnapshot)).toEqual([])
  })

  it('parses to exactly the raw JSON, so the app can use it without runtime parsing', () => {
    expect(DatasetSchema.parse(rawDataset)).toEqual(rawDataset)
  })

  it('fails if any rule lacks a source', () => {
    for (let i = 0; i < dataset.rules.length; i++) {
      const broken = clone()
      const rule = broken.rules[i]
      if (rule === undefined) throw new Error('rule index out of range')
      rule.evidence = []
      const issues = validateDataset(broken, readSnapshot)
      expect(issues.some((issue) => issue.path.startsWith(`rules.${i}.evidence`))).toBe(true)
    }
  })

  it('fails if any quote is changed by a single word', () => {
    const broken = clone()
    const rule = broken.rules[0] as { evidence: Array<{ text: string }> }
    const first = rule.evidence[0]
    if (first === undefined) throw new Error('first rule has no evidence')
    first.text = `${first.text} always`
    expect(validateDataset(broken, readSnapshot).map((issue) => issue.path)).toContain('rules.0.evidence.0.text')
  })

  it('cites only official www.longbeach.gov pages, each fetched and hashed', () => {
    for (const source of dataset.sources) {
      expect(new URL(source.url).hostname).toBe('www.longbeach.gov')
      expect(Number.isNaN(Date.parse(source.fetchedAt))).toBe(false)
      expect(source.sha256).toMatch(/^[0-9a-f]{64}$/)
      const snapshot = readSnapshot(source.snapshot)
      expect(snapshot).toBeDefined()
      expect(snapshot).toContain(`URL: ${source.url}`)
      expect(snapshot).toContain(`SHA-256 of raw ${source.format.toUpperCase()}: ${source.sha256}`)
    }
  })

  it('shows no "Month D, YYYY" date that had already passed when its page was saved', () => {
    // The City's own "Upcoming Dates" lists can keep past events; the app must not present them as upcoming.
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const pattern = new RegExp(`\\b(${months.join('|')}) (\\d{1,2}), (\\d{4})\\b`, 'g')
    const quotes = [...dataset.destinations.flatMap((d) => d.action), ...dataset.rules.flatMap((r) => [...r.evidence, ...r.tips])]
    const stale: string[] = []
    for (const quote of quotes) {
      const source = dataset.sources.find((s) => s.id === quote.sourceId)
      if (source === undefined) continue
      // The Pacific-time date, as the app shows it.
      const saved = new Date(source.fetchedAt).toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })
      for (const match of quote.text.matchAll(pattern)) {
        const [, month = '', day = '', year = ''] = match
        const iso = `${year}-${String(months.indexOf(month) + 1).padStart(2, '0')}-${day.padStart(2, '0')}`
        if (iso < saved) stale.push(`${match[0]} in ${quote.sourceId} (saved ${saved})`)
      }
    }
    expect(stale).toEqual([])
  })

  describe('keeps the conditions the City attaches to a destination (round 2 review)', () => {
    const rule = (id: string) => {
      const found = dataset.rules.find((entry) => entry.id === id)
      if (found === undefined) throw new Error(`missing rule ${id}`)
      return found
    }
    const destination = (id: string) => {
      const found = dataset.destinations.find((entry) => entry.id === id)
      if (found === undefined) throw new Error(`missing destination ${id}`)
      return found
    }
    const texts = (quotes: ReadonlyArray<{ text: string }>) => quotes.map((quote) => quote.text).join(' ')

    it('sends fluorescent bulbs to the retail locations, not the battery drop-off address', () => {
      const bulbs = destination(rule('fluorescent-bulbs').destination)
      expect(texts(bulbs.action)).not.toContain('2929 E. Willow')
      expect(texts(bulbs.action)).toContain('Home Depot accepts compact fluorescent bulbs')
    })

    it('says used motor oil must be in the containers provided', () => {
      expect(texts(rule('used-motor-oil-filters').tips)).toContain('MUST be in the containers provided')
    })

    it('gives the tire drop-off days with the hours', () => {
      expect(texts(rule('tires').tips)).toContain('every 2nd and 4th* Saturday of the month')
    })
  })

  describe('round 3 review', () => {
    const texts = (quotes: ReadonlyArray<{ text: string }>) => quotes.map((quote) => quote.text).join(' ')

    it('shows the HHW transport limit on every household hazardous waste answer', () => {
      const hhw = dataset.destinations.find((entry) => entry.id === 'hazardous-dropoff')
      expect(texts(hhw?.action ?? [])).toContain('15 gallons or 125 pounds of HHW')
    })

    it('gives the 6 a.m. cutoff for the one-time tree pickup', () => {
      const trees = dataset.rules.find((entry) => entry.id === 'holiday-trees')
      expect(texts(trees?.tips ?? [])).toContain('by 6 a.m. on Jan. 9')
    })

    it('spells Spanish search terms with their accents, since suggestions show them', () => {
      const unaccented = ['arbol', 'articulo', 'bateria', 'electronica', 'plastico', 'cafe', 'carton', 'cascara', 'platano', 'ceramica',
        'cesped', 'colchon', 'construccion', 'electrodomestico', 'jardin', 'neumatico', 'periodico', 'quimicos', 'sillon', 'sofa',
        'telefono', 'television', 'tocon']
      const words = dataset.rules.flatMap((rule) => rule.termsEs).flatMap((term) => term.split(' '))
      expect(words.filter((word) => unaccented.includes(word))).toEqual([])
    })
  })

  it('builds a matcher with no term claimed by two rules', () => {
    expect(() => createMatcher(dataset)).not.toThrow()
  })

  // Exhaustive: one full search per listed term, so it gets a longer timeout than the default.
  it('answers every listed term exactly, with the rule that lists it', { timeout: 60_000 }, () => {
    const matcher = createMatcher(dataset)
    for (const rule of dataset.rules) {
      for (const term of [...rule.terms, ...rule.termsEs]) {
        const result = matcher.search(term)
        expect(result.kind, term).toBe('answer')
        if (result.kind === 'answer') expect(result.rule.id, term).toBe(rule.id)
      }
    }
  })
})
