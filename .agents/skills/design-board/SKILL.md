---
name: design-board
description: Captures a running web app's screens at phone, tablet and desktop sizes, makes greyscale wireframes of the same screens, and composes them into one Figma-style presentation board. Every screen sits full size in an iPhone, iPad or browser-window frame with its caption, alongside a cover, the wireframes and the component sheet, rendered to a single big PNG. Use when the user asks for a "design board", "device mockups", "wireframes", a "Figma-style presentation" or "Figma-like design view", "show all pages/screens in one big image", "show it on phone, tablet and desktop", or wants to present a UI flow or redesign as a whole.
---

# Design board: screens, device frames and wireframes in one picture

The output is one big picture of the whole design, like a Figma canvas: a cover, then a section per
device class with every screen full size inside a device frame, a wireframe section and the
component sheet. The screens are the running app, not drawings, so what the board shows is what the
user will get.

This skill is the presentation workflow only. It carries no colours, themes or style rules for the
app being shown; the app's own design is whatever it is. The board's chrome (canvas, frames,
captions) is neutral grey.

Scripts live in `<skill>/scripts`; `<skill>` is this skill's folder. They need bash, Python 3 with
Pillow and the `agent-browser` CLI (`npm i -g agent-browser`). Run every command with bash and full paths.

## 1. Plan the board before capturing

Decide, from the user's request and the app:

- **The flow**: the screens in order, and the states worth showing (empty, filled, error, a sheet
  or dialog open, the end screen). Filled-in states make better mockups than empty forms.
- **Extra pages**: dead ends and one-off pages (not found, expired link, sign-in).
- **Sizes**: phone 390 × 710 (Safari's visible area on an iPhone; the frame draws the status bar
  and Safari's bottom bar around it), tablet portrait 820 × 1180, tablet landscape 1180 × 820,
  desktop 1440 × 900. Drop sizes the user doesn't need.
- **Wireframe sizes**: usually phone, tablet portrait and desktop.
- **Component sheet**: a page that renders the components in each state, if the app has one,
  split into groups (colour, type, buttons, fields, choices, navigation, alerts, numbers, dialogs),
  each a heading, a one-line rule and every variant, size and state. Each group goes on the board
  as its own piece, so mark each group with one class (e.g. `.group`). A buttons group is a grid:
  variants down the side; large, default, small, hover/focus and disabled across; then a row of
  icon, icon-only and busy buttons.
- **The cover**: one sentence for the idea, the palette chips the user agreed (taken from the app,
  not invented), and three or four notes on the decisions.

## 2. Write the config and the flow script

Copy `<skill>/examples/config.example.json` and `<skill>/examples/flow.example.sh` into a board
folder at the repo root, `design-board/<app>/`, and gitignore `design-board/*/board/`. Paths in the config are relative to
the config file.

Config keys:

| Key                       | Meaning                                                                                                                                                                                                               |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `out`                     | Folder for captures and the board.                                                                                                                                                                                    |
| `baseUrl`, `start`        | The app's origin and the flow's first page.                                                                                                                                                                           |
| `flow`                    | The flow script (below). Omit to capture only `pages`.                                                                                                                                                                |
| `pages`                   | `[{ "name", "path" }]`: single pages, shot at every size as a screen and full length.                                                                                                                                 |
| `components`              | `{ "path", "selector", "scale" }`: the component sheet page, the selector for its groups and the pixel density (default 2). Each group is shot on its own over the board canvas into `components/01.png`, `02.png`... |
| `sizes`, `wireframeSizes` | Sizes by name; wireframes use the named ones.                                                                                                                                                                         |
| `logoSelector`            | CSS selector for the logo, drawn as a hatched box in wireframes.                                                                                                                                                      |
| `wireCss`                 | Extra CSS for wireframes, e.g. `:root{--brand:#888}` for project tokens the default grey set misses.                                                                                                                  |
| `board`                   | The board: `width`, `font` (local font file for captions), `url` (shown in the address pills), `statusBar` (status bar colour, to match the app's top edge), `cover`, `sections`.                                     |

A section is `{ "title", "text", "groups": [...] }`, or one group inline. A group is
`{ "device", "dir", "frames": [["file", "Caption"], ...], "perRow", "note", "joinRow" }`, where `device` is
`phone`, `tablet`, `browser`, `plain` (wireframes, the component sheet) or `full` (a long scroll
strip), `joinRow: true` continues the previous row instead of starting a new one (a full-length
strip beside the phones, a landscape tablet beside the portrait ones), and `dir` is a capture folder such as `c-390` (colour) or `w-1440` (wireframe). A frame can
also be `{ "src", "name", "device", "note" }` for a file anywhere under `out`.

The components section is `{ "title", "text", "components": true }`: every shot in `components/`
laid straight on the canvas, large and unframed, flowing left to right like pieces on a Figma
page. `"zoom"` scales them (default 1: one image pixel per board pixel, so a 2x capture shows at
twice its CSS size). Never put the component sheet in a frame; it reads too small.

The flow script is bash, sourced once per size and mode after the start page is open. It uses the
helpers in `scripts/lib.sh`:

- `view NAME` shoots the screen as the device shows it.
- `full NAME` shoots the whole page as one tall screen.
- `top` scrolls up first.
- `w MS` waits.
- `k DIGITS` types into segmented inputs such as dates.
- `go URL` opens and styles a new page.
- `js CODE` clicks what the accessibility tree can't reach.
- `$a` is the browser for anything else (`$a find label "Email" fill ...`).

Use the same file names at every size so sections can point at any size's folder.

## 3. Capture

```bash
bash <skill>/scripts/capture.sh /path/to/config.json
```

It runs the flow at every size in colour (`c-<width>/`) and at the wireframe sizes as wireframes
(`w-<width>/`), then the extra pages and the component groups (`components/`). Wireframes are the same screens with
the colour tokens set to neutral greys, everything greyscale and the logo a hatched box. For one
page alone: `bash <skill>/scripts/shot.sh <width> <height> <url> <out.png>`.

## 4. Build the board

```bash
bash <skill>/scripts/build.sh /path/to/config.json
```

It writes `board.html` in `out` and renders `board.png` at full size and `board-half.jpg` at half
size. Each frame is captioned with its name and size.

## 5. Slop check, before showing anything

Open the PNG (and crops of it with Pillow at readable size) and check every frame:

- [ ] No dev overlays, error toasts, cookie banners or debug badges on any screen.
- [ ] No placeholder or test data that reads as fake ("Lorem", "asdf", "test test"), unless agreed.
- [ ] Nothing cut off by a device's rounded corners, status bar or Safari bar. Buttons sit clear of
      the bottom edge.
- [ ] Every screen comes from the current build. Re-capture after each change; don't mix rounds.
- [ ] The same screen has the same file name and state at every size, so rows compare like with like.
- [ ] No near-empty or broken frames: images loaded, fonts loaded, no layout overflow or horizontal
      scroll.
- [ ] Captions are true: the name matches the screen, the size matches the capture.
- [ ] Wireframes show no leftover colour or logo.
- [ ] The cover's palette chips are the app's real colours, and its notes describe what the screens
      show.
- [ ] The board isn't lopsided: no section with one tiny frame on a huge empty row. Use `perRow`.
- [ ] Components are large and sit on the canvas, not in a frame; each group shows every variant,
      size and state, and no page surface shows around a group.

If a design-review or anti-slop skill is installed (look in `~/.claude/skills`), its checks can run
on the app's own pages too. This skill doesn't depend on one.

## Gotchas

- **zsh doesn't split words.** `for s in "390 844"; do set -- $s` fails in zsh; run scripts with
  bash (`bash -c '...'` for one-off loops).
- **Sticky and fixed elements.** `screenshot --full` stitches the page and draws sticky bars and
  fixed panels in the wrong place. Shoot full length by resizing the viewport to `scrollHeight`
  (`full` and `shot.sh` do this).
- **One browser session per size.** Sessions are named `db<mode><width>`, so runs don't share
  viewports or state. A flow that saves progress in `sessionStorage` resumes mid-flow on the next
  run in the same session; `capture.sh` closes each session after its run.
- **Live backends.** A flow that submits forms writes data every run, and capture runs it five to
  seven times. Point it at a mock or a mode that holds writes back. Never capture against a live
  system that books, charges or emails for real.
- **Board height.** Chrome won't capture a screen taller than 16384px; `render.sh` shoots taller
  boards in slices and stitches them, so height is no reason to shrink or cram a section.
- **Apps that re-render on resize.** `components.sh` grows the viewport to the page height before
  it marks the groups; an app that rebuilds its DOM on resize would otherwise drop the marks.
- **Full length is capped at 16384px.** `full` shoots only the first 16384px of a taller page. Pages
  sized in `vh` also grow when the viewport is made tall, so a full-length shot of a long page is
  rarely worth it; pick pages that are a few screens long.
- **Scroll-in animations.** Elements that animate in on scroll (framer-motion `whileInView`) can show
  blank in a full-length shot. Check the strip, and drop it if it has empty gaps.
- **Leftover sessions.** A run killed midway leaves its browser session open and signed in, so the
  next run's sign-in screen is really the dashboard. Close them first:
  `agent-browser --session db<mode><width> close`.
- **Labels.** `find label` needs the label tied to its input (`htmlFor`/`id`). Where it isn't, use
  `find placeholder`.
- **Caption font.** Point `board.font` at a font file on disk (e.g. the app's own from
  `node_modules/@fontsource*`); a web font URL won't load from a `file://` page.
