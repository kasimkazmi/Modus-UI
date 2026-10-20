// Run in the page by scripts/typography.sh: measures the type styles in use and draws a
// specimen panel of them, set in the page's own fonts. Returns how many styles it found.
(() => {
  const ROLES = [
    ["Display", "h1"],
    ["Heading 2", "h2"],
    ["Heading 3", "h3"],
    ["Heading 4", "h4"],
    ["Body", "main p, p"],
    ["Link", "nav a, header a"],
    ["Button", "button, a[class*='btn'], [role='button']"],
    ["Caption", "small, figcaption, label"],
  ];
  // next/font names faces like __Inter_d65c78; show the real family and drop its fallback face.
  const family = (stack) =>
    stack
      .split(",")
      .map((f) => f.trim().replace(/^["']|["']$/g, ""))
      .map((f) => f.replace(/^__(.+?)_[0-9a-f]{5,}$/, "$1").replace(/_/g, " "))
      .find((f) => !/fallback/i.test(f)) || stack;
  // Plain text only: a logo link's mark and stacked lines would run together as one sample.
  const visible = (el) =>
    el.offsetHeight > 0 &&
    getComputedStyle(el).visibility !== "hidden" &&
    el.textContent.trim().length > 1 &&
    !el.querySelector("img, svg, div, p");

  // Words in their own boxes (inline-block tags, block lines) are spaced by layout, not by a space
  // character, so a box boundary counts as a word break.
  const raw = (n) =>
    n.nodeType === 3
      ? n.textContent
      : n.nodeType !== 1
        ? ""
        : getComputedStyle(n).display === "none"
          ? ""
          : (getComputedStyle(n).display === "inline" ? "" : " ") +
            [...n.childNodes].map(raw).join("") +
            (getComputedStyle(n).display === "inline" ? "" : " ");
  const text = (el) => [...el.childNodes].map(raw).join("").replace(/\s+/g, " ").trim();
  const styleOf = (el, role) => {
    const cs = getComputedStyle(el);
    return {
      role,
      stack: cs.fontFamily,
      family: family(cs.fontFamily),
      weight: cs.fontWeight,
      style: cs.fontStyle,
      size: cs.fontSize,
      line: cs.lineHeight,
      tracking: cs.letterSpacing,
      transform: cs.textTransform,
    };
  };
  const keyOf = (s) => [s.family, s.weight, s.size, s.transform].join("|");

  // Each role takes the style that sets the most text on the page, so one decorative element
  // (a giant watermark, a label inside a mockup) doesn't stand in for the whole role.
  const styles = [];
  const seen = new Set();
  for (const [role, sel] of ROLES) {
    const groups = new Map();
    for (const el of document.querySelectorAll(sel)) {
      if (!visible(el)) continue;
      const s = styleOf(el, role);
      const t = text(el);
      const g = groups.get(keyOf(s)) || { s, chars: 0, sample: "" };
      g.chars += t.length;
      if (t.length > g.sample.length) g.sample = t;
      groups.set(keyOf(s), g);
    }
    const best = [...groups.values()].sort((x, y) => y.chars - x.chars)[0];
    if (!best || seen.has(keyOf(best.s))) continue;
    seen.add(keyOf(best.s));
    styles.push({ ...best.s, text: best.sample.slice(0, 70) });
  }

  const families = new Map();
  for (const s of styles) {
    if (!families.has(s.family)) families.set(s.family, { stack: s.stack, weights: new Set() });
    families.get(s.family).weights.add(s.weight);
  }

  const el = (tag, css, text) => {
    const n = document.createElement(tag);
    n.style.cssText = css;
    if (text != null) n.textContent = text;
    return n;
  };
  const UI = "font-family:system-ui,-apple-system,sans-serif;";
  const panel = el(
    "div",
    "all:initial;display:block;position:absolute;top:0;left:0;z-index:2147483647;width:1440px;box-sizing:border-box;padding:72px 80px;background:#fff;color:#111;border-radius:24px;",
  );
  panel.dataset.boardType = "";

  const fams = el("div", "display:flex;flex-wrap:wrap;gap:24px;margin-bottom:64px;");
  for (const [name, f] of families) {
    const card = el("div", "flex:1 1 360px;padding:32px;border-radius:16px;background:#f4f4f4;");
    card.append(el("div", `font-family:${f.stack};font-size:96px;line-height:1;color:#111;`, "Aa"));
    card.append(el("div", UI + "font-size:22px;font-weight:600;margin-top:20px;color:#111;", name));
    card.append(
      el(
        "div",
        UI + "font-size:16px;margin-top:6px;color:#666;",
        "Weights " + [...f.weights].sort().join(", "),
      ),
    );
    fams.append(card);
  }
  panel.append(fams);

  for (const s of styles) {
    const row = el(
      "div",
      "display:grid;grid-template-columns:260px 1fr;gap:40px;align-items:baseline;padding:28px 0;border-top:1px solid #e6e6e6;",
    );
    const meta = el("div", UI);
    meta.append(el("div", UI + "font-size:18px;font-weight:600;color:#111;", s.role));
    const MAX = 140;
    const px = parseFloat(s.size);
    const scale = px > MAX ? MAX / px : 1;
    const spec = [
      s.family,
      s.weight + (s.style === "italic" ? " italic" : ""),
      `${s.size} / ${s.line}`,
      s.tracking !== "normal" ? `tracking ${s.tracking}` : "",
      s.transform !== "none" ? s.transform : "",
      scale < 1 ? `shown at ${Math.round(scale * 100)}%` : "",
    ].filter(Boolean);
    meta.append(
      el("div", UI + "font-size:15px;line-height:1.5;margin-top:6px;color:#666;", spec.join(" · ")),
    );
    const fit = (v) => (v.endsWith("px") ? `${parseFloat(v) * scale}px` : v);
    const sample = el(
      "div",
      `font-family:${s.stack};font-weight:${s.weight};font-style:${s.style};font-size:${fit(s.size)};line-height:${fit(s.line)};letter-spacing:${fit(s.tracking)};text-transform:${s.transform};color:#111;overflow:hidden;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;`,
      s.text,
    );
    row.append(meta, sample);
    panel.append(row);
  }
  document.body.append(panel);
  return styles.length;
})();
