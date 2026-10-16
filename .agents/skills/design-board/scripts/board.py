#!/usr/bin/env python3
"""Writes a Figma-style presentation board (one HTML page) from the captures and the config.

Usage: board.py <config.json>   -> <out>/<board.file, default board.html>; prints its path and width.

Frames are drawn in CSS: an iPhone with status bar, dynamic island and Safari's bottom bar; an
iPad; a browser window with traffic lights and an address pill; a plain outlined box for
wireframes; a flat strip for full-length scrolls. Every frame is captioned with its name and size.
"""
import html, json, os, sys
from PIL import Image

cfg_path = os.path.abspath(sys.argv[1])
cfg_dir = os.path.dirname(cfg_path)
c = json.load(open(cfg_path))
b = c["board"]
here = lambda v: os.path.abspath(os.path.join(cfg_dir, v))
OUT = here(c["out"])
FILE = os.path.join(OUT, b.get("file", "board.html"))
WIDTH = b.get("width", 5200)
URL = html.escape(b.get("url", "example.com"))
BAR = b.get("statusBar", "#F5F5F5")
INK = b.get("statusInk", "#111")
CANVAS = b.get("canvas", "#E5E5E5")
TEXT = b.get("ink", "#1A1A1A")
QUIET = b.get("quiet", "#6B6B6B")
font = here(b["font"]) if b.get("font") else None

e = html.escape
rel = lambda p: os.path.relpath(p, OUT)
signal = '<svg width="18" height="12" viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5" width="3" height="7" rx="1"/><rect x="10" y="2.5" width="3" height="9.5" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>'
battery = '<svg width="27" height="13" viewBox="0 0 27 13"><rect x=".5" y=".5" width="23" height="12" rx="3.5" fill="none" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="20" height="9" rx="2"/><rect x="25" y="4.5" width="1.5" height="4" rx=".75" opacity=".4"/></svg>'


def size(src):
    with Image.open(os.path.join(OUT, src)) as im:
        return im.size


def caption(name, note):
    return f'<figcaption>{e(name)}<span>{e(note)}</span></figcaption>'


def frame(device, src, name, note=None):
    w, h = size(src)
    img = f'<img src="{e(src)}" width="{w}" height="{h}">'
    if device == "phone":
        return f'''<figure class="dev">{caption(name, note or "iPhone · Safari")}<div class="phone" style="width:{w + 28}px"><div class="bar" style="background:{BAR};color:{INK}"><b>9:41</b><i class="island"></i><span>{signal}{battery}</span></div>{img}<div class="safari"><div>aA<span>{URL}</span>↻</div><i></i></div></div></figure>'''
    if device == "tablet":
        return f'''<figure class="dev">{caption(name, note or f"iPad · {w} × {h}")}<div class="tablet"><div class="tbar" style="background:{BAR};color:{INK}"><b>9:41 Thu</b><span>{signal}{battery}</span></div>{img}</div></figure>'''
    if device == "browser":
        return f'''<figure class="dev">{caption(name, note or f"Desktop · {w} × {h}")}<div class="browser"><div class="chrome"><i></i><i></i><i></i><div class="url">{URL}</div></div>{img}</div></figure>'''
    if device == "full":
        return f'<figure class="dev">{caption(name, note or "Full length")}<img class="flat" src="{e(src)}" width="{w}"></figure>'
    return f'<figure class="dev">{caption(name, note or f"{w} × {h}")}<img class="wire" src="{e(src)}" width="{w}" height="{h}"></figure>'


def group_rows(g):
    frames = [frame(f.get("device", g.get("device", "plain")), f["src"] if "src" in f else f'{g["dir"]}/{f["file"]}.png', f["name"], f.get("note", g.get("note")))
              for f in ({"file": x[0], "name": x[1]} if isinstance(x, list) else x for x in g["frames"])]
    per = g.get("perRow", len(frames))
    return [frames[i:i + per] for i in range(0, len(frames), per)]


def components(s):
    """The component shots, laid straight on the canvas at full pixel size: no frame, no caption."""
    d = os.path.join(OUT, "components")
    files = sorted(f for f in os.listdir(d) if f.endswith(".png"))
    zoom = s.get("zoom", 1)  # 1 = one image pixel per board pixel (a 2x capture shows at twice its CSS size)
    items = "".join(f'<img src="components/{f}" width="{round(size("components/" + f)[0] * zoom)}">' for f in files)
    return f'<section><h2>{e(s["title"])}</h2><p>{e(s.get("text", ""))}</p><div class="parts">{items}</div></section>'


def section(s):
    if s.get("components"):
        return components(s)
    rows = []
    for g in s.get("groups", [s]):
        new = group_rows(g)
        # joinRow: the group's first row continues the previous row instead of starting its own
        if g.get("joinRow") and rows:
            rows[-1] += new.pop(0)
        rows += new
    body = "".join(f'<div class="row">{"".join(r)}</div>' for r in rows)
    return f'<section><h2>{e(s["title"])}</h2><p>{e(s.get("text", ""))}</p>{body}</section>'


cov = b.get("cover", {})
logo = f'<img class="logo" src="{e(rel(here(cov["logo"])))}">' if cov.get("logo") else ""
chips = "".join(f'<div><i style="background:{hx}"></i>{e(n)}<span>{hx}</span></div>' for n, hx in cov.get("palette", []))
notes = "".join(f"<li><b>{e(t)}</b> {e(d)}</li>" for t, d in cov.get("notes", []))
idea = f'<div class="idea"><h2>{e(cov.get("ideaLabel", "The idea"))}</h2><q>{e(cov["idea"])}</q><ul>{notes}</ul></div>' if cov.get("idea") else ""
cover = f'''<div class="cover" style="background:{cov.get("background", "#FFFFFF")}"><div>{logo}<h1>{cov.get("title", "")}</h1><p>{e(cov.get("subtitle", ""))}</p><div class="chips">{chips}</div></div>{idea}</div>''' if cov else ""

fontface = f'@font-face {{ font-family: Board; src: url("file://{font}"); font-weight: 100 900; }}' if font else ""
page = f'''<!doctype html><html><head><meta charset="utf-8"><style>
{fontface}
* {{ box-sizing: border-box; margin: 0; }}
body {{ background: {CANVAS}; font-family: Board, Inter, system-ui, sans-serif; color: {TEXT}; width: {WIDTH}px; padding: 200px; }}
.cover {{ display: grid; grid-template-columns: 1.1fr 1fr; gap: 160px; border-radius: 48px; padding: 140px; margin-bottom: 220px; }}
.cover .logo {{ height: 120px; background: #fff; border-radius: 20px; padding: 18px 24px; margin-bottom: 90px; }}
.cover h1 {{ font-size: 170px; line-height: .95; letter-spacing: -.04em; font-weight: 650; }}
.cover p {{ font-size: 46px; line-height: 1.4; color: {QUIET}; margin-top: 60px; max-width: 28ch; }}
.idea {{ background: #F5F5F5; border-radius: 36px; padding: 80px; align-self: start; }}
.idea h2 {{ font-size: 40px; color: {QUIET}; font-weight: 500; margin-bottom: 28px; }}
.idea q {{ display: block; font-size: 64px; line-height: 1.2; letter-spacing: -.02em; font-weight: 600; quotes: none; }}
.idea ul {{ list-style: none; padding: 0; margin-top: 64px; display: grid; gap: 30px; font-size: 34px; line-height: 1.45; color: {QUIET}; }}
.idea li b {{ color: {TEXT}; }}
.chips {{ display: flex; flex-wrap: wrap; gap: 24px; margin-top: 64px; }}
.chips div {{ font-size: 26px; color: {QUIET}; }} .chips span {{ display: block; font-size: 22px; opacity: .8; }}
.chips i {{ display: block; width: 150px; height: 110px; border-radius: 24px; margin-bottom: 14px; box-shadow: inset 0 0 0 2px #0000000f; }}
section {{ margin-bottom: 220px; }}
section > h2 {{ font-size: 92px; letter-spacing: -.03em; font-weight: 650; }}
section > p {{ font-size: 38px; color: {QUIET}; margin: 18px 0 90px; max-width: 70ch; }}
.row {{ display: flex; gap: 120px; align-items: flex-end; margin-bottom: 140px; }}
figcaption {{ font-size: 30px; color: {QUIET}; margin-bottom: 26px; display: flex; gap: 18px; align-items: baseline; }}
figcaption span {{ color: #8C8C8C; font-size: 24px; }}
.phone {{ background: #111; padding: 14px; border-radius: 68px; box-shadow: 0 0 0 3px #2b2b2b, 0 40px 90px #0000003a; overflow: hidden; }}
.phone .bar {{ height: 54px; border-radius: 54px 54px 0 0; display: flex; align-items: center; justify-content: space-between; padding: 6px 34px 0 46px; font-size: 19px; position: relative; }}
.phone .bar span, .tbar span {{ display: flex; gap: 8px; align-items: center; fill: currentColor; }}
.island {{ position: absolute; left: 50%; top: 12px; transform: translateX(-50%); width: 122px; height: 36px; border-radius: 20px; background: #000; }}
.phone img {{ display: block; }}
.safari {{ height: 80px; background: {BAR}; border-radius: 0 0 54px 54px; padding: 10px 16px 0; display: flex; flex-direction: column; align-items: center; gap: 14px; }}
.safari div {{ width: 100%; height: 44px; border-radius: 14px; background: #fff; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; font-size: 17px; color: #1A1A1A; box-shadow: 0 1px 4px #0000001a; }}
.safari span {{ font-size: 16px; }}
.safari i {{ width: 134px; height: 5px; border-radius: 3px; background: #111; }}
.tablet {{ background: #141414; padding: 26px; border-radius: 52px; box-shadow: 0 0 0 3px #2b2b2b, 0 40px 90px #0000003a; }}
.tbar {{ height: 30px; border-radius: 28px 28px 0 0; display: flex; justify-content: space-between; align-items: center; padding: 0 28px; font-size: 17px; }}
.tablet img {{ display: block; border-radius: 0 0 28px 28px; }}
.browser {{ border-radius: 18px; overflow: hidden; box-shadow: 0 0 0 1px #00000014, 0 40px 90px #0000002e; background: #fff; }}
.chrome {{ height: 64px; background: #EBEBEB; display: flex; align-items: center; gap: 12px; padding: 0 24px; }}
.chrome i {{ width: 16px; height: 16px; border-radius: 50%; }}
.chrome i:nth-child(1) {{ background: #F0605A; }} .chrome i:nth-child(2) {{ background: #F5BD4F; }} .chrome i:nth-child(3) {{ background: #5FC454; }}
.url {{ margin: 0 auto; background: #FFFFFF; border-radius: 12px; padding: 10px 160px; font-size: 20px; color: {QUIET}; }}
.browser img {{ display: block; }}
.parts {{ display: flex; flex-wrap: wrap; gap: 140px 160px; align-items: flex-start; }}
.parts img {{ display: block; height: auto; }}
.wire, .flat {{ display: block; border-radius: 10px; box-shadow: 0 0 0 2px #00000012, 0 20px 50px #00000014; }}
</style></head><body>
{cover}
{"".join(section(s) for s in b.get("sections", []))}
</body></html>'''
os.makedirs(OUT, exist_ok=True)
open(FILE, "w").write(page)
print(FILE, WIDTH)
