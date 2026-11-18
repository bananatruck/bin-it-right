export const FILLER_WORDS: ReadonlySet<string> = new Set([
  'a', 'an', 'the', 'my', 'some', 'old', 'empty', 'please',
  'un', 'una', 'unos', 'unas', 'el', 'la', 'los', 'las', 'de', 'del', 'mi', 'mis',
])

// Identity entries protect singular words from the trailing-s rule.
export const IRREGULAR_SINGULARS: ReadonlyMap<string, string> = new Map([
  ['leaves', 'leaf'], ['knives', 'knife'], ['cartones', 'carton'],
  ['glass', 'glass'], ['grass', 'grass'], ['gas', 'gas'],
  ['mattress', 'mattress'], ['lens', 'lens'], ['series', 'series'],
  ['bus', 'bus'], ['its', 'its'], ['this', 'this'],
])

// Allows one adjacent transposition in a six-letter term, but requires confirmation.
export const SUGGEST_THRESHOLD = 0.8
export const MAX_SUGGESTIONS = 5
