import type { Dataset, Destination, Rule } from '../data/schema'
import { MAX_SUGGESTIONS, SUGGEST_THRESHOLD } from './lexicon'
import { normalize } from './normalize'
import type { NormalizedText } from './normalize'
import { score } from './similarity'

export interface Candidate {
  term: string
  ruleId: string
  score: number
}

export interface Explanation {
  query: string
  normalized: string
  dropped: string[]
  threshold: number
  matchedTerm?: string
  candidates: Candidate[]
}

export interface Suggestion {
  rule: Rule
  destination: Destination
  term: string
  score: number
}

export type SearchResult =
  | { kind: 'answer'; rule: Rule; destination: Destination; matchedTerm: string; explanation: Explanation }
  | { kind: 'suggestions'; suggestions: Suggestion[]; explanation: Explanation }
  | { kind: 'none'; explanation: Explanation }

interface IndexedTerm {
  term: string
  rule: Rule
  normalized: NormalizedText
}

// UTF-16 lexical ordering avoids host locale differences.
function alphabetical(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

export function createMatcher(dataset: Dataset) {
  const destinations = new Map(dataset.destinations.map((destination) => [destination.id, destination]))
  function destinationFor(rule: Rule): Destination {
    const destination = destinations.get(rule.destination)
    if (destination === undefined) throw new Error(`Unknown destination "${rule.destination}" for rule "${rule.id}"`)
    return destination
  }

  const index = new Map<string, IndexedTerm>()
  for (const rule of dataset.rules) {
    destinationFor(rule)
    const terms = [...rule.terms, ...rule.termsEs, rule.label.en]
    if (rule.label.es !== undefined) terms.push(rule.label.es)
    for (const term of terms) {
      const normalized = normalize(term)
      if (!normalized.normalized) continue
      const existing = index.get(normalized.normalized)
      if (existing !== undefined && existing.rule.id !== rule.id) {
        throw new Error(`Term "${normalized.normalized}" selects both "${existing.rule.id}" and "${rule.id}"`)
      }
      if (existing === undefined || alphabetical(term, existing.term) < 0) {
        index.set(normalized.normalized, { term, rule, normalized })
      }
    }
  }

  function search(query: string): SearchResult {
    const normalized = normalize(query)
    const explanation: Explanation = {
      query, normalized: normalized.normalized, dropped: normalized.dropped,
      threshold: SUGGEST_THRESHOLD, candidates: [],
    }
    if (!normalized.normalized) return { kind: 'none', explanation }
    const ranked = [...index.values()].map((entry) => ({ ...entry, score: score(normalized, entry.normalized) }))
      .sort((a, b) => b.score - a.score || alphabetical(a.term, b.term) || alphabetical(a.rule.id, b.rule.id))
    explanation.candidates = ranked.slice(0, 5).map((entry) => ({
      term: entry.term, ruleId: entry.rule.id, score: Math.round(entry.score * 1000) / 1000,
    }))
    const exact = index.get(normalized.normalized)
    if (exact !== undefined) {
      return {
        kind: 'answer', rule: exact.rule, destination: destinationFor(exact.rule), matchedTerm: exact.term,
        explanation: { ...explanation, matchedTerm: exact.term },
      }
    }
    const seen = new Set<string>()
    const suggestions: Suggestion[] = []
    for (const entry of ranked) {
      if (entry.score < SUGGEST_THRESHOLD || seen.has(entry.rule.id)) continue
      seen.add(entry.rule.id)
      suggestions.push({ rule: entry.rule, destination: destinationFor(entry.rule), term: entry.term, score: entry.score })
      if (suggestions.length === MAX_SUGGESTIONS) break
    }
    return suggestions.length ? { kind: 'suggestions', suggestions, explanation } : { kind: 'none', explanation }
  }

  function autocomplete(prefix: string, limit = 8): Array<{ rule: Rule; term: string }> {
    const normalized = normalize(prefix).normalized
    if (!normalized || limit < 1 || !Number.isFinite(limit)) return []
    const entries = [...index.values()].map((entry) => ({
      ...entry,
      group: entry.normalized.normalized.startsWith(normalized) ? 0 : 1,
    })).filter((entry) => entry.group === 0 || entry.normalized.tokens.some((token) => token.startsWith(normalized)))
      .sort((a, b) => a.group - b.group || alphabetical(a.term, b.term) || alphabetical(a.rule.id, b.rule.id))
    const seen = new Set<string>()
    const results: Array<{ rule: Rule; term: string }> = []
    for (const entry of entries) {
      if (seen.has(entry.rule.id)) continue
      seen.add(entry.rule.id)
      results.push({ rule: entry.rule, term: entry.term })
      if (results.length >= Math.floor(limit)) break
    }
    return results
  }

  return { search, autocomplete, destinationFor, rules: dataset.rules, destinations: dataset.destinations }
}

export type Matcher = ReturnType<typeof createMatcher>
