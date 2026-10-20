#!/usr/bin/env bash
# Usage: typography.sh <url> <scale> <out.png>
# Reads the type styles the page really uses (display, headings, body, link, button, caption), then
# draws a specimen of them inside the running page, so every sample is set in the app's own loaded
# font, and shoots just that panel at <scale>x pixel density.
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
url=$1; scale=$2; out=$3
a="agent-browser --session dbtypography"
# Reusing the session name right after a run closes it can reach the old daemon as it shuts down.
$a set viewport 1440 900 "$scale" >/dev/null 2>&1 || { sleep 2; $a set viewport 1440 900 "$scale" >/dev/null; }
$a open "$url" >/dev/null; $a wait 3000 >/dev/null
n=$($a eval "$(cat "$here/../assets/typography.js")" | tr -d '"')
[ "$n" -gt 0 ] || { echo "No text styles found on $url" >&2; $a close >/dev/null || true; exit 1; }
# The panel is shot whole only if it fits in the viewport.
h=$($a eval 'Math.ceil(document.querySelector("[data-board-type]").getBoundingClientRect().height)' | tr -d '"')
$a set viewport 1440 "$h" "$scale" >/dev/null; $a wait 600 >/dev/null
mkdir -p "$(dirname "$out")"
$a screenshot "[data-board-type]" "$out" >/dev/null
$a close >/dev/null || true
echo "$n type styles in $out"
