import { normalize } from './normalize'
import { damerauLevenshtein, phraseSimilarity, queryCoverage, score, tokenContainment } from './similarity'

describe('damerauLevenshtein', () => {
  it.each([
    ['', '', 0], ['', 'abc', 3], ['abc', '', 3], ['widget', 'widget', 0],
    ['widget', 'wigdet', 1], ['ab', 'ba', 1], ['kitten', 'sitting', 3],
    ['ca', 'abc', 3], ['😀a', 'a😀', 1],
  ])('distance %j to %j is %i', (a, b, expected) => {
    expect(damerauLevenshtein(a, b)).toBe(expected)
    expect(damerauLevenshtein(b, a)).toBe(expected)
  })
})

describe('similarity scores', () => {
  it('scales phrase distance and handles empty strings', () => {
    expect(phraseSimilarity('', '')).toBe(1)
    expect(phraseSimilarity('', 'widget')).toBe(0)
    expect(phraseSimilarity('widget', 'wigdet')).toBeCloseTo(5 / 6)
  })

  it('scores term coverage with a small penalty for extra query tokens', () => {
    expect(tokenContainment(['greasy', 'widget', 'box'], ['widget', 'box'])).toBeCloseTo(0.95)
    // A typo earns its similarity (5/6 for one transposition in six letters), not a full match.
    expect(tokenContainment(['greasy', 'wigdet', 'box'], ['widget', 'box'])).toBeCloseTo(((5 / 6 + 1) / 2) * 0.95)
    expect(tokenContainment(['widget'], ['widget', 'box'])).toBe(0.5)
    expect(tokenContainment(['widget', 'widget'], ['widget'])).toBe(1)
    expect(tokenContainment(['zzzzz'], ['widget'])).toBe(0)
    expect(tokenContainment([], [])).toBe(0)
    expect(tokenContainment([], ['widget'])).toBe(0)
    expect(tokenContainment(['widget'], [])).toBe(0)
  })

  it.each([
    { query: ['battery'], term: ['aa', 'battery'], expected: 1 },
    { query: ['lithium', 'battery'], term: ['used', 'lithium', 'battery'], expected: 1 },
    { query: ['batery'], term: ['aa', 'battery'], expected: 0.95 },
    { query: ['glass'], term: ['gloss'], expected: 0.95 },
    { query: ['cup'], term: ['cap'], expected: 0 },
    { query: ['aluminum', 'foil'], term: ['aluminum', 'can'], expected: 0.5 },
    { query: ['battery', 'battery'], term: ['aa', 'battery', 'battery'], expected: 1 },
    { query: ['aluminum', 'aluminum', 'foil'], term: ['aluminum', 'can', 'can'], expected: 0.5 },
    { query: ['zzzzz'], term: ['battery'], expected: 0 },
    { query: [], term: [], expected: 0 },
    { query: [], term: ['battery'], expected: 0 },
    { query: ['battery'], term: [], expected: 0 },
  ])('covers query tokens $query inside $term', ({ query, term, expected }) => {
    expect(queryCoverage(query, term)).toBe(expected)
  })

  it.each(['battery', 'lithium battery'])('scores the contained query %s as 0.85', (query) => {
    expect(score(normalize(query), normalize('used lithium battery'))).toBe(0.85)
  })

  it('uses the maximum of phrase similarity, term containment and weighted query coverage', () => {
    const query = normalize('greasy wigdet box')
    const term = normalize('widget box')
    expect(score(query, term)).toBe(Math.max(
      phraseSimilarity(query.normalized, term.normalized), tokenContainment(query.tokens, term.tokens),
      queryCoverage(query.tokens, term.tokens) * 0.85,
    ))
  })
})
