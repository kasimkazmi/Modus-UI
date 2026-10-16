# Helpers for a capture flow. Sourced by capture.sh with W, H, MODE, out and CSS_FILE set.
# A flow script calls these; it never needs to know which size or mode it runs in.
a="agent-browser --session db${MODE}${W}"

# wait <ms>
w() { $a wait "$1" >/dev/null; }
# Types a string one key at a time, e.g. into a date input's segments: k 14031962
k() { local d; for d in $(echo "$1" | grep -o .); do $a press "$d" >/dev/null; done; }
# Injects the mode's CSS (dev badge hidden; greys and logo placeholder in wireframe mode).
# Call again after any full page load; client-side steps keep it.
restyle() {
  $a eval "(() => { const s = document.createElement('style'); s.textContent = $(python3 -c 'import json,sys; print(json.dumps(open(sys.argv[1]).read()))' "$CSS_FILE"); document.head.appendChild(s); })()" >/dev/null
}
# go <url> [settle ms]: opens a page and styles it.
go() { $a open "$1" >/dev/null; w "${2:-2000}"; restyle; }
# Runs page JavaScript, for clicks the accessibility tree can't reach.
js() { $a eval "$1" >/dev/null; }
top() { $a eval 'window.scrollTo(0,0)' >/dev/null; w 400; }
# view <name>: what the device's screen shows right now.
view() { $a screenshot "$out/$1.png" >/dev/null; echo "  $MODE-$W/$1"; }
# full <name>: the whole page as one tall screen. Resizing the viewport, rather than --full,
# keeps sticky and fixed parts where they belong.
full() {
  local h; h=$($a eval 'document.documentElement.scrollHeight' | tr -d '"')
  [ "$h" -lt "$H" ] && h=$H
  [ "$h" -gt 16384 ] && h=16384   # Chrome won't capture a taller screen
  $a set viewport "$W" "$h" >/dev/null; w 500
  $a screenshot "$out/$1.png" >/dev/null
  $a set viewport "$W" "$H" >/dev/null; w 300
  echo "  $MODE-$W/$1"
}
