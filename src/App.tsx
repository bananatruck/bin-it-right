import { useMemo, useRef, useState } from 'react'
import { BlurFade } from '@/components/ui/blur-fade'
import { DotPattern } from '@/components/ui/dot-pattern'
import { NumberTicker } from '@/components/ui/number-ticker'
import RotatingText from '@/components/RotatingText'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { PlaceholdersAndVanishInput } from '@/components/ui/placeholders-and-vanish-input'
import { Header } from '@/components/app/Header'
import { ResultView } from '@/components/app/ResultView'
import { BrowseRules, HowItWorks, SourcesList } from '@/components/app/Sections'
import { REPO_URL } from '@/lib/labels'
import { dataset } from '@/data'
import { createMatcher, type SearchResult } from '@/engine'
import { useStrings } from '@/i18n/useLocale'
import { announcement, termLang } from '@/lib/labels'

const matcher = createMatcher(dataset)
const termCount = dataset.rules.reduce((total, rule) => total + rule.terms.length + rule.termsEs.length, 0)

export default function App() {
  const { locale, t } = useStrings()
  const [draft, setDraft] = useState('')
  const [result, setResult] = useState<SearchResult | null>(null)
  const [searchCount, setSearchCount] = useState(0)
  const resultRef = useRef<HTMLElement>(null)

  const typeahead = useMemo(() => matcher.autocomplete(draft, 6), [draft])

  function runSearch(query: string) {
    // A blank query shows the "type an item" card instead of silently keeping the old answer.
    setResult(matcher.search(query.trim()))
    setSearchCount((count) => count + 1)
    setDraft('')
    // Move focus to the answer so keyboard and screen-reader users land on it.
    requestAnimationFrame(() => {
      resultRef.current?.focus()
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      resultRef.current?.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' })
    })
  }

  return (
    <>
      <a className="skip-link" href="#main">{t.skipToContent}</a>
      <div className="relative isolate min-h-dvh overflow-x-clip">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[46rem]">
          <DotPattern
            width={22}
            height={22}
            cr={1.1}
            className="text-[#0e2a3b]/20 [mask-image:linear-gradient(to_bottom,white,transparent_85%)]"
          />
        </div>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Header />
          <main id="main" className="grid gap-10 pt-8 pb-16 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
            <section aria-labelledby="ask-title" className="flex min-w-0 flex-col gap-6">
              <div>
                <h1 id="ask-title" className="hero__lead">
                  {t.heroLead}
                  <br />
                  {/* Decorative: screen readers get a stable heading, not a word that changes every few seconds. */}
                  <span aria-hidden="true">
                    <RotatingText
                      texts={t.heroRotatingItems}
                      mainClassName="hero__rotator"
                      rotationInterval={2600}
                      staggerDuration={0.02}
                      staggerFrom="first"
                      animatePresenceMode="popLayout"
                    />
                  </span>
                </h1>
                <p className="hero__sub">{t.heroSub}</p>
              </div>

              <div className="flex flex-col gap-3">
                <label htmlFor="search" className="font-bold">{t.searchLabel}</label>
                <PlaceholdersAndVanishInput
                  id="search"
                  aria-label={t.searchLabel}
                  placeholders={t.searchPlaceholders}
                  value={draft}
                  onValueChange={setDraft}
                  submitLabel={t.searchSubmit}
                  onSubmit={() => { runSearch(draft) }}
                />
                {typeahead.length > 0 && (
                  <div>
                    <p className="sr-only" aria-live="polite">{t.typeaheadCount(typeahead.length)}</p>
                    <ul className="typeahead" role="list" aria-label={t.typeaheadLabel}>
                      {typeahead.map((entry) => (
                        <li key={entry.rule.id}>
                          <button type="button" lang={termLang(entry.rule, entry.term)} onClick={() => { runSearch(entry.term) }}>
                            {entry.term}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div>
                <p className="mb-2 font-bold" id="quick-picks">{t.quickPicksLabel}</p>
                <ul className="chips" role="list" aria-labelledby="quick-picks">
                  {t.quickPicks.map((pick) => (
                    <li key={pick}>
                      <button type="button" className="chip" onClick={() => { runSearch(pick) }}>{pick}</button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* A short status line is announced; the full answer is read when focus moves to it. */}
              <p className="sr-only" role="status">{result === null ? '' : announcement(result, locale, t)}</p>
              <section
                ref={resultRef}
                tabIndex={-1}
                aria-label={t.resultRegionLabel}
                className="result-region scroll-mt-4"
              >
                {result !== null && (
                  <BlurFade key={searchCount} duration={0.3} blur="4px" offset={8}>
                    <ResultView result={result} onPick={runSearch} />
                  </BlurFade>
                )}
              </section>
            </section>

            <aside aria-labelledby="browse-title" className="min-w-0">
              <h2 id="browse-title" className="section-title">{t.browseTitle}</h2>
              <p className="note">{t.browseIntro}</p>
              <BrowseRules onPick={runSearch} />
            </aside>
          </main>

          <section aria-labelledby="numbers-title" className="pb-12">
            <h2 id="numbers-title" className="section-title">{t.numbersTitle}</h2>
            <dl className="stats">
              <div className="stats__item">
                <dt className="stats__label">{t.statRules}</dt>
                <dd className="stats__value"><NumberTicker value={dataset.rules.length} className="text-inherit" /></dd>
              </div>
              <div className="stats__item">
                <dt className="stats__label">{t.statTerms}</dt>
                <dd className="stats__value"><NumberTicker value={termCount} className="text-inherit" /></dd>
              </div>
              <div className="stats__item">
                <dt className="stats__label">{t.statSources}</dt>
                <dd className="stats__value"><NumberTicker value={dataset.sources.length} className="text-inherit" /></dd>
              </div>
              <div className="stats__item">
                <dt className="stats__label">{t.statNetwork}</dt>
                <dd className="stats__value">0</dd>
              </div>
            </dl>
          </section>

          <section aria-label={t.moreLabel} className="pb-16">
            <Accordion type="multiple" className="flex flex-col gap-2">
              <AccordionItem value="how" className="info">
                <AccordionTrigger className="info__trigger">{t.howItWorksTitle}</AccordionTrigger>
                <AccordionContent className="info__content"><HowItWorks /></AccordionContent>
              </AccordionItem>
              <AccordionItem value="sources" className="info">
                <AccordionTrigger className="info__trigger">{t.sourcesTitle(dataset.sources.length)}</AccordionTrigger>
                <AccordionContent className="info__content"><SourcesList /></AccordionContent>
              </AccordionItem>
              <AccordionItem value="access" className="info">
                <AccordionTrigger className="info__trigger">{t.accessTitle}</AccordionTrigger>
                <AccordionContent className="info__content">
                  <ul className="flex list-disc flex-col gap-2 pl-5">
                    {t.accessPoints.map((point) => <li key={point}>{point}</li>)}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          <footer className="flex flex-col gap-2 border-t border-[var(--line)] py-8 text-[0.9375rem] text-[var(--ink-2)]">
            <p className="m-0">{t.footerNote}</p>
            <p className="m-0">{t.translationNote}</p>
            <p className="m-0">
              <a className="inline-flex min-h-12 items-center" href={REPO_URL} target="_blank" rel="noreferrer">{t.sourceCode}</a>
            </p>
          </footer>
        </div>
      </div>
    </>
  )
}
