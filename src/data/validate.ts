import { normalize } from '../engine/normalize'
import { DatasetSchema } from './schema'
import type { Quote } from './schema'

export interface ValidationIssue {
  path: string
  message: string
}

export function normalizeForQuote(text: string): string {
  return text.normalize('NFKC').replace(/\s+/gu, ' ').trim()
}

// Snapshots start with a generated header (source, URL, fetch time, hash) ending in a "---" line.
// Quotes are checked against the City's text below it, never against the header.
export function snapshotBody(snapshot: string): string {
  const lines = snapshot.split(/\r?\n/u)
  const separator = lines.indexOf('---')
  return separator === -1 ? snapshot : lines.slice(separator + 1).join('\n')
}

export function validateDataset(
  raw: unknown,
  readSnapshot: (path: string) => string | undefined,
): ValidationIssue[] {
  const parsed = DatasetSchema.safeParse(raw)
  const issues: ValidationIssue[] = []
  const add = (path: string, message: string) => { issues.push({ path, message }) }
  const sorted = () => issues.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0)
  if (!parsed.success) {
    for (const issue of parsed.error.issues) add(issue.path.map(String).join('.'), issue.message)
    return sorted()
  }
  const dataset = parsed.data
  for (const [name, entries] of [
    ['sources', dataset.sources], ['destinations', dataset.destinations], ['rules', dataset.rules],
  ] satisfies Array<[string, Array<{ id: string }>]>) {
    const seen = new Set<string>()
    entries.forEach((entry, i) => {
      if (seen.has(entry.id)) add(`${name}.${i}.id`, `Duplicate id "${entry.id}"`)
      seen.add(entry.id)
    })
  }

  const sources = new Map(dataset.sources.map((source) => [source.id, source]))
  const cited = new Set<string>()
  const snapshots = new Map<string, string | undefined>()
  const quotes: Array<{ quote: Quote; path: string }> = [{ quote: dataset.scope, path: 'scope' }]
  function collect(entries: Quote[], path: string) {
    entries.forEach((quote, i) => quotes.push({ quote, path: `${path}.${i}` }))
  }
  collect(dataset.contact.evidence, 'contact.evidence')
  dataset.destinations.forEach((destination, i) => { collect(destination.action, `destinations.${i}.action`) })
  dataset.rules.forEach((rule, i) => {
    collect(rule.evidence, `rules.${i}.evidence`)
    collect(rule.tips, `rules.${i}.tips`)
  })
  for (const { quote, path } of quotes) {
    const source = sources.get(quote.sourceId)
    if (source === undefined) {
      add(`${path}.sourceId`, `Unknown source "${quote.sourceId}"`)
      continue
    }
    cited.add(source.id)
    if (!snapshots.has(source.snapshot)) {
      const snapshot = readSnapshot(source.snapshot)
      snapshots.set(source.snapshot, snapshot === undefined ? undefined : normalizeForQuote(snapshotBody(snapshot)))
    }
    const snapshot = snapshots.get(source.snapshot)
    const text = normalizeForQuote(quote.text)
    // Evidence must contain City text after whitespace folding, never an empty substring.
    if (text === '') add(`${path}.text`, 'Quote must contain non-whitespace text')
    if (snapshot === undefined) add(`${path}.text`, `Missing snapshot "${source.snapshot}"`)
    else if (text !== '' && !snapshot.includes(text)) {
      add(`${path}.text`, `Quote does not occur in snapshot "${source.snapshot}"`)
    }
  }

  // Letter case is ignored because the City prints some Spanish headings in capitals ("RECICLAR").
  const caseless = (text: string) => normalizeForQuote(text).toLocaleLowerCase('es')
  function checkSpanish(label: string | undefined, evidence: Quote[], path: string) {
    if (label !== undefined && !evidence.some((quote) =>
      quote.lang === 'es' && caseless(quote.text).includes(caseless(label)),
    )) add(path, `Spanish label "${label}" is not contained in a Spanish quote`)
  }
  const destinations = new Set(dataset.destinations.map((destination) => destination.id))
  const terms = new Map<string, string>()
  dataset.rules.forEach((rule, i) => {
    if (!rule.evidence.some((quote) => quote.lang === 'en' && normalizeForQuote(quote.text) !== '')) {
      add(`rules.${i}.evidence`, 'Rule must have at least one English evidence quote')
    }
    if (!destinations.has(rule.destination)) add(`rules.${i}.destination`, `Unknown destination "${rule.destination}"`)
    checkSpanish(rule.label.es, [...rule.evidence, ...rule.tips], `rules.${i}.label.es`)
    const entries = [
      ...rule.terms.map((term, j) => ({ term, path: `rules.${i}.terms.${j}` })),
      ...rule.termsEs.map((term, j) => ({ term, path: `rules.${i}.termsEs.${j}` })),
      { term: rule.label.en, path: `rules.${i}.label.en` },
    ]
    if (rule.label.es !== undefined) entries.push({ term: rule.label.es, path: `rules.${i}.label.es` })
    for (const { term, path } of entries) {
      const normalized = normalize(term).normalized
      if (!normalized) continue
      const owner = terms.get(normalized)
      if (owner !== undefined && owner !== rule.id) {
        add(path, `Normalized term "${normalized}" selects both "${owner}" and "${rule.id}"`)
      } else terms.set(normalized, rule.id)
    }
  })
  dataset.destinations.forEach((destination, i) => {
    const ruleQuotes = dataset.rules.filter((rule) => rule.destination === destination.id)
      .flatMap((rule) => [...rule.evidence, ...rule.tips])
    checkSpanish(destination.label.es, [...destination.action, ...ruleQuotes], `destinations.${i}.label.es`)
  })
  dataset.sources.forEach((source, i) => {
    if (!cited.has(source.id)) add(`sources.${i}.id`, `Source "${source.id}" is never cited`)
  })
  return sorted()
}
