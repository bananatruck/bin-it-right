import { LinkSchema, SourceSchema } from './schema'

describe('official link check (round 2 review)', () => {
  it.each(['https://www.longbeach.gov/lbrecycles/', 'https://longbeach.gov/', 'https://lbcity.longbeach.gov/x'])('accepts the City domain %s', (url) => {
    expect(LinkSchema.safeParse({ label: 'x', url }).success).toBe(true)
  })

  it.each(['https://notlongbeach.gov/', 'https://longbeach.gov.example.com/', 'http://www.longbeach.gov/'])('rejects %s', (url) => {
    expect(LinkSchema.safeParse({ label: 'x', url }).success).toBe(false)
  })
})

describe('malformed URLs (round 3 review)', () => {
  it('reports a malformed source URL as an issue instead of throwing', () => {
    const source = {
      id: 'x', url: 'not a URL', title: 'x', format: 'html', publisher: 'City of Long Beach',
      fetchedAt: '2026-11-17T00:00:00Z', sha256: '0'.repeat(64), snapshot: 'data/snapshots/x.txt',
    }
    expect(() => SourceSchema.safeParse(source)).not.toThrow()
    expect(SourceSchema.safeParse(source).success).toBe(false)
  })

  it('reports a malformed link URL as an issue instead of throwing', () => {
    expect(() => LinkSchema.safeParse({ label: 'x', url: 'not a URL' })).not.toThrow()
  })
})
