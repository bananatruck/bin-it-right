import type { NormalizedText } from './normalize'

// Optimal string alignment allows an adjacent pair to transpose once.
export function damerauLevenshtein(a: string, b: string): number {
  const left = Array.from(a)
  const right = Array.from(b)
  let previous = Array.from({ length: right.length + 1 }, (_, i) => i)
  let beforePrevious: number[] = []
  for (let i = 1; i <= left.length; i++) {
    const current = [i]
    let last = i
    for (let j = 1; j <= right.length; j++) {
      const substitution = left[i - 1] === right[j - 1] ? 0 : 1
      last = Math.min(
        (previous[j] ?? Infinity) + 1,
        last + 1,
        (previous[j - 1] ?? Infinity) + substitution,
      )
      if (i > 1 && j > 1 && left[i - 1] === right[j - 2] && left[i - 2] === right[j - 1]) {
        last = Math.min(last, (beforePrevious[j - 2] ?? Infinity) + 1)
      }
      current.push(last)
    }
    beforePrevious = previous
    previous = current
  }
  return previous[right.length] ?? left.length
}

export function phraseSimilarity(a: string, b: string): number {
  const length = Math.max(Array.from(a).length, Array.from(b).length)
  return length === 0 ? 1 : 1 - damerauLevenshtein(a, b) / length
}

export function tokenContainment(queryTokens: readonly string[], termTokens: readonly string[]): number {
  const query = [...new Set(queryTokens)]
  const term = [...new Set(termTokens)]
  if (query.length === 0 || term.length === 0) return 0
  // Each term token earns its best similarity to a query word, if that is at least 0.8.
  // An exact word earns 1, so a typo ("glass" for "grass") never scores like the real word.
  let present = 0
  for (const token of term) {
    const best = Math.max(...query.map((word) => phraseSimilarity(word, token)))
    if (best >= 0.8) present += best
  }
  // Term coverage times a small extra-query-token penalty:
  // present / termCount * (0.85 + 0.15 * min(1, termCount / queryCount)).
  return present / term.length * (0.85 + 0.15 * Math.min(1, term.length / query.length))
}

export function queryCoverage(queryTokens: readonly string[], termTokens: readonly string[]): number {
  const query = [...new Set(queryTokens)]
  if (query.length === 0 || termTokens.length === 0) return 0
  // An exact word counts 1; a typo-tolerant word (similarity >= 0.8) counts 0.95,
  // so "glass" ranks glass rules above "grass" while "batery" still finds batteries.
  let present = 0
  for (const word of query) {
    if (termTokens.includes(word)) present += 1
    else if (termTokens.some((token) => phraseSimilarity(word, token) >= 0.8)) present += 0.95
  }
  return present / query.length
}

export function score(query: NormalizedText, term: NormalizedText): number {
  // max(phraseSimilarity, tokenContainment, 0.85 * queryCoverage).
  // Complete query coverage clears the suggestion threshold; only exact normalized matches answer.
  return Math.max(
    phraseSimilarity(query.normalized, term.normalized),
    tokenContainment(query.tokens, term.tokens),
    0.85 * queryCoverage(query.tokens, term.tokens),
  )
}
