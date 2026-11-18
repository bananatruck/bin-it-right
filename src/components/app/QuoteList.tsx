import { ExternalLink } from 'lucide-react'
import { Fragment } from 'react'
import { dataset } from '@/data'
import type { Quote } from '@/data/schema'
import { useStrings } from '@/i18n/useLocale'
import { formatFetchedDate } from '@/lib/format'
import { groupQuotes } from '@/lib/labels'

const sourcesById = new Map(dataset.sources.map((source) => [source.id, source]))

interface QuoteListProps {
  quotes: readonly Quote[]
  variant?: 'evidence' | 'plain'
}

// Quotes from one page are shown as one excerpt; "[…]" marks City text left out between them.
export function QuoteList({ quotes, variant = 'evidence' }: QuoteListProps) {
  const { locale, t } = useStrings()
  return (
    <ul className="flex flex-col gap-3" role="list">
      {groupQuotes(quotes).map((group, index) => {
        const source = sourcesById.get(group.sourceId)
        if (source === undefined) return null
        return (
          <li key={`${group.sourceId}-${String(index)}`}>
            <figure className={variant === 'evidence' ? 'quote quote--evidence' : 'quote'}>
              <blockquote lang={group.lang} cite={source.url} className="quote__text">
                {group.texts.map((text, part) => (
                  <Fragment key={text}>
                    {part > 0 && (
                      <span className="quote__gap">
                        <span aria-hidden="true">[…]</span>
                        <span className="sr-only">{t.textOmitted}</span>
                      </span>
                    )}
                    <span className="quote__part">{text}</span>
                  </Fragment>
                ))}
              </blockquote>
              <figcaption className="quote__source">
                <a href={source.url} target="_blank" rel="noreferrer" className="quote__link">
                  <span>{t.sourceLine(source.title, formatFetchedDate(source.fetchedAt, locale))}</span>
                  <ExternalLink aria-hidden="true" className="size-4 shrink-0" />
                  <span className="sr-only">{t.opensInNewTab}</span>
                </a>
              </figcaption>
            </figure>
          </li>
        )
      })}
    </ul>
  )
}
