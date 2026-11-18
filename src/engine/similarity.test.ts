import { normalize } from './normalize'
import { damerauLevenshtein, phraseSimilarity, score, tokenContainment } from './similarity'

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
    expect(tokenContainment(['greasy', 'wigdet', 'box'], ['widget', 'box'])).toBeCloseTo(0.95)
    expect(tokenContainment(['widget'], ['widget', 'box'])).toBe(0.5)
    expect(tokenContainment(['widget', 'widget'], ['widget'])).toBe(1)
    expect(tokenContainment(['zzzzz'], ['widget'])).toBe(0)
    expect(tokenContainment([], [])).toBe(0)
    expect(tokenContainment([], ['widget'])).toBe(0)
    expect(tokenContainment(['widget'], [])).toBe(0)
  })

  it('uses the higher of phrase similarity and token containment', () => {
    const query = normalize('greasy wigdet box')
    const term = normalize('widget box')
    expect(score(query, term)).toBe(Math.max(
      phraseSimilarity(query.normalized, term.normalized), tokenContainment(query.tokens, term.tokens),
    ))
  })
})
