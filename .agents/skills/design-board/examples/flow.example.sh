# Example flow: sourced by capture.sh once per size and mode, after the start page is open and
# styled. Use only the helpers from scripts/lib.sh ($a, w, k, go, js, top, view, full). Keep it
# idempotent: it runs 5 to 7 times. Never let it write to a real backend (see SKILL.md).

# Screen 1, filled in so the mockup shows real content
view 00-empty
$a find label "Full name" fill "Jordan Sample" >/dev/null
$a find label "Email" fill "jordan@example.com" >/dev/null
$a find role radio click --name "Text message" >/dev/null
top; view 01-details; full 01-details-full

# Screen 2
$a find role button click --name "Continue" >/dev/null; w 2000
top; view 02-choose

# A control the accessibility tree can't reach: click it from page JavaScript
js '(() => { const b = [...document.querySelectorAll("button")].find(b => /\d:\d\d/.test(b.textContent)); b && b.click() })()'
w 800; top; view 03-chosen

# The end of the flow
$a find role button click --name "Confirm" >/dev/null; w 4000
top; view 04-done
