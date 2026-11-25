// Records the submission demo of the live site in headless Chromium, then uses ffmpeg to make:
//   submission/video/bin-it-right-demo-captioned.mp4   English captions burned in
//   submission/video/bin-it-right-demo-nocaptions.mp4  same footage, no captions (for a narrated version)
//   submission/video/bin-it-right-demo.srt             the captions, timed to the footage
//   submission/video/timed-script.md                   the captions as a timed script to read over the footage
//
// Usage: pnpm demo:record [url]     (default: the live site)
// Needs:
//   - ffmpeg on PATH with the libx264 encoder and the subtitles (libass), drawtext and pad filters;
//     the script checks these before it starts a browser;
//   - a Chromium binary: set CHROMIUM_PATH, or have Playwright's browser cache in ~/.cache/ms-playwright;
//   - Playwright's own ffmpeg build, which recordVideo uses: `pnpm exec playwright-core install ffmpeg`.
// Record the live site or a production preview (`pnpm build && pnpm preview`); the dev server has no
// service worker, so the offline scene cannot work there. The video files are git-ignored.
//
// Captions are neutral descriptions of what is on screen. Nothing is presented as anyone speaking.

import { isMain } from './is-main.ts'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { chromium, type Locator, type Page } from 'playwright-core'
import rules from '../src/data/rules.json' with { type: 'json' }
import savedSources from '../src/data/sources.json' with { type: 'json' }

const url = process.argv[2] ?? 'https://bananatruck.github.io/bin-it-right/'
const outDir = join(import.meta.dirname, '..', 'submission', 'video')
const rawDir = join(outDir, 'raw')
const WIDTH = 1920
const PAGE_HEIGHT = 1000 // the page area; ffmpeg adds an 80 px frame bar on top for 1920 x 1080
const BAR = 1080 - PAGE_HEIGHT
// CSS zoom lays the page out as if it were 1280 pixels wide while rendering at the full 1920,
// so text is large and sharp in a 1080p video.
const ZOOM = 1.5

// Names each ffmpeg feature the export needs that the installed build lacks.
export function missingFfmpegFeatures(filtersOutput: string, encodersOutput: string): string[] {
  const hasFilter = (name: string) => new RegExp(`^\\s*\\S+\\s+${name}\\s`, 'm').test(filtersOutput)
  const missing: string[] = []
  if (!/\blibx264\b/.test(encodersOutput)) missing.push('libx264 encoder')
  if (!hasFilter('subtitles')) missing.push('subtitles filter (libass)')
  if (!hasFilter('drawtext')) missing.push('drawtext filter (libfreetype)')
  if (!hasFilter('pad')) missing.push('pad filter')
  return missing
}

function checkFfmpeg(): void {
  const run = (flag: string) => execFileSync('ffmpeg', ['-hide_banner', flag], { encoding: 'utf8' })
  const missing = missingFfmpegFeatures(run('-filters'), run('-encoders'))
  if (missing.length > 0) throw new Error(`ffmpeg lacks: ${missing.join(', ')}. Install a full ffmpeg build before recording.`)
}

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

interface Cue {
  start: number
  end: number
  text: string
}

// A visible pointer, because headless recordings do not draw the mouse.
const POINTER_SCRIPT = `
  window.addEventListener('DOMContentLoaded', () => {
    const dot = document.createElement('div')
    dot.setAttribute('aria-hidden', 'true')
    dot.style.cssText = 'position:fixed;z-index:2147483647;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;' +
      'background:rgba(14,42,59,.35);border:2px solid #0e2a3b;pointer-events:none;left:-40px;top:-40px;transition:transform .12s'
    document.body.appendChild(dot)
    document.addEventListener('mousemove', (e) => { dot.style.left = e.clientX + 'px'; dot.style.top = e.clientY + 'px' }, true)
    document.addEventListener('mousedown', () => { dot.style.transform = 'scale(.6)' }, true)
    document.addEventListener('mouseup', () => { dot.style.transform = 'scale(1)' }, true)
  })
`

class Timeline {
  private readonly cues: Cue[] = []
  private current: { text: string; start: number } | undefined
  readonly origin: number
  constructor(origin: number) {
    this.origin = origin
  }
  now(): number {
    return (Date.now() - this.origin) / 1000
  }
  caption(text: string): void {
    this.close()
    this.current = { text, start: this.now() }
  }
  close(): void {
    if (this.current !== undefined) this.cues.push({ ...this.current, end: this.now() })
    this.current = undefined
  }
  shifted(by: number): Cue[] {
    return this.cues.map((cue) => ({ text: cue.text, start: Math.max(0, cue.start - by), end: cue.end - by }))
  }
}

function srtTime(seconds: number): string {
  const ms = Math.round(seconds * 1000)
  const pad = (n: number, width = 2) => String(n).padStart(width, '0')
  return `${pad(Math.floor(ms / 3_600_000))}:${pad(Math.floor(ms / 60_000) % 60)}:${pad(Math.floor(ms / 1000) % 60)},${pad(ms % 1000, 3)}`
}

function clock(seconds: number): string {
  return `${String(Math.floor(seconds / 60))}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
}

async function main(): Promise<void> {
  checkFfmpeg()
  rmSync(rawDir, { recursive: true, force: true })
  mkdirSync(rawDir, { recursive: true })
  const browser = await chromium.launch({ executablePath: findChromium() })
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: PAGE_HEIGHT },
    recordVideo: { dir: rawDir, size: { width: WIDTH, height: PAGE_HEIGHT } },
    locale: 'en-US',
    colorScheme: 'light',
  })
  await context.addInitScript(POINTER_SCRIPT)
  await context.addInitScript(`window.addEventListener('DOMContentLoaded', () => { document.documentElement.style.zoom = '${String(ZOOM)}' })`)
  const page = await context.newPage()
  const timeline = new Timeline(Date.now())
  const pause = (seconds: number) => page.waitForTimeout(seconds * 1000)

  const moveTo = async (target: Locator) => {
    const box = await target.boundingBox()
    if (box !== null) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 25 })
  }
  const click = async (target: Locator) => {
    await target.scrollIntoViewIfNeeded()
    await moveTo(target)
    await pause(0.3)
    await target.click()
  }
  const reveal = async (target: Locator) => {
    // A string body keeps DOM types out of this Node script.
    await target.evaluate("(el) => el.scrollIntoView({ behavior: 'smooth', block: 'center' })")
    await pause(1.2)
  }
  const toTop = async () => {
    await page.evaluate("window.scrollTo({ top: 0, behavior: 'smooth' })")
    await pause(1.2)
  }
  const search = async (text: string) => {
    const input = page.locator('#search')
    await click(input)
    await input.pressSequentially(text, { delay: 110 })
    await pause(0.5)
    await input.press('Enter')
    await page.locator('.result').first().waitFor()
    await pause(1.5)
  }
  const result = (page: Page) => page.locator('.result').first()

  // Load, let the service worker take its offline copy, and start the footage after that.
  await page.goto(url, { waitUntil: 'networkidle' })
  const workerReady = await page.evaluate(
    'Promise.race([navigator.serviceWorker.ready.then(() => true), new Promise((resolve) => setTimeout(() => resolve(false), 20000))])',
  )
  if (workerReady !== true) {
    throw new Error('No service worker became active within 20 s; record the live site or a production preview (pnpm build && pnpm preview).')
  }
  await pause(3)
  await page.mouse.move(WIDTH / 2, PAGE_HEIGHT / 2)
  const footageStart = timeline.now()

  // 1. What it is.
  timeline.caption('Bin It Right answers one question for Long Beach residents: which cart or drop-off does this go in?')
  await pause(6)
  timeline.caption("Every answer quotes the City of Long Beach's own published sorting rules.")
  await pause(5.5)

  // 2. An answer with its proof.
  timeline.caption('Search: pizza box.')
  await search('pizza box')
  timeline.caption('Answer: the green organics cart.')
  await pause(4)
  await reveal(result(page).locator('.quote').first())
  timeline.caption("Below it: the City's rule, word for word, with the City page it came from and the date that page was saved.")
  await pause(7)
  await moveTo(result(page).locator('.quote__link').first())
  timeline.caption('Each quote links to the official City page.')
  await pause(4)
  await reveal(result(page).locator('.hauler'))
  timeline.caption('Cart rules apply to homes with City collection; the app notes that a private hauler may differ.')
  await pause(5.5)

  // 3. Ambiguous words.
  await toTop()
  timeline.caption('Some words could mean more than one thing.')
  await search('battery')
  timeline.caption('So the app asks which one, instead of guessing.')
  await pause(5)
  await click(page.getByRole('button', { name: /Lithium primary/ }))
  await pause(1.5)
  timeline.caption('Lithium-ion batteries: a household hazardous waste drop-off, as the City says.')
  await pause(5.5)

  // 4. No match.
  await toTop()
  timeline.caption('Search: aluminum foil.')
  await search('aluminum foil')
  timeline.caption('No City rule in the app matches, and the app says so instead of guessing.')
  await pause(5)
  await reveal(result(page).locator('.contact'))
  timeline.caption("It shows the City's email and phone, and a ready-made question to send them.")
  await pause(5)
  const why = result(page).locator('details.explain summary')
  await click(why)
  await reveal(result(page).locator('details.explain'))
  timeline.caption('"Why this answer" shows how the words were matched and how close each listed term came.')
  await pause(5.5)

  // 5. Spanish.
  await toTop()
  timeline.caption('Spanish mode.')
  await click(page.getByRole('button', { name: 'Español' }))
  await pause(1.5)
  await search('bolsa de plástico')
  timeline.caption("It shows the City's own Spanish wording from its printed guidelines: Basura (trash).")
  await pause(6)
  await toTop()
  timeline.caption('Search: pintura (paint).')
  await search('pintura')
  await reveal(result(page).locator('.note').first())
  timeline.caption('Where the City publishes a rule only in English, the app shows the English rule and says so.')
  await pause(5.5)

  // 6. Offline.
  await toTop()
  await click(page.getByRole('button', { name: 'English' }))
  await pause(1)
  timeline.caption('Offline test: the network is switched off and the page is reloaded.')
  await context.setOffline(true)
  await pause(1.5)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.locator('#search').waitFor()
  await pause(2.5)
  await search('mattress')
  timeline.caption('After one visit, it still answers with no connection.')
  await pause(5)
  await context.setOffline(false)

  // 7. The data.
  await reveal(page.locator('#browse-title'))
  timeline.caption(`All ${String(rules.length)} rules, from ${String(savedSources.length)} saved City pages, can be browsed by destination.`)
  await pause(5)
  const sources = page.getByRole('button', { name: /^Sources/ })
  await reveal(sources)
  await click(sources)
  await pause(1)
  await reveal(page.locator('.sources'))
  timeline.caption('Each source page is saved with its address, the date it was fetched, and a SHA-256 fingerprint.')
  await pause(6)
  timeline.caption('An automated test fails the build if any quote stops matching its saved page.')
  await pause(5)

  // 8. Close.
  await toTop()
  timeline.caption("Bin It Right: the City's own rules, with the receipts.")
  await pause(5)
  timeline.close()
  await pause(0.5)

  const video = page.video()
  await context.close()
  await browser.close()
  if (video === null) throw new Error('No video was recorded')
  const raw = join(rawDir, 'raw.webm')
  renameSync(await video.path(), raw)

  const cues = timeline.shifted(footageStart)
  const last = cues.at(-1)
  if (last === undefined) throw new Error('No captions were recorded')
  const duration = last.end + 0.5
  // The hackathon allows 2 to 3 minutes. Scene lengths stretch on a busy machine, so keep a 5 s margin.
  if (duration > 175) throw new Error(`The footage runs ${clock(duration)}, over the 2:55 margin; re-record on a less busy machine.`)
  const srt = cues.map((cue, i) => `${String(i + 1)}\n${srtTime(cue.start)} --> ${srtTime(cue.end)}\n${cue.text}\n`).join('\n')
  const srtPath = join(outDir, 'bin-it-right-demo.srt')
  writeFileSync(srtPath, srt)
  writeFileSync(
    join(outDir, 'timed-script.md'),
    [
      '# Bin It Right demo: timed script',
      '',
      'Each line is on screen as a caption in the captioned file, at the time given.',
      'To narrate the uncaptioned file instead, read each line at its time.',
      '',
      ...cues.map((cue) => `- ${clock(cue.start)} to ${clock(cue.end)}: ${cue.text}`),
      '',
      `Total length: ${clock(duration)}.`,
      '',
    ].join('\n'),
  )

  // A plain frame: a light bar above the page with the app's name, nothing else.
  const frame =
    `pad=${String(WIDTH)}:1080:0:${String(BAR)}:color=0xdfe5e4,` +
    `drawbox=x=0:y=${String(BAR - 2)}:w=${String(WIDTH)}:h=2:color=0xc4cfd2:t=fill,` +
    `drawtext=fontfile=/usr/share/fonts/liberation/LiberationSans-Bold.ttf:text='Bin It Right':fontcolor=0x0e2a3b:fontsize=30:x=40:y=(${String(BAR)}-th)/2`
  const encode = ['-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', '30', '-movflags', '+faststart', '-an']
  const common = ['-y', '-hide_banner', '-loglevel', 'error', '-ss', footageStart.toFixed(2), '-t', duration.toFixed(2), '-i', raw]
  const plain = join(outDir, 'bin-it-right-demo-nocaptions.mp4')
  execFileSync('ffmpeg', [...common, '-vf', frame, ...encode, plain], { stdio: 'inherit' })
  const style =
    // ASS colours are &HAABBGGRR: an opaque harbour-navy (#0E2A3B) box behind white text.
    'FontName=Liberation Sans,FontSize=12,PrimaryColour=&H00FFFFFF,BackColour=&H003B2A0E,BorderStyle=4,Outline=0,Shadow=0,MarginV=22'
  const escaped = srtPath.replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "\\'")
  const captioned = join(outDir, 'bin-it-right-demo-captioned.mp4')
  execFileSync('ffmpeg', [...common, '-vf', `${frame},subtitles='${escaped}':original_size=${String(WIDTH)}x1080:force_style='${style}'`, ...encode, captioned], {
    stdio: 'inherit',
  })
  rmSync(rawDir, { recursive: true, force: true })
  console.log(`footage ${clock(duration)} (${duration.toFixed(1)} s)`)
  console.log(`wrote ${captioned}\nwrote ${plain}\nwrote ${srtPath}`)
}

// Only record when run as a script, so tests can import the helpers above.
if (isMain(import.meta)) await main()
