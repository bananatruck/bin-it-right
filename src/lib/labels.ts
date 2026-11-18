import { dataset } from '@/data'
import type { Destination, DestinationId, Quote, Rule } from '@/data/schema'
import type { Locale } from '@/i18n/strings'

export const REPO_URL = 'https://github.com/bananatruck/bin-it-right'

export function destinationLabel(destination: Destination, locale: Locale): string {
  return locale === 'es' && destination.label.es !== undefined ? destination.label.es : destination.label.en
}

export function ruleLabel(rule: Rule, locale: Locale): string {
  return locale === 'es' && rule.label.es !== undefined ? rule.label.es : rule.label.en
}

// Picks the quotes to show for a locale.
// Spanish shows the City's Spanish wording where it exists, otherwise the English rule with a note.
export function quotesForLocale(quotes: readonly Quote[], locale: Locale): { quotes: Quote[]; englishOnly: boolean } {
  const english = quotes.filter((quote) => quote.lang === 'en')
  if (locale === 'en') return { quotes: english, englishOnly: false }
  const spanish = quotes.filter((quote) => quote.lang === 'es')
  if (spanish.length === 0) return { quotes: english, englishOnly: english.length > 0 }
  return { quotes: [...spanish, ...english], englishOnly: false }
}

export function rulesByDestination(): Array<{ id: DestinationId; rules: Rule[] }> {
  return dataset.destinations
    .map((destination) => ({ id: destination.id, rules: dataset.rules.filter((rule) => rule.destination === destination.id) }))
    .filter((group) => group.rules.length > 0)
}

export function gapReport(query: string): string {
  return [
    'Bin It Right gap report',
    `Item: ${query}`,
    'No rule for this item was found in the City of Long Beach sorting guidelines saved by Bin It Right.',
    'Could the City publish which cart or drop-off it belongs in?',
  ].join('\n')
}

export interface QuoteGroup {
  sourceId: string
  lang: Quote['lang']
  texts: string[]
}

// Adjacent quotes from the same source and language read as one excerpt with one citation.
export function groupQuotes(quotes: readonly Quote[]): QuoteGroup[] {
  const groups: QuoteGroup[] = []
  for (const quote of quotes) {
    const last = groups.at(-1)
    if (last !== undefined && last.sourceId === quote.sourceId && last.lang === quote.lang) {
      if (!last.texts.includes(quote.text)) last.texts.push(quote.text)
    } else {
      groups.push({ sourceId: quote.sourceId, lang: quote.lang, texts: [quote.text] })
    }
  }
  return groups
}

// Drops quotes whose text is already shown elsewhere on the same answer.
export function withoutRepeats(quotes: readonly Quote[], shown: readonly Quote[]): Quote[] {
  const seen = new Set(shown.map((quote) => quote.text))
  return quotes.filter((quote) => !seen.has(quote.text))
}
