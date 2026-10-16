#!/usr/bin/env bash
# Usage: build.sh <config.json> — writes the board's HTML from the captures, then renders it.
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
read -r board width < <(python3 "$here/board.py" "$1")
"$here/render.sh" "$board" "$width"
