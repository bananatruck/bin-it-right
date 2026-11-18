import { ExternalLink, FileText } from 'lucide-react'
import { dataset } from '@/data'
import { useStrings } from '@/i18n/useLocale'
import { DESTINATION_STYLE } from '@/lib/destinationStyle'
import { formatFetchedDate } from '@/lib/format'
import { destinationLabel, labelLang, REPO_URL, ruleLabel, rulesByDestination } from '@/lib/labels'

const sourcesById = new Map(dataset.sources.map((source) => [source.id, source]))

interface BrowseProps {
  onPick: (term: string) => void
}

// Every rule in the dataset, grouped by where it goes, each with its first source.
export function BrowseRules({ onPick }: BrowseProps) {
  const { locale, t } = useStrings()
  return (
    <div className="browse">
      {rulesByDestination().map((group) => {
        const destination = dataset.destinations.find((entry) => entry.id === group.id)
        if (destination === undefined) return null
        const style = DESTINATION_STYLE[group.id]
        const Icon = style.icon
        return (
          <details key={group.id} className="browse__group">
            <summary className="browse__summary">
              <span
                className={style.uncertain ? 'browse__swatch browse__swatch--uncertain' : 'browse__swatch'}
                style={{ backgroundColor: style.slab, color: style.ink }}
                aria-hidden="true"
              >
                <Icon className="size-5" />
              </span>
              <span className="browse__label" lang={labelLang(destination.label, locale)}>{destinationLabel(destination, locale)}</span>
              <span className="browse__count">{t.ruleCount(group.rules.length)}</span>
            </summary>
            <ul className="browse__list" role="list">
              {group.rules.map((rule) => {
                const first = rule.evidence[0]
                const source = first === undefined ? undefined : sourcesById.get(first.sourceId)
                return (
                  <li key={rule.id} className="browse__row">
                    <button type="button" className="browse__rule" onClick={() => { onPick(rule.label.en) }}>
                      <span lang={labelLang(rule.label, locale)}>{ruleLabel(rule, locale)}</span>
                    </button>
                    {source !== undefined && (
                      <a className="browse__source" href={source.url} target="_blank" rel="noreferrer">
                        {t.sourceShort}
                        <span className="sr-only">: {source.title}, {t.opensInNewTab}</span>
                      </a>
                    )}
                  </li>
                )
              })}
            </ul>
          </details>
        )
      })}
    </div>
  )
}

export function SourcesList() {
  const { locale, t } = useStrings()
  return (
    <ol className="sources" role="list">
      {dataset.sources.map((source) => (
        <li key={source.id} className="sources__row">
          <div className="sources__main">
            <a href={source.url} target="_blank" rel="noreferrer" className="sources__title">
              {source.title}
              <ExternalLink aria-hidden="true" className="size-4 shrink-0" />
              <span className="sr-only">{t.opensInNewTab}</span>
            </a>
            <p className="sources__meta">
              {source.format.toUpperCase()} {t.fetchedOn(formatFetchedDate(source.fetchedAt, locale))}
            </p>
            <p className="sources__hash">
              <span>SHA-256</span> <code>{source.sha256.slice(0, 16)}</code>
            </p>
          </div>
          <a className="sources__snapshot" href={`${REPO_URL}/blob/${__DATASET_COMMIT__}/${source.snapshot}`} target="_blank" rel="noreferrer">
            <FileText aria-hidden="true" className="size-4" />
            {t.savedCopy}
            <span className="sr-only">: {source.title}, {t.opensInNewTab}</span>
          </a>
        </li>
      ))}
    </ol>
  )
}

export function HowItWorks() {
  const { t } = useStrings()
  return (
    <ol className="steps">
      {t.howItWorksSteps.map((step) => (
        <li key={step.title} className="steps__item">
          <h4 className="steps__title">{step.title}</h4>
          <p>{step.body}</p>
        </li>
      ))}
    </ol>
  )
}
