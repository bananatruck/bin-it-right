// Browser smoke test of a build: quick searches in a row, Spanish, console and network, offline after one visit.
// Usage: pnpm smoke [url]      (default: the live site; also works with `pnpm build && pnpm preview`)
// It types each query right after the previous answer, as a person would. This caught a bug where the search
// box ignored typing while the previous query's vanish animation played, so each answer lagged one query behind.

import { isMain } from './is-main.ts'
import { existsSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { chromium, type Page } from 'playwright-core'

const url = process.argv[2] ?? 'https://bananatruck.github.io/bin-it-right/'

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

async function ask(page: Page, query: string): Promise<string> {
  const input = page.locator('#search')
  await input.fill(query)
  await input.press('Enter')
  await page.waitForTimeout(700)
  return page.getByRole('status').innerText()
}

const expectations: Array<[string, string]> = [
  ['pizza box', 'Food-soiled paper (napkins, paper towels, pizza boxes): Green organics cart'],
  ['battery', 'No exact match. 2 suggestions.'],
  ['aluminum foil', 'No official rule found in this app'],
  ['gasoline', 'Gasoline: Household hazardous waste drop-off'],
]

export async function main(): Promise<void> {
  const browser = await chromium.launch({ executablePath: findChromium() })
  const problems: string[] = []
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const page = await context.newPage()
    page.on('pageerror', (error) => problems.push(`page error: ${error.message}`))
    page.on('console', (message) => {
      if (message.type() === 'error' || message.type() === 'warning') problems.push(`console ${message.type()}: ${message.text()}`)
    })
    page.on('requestfailed', (request) => problems.push(`failed request: ${request.url()}`))
    await page.goto(url, { waitUntil: 'networkidle' })

    for (const [query, expected] of expectations) {
      const status = await ask(page, query)
      if (status !== expected) problems.push(`"${query}" announced "${status}", expected "${expected}"`)
    }
    await page.getByRole('button', { name: 'Español' }).click()
    const spanish = await ask(page, 'café molido')
    if (spanish !== 'Coffee grounds: Orgánicos') problems.push(`"café molido" announced "${spanish}"`)

    const ready = await page.evaluate(
      'Promise.race([navigator.serviceWorker.ready.then(() => true), new Promise((resolve) => setTimeout(() => resolve(false), 20000))])',
    )
    if (!ready) throw new Error('Service worker was not ready within 20 seconds')
    await page.waitForTimeout(3000)
    await context.setOffline(true)
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.locator('#search').waitFor({ timeout: 10_000 })
    const offline = await ask(page, 'colchón')
    if (!offline.endsWith('24/7 mattress drop-off')) problems.push(`offline "colchón" announced "${offline}"`)
  } catch (error) {
    problems.push(error instanceof Error ? error.message : String(error))
  } finally {
    await browser.close()
  }

  if (problems.length > 0) {
    console.error(problems.join('\n'))
    process.exitCode = 1
  } else {
    console.log(`smoke passed: ${String(expectations.length + 2)} checks on ${url}`)
  }
}

if (isMain(import.meta)) await main()
