// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { missingFfmpegFeatures } from './record-demo.ts'

const filters = (...names: string[]) => names.map((name) => ` T.. ${name}            V->V       description`).join('\n')

describe('ffmpeg preflight (round 3 review)', () => {
  it('passes when x264, subtitles, drawtext and pad are all present', () => {
    expect(missingFfmpegFeatures(filters('drawtext', 'subtitles', 'pad'), ' V....D libx264   H.264')).toEqual([])
  })

  it('names every missing filter or encoder before any recording starts', () => {
    expect(missingFfmpegFeatures(filters('pad'), ' V....D libvpx   VP8')).toEqual(['libx264 encoder', 'subtitles filter (libass)', 'drawtext filter (libfreetype)'])
  })
})
