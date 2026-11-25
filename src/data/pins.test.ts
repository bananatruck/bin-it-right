// @vitest-environment node
// Pins answers that a review questioned, to the City text they rest on, so they are not raised again.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createMatcher } from '@/engine'
import { dataset } from './index'

const root = join(import.meta.dirname, '..', '..')
const readSnapshot = (path: string) => readFileSync(join(root, path), 'utf8')
const matcher = createMatcher(dataset)

describe('answers pinned to their City source', () => {
  // CodeRabbit asked (PR #1, src/data/rules.json:495) for clean and food-soiled pizza boxes to be split.
  // The City does not split them: its green-cart list gives pizza boxes as food-soiled paper, so the app follows it.
  it('ties the pizza-box answer to the City sentence that lists pizza boxes, and to its saved page', () => {
    const result = matcher.search('pizza box')
    expect(result.kind).toBe('answer')
    if (result.kind !== 'answer') return
    expect(result.destination.id).toBe('green-cart')
    const quote = result.rule.evidence.find((entry) => entry.text === 'Food-soiled paper (napkins, paper towels, pizza boxes)')
    expect(quote?.sourceId).toBe('lb-green-cart')
    const source = dataset.sources.find((entry) => entry.id === quote?.sourceId)
    expect(source?.url).toBe('https://www.longbeach.gov/lbrecycles/yard-trimmings-food-scraps/residential-yard-trimmings-and-food-scraps-collection/')
    expect(readSnapshot(source?.snapshot ?? '')).toContain('What Goes in the Green Cart?')
    expect(readSnapshot(source?.snapshot ?? '')).toContain('Food-soiled paper (napkins, paper towels, pizza boxes)')
  })
})
