#!/usr/bin/env bash
# Usage: components.sh <url> <selector> <scale> <canvas> <out-dir> <css-file>
# Shoots every element matching <selector> on the component page as its own PNG (01.png, 02.png, ...)
# at <scale>x pixel density, over the board's <canvas> colour so it sits straight on the board.
set -euo pipefail
url=$1; sel=$2; scale=$3; canvas=$4; dir=$5; css=$6
a="agent-browser --session dbcomponents"
q=$(python3 -c 'import json,sys; print(json.dumps(sys.argv[1]))' "$sel")
rm -rf "$dir"; mkdir -p "$dir"
$a set viewport 1440 900 "$scale" >/dev/null
$a open "$url" >/dev/null; $a wait 2500 >/dev/null
$a eval "(() => { const s = document.createElement('style'); s.textContent = $(python3 -c 'import json,sys; print(json.dumps(open(sys.argv[1]).read()))' "$css") + 'html,body{background:$canvas!important}'; document.head.appendChild(s); })()" >/dev/null
h=$($a eval 'document.documentElement.scrollHeight' | tr -d '"')
$a set viewport 1440 "$h" "$scale" >/dev/null; $a wait 1200 >/dev/null
# Marked after the resize: apps that re-render on resize would drop the marks.
# Every ancestor of a group takes the canvas colour too, so no page surface shows around it
n=$($a eval "(() => { const els = [...document.querySelectorAll($q)]; els.forEach((el, i) => { el.dataset.boardPart = i + 1; for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) p.style.background = 'transparent'; }); return els.length })()" | tr -d '"')
[ "$n" -gt 0 ] || { echo "No element matches $sel on $url" >&2; $a close >/dev/null || true; exit 1; }
for i in $(seq 1 "$n"); do
  $a screenshot "[data-board-part=\"$i\"]" "$dir/$(printf %02d "$i").png" >/dev/null
done
$a close >/dev/null || true
echo "$n components in $dir"
