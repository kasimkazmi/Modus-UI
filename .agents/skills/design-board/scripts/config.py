# Reads a capture config and prints it as shell variables for capture.sh.
import json, os, shlex, sys
c = json.load(open(sys.argv[1]))
d = os.path.dirname(sys.argv[1])
p = lambda v: os.path.abspath(os.path.join(d, v))
print(f"OUT={shlex.quote(p(c['out']))}")
print(f"BASE={shlex.quote(c['baseUrl'].rstrip('/'))}")
print(f"START={shlex.quote(c.get('start', '/'))}")
print(f"FLOW={shlex.quote(p(c['flow']) if c.get('flow') else '')}")
print(f"LOGO={shlex.quote(c.get('logoSelector', 'header img'))}")
print(f"WIRE_EXTRA={shlex.quote(c.get('wireCss', ''))}")
comp = c.get('components') or {}
print(f"COMPONENTS={shlex.quote(comp.get('path', ''))}")
print(f"COMP_SELECTOR={shlex.quote(comp.get('selector', '[data-board]'))}")
print(f"COMP_SCALE={shlex.quote(str(comp.get('scale', 2)))}")
print(f"CANVAS={shlex.quote(c.get('board', {}).get('canvas', '#E5E5E5'))}")
sizes = c.get('sizes', {"phone": [390, 710], "tablet": [820, 1180], "tabletLandscape": [1180, 820], "desktop": [1440, 900]})
wire = c.get('wireframeSizes', ["phone", "tablet", "desktop"])
runs = [f"c {w} {h}" for w, h in sizes.values()] + [f"w {sizes[k][0]} {sizes[k][1]}" for k in wire]
print(f"RUNS={shlex.quote(chr(10).join(runs))}")
pages = c.get('pages', [])
print(f"PAGES={shlex.quote(chr(10).join(pg['name'] + ' ' + pg['path'] for pg in pages))}")
