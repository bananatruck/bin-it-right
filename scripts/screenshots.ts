// Captures README screenshots of a running build in headless Chromium.
// Usage: pnpm build && pnpm preview --port 4791 &   then   pnpm screenshots [baseUrl]
// Needs a Chromium binary: set CHROMIUM_PATH, or have Playwright's browser cache in ~/.cache/ms-playwright.

import { existsSync, mkdirSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { chromium, type Page } from 'playwright-core'

const baseUrl = process.argv[2] ?? 'http://localhost:4791/bin-it-right/'
const outDir = join(import.meta.dirname, '..', 'docs', 'screenshots')

function findChromium(): string {
  const fromEnv = process.env.CHROMIUM_PATH
  if (fromEnv !== undefined && existsSync(fromEnv)) return fromEnv
  const cache = join(homedir(), '.cache', 'ms-playwright')
  for (const dir of readdirSync(cache).filter((name) => name.startsWith('chromium-')).sort().reverse()) {
    for (const candidate of ['chrome-linux64/chrome', 'chrome-linux/chrome']) {
      const path = join(cache, dir, candidate)
      if (existsSync(path)) return path
    }
  }
  throw new Error('No Chromium found; set CHROMIUM_PATH')
}

async function search(page: Page, query: string): Promise<void> {
  const input = page.locator('#search')
  await input.fill(query)
  await input.press('Enter')
  await page.locator('.result').first().waitFor()
  await page.waitForTimeout(900)
}

async function main(): Promise<void> {
  mkdirSync(outDir, { recursive: true })
  const browser = await chromium.launch({ executablePath: findChromium() })
  const shots: Array<{ name: string; width: number; height: number; locale?: string; run: (page: Page) => Promise<void>; full?: boolean }> = [
    { name: 'phone-home', width: 390, height: 844, run: () => Promise.resolve() },
    { name: 'phone-answer-pizza-box', width: 390, height: 844, run: (page) => search(page, 'greasy pizza box').then(() => page.getByRole('button', { name: /pizza box/i }).first().click()).then(() => page.waitForTimeout(900)), full: true },
    { name: 'phone-did-you-mean-battery', width: 390, height: 844, run: (page) => search(page, 'battery'), full: true },
    { name: 'phone-no-rule', width: 390, height: 844, run: (page) => search(page, 'aluminum foil'), full: true },
    { name: 'phone-spanish-answer', width: 390, height: 844, locale: 'es', run: (page) => search(page, 'bolsa de plástico'), full: true },
    { name: 'desktop-home', width: 1440, height: 900, run: () => Promise.resolve() },
    { name: 'desktop-answer', width: 1440, height: 900, run: (page) => search(page, 'glass jar') },
    { name: 'desktop-hazardous', width: 1440, height: 900, run: (page) => search(page, 'paint') },
  ]
  for (const shot of shots) {
    const context = await browser.newContext({
      viewport: { width: shot.width, height: shot.height },
      deviceScaleFactor: 2,
      locale: shot.locale ?? 'en-US',
      // Reduced motion renders the rotating headline and counters statically, so captures are stable.
      reducedMotion: 'reduce',
    })
    const page = await context.newPage()
    await page.goto(baseUrl, { waitUntil: 'networkidle' })
    await page.evaluate('document.fonts.ready')
    await shot.run(page)
    const path = join(outDir, `${shot.name}.png`)
    await page.screenshot({ path, fullPage: shot.full ?? false })
    console.log(`saved ${path}`)
    await context.close()
  }
  await browser.close()
}

await main()
