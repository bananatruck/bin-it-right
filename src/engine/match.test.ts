import type { Dataset, Rule } from '../data/schema'
import { createMatcher, MAX_SUGGESTIONS, SUGGEST_THRESHOLD } from './index'

function rule(id: string, terms: string[] = [id]): Rule {
  return {
    id, label: { en: id }, destination: 'blue-cart', terms, termsEs: [], tips: [],
    evidence: [{ sourceId: 'fixture', lang: 'en', text: 'Fictional widget instruction.' }],
  }
}

function fixture(rules: Rule[] = [
  { ...rule('widget'), terms: ['widget', 'widget unit'], termsEs: ['artilugio'], label: { en: 'widget', es: 'aparato' } },
  rule('gadget'),
]): Dataset {
  const evidence = { sourceId: 'fixture', lang: 'en', text: 'Fictional widget instruction.' } satisfies Dataset['scope']
  return {
    city: 'Long Beach, California', scope: evidence,
    contact: { email: 'fixture@example.test', phone: '000-000-0000', evidence: [evidence] },
    sources: [{
      id: 'fixture', url: 'https://www.longbeach.gov/fixture', title: 'Fictional test source',
      publisher: 'City of Long Beach', format: 'html', fetchedAt: '2026-11-17T00:00:00Z',
      sha256: '0'.repeat(64), snapshot: 'data/snapshots/fixture.txt',
    }],
    destinations: [{ id: 'blue-cart', label: { en: 'Fictional destination' }, action: [evidence], links: [] }],
    rules,
  }
}

describe('createMatcher', () => {
  it.each(['widget', 'the old WÍDGETS!', 'artilugios', 'aparatos'])('answers exact normalized query %s', (query) => {
    const dataset = fixture()
    const matcher = createMatcher(dataset)
    const result = matcher.search(query)
    expect(result.kind).toBe('answer')
    if (result.kind !== 'answer') throw new Error('Expected an exact answer')
    expect(result.rule.id).toBe('widget')
    expect(result.destination.id).toBe('blue-cart')
    expect(result.explanation.matchedTerm).toBe(result.matchedTerm)
    expect(matcher.rules).toBe(dataset.rules)
    expect(matcher.destinations).toBe(dataset.destinations)
    expect(matcher.destinationFor(result.rule)).toBe(result.destination)
  })

  it('indexes each English and Spanish label and term', () => {
    const entry = {
      ...rule('fixture-rule', ['widget alias']), termsEs: ['artilugio alias'],
      label: { en: 'widget label', es: 'artilugio etiqueta' },
    }
    const matcher = createMatcher(fixture([entry]))
    for (const term of [...entry.terms, ...entry.termsEs, entry.label.en, entry.label.es]) {
      expect(matcher.search(term).kind).toBe('answer')
    }
  })

  it('returns suggestions for typos and token containment, never an answer', () => {
    const matcher = createMatcher(fixture())
    for (const query of ['wigdet', 'greasy wigdet unit']) {
      const result = matcher.search(query)
      expect(result.kind).toBe('suggestions')
      if (result.kind !== 'suggestions') throw new Error('Expected suggestions')
      expect(result.suggestions[0]?.rule.id).toBe('widget')
      expect(result.suggestions.every((item) => item.score >= SUGGEST_THRESHOLD)).toBe(true)
      expect(new Set(result.suggestions.map((item) => item.rule.id)).size).toBe(result.suggestions.length)
      for (const suggestion of result.suggestions) expect(matcher.search(suggestion.term).kind).toBe('answer')
    }
  })

  it.each(['qzxv jkkk', '', '   ', 'the old empty', 'el la mi'])('returns none for %j', (query) => {
    expect(createMatcher(fixture()).search(query).kind).toBe('none')
  })

  it('reports normalization and rounded top candidates even below threshold', () => {
    const matcher = createMatcher(fixture())
    const result = matcher.search('the qzxv jkkk')
    expect(result.explanation).toMatchObject({
      query: 'the qzxv jkkk', normalized: 'qzxv jkkk', dropped: ['the'], threshold: SUGGEST_THRESHOLD,
    })
    expect(result.explanation.candidates).toHaveLength(5)
    for (const candidate of result.explanation.candidates) {
      expect(candidate.score).toBeLessThan(SUGGEST_THRESHOLD)
      expect(candidate.score).toBe(Number(candidate.score.toFixed(3)))
    }
    expect(matcher.search('the').explanation.candidates).toEqual([])
    expect(matcher.search('the WÍDGETS').explanation).toMatchObject({
      normalized: 'widget', dropped: ['the'], matchedTerm: 'widget',
    })
    expect(matcher.search('gagt').explanation.candidates).toContainEqual({ term: 'gadget', ruleId: 'gadget', score: 0.667 })
  })

  it('keeps surface aliases for fuzzy scores while sharing an exact normalized key', () => {
    const matcher = createMatcher(fixture([rule('box', ['box', 'boxes'])]))
    for (const query of ['box', 'boxes']) {
      expect(matcher.search(query)).toMatchObject({ kind: 'answer', rule: { id: 'box' } })
    }
    const result = matcher.search('boxse')
    expect(result).toMatchObject({ kind: 'suggestions', suggestions: [{ rule: { id: 'box' }, term: 'boxes' }] })
    if (result.kind === 'suggestions') expect(result.suggestions[0]?.score).toBeGreaterThanOrEqual(SUGGEST_THRESHOLD)
  })

  it('keeps surface phrase and token prefixes visible through plural endings', () => {
    const matcher = createMatcher(fixture([rule('batteries'), rule('household batteries')]))
    for (const prefix of ['batteri', 'batterie', 'batteries']) {
      expect(matcher.autocomplete(prefix).map((entry) => entry.rule.id)).toEqual(['batteries', 'household batteries'])
    }
    expect(matcher.autocomplete('household batteri').map((entry) => entry.rule.id)).toEqual(['household batteries'])
    const aliases = createMatcher(fixture([rule('box', ['box', 'boxes'])]))
    expect(aliases.autocomplete('boxe')).toEqual([{ rule: expect.objectContaining({ id: 'box' }), term: 'boxes' }])
    expect(aliases.autocomplete('box')).toHaveLength(1)
  })

  it('throws with both rule ids and the normalized colliding term', () => {
    expect(() => createMatcher(fixture([
      rule('first', ['the widgets']), rule('second', ['WÍDGET']),
    ]))).toThrow('Term "widget" selects both "first" and "second"')
  })

  it('detects label collisions with Spanish terms', () => {
    expect(() => createMatcher(fixture([
      { ...rule('widget'), termsEs: ['gádgets'] }, rule('gadget'),
    ]))).toThrow('Term "gadget" selects both "widget" and "gadget"')
  })

  it('ignores empty normalized aliases and accepts repeated aliases on one rule', () => {
    const matcher = createMatcher(fixture([rule('widget', ['the', 'widget', 'widgets'])]))
    expect(matcher.search('widget').kind).toBe('answer')
    expect(matcher.search('the').kind).toBe('none')
  })

  it('keeps tied suggestions alphabetical and capped, regardless of input order', () => {
    const entries = ['f', 'd', 'b', 'e', 'a', 'c'].map((letter) => rule(`widget-${letter}`, [`widget ${letter}`]))
    const first = createMatcher(fixture(entries)).search('greasy widget a b c d e f')
    const second = createMatcher(fixture([...entries].reverse())).search('greasy widget a b c d e f')
    expect(first).toEqual(second)
    if (first.kind !== 'suggestions') throw new Error('Expected suggestions')
    expect(first.suggestions).toHaveLength(MAX_SUGGESTIONS)
    const terms = first.suggestions.map((entry) => entry.term)
    expect(terms).toEqual([...terms].sort())
    expect(first.explanation.candidates).toHaveLength(5)
  })

  it('orders autocomplete by phrase prefix, then word prefix, alphabetically per group', () => {
    const matcher = createMatcher(fixture([
      rule('zinc', ['widget zebra']), rule('alpine', ['alpha widget']),
      rule('birch', ['widget alpha', 'widget alternate']), rule('cedar', ['beta widget']),
    ]))
    const expected = ['widget alpha', 'widget zebra', 'alpha widget', 'beta widget']
    expect(matcher.autocomplete('the wíd')).toEqual(expected.map((term, i) => ({
      term, rule: [matcher.rules[2], matcher.rules[0], matcher.rules[1], matcher.rules[3]][i],
    })))
    expect(matcher.autocomplete('wíd', 2).map((entry) => entry.term)).toEqual(expected.slice(0, 2))
    expect(matcher.autocomplete('widgets').map((entry) => entry.term)).toEqual(expected)
    expect(matcher.autocomplete('alpha wi').map((entry) => entry.term)).toEqual(['alpha widget'])
    expect(matcher.autocomplete('')).toEqual([])
    expect(matcher.autocomplete('the')).toEqual([])
    expect(matcher.autocomplete('widget', 0)).toEqual([])
  })

  it('rejects missing destination references', () => {
    expect(() => createMatcher(fixture([{ ...rule('widget'), destination: 'no-cart' }]))).toThrow('Unknown destination "no-cart"')
  })
})
