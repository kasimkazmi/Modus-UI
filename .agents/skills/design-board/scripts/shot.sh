#!/usr/bin/env bash
# Usage: shot.sh <width> <height> <url> <out.png> [css-file]
# One page as one tall screen: the viewport grows to the page's height, so sticky and fixed parts
# render where they would. The optional CSS is injected first (e.g. to hide the dev badge).
set -euo pipefail
W=$1; H=$2; url=$3; png=$4; css=${5:-$(dirname "$0")/../assets/hide-dev.css}
a="agent-browser --session dbshot$W"
$a set viewport "$W" "$H" >/dev/null
$a open "$url" >/dev/null; $a wait 2500 >/dev/null
$a eval "(() => { const s = document.createElement('style'); s.textContent = $(python3 -c 'import json,sys; print(json.dumps(open(sys.argv[1]).read()))' "$css"); document.head.appendChild(s); })()" >/dev/null
h=$($a eval 'document.documentElement.scrollHeight' | tr -d '"'); [ "$h" -lt "$H" ] && h=$H
$a set viewport "$W" "$h" >/dev/null; $a wait 800 >/dev/null
mkdir -p "$(dirname "$png")"; $a screenshot "$png" >/dev/null
$a close >/dev/null || true
echo "$png ($W x $h)"
