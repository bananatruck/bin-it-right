import type { Quote } from '@/data/schema'
import { groupQuotes, quotesForLocale, withoutRepeats } from './labels'

const q = (sourceId: string, text: string, lang: Quote['lang'] = 'en'): Quote => ({ sourceId, lang, text })

describe('groupQuotes', () => {
  it('joins adjacent quotes from one source and language, and keeps order', () => {
    expect(groupQuotes([q('a', 'one'), q('a', 'two'), q('b', 'three'), q('a', 'four')])).toEqual([
      { sourceId: 'a', lang: 'en', texts: ['one', 'two'] },
      { sourceId: 'b', lang: 'en', texts: ['three'] },
      { sourceId: 'a', lang: 'en', texts: ['four'] },
    ])
  })

  it('keeps languages apart and drops exact repeats inside a group', () => {
    expect(groupQuotes([q('a', 'one'), q('a', 'uno', 'es'), q('a', 'uno', 'es')])).toEqual([
      { sourceId: 'a', lang: 'en', texts: ['one'] },
      { sourceId: 'a', lang: 'es', texts: ['uno'] },
    ])
  })
})

describe('withoutRepeats', () => {
  it('removes quotes already shown', () => {
    expect(withoutRepeats([q('a', 'one'), q('a', 'two')], [q('b', 'one')])).toEqual([q('a', 'two')])
  })
})

describe('quotesForLocale', () => {
  const quotes = [q('a', 'English rule'), q('a', 'Regla', 'es')]
  it('shows only English quotes in English', () => {
    expect(quotesForLocale(quotes, 'en')).toEqual({ quotes: [q('a', 'English rule')], englishOnly: false })
  })
  it("shows the City's Spanish first in Spanish, keeping the English", () => {
    expect(quotesForLocale(quotes, 'es').quotes.map((quote) => quote.lang)).toEqual(['es', 'en'])
  })
  it('flags English-only rules in Spanish mode instead of translating them', () => {
    expect(quotesForLocale([q('a', 'English rule')], 'es')).toEqual({ quotes: [q('a', 'English rule')], englishOnly: true })
  })
})
