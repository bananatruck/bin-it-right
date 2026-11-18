import { dataset } from '@/data'
import { createMatcher } from '@/engine'
import { strings } from './strings'

const matcher = createMatcher(dataset)

describe('interface examples (round 2 review)', () => {
  for (const [locale, t] of Object.entries(strings)) {
    const examples = [
      ...t.searchPlaceholders.map((text) => text.replace(/^(Try|Prueba): /, '')),
      ...t.heroRotatingItems,
      ...t.quickPicks.filter((pick) => pick !== 'Aluminum foil'),
    ]
    it.each(examples)(`${locale}: the advertised example %j finds an answer or suggestions`, (example) => {
      expect(matcher.search(example).kind).not.toBe('none')
    })
  }

  it('frames every destination, not only carts, in both languages', () => {
    expect(strings.en.answerLabel).toBe('Where it goes')
    expect(strings.es.answerLabel).toBe('Qué hacer')
  })
})
