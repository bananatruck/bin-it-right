import { LinkSchema } from './schema'

describe('official link check (round 2 review)', () => {
  it.each(['https://www.longbeach.gov/lbrecycles/', 'https://longbeach.gov/', 'https://lbcity.longbeach.gov/x'])('accepts the City domain %s', (url) => {
    expect(LinkSchema.safeParse({ label: 'x', url }).success).toBe(true)
  })

  it.each(['https://notlongbeach.gov/', 'https://longbeach.gov.example.com/', 'http://www.longbeach.gov/'])('rejects %s', (url) => {
    expect(LinkSchema.safeParse({ label: 'x', url }).success).toBe(false)
  })
})
