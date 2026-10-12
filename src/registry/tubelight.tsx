"use client";
// Ported from ThreeUI Community's Neon Sign (MIT, © 2026 Meng To).

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface TubelightProps {
  className?: string;
  /** Lettering, set in the theme's heading serif; "\n" starts a new line. */
  text?: string;
  /** "dark" lights the tubes; "light" shows unlit daylight glass on paper. "auto" follows the site theme. */
  mode?: "auto" | "dark" | "light";
  /** Bend a framing tube around the lettering, fed by two electrodes. */
  frame?: boolean;
  /** Stage colour. Defaults to the theme background. */
  backgroundColor?: string;
  /** Final-frame grade, in degrees. */
  hue?: number;
  saturation?: number;
  brightness?: number;
}

type Glyph = { ch: string; x: number; y: number };
type Hsl = { h: number; s: number; l: number };
type Theme = { primary: Hsl; fg: Hsl; font: string; light: boolean };

const P = Math.PI;
const DEFAULT_TEXT = "Modus";
const SPILL_S = 0.34;
const BLOOM_S = 0.5;

function hsl(c: Hsl, a = 1, l = c.l, s = c.s) {
  return `hsla(${c.h} ${s}% ${l}% / ${a})`;
}
function readTheme(mode: TubelightProps["mode"]): Theme {
  const root = document.documentElement;
  const cs = getComputedStyle(root);
  const parse = (name: string): Hsl => {
    const [h, s, l] = cs
      .getPropertyValue(name)
      .trim()
      .split(/\s+/)
      .map((v) => parseFloat(v));
    return { h: h || 0, s: s || 0, l: l || 50 };
  };
  const probe = document.createElement("span");
  probe.className = "font-serif";
  probe.style.display = "none";
  document.body.appendChild(probe);
  const font = getComputedStyle(probe).fontFamily || "Georgia, serif";
  probe.remove();
  const light = mode === "auto" ? !root.classList.contains("dark") : mode === "light";
  return { primary: parse("--primary"), fg: parse("--foreground"), font, light };
}

function mk(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

/** A sign: serif glyphs stroked as outline tubing plus an optional rounded frame tube. */
type Sign = { glyphs: Glyph[]; frame: Path2D | null; ends: { x: number; y: number }[] };

function scale(x: CanvasRenderingContext2D, k: number) {
  x.setTransform(k, 0, 0, k, 0, 0);
}
function strokePass(
  x: CanvasRenderingContext2D,
  sign: Sign,
  font: string,
  w: number,
  blur: number,
  col: string,
  alpha: number,
  op: GlobalCompositeOperation = "lighter",
  dx = 0,
  dy = 0,
) {
  x.save();
  x.lineCap = "round";
  x.lineJoin = "round";
  if (blur > 0.25) x.filter = `blur(${blur.toFixed(2)}px)`;
  x.globalCompositeOperation = op;
  x.globalAlpha = alpha;
  x.lineWidth = w;
  x.strokeStyle = col;
  x.font = font;
  x.textBaseline = "alphabetic";
  x.translate(dx, dy);
  for (const g of sign.glyphs) x.strokeText(g.ch, g.x, g.y);
  if (sign.frame) x.stroke(sign.frame);
  x.restore();
}

/** Colour recipe per mode: lit gas on dark, or unlit tinted glass in daylight. */
function paintTubes(
  x: CanvasRenderingContext2D,
  sign: Sign,
  font: string,
  tube: number,
  t: Theme,
  lit: boolean,
) {
  const p = t.primary;
  const glowS = Math.max(p.s, 45);
  if (!t.light) {
    // glass wall, then the lit core in three heats
    strokePass(x, sign, font, tube, 0, hsl(p, 0.22, 18, glowS), 1, "source-over");
    if (!lit) return;
    strokePass(x, sign, font, tube * 0.88, tube * 0.1, hsl(p, 1, 55, glowS), 1);
    strokePass(x, sign, font, tube * 0.54, tube * 0.06, hsl(p, 1, 76, glowS), 1);
    strokePass(x, sign, font, tube * 0.24, tube * 0.035, hsl(p, 1, 97, p.s * 0.3), 1);
    return;
  }
  // daylight: a cast shadow on paper, tinted glass, the unlit gas channel and a specular streak
  strokePass(
    x,
    sign,
    font,
    tube,
    tube * 0.5,
    hsl(t.fg, 0.16),
    1,
    "source-over",
    tube * 0.35,
    tube * 0.9,
  );
  strokePass(x, sign, font, tube, 0, hsl(p, 0.28, Math.min(p.l + 30, 70), glowS), 1, "source-over");
  strokePass(
    x,
    sign,
    font,
    tube * 0.32,
    0,
    hsl(p, lit ? 1 : 0.6, Math.min(p.l + 18, 46), glowS),
    1,
    "source-over",
  );
  strokePass(
    x,
    sign,
    font,
    tube * 0.18,
    tube * 0.05,
    "rgba(255,255,255,0.85)",
    1,
    "source-over",
    -tube * 0.12,
    -tube * 0.22,
  );
}

function glow(sign: Sign, font: string, tube: number, t: Theme, W: number, H: number, k: number) {
  const c = mk(W * k, H * k);
  const x = c.getContext("2d")!;
  scale(x, k);
  const p = t.primary;
  const s = Math.max(p.s, 45);
  if (t.light) {
    strokePass(x, sign, font, tube * 1.6, tube * 0.9, hsl(p, 1, 60, s), 0.12, "source-over");
  } else {
    strokePass(x, sign, font, tube * 2.6, tube * 1.75, hsl(p, 1, 55, s), 0.3);
    strokePass(x, sign, font, tube * 1.34, tube * 0.58, hsl(p, 1, 70, s), 0.45);
  }
  return c;
}

function electrodes(x: CanvasRenderingContext2D, ends: Sign["ends"], tube: number, t: Theme) {
  const p = t.primary;
  x.save();
  for (const e of ends) {
    x.beginPath();
    x.moveTo(e.x, e.y);
    x.lineTo(e.x, e.y + tube * 2.2);
    x.lineCap = "round";
    x.lineWidth = tube * 0.5;
    x.strokeStyle = hsl(t.fg, t.light ? 0.55 : 0.35, t.light ? 25 : 12);
    x.stroke();
    x.beginPath();
    x.arc(e.x, e.y, tube * 0.75, 0, P * 2);
    x.fillStyle = hsl(t.fg, 1, t.light ? 22 : 8);
    x.fill();
    if (!t.light) {
      const g = x.createRadialGradient(e.x, e.y, 0, e.x, e.y, tube * 1.4);
      g.addColorStop(0, hsl(p, 0.9, 92, 40));
      g.addColorStop(0.3, hsl(p, 0.5, 60, Math.max(p.s, 45)));
      g.addColorStop(1, hsl(p, 0, 50));
      x.globalCompositeOperation = "lighter";
      x.beginPath();
      x.arc(e.x, e.y, tube * 1.4, 0, P * 2);
      x.fillStyle = g;
      x.fill();
      x.globalCompositeOperation = "source-over";
    }
  }
  x.restore();
}

export function Tubelight({
  className,
  text = DEFAULT_TEXT,
  mode = "auto",
  frame = true,
  backgroundColor,
  hue = 0,
  saturation = 1,
  brightness = 1,
}: TubelightProps) {
  const prefersReducedMotion = useReducedMotion();
  const boardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [themeKey, setThemeKey] = useState(0);

  // re-resolve tokens when the site theme or palette changes, and once the serif has loaded
  useEffect(() => {
    const bump = () => setThemeKey((k) => k + 1);
    const mo = new MutationObserver(bump);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "style"],
    });
    document.fonts?.ready.then(bump);
    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    const board = boardRef.current;
    const cv = canvasRef.current;
    if (!board || !cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = !!prefersReducedMotion;
    const theme = readTheme(mode);
    const LINES = text.split("\n").filter((l) => l.trim().length);

    let W = 0;
    let H = 0;
    let BASE: HTMLCanvasElement | null = null;
    let WLIT: HTMLCanvasElement | null = null;
    let dirty = { x: 0, y: 0, w: 0, h: 0 };
    let composed = false;
    let lastF = -1;

    function layout() {
      const m = mk(1, 1).getContext("2d")!;
      const font = (px: number) => `400 ${px}px ${theme.font}`;
      m.font = font(100);
      const widths = LINES.map((l) => m.measureText(l).width / 100);
      const lineH = 1.02;
      const blockW = Math.max(...widths);
      const blockH = LINES.length * lineH;
      const padX = frame ? 0.34 : 0.1;
      const padY = frame ? 0.3 : 0.1;
      const size = Math.min((W * 0.86) / (blockW + padX * 2), (H * 0.8) / (blockH + padY * 2));
      const tube = Math.max(1.5, size * 0.026);
      const x0 = (W - blockW * size) / 2;
      const y0 = (H - blockH * size) / 2;
      m.font = font(size);
      const glyphs: Glyph[] = [];
      LINES.forEach((line, i) => {
        const lx = x0 + ((blockW - widths[i]) * size) / 2;
        const by = y0 + (i * lineH + 0.78) * size;
        const chars = [...line];
        chars.forEach((ch, j) => {
          if (!ch.trim()) return;
          const before = m.measureText(chars.slice(0, j).join("")).width;
          glyphs.push({ ch, x: lx + before, y: by });
        });
      });
      let framePath: Path2D | null = null;
      const ends: Sign["ends"] = [];
      if (frame) {
        const fx = x0 - padX * size;
        const fy = y0 - padY * size * 0.75;
        const fw = (blockW + padX * 2) * size;
        const fh = (blockH + padY * 1.6) * size;
        const r = size * 0.16;
        const gap = size * 0.1;
        const cx = fx + fw / 2;
        const bottom = fy + fh;
        framePath = new Path2D();
        framePath.moveTo(cx - gap, bottom);
        framePath.arcTo(fx, bottom, fx, fy, r);
        framePath.arcTo(fx, fy, fx + fw, fy, r);
        framePath.arcTo(fx + fw, fy, fx + fw, bottom, r);
        framePath.arcTo(fx + fw, bottom, cx, bottom, r);
        framePath.lineTo(cx + gap, bottom);
        ends.push({ x: cx - gap, y: bottom }, { x: cx + gap, y: bottom });
      }
      return { glyphs, framePath, ends, tube, size, font: font(size) };
    }

    function bake() {
      const L = layout();
      // the flickering letter: second from the end of the last line
      const flickIdx = Math.max(0, L.glyphs.length - 2);
      const flick = L.glyphs[flickIdx];
      const steady: Sign = {
        glyphs: L.glyphs.filter((_, i) => i !== flickIdx),
        frame: L.framePath,
        ends: L.ends,
      };
      const one: Sign = { glyphs: flick ? [flick] : [], frame: null, ends: [] };
      const all: Sign = { glyphs: L.glyphs, frame: L.framePath, ends: L.ends };

      const base = mk(W, H);
      const b = base.getContext("2d")!;
      b.globalCompositeOperation = theme.light ? "source-over" : "lighter";
      b.drawImage(glow(steady, L.font, L.tube, theme, W, H, SPILL_S), 0, 0, W, H);
      if (!theme.light) b.drawImage(glow(steady, L.font, L.tube, theme, W, H, BLOOM_S), 0, 0, W, H);
      b.globalCompositeOperation = "source-over";
      // the dark glass of every tube, the flicker letter included, then the lit cores
      if (!theme.light) paintTubes(b, all, L.font, L.tube, theme, false);
      paintTubes(b, steady, L.font, L.tube, theme, true);
      if (theme.light && one.glyphs.length) paintTubes(b, one, L.font, L.tube, theme, false);
      electrodes(b, L.ends, L.tube, theme);
      BASE = base;

      const lit = mk(W, H);
      const w = lit.getContext("2d")!;
      if (flick) {
        w.drawImage(glow(one, L.font, L.tube, theme, W, H, SPILL_S), 0, 0, W, H);
        paintTubes(w, one, L.font, L.tube, theme, true);
        const pad = L.size * 0.9;
        dirty = {
          x: Math.max(0, Math.floor(flick.x - pad)),
          y: Math.max(0, Math.floor(flick.y - L.size - pad)),
          w: 0,
          h: 0,
        };
        dirty.w = Math.min(W - dirty.x, Math.ceil(L.size * 0.8 + pad * 2));
        dirty.h = Math.min(H - dirty.y, Math.ceil(L.size * 1.2 + pad * 2));
      } else {
        dirty = { x: 0, y: 0, w: 0, h: 0 };
      }
      WLIT = lit;
    }

    function compose(f: number) {
      if (!BASE || !ctx) return;
      const r = dirty.w > 0 && composed ? dirty : { x: 0, y: 0, w: W, h: H };
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.clearRect(r.x, r.y, r.w, r.h);
      ctx.drawImage(BASE, r.x, r.y, r.w, r.h, r.x, r.y, r.w, r.h);
      if (f > 0.002 && WLIT) {
        ctx.globalCompositeOperation = theme.light ? "source-over" : "lighter";
        ctx.globalAlpha = f;
        ctx.drawImage(WLIT, r.x, r.y, r.w, r.h, r.x, r.y, r.w, r.h);
      }
      composed = true;
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      lastF = f;
    }

    /* the flicker: a seeded schedule of dips on one letter, quickened for the preview as in ThreeUI */
    let fseed = 0x1981;
    const frnd = () => {
      fseed = (Math.imul(fseed, 1103515245) + 12345) >>> 0;
      return fseed / 4294967296;
    };
    type Ev = { t0: number; dur: number; segs: { d: number; v: number }[] };
    let ev: Ev | null = null;
    let clock = 0;
    function nextEvent(after: number): Ev {
      const segs: { d: number; v: number }[] = [];
      const n = 1 + (frnd() < 0.42 ? 1 : 0);
      for (let i = 0; i < n; i++) {
        segs.push({ d: 0.2 + frnd() * 0.26, v: 0.22 + frnd() * 0.4 });
        segs.push({ d: 0.24 + frnd() * 0.34, v: 1 });
      }
      const total = segs.reduce((a, s) => a + s.d, 0);
      return { t0: after + 1.25 + frnd() * 1.75, dur: total, segs };
    }
    function level(t: number) {
      if (!ev) ev = nextEvent(0.55);
      while (t > ev.t0 + ev.dur) ev = nextEvent(ev.t0 + ev.dur);
      if (t < ev.t0) return 1;
      let u = t - ev.t0;
      let prev = 1;
      for (const s of ev.segs) {
        if (u < s.d) {
          let p = u / s.d;
          p = p * p * (3 - 2 * p);
          return prev + (s.v - prev) * p;
        }
        u -= s.d;
        prev = s.v;
      }
      return 1;
    }

    function resize() {
      const w = Math.round(board!.clientWidth);
      const h = Math.round(board!.clientHeight);
      if (!w || !h || !LINES.length) return;
      if (w === W && h === H) return;
      W = w;
      H = h;
      cv!.width = W;
      cv!.height = H;
      bake();
      composed = false;
      compose(reduce ? 1 : level(clock));
    }

    let raf = 0;
    let last = 0;
    let visible = true;
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      clock += dt;
      const f = level(clock);
      if (Math.abs(f - lastF) > 0.008) compose(f);
    };
    const start = () => {
      if (reduce || raf || !visible || document.hidden) return;
      last = 0;
      raf = requestAnimationFrame(tick);
    };

    resize();
    let rt = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(rt);
      if (!W) resize();
      else rt = window.setTimeout(resize, 180);
    });
    ro.observe(board);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
        else stop();
      },
      { threshold: 0.01 },
    );
    io.observe(board);
    start();

    return () => {
      stop();
      window.clearTimeout(rt);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [text, mode, frame, prefersReducedMotion, themeKey]);

  const background = backgroundColor ?? "hsl(var(--background))";
  const safeHue = Math.min(180, Math.max(-180, hue));
  const safeSaturation = Math.min(2, Math.max(0, saturation));
  const safeBrightness = Math.min(1.65, Math.max(0.35, brightness));
  const grade =
    safeHue === 0 && safeSaturation === 1 && safeBrightness === 1
      ? undefined
      : `hue-rotate(${safeHue}deg) saturate(${safeSaturation}) brightness(${safeBrightness})`;

  return (
    <div
      className={cn(
        "relative flex h-full w-full items-center justify-center overflow-hidden",
        className,
      )}
      style={{ background, filter: grade }}
    >
      <div
        ref={boardRef}
        className="relative aspect-video max-h-[calc(100%-32px)] w-[min(calc(100%-32px),1040px)]"
      >
        <motion.canvas
          ref={canvasRef}
          aria-hidden="true"
          className="block h-full w-full"
          style={{ transformOrigin: "50% 52%", willChange: "transform, opacity" }}
          initial={false}
          animate={
            prefersReducedMotion
              ? { y: 0, scale: 1, opacity: 1 }
              : {
                  y: [3, -3, 0, 3],
                  scale: [0.988, 1, 0.996, 0.988],
                  opacity: [0.88, 1, 0.96, 0.88],
                }
          }
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : {
                  duration: 5.6,
                  times: [0, 0.45, 0.68, 1],
                  ease: [0.22, 1, 0.36, 1],
                  repeat: Infinity,
                }
          }
        />
        <span className="sr-only">{text.replace(/\n/g, " ")}</span>
      </div>
    </div>
  );
}
