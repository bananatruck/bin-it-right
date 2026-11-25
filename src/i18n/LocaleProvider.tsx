import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { strings, type Locale } from './strings'
import { LocaleContext } from './useLocale'

const STORAGE_KEY = 'bin-it-right:locale'

// The remembered language is a per-viewer convenience; the app works the same without storage.
function readStoredLocale(): Locale {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'en' || stored === 'es') return stored
  } catch {
    // Storage can be blocked; fall through to the browser language.
  }
  return navigator.language.toLowerCase().startsWith('es') ? 'es' : 'en'
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(readStoredLocale)

  useEffect(() => {
    document.documentElement.lang = locale
    try {
      window.localStorage.setItem(STORAGE_KEY, locale)
    } catch {
      // Ignore: remembering the language is optional.
    }
  }, [locale])

  const value = useMemo(() => ({ locale, setLocale, t: strings[locale] }), [locale])
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}
