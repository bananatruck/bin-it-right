import { Check, Copy, Mail, Phone } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { dataset } from '@/data'
import type { Destination, Rule } from '@/data/schema'
import type { Explanation, SearchResult } from '@/engine'
import { useStrings } from '@/i18n/useLocale'
import { DESTINATION_STYLE } from '@/lib/destinationStyle'
import { formatScore } from '@/lib/format'
import { destinationLabel, quotesForLocale, ruleLabel, withoutRepeats } from '@/lib/labels'
import { QuoteList } from './QuoteList'

interface ResultViewProps {
  result: SearchResult
  onPick: (term: string) => void
}

export function ResultView({ result, onPick }: ResultViewProps) {
  if (result.kind === 'answer') return <AnswerCard rule={result.rule} destination={result.destination} explanation={result.explanation} />
  if (result.kind === 'suggestions') return <SuggestionsCard result={result} onPick={onPick} />
  return <NoRuleCard explanation={result.explanation} />
}

function DestinationSlab({ destination }: { destination: Destination }) {
  const { locale, t } = useStrings()
  const reduceMotion = useReducedMotion()
  const style = DESTINATION_STYLE[destination.id]
  const Icon = style.icon
  return (
    <motion.div
      className={style.uncertain ? 'slab slab--uncertain' : 'slab'}
      style={{ backgroundColor: style.slab, color: style.ink, transformOrigin: 'top' }}
      initial={reduceMotion === true ? false : { scaleY: 0.2, opacity: 0 }}
      animate={{ scaleY: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
    >
      <span className="slab__lid" aria-hidden="true" />
      <h2 id="answer-destination" className="slab__heading">
        <span className="slab__eyebrow">{t.answerLabel}</span>{' '}
        <span className="slab__title">
          <Icon aria-hidden="true" className="slab__icon" strokeWidth={2.25} />
          <span>{destinationLabel(destination, locale)}</span>
        </span>
      </h2>
    </motion.div>
  )
}

function AnswerCard({ rule, destination, explanation }: { rule: Rule; destination: Destination; explanation: Explanation }) {
  const { locale, t } = useStrings()
  const evidence = quotesForLocale(rule.evidence, locale)
  const tips = quotesForLocale(rule.tips, locale)
  const action = quotesForLocale(withoutRepeats(destination.action, [...rule.evidence, ...rule.tips]), locale)
  return (
    <article className="result" aria-labelledby="answer-destination answer-item">
      <DestinationSlab destination={destination} />
      <div className="result__body">
        <h3 id="answer-item" className="result__item" lang={locale === 'es' && rule.label.es !== undefined ? 'es' : 'en'}>
          {ruleLabel(rule, locale)}
        </h3>
        <section aria-labelledby="answer-quote">
          <h4 id="answer-quote" className="result__heading">{t.quoteIntro}</h4>
          {evidence.englishOnly && <p className="note">{t.englishOnlyNote}</p>}
          <QuoteList quotes={evidence.quotes} />
        </section>
        {tips.quotes.length > 0 && (
          <section aria-labelledby="answer-tips">
            <h4 id="answer-tips" className="result__heading">{t.tipsLabel}</h4>
            <QuoteList quotes={tips.quotes} variant="plain" />
          </section>
        )}
        <section aria-labelledby="answer-howto">
          <h4 id="answer-howto" className="result__heading">{t.howToLabel}</h4>
          <QuoteList quotes={action.quotes} variant="plain" />
          {destination.links.length > 0 && (
            <ul className="link-row" role="list">
              {destination.links.map((link) => (
                <li key={link.url}>
                  <a className="button button--ghost" href={link.url} target="_blank" rel="noreferrer">
                    {link.label}
                    <span className="sr-only">{t.opensInNewTab}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
        <HaulerNote />
        <ExplainPanel explanation={explanation} />
      </div>
    </article>
  )
}

function SuggestionsCard({ result, onPick }: { result: Extract<SearchResult, { kind: 'suggestions' }>; onPick: (term: string) => void }) {
  const { locale, t } = useStrings()
  return (
    <article className="result result--plain" aria-labelledby="suggest-title">
      <div className="result__body">
        <h2 id="suggest-title" className="result__item">{t.noExactTitle(result.explanation.query)}</h2>
        <p className="lede">{t.didYouMean}</p>
        <ul className="suggestions" role="list">
          {result.suggestions.map((suggestion) => {
            const style = DESTINATION_STYLE[suggestion.destination.id]
            const Icon = style.icon
            return (
              <li key={suggestion.rule.id}>
                <button type="button" className="suggestion" onClick={() => { onPick(suggestion.term) }}>
                  <span className="suggestion__swatch" style={{ backgroundColor: style.slab, color: style.ink }} aria-hidden="true">
                    <Icon className="size-5" />
                  </span>
                  <span className="suggestion__text">
                    <span className="suggestion__term">{ruleLabel(suggestion.rule, locale)}</span>
                    <span className="suggestion__dest">{destinationLabel(suggestion.destination, locale)}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
        <p className="note">{t.suggestionsNote}</p>
        <ContactBlock query={result.explanation.query} />
        <ExplainPanel explanation={result.explanation} />
      </div>
    </article>
  )
}

function NoRuleCard({ explanation }: { explanation: Explanation }) {
  const { t } = useStrings()
  const empty = explanation.normalized === ''
  return (
    <article className="result" aria-labelledby="none-title">
      <div className="slab slab--uncertain" style={{ backgroundColor: '#FFFFFF', color: '#0E2A3B' }}>
        <span className="slab__lid" aria-hidden="true" />
        <p className="slab__title" id="none-title">{empty ? t.emptyQueryTitle : t.noRuleTitle}</p>
      </div>
      <div className="result__body">
        {!empty && <p className="lede">{t.noRuleBody(explanation.query)}</p>}
        {!empty && <ContactBlock query={explanation.query} />}
        {!empty && <ExplainPanel explanation={explanation} />}
      </div>
    </article>
  )
}

function HaulerNote() {
  const { t } = useStrings()
  return (
    <aside className="hauler" aria-label={t.haulerLabel}>
      <p>{t.haulerNote}</p>
      <QuoteList quotes={[dataset.scope]} variant="plain" />
    </aside>
  )
}

function ContactBlock({ query }: { query: string }) {
  const { t } = useStrings()
  const [copied, setCopied] = useState(false)
  const { email, phone } = dataset.contact
  const report = t.gapReport(query)
  const mailto = `mailto:${email}?subject=${encodeURIComponent(t.gapSubject(query))}&body=${encodeURIComponent(report)}`
  async function copy() {
    try {
      await navigator.clipboard.writeText(report)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }
  return (
    <section className="contact" aria-labelledby="contact-title">
      <h3 id="contact-title" className="result__heading">{t.contactTitle}</h3>
      <ul className="link-row" role="list">
        <li>
          <a className="button button--solid" href={mailto}>
            <Mail aria-hidden="true" className="size-5" />
            {t.contactEmail}: {email}
          </a>
        </li>
        <li>
          <a className="button button--ghost" href={`tel:+1${phone.replace(/\D/g, '')}`}>
            <Phone aria-hidden="true" className="size-5" />
            {t.contactPhone}: {phone}
          </a>
        </li>
        <li>
          <button type="button" className="button button--ghost" onClick={() => { void copy() }}>
            {copied ? <Check aria-hidden="true" className="size-5" /> : <Copy aria-hidden="true" className="size-5" />}
            {copied ? t.copied : t.copyGapReport}
          </button>
        </li>
      </ul>
      <QuoteList quotes={dataset.contact.evidence} variant="plain" />
    </section>
  )
}

function ExplainPanel({ explanation }: { explanation: Explanation }) {
  const { t } = useStrings()
  return (
    <details className="explain">
      <summary>{t.explainTitle}</summary>
      <dl className="explain__grid">
        <dt>{t.explainTyped}</dt>
        <dd><code>{explanation.query}</code></dd>
        <dt>{t.explainNormalized}</dt>
        <dd><code>{explanation.normalized || '-'}</code></dd>
        <dt>{t.explainDropped}</dt>
        <dd>{explanation.dropped.length > 0 ? explanation.dropped.join(', ') : '-'}</dd>
        <dt>{t.explainMatch}</dt>
        <dd>{explanation.matchedTerm !== undefined ? t.explainExact(explanation.matchedTerm) : t.explainNoExact}</dd>
        <dt>{t.explainThreshold}</dt>
        <dd>{formatScore(explanation.threshold)}</dd>
      </dl>
      {explanation.candidates.length > 0 && (
        <table className="explain__table">
          <caption>{t.explainCandidates}</caption>
          <thead>
            <tr>
              <th scope="col">{t.explainTerm}</th>
              <th scope="col">{t.explainScore}</th>
            </tr>
          </thead>
          <tbody>
            {explanation.candidates.map((candidate) => (
              <tr key={`${candidate.ruleId}-${candidate.term}`}>
                <td>{candidate.term}</td>
                <td>{formatScore(candidate.score)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </details>
  )
}
