import type { Locale } from '@/i18n/strings'

// Fetch dates are shown in Long Beach's own time zone.
export function formatFetchedDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-US' : 'en-US', {
    dateStyle: 'medium',
    timeZone: 'America/Los_Angeles',
  }).format(new Date(iso))
}

export function formatScore(score: number): string {
  return score.toFixed(2)
}
