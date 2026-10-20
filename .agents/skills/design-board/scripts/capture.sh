#!/usr/bin/env bash
# Usage: capture.sh <config.json>
# Walks the project's flow at every configured size, in colour ("c") and, where configured, as a
# wireframe ("w"), then shoots the extra pages and the component sheet. Output: <out>/<mode>-<width>/.
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
cfg=$(realpath "$1")
cd "$(dirname "$cfg")"   # relative paths in the config are relative to it

eval "$(python3 "$here/config.py" "$cfg")"
mkdir -p "$OUT"
cssdir=$(mktemp -d)
cp "$here/../assets/hide-dev.css" "$cssdir/c.css"
{ cat "$here/../assets/hide-dev.css"; sed "s|LOGO_SELECTOR|$LOGO|" "$here/../assets/wire.css"; echo "$WIRE_EXTRA"; } > "$cssdir/w.css"

# Own file descriptors, so nothing a flow runs can read the remaining runs off stdin.
while read -r MODE W H <&3; do
  [ -z "${MODE:-}" ] && continue
  out="$OUT/$MODE-$W"; CSS_FILE="$cssdir/$MODE.css"
  mkdir -p "$out"; echo "$MODE-$W ($W x $H)"
  # shellcheck source=lib.sh
  source "$here/lib.sh"
  $a set viewport "$W" "$H" >/dev/null
  if [ -n "$FLOW" ]; then go "$BASE$START"; source "$FLOW"; fi
  while read -r name path <&4; do
    [ -z "${name:-}" ] && continue
    go "$BASE$path"; top; view "$name"; full "$name-full"
  done 4<<< "$PAGES"
  $a close >/dev/null || true
done 3<<< "$RUNS"

if [ -n "$COMPONENTS" ]; then
  "$here/components.sh" "$BASE$COMPONENTS" "$COMP_SELECTOR" "$COMP_SCALE" "$CANVAS" "$OUT/components" "$cssdir/c.css"
fi
if [ -n "$TYPOGRAPHY" ]; then
  rm -rf "$OUT/typography"
  "$here/typography.sh" "$BASE$TYPOGRAPHY" "$TYPO_SCALE" "$OUT/typography/01.png"
fi
rm -rf "$cssdir"
echo "Captures in $OUT"
