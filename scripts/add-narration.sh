#!/bin/sh
# Lays a voice recording over the uncaptioned demo video.
# Usage: scripts/add-narration.sh voice.m4a [output.mp4]
# The video keeps its full length: a shorter recording is padded with silence, a longer one is cut.
# Read submission/video/timed-script.md while recording so the words match the footage.
set -eu
if [ "$#" -lt 1 ]; then
  echo "usage: $0 voice-recording [output.mp4]" >&2
  exit 2
fi
voice=$1
here=$(cd "$(dirname "$0")/.." && pwd)
video="$here/submission/video/bin-it-right-demo-nocaptions.mp4"
out=${2:-"$here/submission/video/bin-it-right-demo-narrated.mp4"}
if [ ! -f "$video" ]; then
  echo "missing $video; run 'pnpm demo:record' first" >&2
  exit 1
fi
if [ ! -f "$voice" ]; then
  echo "missing voice recording: $voice" >&2
  exit 1
fi
ffmpeg -hide_banner -loglevel error -y -i "$video" -i "$voice" \
  -map 0:v:0 -map 1:a:0 -c:v copy -af apad -c:a aac -b:a 160k -shortest -movflags +faststart "$out"
echo "wrote $out"
