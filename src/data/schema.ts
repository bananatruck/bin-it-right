import { z } from 'zod'

// Every fact the app shows comes from an official page listed in sources.json.
// A quote's text must appear, after normalisation, in that source's snapshot file.

// Zod still runs refinements after z.url() reports a bad URL, so parsing must never throw here.
function parseUrl(url: string): URL | undefined {
  try {
    return new URL(url)
  } catch {
    return undefined
  }
}

export const LangSchema = z.enum(['en', 'es'])
export type Lang = z.infer<typeof LangSchema>

export const SourceSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  url: z.url().refine((url) => parseUrl(url)?.hostname === 'www.longbeach.gov', {
    message: 'source must be an official www.longbeach.gov URL',
  }),
  title: z.string().min(1),
  format: z.enum(['html', 'pdf']),
  publisher: z.literal('City of Long Beach'),
  fetchedAt: z.iso.datetime(),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
  snapshot: z.string().regex(/^data\/snapshots\/[a-z0-9-]+\.txt$/),
})
export type Source = z.infer<typeof SourceSchema>

export const QuoteSchema = z.object({
  sourceId: z.string().min(1),
  lang: LangSchema,
  text: z.string().min(3),
})
export type Quote = z.infer<typeof QuoteSchema>

export const LabelSchema = z.object({
  en: z.string().min(1),
  // Only when the City publishes this exact Spanish wording in a cited source.
  es: z.string().min(1).optional(),
})
export type Label = z.infer<typeof LabelSchema>

export const DestinationIdSchema = z.enum([
  'blue-cart',
  'green-cart',
  'trash-cart',
  'special-collection',
  'hazardous-dropoff',
  'paintcare-dropoff',
  'e-waste-dropoff',
  'battery-dropoff',
  'bulb-dropoff',
  'medical-dropoff',
  'used-oil',
  'mattress-dropoff',
  'treecycling',
  'donate',
  // The City says "never in any cart" but names no place to take it.
  'no-cart',
  // The City excludes it from a cart but does not say where it goes.
  'ask-the-city',
])
export type DestinationId = z.infer<typeof DestinationIdSchema>

// longbeach.gov itself or a subdomain of it, over HTTPS. A bare suffix check would accept look-alikes such as notlongbeach.gov.
export function isOfficialCityUrl(url: string): boolean {
  const parsed = parseUrl(url)
  return parsed?.protocol === 'https:' && (parsed.hostname === 'longbeach.gov' || parsed.hostname.endsWith('.longbeach.gov'))
}

export const LinkSchema = z.object({
  label: z.string().min(1),
  url: z.url().refine(isOfficialCityUrl, {
    message: 'links must point to an official longbeach.gov page over HTTPS',
  }),
})
export type Link = z.infer<typeof LinkSchema>

export const DestinationSchema = z.object({
  id: DestinationIdSchema,
  label: LabelSchema,
  // What the resident should do, quoted from an official source.
  action: z.array(QuoteSchema).min(1),
  links: z.array(LinkSchema),
})
export type Destination = z.infer<typeof DestinationSchema>

export const RuleSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  label: LabelSchema,
  destination: DestinationIdSchema,
  evidence: z.array(QuoteSchema).min(1),
  tips: z.array(QuoteSchema).default([]),
  terms: z.array(z.string().min(2)).min(1),
  termsEs: z.array(z.string().min(2)).default([]),
})
export type Rule = z.infer<typeof RuleSchema>
export type RuleInput = z.input<typeof RuleSchema>

export const ContactSchema = z.object({
  email: z.email(),
  phone: z.string().min(7),
  evidence: z.array(QuoteSchema).min(1),
})
export type Contact = z.infer<typeof ContactSchema>

export const DatasetSchema = z.object({
  city: z.literal('Long Beach, California'),
  scope: QuoteSchema,
  contact: ContactSchema,
  sources: z.array(SourceSchema).min(1),
  destinations: z.array(DestinationSchema).min(1),
  rules: z.array(RuleSchema).min(1),
})
export type Dataset = z.infer<typeof DatasetSchema>
