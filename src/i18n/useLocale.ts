import { createContext, useContext } from 'react'
import { strings, type Locale, type UiStrings } from './strings'

export interface LocaleState {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: UiStrings
}

export const LocaleContext = createContext<LocaleState>({
  locale: 'en',
  setLocale: () => undefined,
  t: strings.en,
})

export function useStrings(): LocaleState {
  return useContext(LocaleContext)
}
