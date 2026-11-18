import { FILLER_WORDS, IRREGULAR_SINGULARS } from './lexicon'

export interface NormalizedText {
  original: string
  normalized: string
  tokens: string[]
  dropped: string[]
}

function singularize(token: string): string {
  const irregular = IRREGULAR_SINGULARS.get(token)
  if (irregular !== undefined) return irregular
  // Consonant + ies becomes y. Sibilant plurals lose es.
  if (/[^aeiou]ies$/.test(token)) return token.slice(0, -3) + 'y'
  if (/(?:sses|shes|ches|xes|zes)$/.test(token)) return token.slice(0, -2)
  // Other English/Spanish plurals lose only s, preserving the e in
  // envases, recortes, bottles, phones and tires. Cartones is explicit
  // in the exception map because an -ones rule would also damage phones.
  if (token.length > 2 && token.endsWith('s')) return token.slice(0, -1)
  return token
}

export function normalize(text: string): NormalizedText {
  const words = text.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(/\s+/u).filter(Boolean)
  const tokens: string[] = []
  const dropped: string[] = []
  for (const word of words) {
    if (FILLER_WORDS.has(word)) dropped.push(word)
    else tokens.push(singularize(word))
  }
  return { original: text, normalized: tokens.join(' '), tokens, dropped }
}
