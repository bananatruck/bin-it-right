// @vitest-environment node
import { runInNewContext } from 'node:vm'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const launch = vi.hoisted(() => vi.fn())
vi.mock('playwright-core', () => ({ chromium: { launch } }))
import { main } from './smoke.ts'

const statuses = [
  'Food-soiled paper (napkins, paper towels, pizza boxes): Green organics cart',
  'No exact match. 2 suggestions.',
  'No official rule found in this app',
  'Gasoline: Household hazardous waste drop-off',
  'Coffee grounds: Orgánicos',
]

function browserFixture() {
  const innerText = vi.fn()
  for (const status of statuses) innerText.mockResolvedValueOnce(status)
  const evaluate = vi.fn((script: string): Promise<unknown> => {
    const result: unknown = runInNewContext(script, {
      navigator: { serviceWorker: { ready: new Promise(() => undefined) } },
      Promise, setTimeout,
    })
    return Promise.resolve(result)
  })
  const page = {
    on: vi.fn(), goto: vi.fn().mockResolvedValue(undefined),
    locator: () => ({ fill: vi.fn(), press: vi.fn(), waitFor: vi.fn() }),
    getByRole: () => ({ innerText, click: vi.fn() }),
    waitForTimeout: vi.fn().mockResolvedValue(undefined), evaluate,
    reload: vi.fn(),
  }
  const context = { newPage: vi.fn().mockResolvedValue(page), setOffline: vi.fn() }
  const browser = { newContext: vi.fn().mockResolvedValue(context), close: vi.fn().mockResolvedValue(undefined) }
  launch.mockResolvedValue(browser)
  return { page, context, browser }
}

describe('smoke failure handling', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubEnv('CHROMIUM_PATH', process.execPath)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })
  afterEach(() => {
    process.exitCode = 0
    vi.useRealTimers()
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('reports a worker readiness timeout and closes the browser', async () => {
    const { browser, context } = browserFixture()
    const run = main()
    await vi.advanceTimersByTimeAsync(20_001)
    expect(browser.close).toHaveBeenCalledOnce()
    await run
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Service worker was not ready within 20 seconds'))
    expect(context.setOffline).not.toHaveBeenCalled()
    expect(process.exitCode).toBe(1)
  })

  it('closes the browser and reports failures before worker readiness', async () => {
    const { page, browser } = browserFixture()
    page.goto.mockRejectedValue(new Error('navigation failed'))
    await main()
    expect(browser.close).toHaveBeenCalledOnce()
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('navigation failed'))
    expect(process.exitCode).toBe(1)
  })
})
