// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { htmlToText } from './extract.ts'

describe('htmlToText (round 4)', () => {
  it('joins text split across adjacent inline elements, as a browser renders it', () => {
    // The City's paint page writes "Sealers" as <span>S</span><span>ealers</span>.
    expect(htmlToText('<li><span class="TextRun">S</span><span class="TextRun">ealers</span></li>')).toBe('Sealers')
    expect(htmlToText('<p>Please call <a href="#">us</a>.</p>')).toBe('Please call us.')
  })

  it('keeps real spaces between inline elements', () => {
    expect(htmlToText('<p><span>Clear</span> <span>coatings</span></p>')).toBe('Clear coatings')
  })

  it('still breaks lines at block elements', () => {
    expect(htmlToText('<ul><li>House paint</li><li>Primers</li></ul><p>Stains</p>')).toBe('House paint\nPrimers\nStains')
    expect(htmlToText('<td>a</td><td>b</td>')).toBe('a\nb')
  })
})
