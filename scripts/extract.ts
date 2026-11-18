// Turns a longbeach.gov HTML page into plain text lines and keeps only the page's main content.
// Kept dependency-free on purpose so the extraction is easy to read and audit.

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  raquo: '»',
  laquo: '«',
  reg: '®',
  copy: '©',
  zwnj: '',
  zwj: '',
}

export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, body: string) => {
    if (body.startsWith('#x') || body.startsWith('#X')) return String.fromCodePoint(parseInt(body.slice(2), 16))
    if (body.startsWith('#')) return String.fromCodePoint(parseInt(body.slice(1), 10))
    return NAMED_ENTITIES[body.toLowerCase()] ?? whole
  })
}

export function htmlToText(html: string): string {
  let text = html.replace(/<(script|style|noscript)[^>]*>[\s\S]*?<\/\1>/gi, '')
  text = text.replace(/<br\s*\/?>/gi, '\n')
  text = text.replace(/<\/(p|div|li|h\d|tr|td|th|ul|ol|section|header|footer|article)>/gi, '\n')
  text = text.replace(/<[^>]+>/g, ' ')
  text = decodeEntities(text)
  return text
    .split('\n')
    .map((line) => line.replace(/[\s\u200B]+/g, ' ').trim())
    .filter((line) => line.length > 0)
    .join('\n')
}

// The main content starts at the last breadcrumb line ("Home »") and ends before the site footer.
export function extractMainContent(text: string): string {
  const lines = text.split('\n')
  let start = -1
  lines.forEach((line, index) => {
    if (line === 'Home »') start = index
  })
  if (start === -1) return ''
  const end = lines.findIndex((line, index) => index > start && /^(Find Us Online:|Useful Links)$/.test(line))
  return lines.slice(start, end === -1 ? undefined : end).join('\n')
}
