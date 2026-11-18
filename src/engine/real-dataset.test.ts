import { dataset } from '@/data'
import { createMatcher } from './match'

const matcher = createMatcher(dataset)

describe('searching parts of terms in the real dataset', () => {
  it.each([
    { query: 'battery', ids: ['household-batteries', 'lithium-batteries'] },
    { query: 'glass', ids: ['glass-bottles-jars', 'ceramics-broken-glass', 'large-glass-items'] },
    { query: 'bottle', ids: ['plastic-bottles-jugs-tubs', 'glass-bottles-jars'] },
    { query: 'cup', ids: ['plastic-lined-cups-plates-containers', 'plastic-foam-compostable-foodware'] },
  ])('suggests all relevant rules for $query', ({ query, ids }) => {
    const result = matcher.search(query)
    expect(result.kind).toBe('suggestions')
    if (result.kind !== 'suggestions') throw new Error('Expected suggestions')
    expect(result.suggestions.map(({ rule }) => rule.id)).toEqual(expect.arrayContaining(ids))
    expect(matcher.search(query)).toEqual(result)
    const reversed = createMatcher({ ...dataset, rules: [...dataset.rules].reverse() })
    expect(reversed.search(query)).toEqual(result)
  })

  it('ranks rules that contain the exact word above typo-tolerant matches', () => {
    // "glass" is one letter from "grass"; glass rules must come first.
    const result = matcher.search('glass')
    if (result.kind !== 'suggestions') throw new Error('Expected suggestions')
    const ids = result.suggestions.map(({ rule }) => rule.id)
    const grass = ids.indexOf('grass-clippings')
    for (const id of ['glass-bottles-jars', 'ceramics-broken-glass', 'large-glass-items']) {
      expect(grass === -1 || ids.indexOf(id) < grass, `${id} before grass-clippings in ${ids.join(', ')}`).toBe(true)
    }
  })

  it.each(['glas jar', 'glas', 'glas bottle'])('suggests glass bottles and jars for the typo %j, which singularisation would otherwise break', (query) => {
    const result = matcher.search(query)
    expect(result.kind).toBe('suggestions')
    if (result.kind !== 'suggestions') throw new Error('Expected suggestions')
    expect(result.suggestions.map(({ rule }) => rule.id)).toContain('glass-bottles-jars')
  })

  it.each(['aluminum foil', 'xyzzy', ''])('returns none for %j', (query) => {
    expect(matcher.search(query).kind).toBe('none')
  })

  it('answers pizza box exactly', () => {
    expect(matcher.search('pizza box')).toMatchObject({ kind: 'answer', rule: { id: 'food-soiled-paper' } })
  })

  it('answers the listed term greasy pizza box exactly', () => {
    expect(matcher.search('greasy pizza box')).toMatchObject({ kind: 'answer', rule: { id: 'food-soiled-paper' } })
  })

  it('suggests food-soiled paper first for an extended pizza box query', () => {
    const result = matcher.search('very greasy pizza box')
    expect(result.kind).toBe('suggestions')
    if (result.kind !== 'suggestions') throw new Error('Expected suggestions')
    expect(result.suggestions[0]?.rule.id).toBe('food-soiled-paper')
  })

  it('naturally suggests battery rules for batery without returning an answer', () => {
    const result = matcher.search('batery')
    expect(result.kind).toBe('suggestions')
    if (result.kind !== 'suggestions') throw new Error('Expected suggestions')
    expect(result.suggestions.map(({ rule }) => rule.id)).toEqual(['household-batteries', 'lithium-batteries'])
  })
})
