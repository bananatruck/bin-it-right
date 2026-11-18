import type { Dataset, Quote } from './schema'
import { normalizeForQuote, validateDataset } from './validate'

function fixture(): Dataset {
  const english: Quote = { sourceId: 'fixture', lang: 'en', text: 'Fictional widgets go to the test destination.' }
  const spanish: Quote = { sourceId: 'fixture', lang: 'es', text: 'Artilugio ficticio en destino ficticio.' }
  return {
    city: 'Long Beach, California', scope: english,
    contact: { email: 'fixture@example.test', phone: '000-000-0000', evidence: [english] },
    sources: [{
      id: 'fixture', url: 'https://www.longbeach.gov/fixture', title: 'Fictional test source',
      publisher: 'City of Long Beach', format: 'html', fetchedAt: '2026-11-17T00:00:00Z',
      sha256: '0'.repeat(64), snapshot: 'data/snapshots/fixture.txt',
    }],
    destinations: [{
      id: 'blue-cart', label: { en: 'Fictional destination', es: 'destino ficticio' }, action: [english], links: [],
    }],
    rules: [{
      id: 'widget', label: { en: 'widget', es: 'Artilugio ficticio' }, destination: 'blue-cart',
      evidence: [english, spanish], tips: [], terms: ['widget'], termsEs: ['artilugio ficticio'],
    }],
  }
}

const snapshot = 'Fictional widgets go to the test destination.\nArtilugio ficticio en destino ficticio.'
const readSnapshot = (path: string) => path === 'data/snapshots/fixture.txt' ? snapshot : undefined

// Mutators receive fresh inline fixture values so tests never share mutable data.
function changeRule(change: (rule: Dataset['rules'][number]) => void): Dataset {
  const dataset = fixture()
  dataset.rules.forEach(change)
  return dataset
}

describe('normalizeForQuote', () => {
  it('only folds compatibility characters, collapses whitespace and trims', () => {
    expect(normalizeForQuote('  Ｗidget\n\t  café\u00a0 X!  ')).toBe('Widget café X!')
    expect(normalizeForQuote('CAFÉ, widgets')).toBe('CAFÉ, widgets')
    expect(normalizeForQuote('e\u0301')).toBe('é')
  })
})

describe('validateDataset', () => {
  it('accepts a valid dataset with Spanish destination evidence on a targeting rule', () => {
    expect(validateDataset(fixture(), readSnapshot)).toEqual([])
  })

  it('converts Zod failures to issues without reading snapshots', () => {
    const read = vi.fn(readSnapshot)
    const issues = validateDataset({ city: 'Elsewhere' }, read)
    expect(issues.map((issue) => issue.path)).toEqual(expect.arrayContaining(['city', 'rules']))
    expect(issues.every((issue) => typeof issue.message === 'string')).toBe(true)
    expect(read).not.toHaveBeenCalled()
  })

  it('fails if any rule lacks a source', () => {
    const dataset = changeRule((rule) => { rule.evidence = [] })
    expect(validateDataset(dataset, readSnapshot)).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'rules.0.evidence' }),
    ]))
  })

  it('requires English evidence even when Spanish evidence exists', () => {
    const dataset = changeRule((rule) => { rule.evidence = rule.evidence.filter((quote) => quote.lang === 'es') })
    expect(validateDataset(dataset, readSnapshot)).toContainEqual({
      path: 'rules.0.evidence', message: 'Rule must have at least one English evidence quote',
    })
  })

  it('reports a quote not in the snapshot', () => {
    const dataset = changeRule((rule) => { rule.tips = [{ sourceId: 'fixture', lang: 'en', text: 'Invented missing quotation.' }] })
    expect(validateDataset(dataset, readSnapshot)).toContainEqual({
      path: 'rules.0.tips.0.text', message: 'Quote does not occur in snapshot "data/snapshots/fixture.txt"',
    })
  })

  it('checks quotes at every location for unknown sources', () => {
    const dataset = fixture()
    dataset.scope.sourceId = 'missing'
    // Some fixture quotes share identity. Replace each quote array explicitly.
    const missing: Quote = { sourceId: 'missing', lang: 'en', text: 'Missing source quote.' }
    dataset.contact.evidence = [missing]
    dataset.destinations.forEach((destination) => { destination.action = [missing] })
    dataset.rules.forEach((rule) => { rule.evidence = [missing]; rule.tips = [missing] })
    const paths = validateDataset(dataset, readSnapshot).map((issue) => issue.path)
    expect(paths).toEqual(expect.arrayContaining([
      'scope.sourceId', 'contact.evidence.0.sourceId', 'destinations.0.action.0.sourceId',
      'rules.0.evidence.0.sourceId', 'rules.0.tips.0.sourceId', 'sources.0.id',
    ]))
  })

  it('reports missing snapshots and caches each read', () => {
    const missing = vi.fn((): string | undefined => undefined)
    const issues = validateDataset(fixture(), missing)
    expect(issues.filter((issue) => issue.message.includes('Missing snapshot'))).toHaveLength(5)
    expect(missing).toHaveBeenCalledExactlyOnceWith('data/snapshots/fixture.txt')
  })

  it('compares quotes after NFKC and whitespace normalization only', () => {
    expect(validateDataset(fixture(), () => `  ${snapshot.replaceAll(' ', '\n\t').replace('Fictional', 'Ｆictional')}  `)).toEqual([])
    expect(validateDataset(fixture(), () => snapshot.toLowerCase()).some((issue) => issue.path === 'scope.text')).toBe(true)
  })

  it.each(['sources', 'destinations', 'rules'] satisfies Array<'sources' | 'destinations' | 'rules'>)('requires unique %s ids', (collection) => {
    const dataset = fixture()
    if (collection === 'sources') dataset.sources.push(...structuredClone(dataset.sources))
    if (collection === 'destinations') dataset.destinations.push(...structuredClone(dataset.destinations))
    if (collection === 'rules') dataset.rules.push(...structuredClone(dataset.rules))
    expect(validateDataset(dataset, readSnapshot).some((issue) =>
      issue.path === `${collection}.1.id` && issue.message.includes('Duplicate id'),
    )).toBe(true)
  })

  it('rejects a rule targeting an absent destination', () => {
    const dataset = changeRule((rule) => { rule.destination = 'no-cart' })
    expect(validateDataset(dataset, readSnapshot)).toContainEqual({ path: 'rules.0.destination', message: 'Unknown destination "no-cart"' })
  })

  it('rejects unused sources', () => {
    const dataset = fixture()
    dataset.sources.push(...dataset.sources.map((source) => ({ ...source, id: 'unused' })))
    expect(validateDataset(dataset, readSnapshot)).toContainEqual({ path: 'sources.1.id', message: 'Source "unused" is never cited' })
  })

  it('rejects normalized term collisions including labels and Spanish aliases', () => {
    const dataset = fixture()
    dataset.rules.push(...dataset.rules.map((rule) => ({
      ...rule, id: 'other', label: { en: 'other widget' }, terms: ['the WÍDGETS'], termsEs: ['Artilugios ficticios'],
    })))
    const issues = validateDataset(dataset, readSnapshot)
    expect(issues).toEqual(expect.arrayContaining([
      { path: 'rules.1.terms.0', message: 'Normalized term "widget" selects both "widget" and "other"' },
      expect.objectContaining({ path: 'rules.1.termsEs.0' }),
    ]))
    expect(validateDataset(changeRule((rule) => { rule.terms.push('WÍDGETS') }), readSnapshot)).toEqual([])
  })

  it('requires each Spanish rule label to occur in its own Spanish evidence or tips, ignoring only letter case', () => {
    // The City prints some Spanish headings in capitals ("RECICLAR"); casing is not wording.
    const recased = changeRule((rule) => { rule.label.es = 'artilugio FICTICIO' })
    expect(validateDataset(recased, readSnapshot)).toEqual([])
    const dataset = changeRule((rule) => { rule.label.es = 'artilugio ficticia' })
    expect(validateDataset(dataset, readSnapshot).some((issue) => issue.path === 'rules.0.label.es')).toBe(true)
    const tips = changeRule((rule) => {
      rule.tips = rule.evidence.filter((quote) => quote.lang === 'es')
      rule.evidence = rule.evidence.filter((quote) => quote.lang === 'en')
    })
    expect(validateDataset(tips, readSnapshot)).toEqual([])
    const englishOnly = changeRule((rule) => {
      rule.evidence = rule.evidence.map((quote) => ({ ...quote, lang: 'en' }))
    })
    expect(validateDataset(englishOnly, readSnapshot).some((issue) => issue.path === 'rules.0.label.es')).toBe(true)
  })

  it('requires Spanish destination labels in their action or a targeting rule quote', () => {
    const dataset = fixture()
    dataset.destinations.forEach((destination) => { destination.label.es = 'sin respaldo' })
    expect(validateDataset(dataset, readSnapshot).some((issue) => issue.path === 'destinations.0.label.es')).toBe(true)
    const actionOnly = fixture()
    actionOnly.destinations.forEach((destination) => {
      destination.action.push({ sourceId: 'fixture', lang: 'es', text: 'Artilugio ficticio en destino ficticio.' })
    })
    actionOnly.rules.forEach((rule) => {
      rule.label = { en: 'widget' }
      rule.evidence = rule.evidence.filter((quote) => quote.lang === 'en')
    })
    expect(validateDataset(actionOnly, readSnapshot)).toEqual([])
    const unrelated = changeRule((rule) => { rule.destination = 'no-cart' })
    expect(validateDataset(unrelated, readSnapshot).some((issue) => issue.path === 'destinations.0.label.es')).toBe(true)
  })

  it('sorts all issues by their paths', () => {
    const dataset = fixture()
    dataset.scope.sourceId = 'missing'
    dataset.rules.forEach((rule) => { rule.destination = 'no-cart'; rule.label.es = 'missing' })
    const paths = validateDataset(dataset, readSnapshot).map((issue) => issue.path)
    expect(paths).toEqual([...paths].sort())
  })
})
