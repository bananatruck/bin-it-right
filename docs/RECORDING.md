# Recording the demo video

The submission video is recorded from the live site by a script, so it can be re-made after any change.

## Make the video

```sh
pnpm install
pnpm demo:record                     # records https://bananatruck.github.io/bin-it-right/
pnpm demo:record http://localhost:4791/bin-it-right/   # or any other build
```

It needs `ffmpeg` with libx264 and libass, and a Chromium binary (set `CHROMIUM_PATH`, or keep Playwright's browser cache in `~/.cache/ms-playwright`).
The run takes about three minutes and writes four files to `submission/video/`, which is git-ignored:

- `bin-it-right-demo-captioned.mp4`: 1920 by 1080, H.264, English captions burned in, no audio.
- `bin-it-right-demo-nocaptions.mp4`: the same footage without captions, for a narrated version.
- `bin-it-right-demo.srt`: the captions, timed to the footage, for uploading as a subtitle track.
- `timed-script.md`: the captions as a timed script.

The script, `scripts/record-demo.ts`, walks the scenes in `submission/VIDEO_SCRIPT.md`.
Each caption's start and end are taken from the recording itself, so the subtitles stay in sync when pauses change.
The page is laid out at 1280 CSS pixels and drawn at 1.5 times, and ffmpeg adds a plain 80-pixel bar with the app's name above it.
The frame shows no address bar and the recording never opens other websites, so no third-party names or logos appear.

## Add a voice instead of captions

Record yourself reading `submission/video/timed-script.md` against the uncaptioned video, then:

```sh
scripts/add-narration.sh voice.m4a            # writes submission/video/bin-it-right-demo-narrated.mp4
```

The video keeps its full length: a shorter recording is padded with silence and a longer one is cut.

## Check the result

Extract one frame per caption and look at it before uploading:

```sh
ffmpeg -ss 30 -i submission/video/bin-it-right-demo-captioned.mp4 -frames:v 1 frame.png
```

The hackathon allows 2 to 3 minutes; the recording is about 2 minutes 30 seconds.
