import { MapPin, Recycle } from 'lucide-react'
import type { Locale } from '@/i18n/strings'
import { useStrings } from '@/i18n/useLocale'

const LOCALES: Array<{ id: Locale; label: string; name: string }> = [
  { id: 'en', label: 'EN', name: 'English' },
  { id: 'es', label: 'ES', name: 'Español' },
]

export function Header() {
  const { locale, setLocale, t } = useStrings()
  return (
    <header className="topbar">
      <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
        <a href="./" className="wordmark" aria-label={t.appName}>
          <span className="wordmark__mark" aria-hidden="true"><Recycle className="size-5" /></span>
          <span>{t.appName}</span>
        </a>
        <span className="city-chip">
          <MapPin aria-hidden="true" className="size-4" />
          {t.cityChip}
        </span>
      </div>
      <div className="lang-toggle" role="group" aria-label={t.languageLabel}>
        {LOCALES.map((entry) => (
          <button
            key={entry.id}
            type="button"
            lang={entry.id}
            aria-pressed={locale === entry.id}
            aria-label={entry.name}
            onClick={() => { setLocale(entry.id) }}
          >
            {entry.label}
          </button>
        ))}
      </div>
    </header>
  )
}
