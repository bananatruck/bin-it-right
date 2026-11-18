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
  const present = term.filter((token) => query.some((word) => phraseSimilarity(word, token) >= 0.8)).length
  // Term coverage times a small extra-query-token penalty:
  // present / termCount * (0.85 + 0.15 * min(1, termCount / queryCount)).
  return present / term.length * (0.85 + 0.15 * Math.min(1, term.length / query.length))
}

export function score(query: NormalizedText, term: NormalizedText): number {
  return Math.max(phraseSimilarity(query.normalized, term.normalized), tokenContainment(query.tokens, term.tokens))
}
