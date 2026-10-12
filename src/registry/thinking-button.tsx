"use client";
// Ported from ThreeUI Community's Thinking Button (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

export interface ThinkingButtonProps {
  /** Word drawn on the button. */
  label?: string;
  /** Scene theme; picks the default background and plate colours. */
  mode?: "dark" | "light";
  /** Scene background colour. Defaults to the mode's colour. */
  backgroundColor?: string;
  /** Three plate gradient stops (top, middle, bottom). Defaults to the mode's colours. */
  plateColors?: [string, string, string];
  /** Hue rotation in degrees (-180 to 180). */
  hue?: number;
  /** Saturation multiplier (0 to 2). */
  saturation?: number;
  /** Brightness multiplier (0.35 to 1.65). */
  brightness?: number;
  className?: string;
}

/* reference frame: everything authored in a 2048px square */
const REF = 2048;
const SCL = 0.49; /* hero button -> normal button */
const CX = (1024 - 22) / SCL;
const CY = (1024 + 11.5) / SCL;
const PW = 1010;
const PH = 345;
const PR = 100;
const GAP = 50;
const TW = PW + 2 * GAP;
const TH = PH + 2 * GAP;
const TR = PR + GAP;
const TRACK_W = 13;
const CORE_W = 14;
const GLOW_W = 12;
const DUR = 2.7; /* one lap of the trace = one loop */
const TAIL = 0.389; /* comet length, in laps */
const SHIM_OFF = 0.898;
const TXT_W = 450;
const TXT_CAP = 79;
const TXT_BASE = CY + 38;
const BR_R = 13;
const BR_SP = 40;
const BR_GAP = 78;
const BR_W = BR_SP + 2 * BR_R;
const BR_SHIFT = (BR_W + BR_GAP) / 2;
/* the terminal 'dots' spinner, as raised-dot masks: bit 0..2 = left column top->bottom, 3..5 = right */
const BRAILLE = [0x0b, 0x19, 0x39, 0x38, 0x3c, 0x34, 0x26, 0x27, 0x07, 0x0f];
const BR_STEPS = 30;
const FONT = '300 100px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const SW = TW - 2 * TR;
const SH = TH - 2 * TR;
const ARC = (Math.PI * TR) / 2;
const PERIM = 2 * SW + 2 * SH + 4 * ARC;
const L = CX - TW / 2;
const T = CY - TH / 2;
const R = CX + TW / 2;
const B = CY + TH / 2;

const TAPER = [
  1.16, 1.09, 1.03, 1.0, 1.02, 1.0, 1.0, 1.0, 1.0, 0.98, 0.97, 0.94, 0.91, 0.89, 0.84, 0.77, 0.74,
  0.65, 0.61, 0.52, 0.43, 0.4, 0.27, 0.23, 0.17, 0.12, 0.075, 0.02, 0,
];
const TSTEP = TAIL / (TAPER.length - 1);

const MODES = {
  dark: {
    background: "#111318",
    plate: ["#2563eb", "#1d4ed8", "#1e40af"] as [string, string, string],
  },
  light: {
    background: "#f4f7fb",
    plate: ["#60a5fa", "#3b82f6", "#2563eb"] as [string, string, string],
  },
};

function rrPath(
  c: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  r: number,
) {
  const x = cx - w / 2;
  const y = cy - h / 2;
  c.beginPath();
  c.moveTo(x + r, y);
  c.lineTo(x + w - r, y);
  c.arcTo(x + w, y, x + w, y + r, r);
  c.lineTo(x + w, y + h - r);
  c.arcTo(x + w, y + h, x + w - r, y + h, r);
  c.lineTo(x + r, y + h);
  c.arcTo(x, y + h, x, y + h - r, r);
  c.lineTo(x, y + r);
  c.arcTo(x, y, x + r, y, r);
  c.closePath();
}

/* point on the track outline at arc length s, clockwise from the top-left tangent point */
function ptAt(s: number): [number, number] {
  s = s - Math.floor(s / PERIM) * PERIM;
  let a: number;
  if (s < SW) return [L + TR + s, T];
  s -= SW;
  if (s < ARC) {
    a = s / TR;
    return [R - TR + TR * Math.sin(a), T + TR - TR * Math.cos(a)];
  }
  s -= ARC;
  if (s < SH) return [R, T + TR + s];
  s -= SH;
  if (s < ARC) {
    a = s / TR;
    return [R - TR + TR * Math.cos(a), B - TR + TR * Math.sin(a)];
  }
  s -= ARC;
  if (s < SW) return [R - TR - s, B];
  s -= SW;
  if (s < ARC) {
    a = s / TR;
    return [L + TR - TR * Math.sin(a), B - TR + TR * Math.cos(a)];
  }
  s -= ARC;
  if (s < SH) return [L, B - TR - s];
  s -= SH;
  a = s / TR;
  return [L + TR - TR * Math.cos(a), T + TR - TR * Math.sin(a)];
}

function taper(u: number) {
  if (u < 0 || u >= TAIL) return 0;
  const f = u / TSTEP;
  const i = Math.floor(f);
  return TAPER[i] + (TAPER[i + 1] - TAPER[i]) * (f - i);
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function ThinkingButton({
  label = "Thinking",
  mode = "dark",
  backgroundColor,
  plateColors,
  hue = 0,
  saturation = 1,
  brightness = 1,
  className,
}: ThinkingButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const background = backgroundColor ?? MODES[mode].background;
  const plateKey = (plateColors ?? MODES[mode].plate).join(",");

  useEffect(() => {
    const stage = stageRef.current;
    const cv = canvasRef.current;
    const ctx = cv?.getContext("2d");
    if (!stage || !cv || !ctx) return;
    const plateStops = plateKey.split(",");
    const glc = document.createElement("canvas");
    const gx = glc.getContext("2d")!; /* comet, glow tint */
    const co = document.createElement("canvas");
    const cox = co.getContext("2d")!; /* comet, core tint */
    let S = 0;
    let k = 1;
    let dpr = 1;
    const canFilter = (() => {
      const t = document.createElement("canvas").getContext("2d")!;
      t.filter = "blur(2px)";
      return t.filter !== "none";
    })();

    let glyphs: { ch: string; w: number }[] = [];
    let fontPx = 169;
    let tracking = 0;
    let textX = 0;
    let brailleX = 0;

    function fitText() {
      const word = label;
      const n = word.length;
      const probe = 200;
      if (!n) {
        glyphs = [];
        return;
      }
      ctx!.setTransform(1, 0, 0, 1, 0, 0);
      ctx!.font = FONT.replace("100px", probe + "px");
      const cap = ctx!.measureText("U").actualBoundingBoxAscent || probe * 0.7;
      fontPx = (probe * (TXT_CAP * k)) / cap;
      ctx!.font = FONT.replace("100px", fontPx + "px");
      glyphs = [];
      let advSum = 0;
      for (let i = 0; i < n; i++) {
        const m = ctx!.measureText(word[i]);
        glyphs.push({ ch: word[i], w: m.width });
        if (i < n - 1) advSum += m.width;
      }
      const lead = ctx!.measureText(word[0]).actualBoundingBoxLeft;
      const trail = ctx!.measureText(word[n - 1]).actualBoundingBoxRight;
      tracking = n > 1 ? (TXT_W * k - trail - lead - advSum) / (n - 1) : 0;
      textX = (CX + 4) * k - (TXT_W * k) / 2 + lead + BR_SHIFT * k;
      brailleX = (CX + 4) * k - ((BR_W + BR_GAP + TXT_W) * k) / 2 + BR_R * k;
    }

    function paintComet(
      c: CanvasRenderingContext2D,
      head: number,
      col: number[],
      hot: number[],
      width: number,
    ) {
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, c.canvas.width, c.canvas.height);
      c.lineCap = "round";
      c.lineWidth = width * k;
      const step = 6;
      const n = Math.ceil((TAIL * PERIM) / step);
      for (let i = n; i >= 1; i--) {
        const s1 = head - i * step;
        const s0 = head - (i - 1) * step;
        const a = taper((i * step) / PERIM);
        if (a <= 0.002) continue;
        const f = Math.min(a, 1.3);
        const x = Math.max(0, f - 1);
        const r = Math.round(Math.min(255, col[0] * f + hot[0] * x));
        const g = Math.round(Math.min(255, col[1] * f + hot[1] * x));
        const b = Math.round(Math.min(255, col[2] * f + hot[2] * x));
        const p1 = ptAt(s1);
        const mid = ptAt((s1 + s0) / 2);
        const p0 = ptAt(s0);
        c.strokeStyle = "rgb(" + r + "," + g + "," + b + ")";
        c.beginPath();
        c.moveTo(p1[0] * k, p1[1] * k);
        c.lineTo(mid[0] * k, mid[1] * k);
        c.lineTo(p0[0] * k, p0[1] * k);
        c.stroke();
      }
    }

    function plate(c: CanvasRenderingContext2D) {
      const y = CY - PH / 2;
      const grd = c.createLinearGradient(0, y * k, 0, (y + PH) * k);
      grd.addColorStop(0, plateStops[0]);
      grd.addColorStop(0.55, plateStops[1]);
      grd.addColorStop(1, plateStops[2]);
      rrPath(c, CX * k, CY * k, PW * k, PH * k, PR * k);
      c.fillStyle = grd;
      c.fill();
      c.lineWidth = 5 * k;
      const hg = c.createLinearGradient(0, y * k, 0, (y + PH) * k);
      hg.addColorStop(0, "rgba(226,233,255,0.125)");
      hg.addColorStop(0.1, "rgba(226,233,255,0)");
      hg.addColorStop(0.9, "rgba(80,100,255,0)");
      hg.addColorStop(1, "rgba(80,100,255,0.22)");
      rrPath(c, CX * k, CY * k, (PW - 13) * k, (PH - 13) * k, (PR - 6.5) * k);
      c.strokeStyle = hg;
      c.stroke();
    }

    /* the spinner is drawn as dots rather than braille glyphs */
    function braille(c: CanvasRenderingContext2D, ph: number) {
      const mask = BRAILLE[Math.floor(ph * BR_STEPS) % BRAILLE.length];
      const cy = (CY - 1.5) * k;
      const r = BR_R * k;
      const sp = BR_SP * k;
      for (let b = 0; b < 6; b++) {
        const on = (mask >> b) & 1;
        c.beginPath();
        c.arc(
          brailleX + (b < 3 ? 0 : sp),
          cy + ((b % 3) - 1) * sp,
          on ? r : r * 0.7,
          0,
          Math.PI * 2,
        );
        c.fillStyle = on ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.16)";
        c.fill();
      }
    }

    function drawLabel(c: CanvasRenderingContext2D, ph: number) {
      /* shimmer: a soft band ping-pongs across the word, twice per lap */
      let q = ph - SHIM_OFF;
      q -= Math.floor(q);
      const u = q < 0.5 ? q / 0.5 : (1 - q) / 0.5;
      const x0 = textX;
      const w = TXT_W * k;
      const bc = x0 + w * (-0.2375 + 1.475 * u);
      const bw = w * 0.22;
      const g = c.createLinearGradient(bc - bw, 0, bc + bw, 0);
      g.addColorStop(0, "rgb(219,234,254)");
      g.addColorStop(0.3, "rgb(239,246,255)");
      g.addColorStop(0.5, "rgb(255,255,255)");
      g.addColorStop(0.7, "rgb(239,246,255)");
      g.addColorStop(1, "rgb(219,234,254)");
      c.fillStyle = g;
      c.strokeStyle = g;
      c.font = FONT.replace("100px", fontPx + "px");
      c.textBaseline = "alphabetic";
      let x = textX;
      for (let i = 0; i < glyphs.length; i++) {
        c.fillText(glyphs[i].ch, x, TXT_BASE * k);
        c.lineWidth = 1.9 * k;
        c.strokeText(glyphs[i].ch, x, TXT_BASE * k);
        x += glyphs[i].w + tracking;
      }
    }

    function render(t: number) {
      if (!S) return;
      let ph = (t / DUR) % 1;
      if (ph < 0) ph += 1;
      const head = ph * PERIM;
      const c = ctx!;
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalCompositeOperation = "source-over";
      c.globalAlpha = 1;
      c.filter = "none";
      c.fillStyle = background;
      c.fillRect(0, 0, cv!.width, cv!.height);

      rrPath(c, CX * k, CY * k, TW * k, TH * k, TR * k);
      c.lineWidth = TRACK_W * k;
      c.strokeStyle = "rgba(120,140,255,0.048)";
      c.stroke();

      paintComet(gx, head, [95, 125, 242], [50, 70, 120], GLOW_W);
      paintComet(cox, head, [82, 90, 110], [70, 60, 40], CORE_W);
      c.globalCompositeOperation = "lighter";
      if (canFilter) {
        c.filter = "blur(" + 28 * k + "px)";
        c.globalAlpha = 0.62;
        c.drawImage(glc, 0, 0);
        c.filter = "blur(" + 8 * k + "px)";
        c.globalAlpha = 0.45;
        c.drawImage(glc, 0, 0);
        c.filter = "blur(" + 1.8 * k + "px)";
        c.globalAlpha = 1;
        c.drawImage(co, 0, 0);
        c.filter = "none";
      } else {
        c.shadowColor = "rgba(88,122,255,0.9)";
        c.shadowBlur = 26 * k;
        c.globalAlpha = 0.7;
        c.drawImage(glc, 0, 0);
        c.shadowBlur = 8 * k;
        c.globalAlpha = 0.8;
        c.drawImage(glc, 0, 0);
        c.shadowBlur = 0;
        c.globalAlpha = 1;
        c.drawImage(co, 0, 0);
      }
      c.globalAlpha = 1;
      c.globalCompositeOperation = "source-over";

      plate(c);
      braille(c, ph);
      drawLabel(c, ph);
    }

    let now = 0;
    let last: number | null = null;
    let raf = 0;
    let visible = true;

    function resize() {
      S = stage!.clientWidth || 1;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv!.width = glc.width = co.width = Math.round(S * dpr);
      cv!.height = glc.height = co.height = Math.round(S * dpr);
      k = ((S * dpr) / REF) * SCL;
      fitText();
      render(now);
    }

    function frame(ts: number) {
      if (last != null) now = (now + (ts - last) / 1000) % DUR;
      last = ts;
      render(now);
      raf = requestAnimationFrame(frame);
    }
    function start() {
      cancelAnimationFrame(raf);
      last = null;
      if (prefersReducedMotion || !visible || document.hidden) return;
      raf = requestAnimationFrame(frame);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(stage);
    const io = new IntersectionObserver(([e]) => {
      visible = e?.isIntersecting ?? true;
      start();
    });
    io.observe(stage);
    const onVis = () => start();
    document.addEventListener("visibilitychange", onVis);
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (cancelled) return;
      fitText();
      render(now);
    });
    resize();
    start();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [label, background, plateKey, prefersReducedMotion]);

  const filter =
    hue === 0 && saturation === 1 && brightness === 1
      ? undefined
      : `hue-rotate(${clamp(hue, -180, 180)}deg) saturate(${clamp(saturation, 0, 2)}) brightness(${clamp(brightness, 0.35, 1.65)})`;

  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        "absolute inset-0 flex items-center justify-center overflow-hidden [container-type:size]",
        className,
      )}
      style={{ background, filter }}
    >
      <div
        ref={stageRef}
        className="relative"
        style={{
          background,
          width: "min(100cqw, 100cqh)",
          height: "min(100cqw, 100cqh)",
        }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />
      </div>
    </div>
  );
}
