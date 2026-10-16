#!/usr/bin/env bash
# Usage: render.sh <board.html> [width]
# Renders the board as one PNG at full size, plus a half-size JPG to share. Chrome won't capture a
# screen taller than 16384px, so a taller board is shot in slices and stitched.
set -euo pipefail
board=$(realpath "$1"); W=${2:-5200}
a="agent-browser --session dbboard"
SLICE=8000
png="${board%.html}.png"
tmp=$(mktemp -d)
$a set viewport "$W" 1000 >/dev/null
$a open "file://$board" >/dev/null; $a wait 2500 >/dev/null
h=$($a eval 'document.documentElement.scrollHeight' | tr -d '"')
if [ "$h" -le 16384 ]; then
  $a set viewport "$W" "$h" >/dev/null; $a wait 3000 >/dev/null
  $a screenshot "$tmp/0.png" >/dev/null
else
  # Slice by slice: a viewport of SLICE px, scrolled down one slice at a time; the last slice
  # scrolls only as far as the page goes, so the stitch crops its overlap.
  $a set viewport "$W" "$SLICE" >/dev/null; $a wait 3000 >/dev/null
  i=0
  for ((y = 0; y < h; y += SLICE)); do
    $a eval "window.scrollTo(0, $y)" >/dev/null; $a wait 600 >/dev/null
    $a screenshot "$tmp/$i.png" >/dev/null; i=$((i + 1))
  done
fi
$a close >/dev/null || true
python3 - "$tmp" "$png" "$h" "$SLICE" <<'PY'
import os, sys
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
tmp, png, h, slice_ = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
parts = sorted((f for f in os.listdir(tmp) if f.endswith(".png")), key=lambda f: int(f[:-4]))
first = Image.open(os.path.join(tmp, parts[0]))
im = Image.new("RGB", (first.width, h))
for i, f in enumerate(parts):
    part = Image.open(os.path.join(tmp, f)).convert("RGB")
    y = i * slice_
    if y + part.height > h:  # the last slice was scrolled back up; keep only its new rows
        part = part.crop((0, part.height - (h - y), part.width, part.height))
    im.paste(part, (0, y))
im.save(png)
im.resize((im.width // 2, im.height // 2), Image.LANCZOS).save(png[:-4] + "-half.jpg", quality=90)
print(f"{png} ({im.width} x {im.height})")
print(png[:-4] + "-half.jpg")
PY
rm -rf "$tmp"
