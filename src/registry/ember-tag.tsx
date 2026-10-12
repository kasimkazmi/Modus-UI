"use client";
// Ported from ThreeUI Community's Spark Badge (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface EmberTagProps {
  /** Simulation speed multiplier (0 to 2). */
  speed?: number;
  /** Ember count multiplier (0.35 to 1.4). */
  particleAmount?: number;
  /** Rain count multiplier (0 to 1.5). */
  rainAmount?: number;
  /** Curl-noise turbulence multiplier (0 to 2). */
  turbulence?: number;
  /** Ember trail spread multiplier (0.5 to 1.75). */
  spread?: number;
  /** Scene background colour; `var(--token)` references are resolved from the theme. */
  backgroundColor?: string;
  /** Ember colour; `var(--token)` references are resolved from the theme. */
  color?: string;
  className?: string;
}

const TAU = Math.PI * 2;

/** Resolves `var(--token)` references against the document's theme, for use on a canvas. */
function resolveThemeColor(value: string) {
  const style = getComputedStyle(document.documentElement);
  return value.replace(/var\((--[\w-]+)\)/g, (_, name: string) =>
    style.getPropertyValue(name).trim(),
  );
}

/** True when the theme's background is dark, read from the lightness channel of `--background`. */
function themeIsDark() {
  const bg = getComputedStyle(document.documentElement).getPropertyValue("--background").trim();
  const lightness = parseFloat(bg.split(/\s+/)[2] ?? "100");
  return lightness < 50;
}

/* ------------------------------------------------------------------ *
 *  rng + noise
 * ------------------------------------------------------------------ */
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NS = 256,
  NM = NS - 1;
type Field = { cx: Float32Array; cy: Float32Array };

// tileable smooth scalar field -> its curl, precomputed once
function makeCurlField(seed: number): Field {
  const r = mulberry32(seed);
  const a = new Float32Array(NS * NS),
    b = new Float32Array(NS * NS);
  for (let i = 0; i < NS * NS; i++) a[i] = r();
  const R = 5;
  for (let p = 0; p < 3; p++) {
    for (let y = 0; y < NS; y++) {
      const o = y * NS;
      for (let x = 0; x < NS; x++) {
        let s = 0;
        for (let k = -R; k <= R; k++) s += a[o + ((x + k) & NM)];
        b[o + x] = s / (2 * R + 1);
      }
    }
    for (let x = 0; x < NS; x++) {
      for (let y = 0; y < NS; y++) {
        let s = 0;
        for (let k = -R; k <= R; k++) s += b[((y + k) & NM) * NS + x];
        a[y * NS + x] = s / (2 * R + 1);
      }
    }
  }
  let mn = Infinity,
    mx = -Infinity;
  for (let i = 0; i < NS * NS; i++) {
    if (a[i] < mn) mn = a[i];
    if (a[i] > mx) mx = a[i];
  }
  const sc = 2 / (mx - mn);
  for (let i = 0; i < NS * NS; i++) a[i] = (a[i] - mn) * sc - 1;
  const cx = new Float32Array(NS * NS),
    cy = new Float32Array(NS * NS);
  const H = 2;
  let vmax = 0;
  for (let y = 0; y < NS; y++)
    for (let x = 0; x < NS; x++) {
      const dy = a[((y + H) & NM) * NS + x] - a[((y - H + NS) & NM) * NS + x];
      const dx = a[y * NS + ((x + H) & NM)] - a[y * NS + ((x - H + NS) & NM)];
      const i = y * NS + x;
      cx[i] = dy;
      cy[i] = -dx;
      const m = Math.abs(dy) + Math.abs(dx);
      if (m > vmax) vmax = m;
    }
  const inv = 1.9 / vmax;
  for (let i = 0; i < NS * NS; i++) {
    cx[i] *= inv;
    cy[i] *= inv;
  }
  return { cx, cy };
}

function curlSample(F: Field, x: number, y: number, out: number[] | Float32Array) {
  x *= NS;
  y *= NS;
  let x0 = Math.floor(x),
    y0 = Math.floor(y);
  const fx = x - x0,
    fy = y - y0;
  x0 &= NM;
  y0 &= NM;
  const x1 = (x0 + 1) & NM,
    y1 = (y0 + 1) & NM;
  const u = fx * fx * (3 - 2 * fx),
    v = fy * fy * (3 - 2 * fy);
  const i00 = y0 * NS + x0,
    i01 = y0 * NS + x1,
    i10 = y1 * NS + x0,
    i11 = y1 * NS + x1;
  const ax = F.cx[i00] + (F.cx[i01] - F.cx[i00]) * u,
    bx = F.cx[i10] + (F.cx[i11] - F.cx[i10]) * u;
  const ay = F.cy[i00] + (F.cy[i01] - F.cy[i00]) * u,
    by = F.cy[i10] + (F.cy[i11] - F.cy[i10]) * u;
  out[0] = ax + (bx - ax) * v;
  out[1] = ay + (by - ay) * v;
}

/* ------------------------------------------------------------------ *
 *  figure — authored in art space (0..1 square), rasterised to a mask
 * ------------------------------------------------------------------ */
const MW = 768;
const AY0 = -0.55,
  AH = 1.55;
const MH = Math.round(MW * AH);

/* Per-region emission: [ink, drift]. */
const EMPH: Record<string, [number, number]> = {
  base: [1.0, 0.8],
  strap: [1.35, 1.15],
  clip: [2.3, 0.42],
  card: [1.95, 0.55],
  slot: [2.0, 0.2],
  rule: [1.05, 0.15],
  word: [1.75, 0.17],
  edition: [1.8, 0.18],
  window: [1.7, 0.16],
  meta: [1.15, 0.15],
  name: [2.1, 0.18],
  tier: [1.85, 0.17],
  qr: [1.45, 0.2],
};
const B = 78;
const W2G = (k: string) => {
  const e = EMPH[k];
  const r = Math.max(0, Math.min(255, Math.round(e[0] * B)));
  const g = Math.max(0, Math.min(255, Math.round(e[1] * B)));
  return "rgb(" + r + "," + g + ",0)";
};

type Ctx = CanvasRenderingContext2D;

function buildMasks() {
  const solid = document.createElement("canvas");
  solid.width = MW;
  solid.height = MH;
  const emph = document.createElement("canvas");
  emph.width = MW;
  emph.height = MH;
  const gm = solid.getContext("2d")!;
  const ge = emph.getContext("2d", { willReadFrequently: true })!;
  ge.fillStyle = W2G("base");
  ge.fillRect(0, 0, MW, MH);

  const S = MW;
  gm.translate(0, -AY0 * S);
  ge.translate(0, -AY0 * S);
  const key = (k: string) => {
    const c = W2G(k);
    gm.fillStyle = "white";
    gm.strokeStyle = "white";
    ge.fillStyle = c;
    ge.strokeStyle = c;
  };
  const both = (fn: (c: Ctx) => void) => {
    fn(gm);
    fn(ge);
  };

  const rr = (c: Ctx, x0: number, y0: number, x1: number, y1: number, r: number) => {
    const X0 = x0 * S,
      Y0 = y0 * S,
      X1 = x1 * S,
      Y1 = y1 * S,
      R = r * S;
    c.beginPath();
    c.moveTo(X0 + R, Y0);
    c.arcTo(X1, Y0, X1, Y1, R);
    c.arcTo(X1, Y1, X0, Y1, R);
    c.arcTo(X0, Y1, X0, Y0, R);
    c.arcTo(X0, Y0, X1, Y0, R);
    c.closePath();
  };
  const poly = (c: Ctx, a: number[][]) => {
    c.beginPath();
    c.moveTo(a[0][0] * S, a[0][1] * S);
    for (let i = 1; i < a.length; i++) c.lineTo(a[i][0] * S, a[i][1] * S);
    c.closePath();
  };
  const SC = 1.12;
  const tilt = (c: Ctx) => {
    c.save();
    c.translate(0.5 * S, 0.862 * S);
    c.scale(SC, SC);
    c.translate(-0.5 * S, -0.862 * S);
    c.translate(0.5 * S, 0.3 * S);
    c.rotate(-0.048);
    c.translate(-0.5 * S, -0.3 * S);
  };

  /* ---- lanyard: two ribbons rising out of frame to the clip ---- */
  key("strap");
  both((c) => {
    poly(c, [
      [-0.315, -0.55],
      [-0.236, -0.55],
      [0.5, 0.208],
      [0.46, 0.208],
    ]);
    c.fill();
  });
  both((c) => {
    poly(c, [
      [1.236, -0.55],
      [1.315, -0.55],
      [0.54, 0.208],
      [0.5, 0.208],
    ]);
    c.fill();
  });

  /* ---- clip and card ---- */
  key("clip");
  both((c) => {
    tilt(c);
    rr(c, 0.4536, 0.248, 0.5464, 0.306, 0.01);
    c.fill();
    c.restore();
  });
  key("card");
  both((c) => {
    tilt(c);
    rr(c, 0.312, 0.296, 0.688, 0.862, 0.024);
    c.fill();
    c.restore();
  });

  // snapshot the un-carved silhouette for rain occlusion
  const occ = document.createElement("canvas");
  occ.width = MW;
  occ.height = MH;
  occ.getContext("2d")!.drawImage(solid, 0, 0);

  gm.globalCompositeOperation = "destination-out";
  gm.lineCap = "round";
  gm.lineJoin = "round";
  ge.lineCap = "round";
  ge.lineJoin = "round";

  const cutRR = (x0: number, y0: number, x1: number, y1: number, r: number, k: string) => {
    rr(gm, x0, y0, x1, y1, r);
    gm.fill();
    ge.fillStyle = W2G(k);
    ge.strokeStyle = W2G(k);
    ge.lineWidth = 0.019 * S;
    rr(ge, x0, y0, x1, y1, r);
    ge.fill();
    ge.stroke();
  };
  const frameRR = (
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    r: number,
    w: number,
    k: string,
  ) => {
    gm.lineWidth = w * S;
    rr(gm, x0, y0, x1, y1, r);
    gm.stroke();
    ge.strokeStyle = W2G(k);
    ge.lineWidth = (w + 0.017) * S;
    rr(ge, x0, y0, x1, y1, r);
    ge.stroke();
  };
  const cutLine = (x0: number, y0: number, x1: number, y1: number, w: number, k: string) => {
    gm.lineWidth = w * S;
    gm.beginPath();
    gm.moveTo(x0 * S, y0 * S);
    gm.lineTo(x1 * S, y1 * S);
    gm.stroke();
    ge.strokeStyle = W2G(k);
    ge.lineWidth = (w + 0.016) * S;
    ge.beginPath();
    ge.moveTo(x0 * S, y0 * S);
    ge.lineTo(x1 * S, y1 * S);
    ge.stroke();
  };

  tilt(gm);
  tilt(ge);

  cutRR(0.462, 0.316, 0.538, 0.334, 0.009, "slot");
  cutRR(0.342, 0.356, 0.5, 0.386, 0.005, "word");
  cutRR(0.576, 0.362, 0.658, 0.379, 0.004, "edition");
  cutLine(0.342, 0.402, 0.658, 0.402, 0.0045, "rule");
  frameRR(0.342, 0.42, 0.658, 0.6, 0.007, 0.005, "window");
  cutLine(0.342, 0.626, 0.556, 0.626, 0.004, "meta");
  cutRR(0.342, 0.648, 0.604, 0.69, 0.005, "name");
  cutLine(0.342, 0.708, 0.54, 0.708, 0.004, "meta");
  cutLine(0.342, 0.744, 0.658, 0.744, 0.0045, "rule");
  cutRR(0.342, 0.764, 0.47, 0.802, 0.019, "tier");
  cutLine(0.342, 0.822, 0.45, 0.822, 0.0038, "meta");

  /* ---- data block ---- */
  (() => {
    const x0 = 0.54,
      y0 = 0.752,
      m = 0.0197;
    frameRR(x0, y0, x0 + m * 6, y0 + m * 5, 0.004, 0.0038, "qr");
    for (const [cxm, cym] of [
      [0, 0],
      [4, 0],
      [0, 3],
    ]) {
      const fx0 = x0 + (cxm + 0.35) * m,
        fy0 = y0 + (cym + 0.35) * m;
      frameRR(fx0, fy0, fx0 + m * 1.3, fy0 + m * 1.3, 0.0018, 0.0034, "qr");
    }
    const r = mulberry32(0x51de);
    for (let gy = 0; gy < 5; gy++)
      for (let gx = 0; gx < 6; gx++) {
        if ((gx < 2 && gy < 2) || (gx > 3 && gy < 2) || (gx < 2 && gy > 2)) continue;
        if (r() > 0.46) continue;
        const mx = x0 + (gx + 0.28) * m,
          my = y0 + (gy + 0.28) * m;
        cutRR(mx, my, mx + m * 0.62, my + m * 0.62, 0.0012, "qr");
      }
  })();

  /* ---- the window carries a serif wordmark in the theme heading face ---- */
  (() => {
    const family =
      getComputedStyle(document.documentElement).getPropertyValue("--font-heading").trim() ||
      "serif";
    const h = 0.1 * S;
    ge.strokeStyle = W2G("edition");
    gm.lineWidth = 0.0068 * S;
    ge.lineWidth = 0.019 * S;
    both((c) => {
      c.font = `italic ${h}px ${family}`;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.strokeText("Modus", 0.5 * S, 0.512 * S);
    });
  })();

  gm.restore();
  ge.restore();
  gm.globalCompositeOperation = "source-over";
  return { detail: solid, occ, emph };
}

/* ------------------------------------------------------------------ *
 *  emitters: silhouette edges of the mask, with outward normals
 * ------------------------------------------------------------------ */
function buildEmitters(
  maskCanvas: HTMLCanvasElement,
  emphCanvas: HTMLCanvasElement,
  rnd: () => number,
) {
  const d = maskCanvas.getContext("2d")!.getImageData(0, 0, MW, MH).data;
  const ed = emphCanvas.getContext("2d")!.getImageData(0, 0, MW, MH).data;
  const a = new Float32Array(MW * MH),
    b = new Float32Array(MW * MH);
  for (let i = 0; i < MW * MH; i++) a[i] = d[i * 4 + 3] / 255;
  const R = 2;
  for (let p = 0; p < 2; p++) {
    for (let y = 0; y < MH; y++) {
      const o = y * MW;
      for (let x = 0; x < MW; x++) {
        let s = 0,
          n = 0;
        for (let k = -R; k <= R; k++) {
          const xx = x + k;
          if (xx < 0 || xx >= MW) continue;
          s += a[o + xx];
          n++;
        }
        b[o + x] = s / n;
      }
    }
    for (let x = 0; x < MW; x++) {
      for (let y = 0; y < MH; y++) {
        let s = 0,
          n = 0;
        for (let k = -R; k <= R; k++) {
          const yy = y + k;
          if (yy < 0 || yy >= MH) continue;
          s += b[yy * MW + x];
          n++;
        }
        a[y * MW + x] = s / n;
      }
    }
  }
  const ex: number[] = [],
    ey: number[] = [],
    enx: number[] = [],
    eny: number[] = [],
    ew: number[] = [],
    ee: number[] = [],
    edr: number[] = [];
  for (let y = 1; y < MH - 1; y++)
    for (let x = 1; x < MW - 1; x++) {
      const i = y * MW + x;
      const gx = a[i + 1] - a[i - 1],
        gy = a[i + MW] - a[i - MW];
      const m = Math.hypot(gx, gy);
      if (m < 0.035) continue;
      const w = ed[i * 4] / 78,
        dr = ed[i * 4 + 1] / 78;
      ex.push(x / MW);
      ey.push(y / MW + AY0);
      enx.push(-gx / m);
      eny.push(-gy / m);
      ew.push(m * w);
      ee.push(w);
      edr.push(dr);
    }
  const n = ew.length,
    cdf = new Float32Array(n);
  let acc = 0;
  for (let i = 0; i < n; i++) {
    acc += ew[i];
    cdf[i] = acc;
  }
  return {
    n,
    total: acc,
    cdf,
    x: Float32Array.from(ex),
    y: Float32Array.from(ey),
    nx: Float32Array.from(enx),
    ny: Float32Array.from(eny),
    e: Float32Array.from(ee),
    dr: Float32Array.from(edr),
    pick() {
      const t = rnd() * this.total;
      let lo = 0,
        hi = this.n - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (this.cdf[mid] < t) lo = mid + 1;
        else hi = mid;
      }
      return lo;
    },
  };
}

const mk = (n: number) => ({
  x: new Float32Array(n),
  y: new Float32Array(n),
  nx: new Float32Array(n),
  ny: new Float32Array(n),
  rx: new Float32Array(n),
  ry: new Float32Array(n),
  spd: new Float32Array(n),
  len: new Float32Array(n),
  br: new Float32Array(n),
  seed: new Float32Array(n),
  style: new Uint8Array(n),
  life: new Float32Array(n),
  max: new Float32Array(n),
  vx: new Float32Array(n),
  vy: new Float32Array(n),
  pin: new Float32Array(n),
  age: new Float32Array(n),
  k: new Uint8Array(n),
});
type Pool = ReturnType<typeof mk>;

export function EmberTag({
  speed = 0.8,
  particleAmount = 0.8,
  rainAmount = 0.45,
  turbulence = 1.3,
  spread = 1.25,
  backgroundColor = "hsl(var(--background))",
  color = "hsl(var(--primary))",
  className,
}: EmberTagProps) {
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controls = useRef({
    speed,
    particleAmount,
    rainAmount,
    turbulence,
    spread,
    backgroundColor,
    color,
  });
  const applyRef = useRef<() => void>(() => {});

  useEffect(() => {
    const c = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
    controls.current = {
      speed: c(speed, 0, 2),
      particleAmount: c(particleAmount, 0.35, 1.4),
      rainAmount: c(rainAmount, 0, 1.5),
      turbulence: c(turbulence, 0, 2),
      spread: c(spread, 0.5, 1.75),
      backgroundColor,
      color,
    };
    applyRef.current();
  }, [speed, particleAmount, rainAmount, turbulence, spread, backgroundColor, color]);

  useEffect(() => {
    const host = hostRef.current;
    const cv = canvasRef.current;
    if (!host || !cv) return;
    const ctx = cv.getContext("2d")!;
    const theme = { bg: "", ink: "", rain: "", blend: "lighter" as GlobalCompositeOperation };
    const readTheme = () => {
      theme.bg = resolveThemeColor(controls.current.backgroundColor);
      theme.ink = resolveThemeColor(controls.current.color);
      theme.rain = resolveThemeColor("hsl(var(--muted-foreground))");
      theme.blend = themeIsDark() ? "lighter" : "multiply";
    };
    readTheme();
    const themeObserver = new MutationObserver(() => applyRef.current());
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "data-palette", "style"],
    });
    const rnd = mulberry32(0x5eed12);
    const F1 = makeCurlField(0x1234),
      F2 = makeCurlField(0x9abc);
    const _cv = [0, 0];
    let CT = 0;
    function curlAt(x: number, y: number, out: Float32Array) {
      curlSample(F1, x * 1.3 + CT * 0.011, y * 1.3 - CT * 0.019, _cv);
      const ox = _cv[0],
        oy = _cv[1];
      curlSample(F2, x * 3.05 - CT * 0.026, y * 3.05 + CT * 0.015, _cv);
      out[0] = ox + _cv[0] * 0.45;
      out[1] = oy + _cv[1] * 0.45;
    }

    let VW = 0,
      VH = 0,
      DPR = 1,
      ART = { x: 0, y: 0, s: 0 },
      LW = 1,
      WATER = 0;
    const WANG = (60 * Math.PI) / 180;
    const WIND = { x: Math.cos(WANG), y: Math.sin(WANG) };

    const MASKS = buildMasks();
    const EM = buildEmitters(MASKS.detail, MASKS.emph, rnd);

    const SEG = 0.0082;
    const NF0 = 17600,
      NR0 = 300,
      NW0 = 460,
      REF_S = 900;
    let NF = NF0,
      NR = NR0,
      NW = NW0;
    let BASE_NF = NF0,
      BASE_NR = NR0,
      BASE_NW = NW0;
    const CAP_F = 40000,
      CAP_R = 1400,
      CAP_W = 1600;

    function applyParticleCounts() {
      const k = controls.current;
      NF = Math.min(CAP_F, Math.max(1, Math.round(BASE_NF * k.particleAmount)));
      NR = Math.min(CAP_R, Math.max(0, Math.round(BASE_NR * k.rainAmount)));
      NW = Math.min(CAP_W, Math.max(1, Math.round(BASE_NW * k.particleAmount)));
    }

    const FUR = mk(CAP_F),
      RAIN = mk(CAP_R),
      WAT = mk(CAP_W);

    const pickStyle = () => {
      const r = rnd();
      return r < 0.46 ? 0 : r < 0.78 ? 1 : 2;
    };
    const stepsFor = (len: number, lo: number, hi: number) =>
      Math.max(lo, Math.min(hi, Math.round(len / (SEG * ART.s))));

    function pickHot() {
      let e = EM.pick();
      for (let t = 0; t < 3; t++) {
        curlSample(F1, EM.x[e] * 0.85 + CT * 0.045, EM.y[e] * 0.85 - CT * 0.03, _cv);
        const h = _cv[0] * 0.5 + 0.5;
        if (rnd() < h * h * 1.15) break;
        e = EM.pick();
      }
      return e;
    }

    function spawnFur(i: number, seeded: boolean) {
      const e = pickHot();
      const j = 0.0032 * ART.s;
      FUR.x[i] = ART.x + EM.x[e] * ART.s + (rnd() - 0.5) * j;
      FUR.y[i] = ART.y + EM.y[e] * ART.s + (rnd() - 0.5) * j;
      const em = EM.e[e],
        eb = Math.sqrt(em),
        dr = EM.dr[e];
      const pin = Math.max(0, Math.min(1, 1 - dr / 0.85));
      FUR.pin[i] = pin;
      const sp =
        rnd() < 0.58 + pin * 0.38
          ? (rnd() < 0.5 ? -1 : 1) * (1.44 + (rnd() - 0.5) * 0.42 * (1 - pin * 0.7))
          : (rnd() - 0.5) * 1.15;
      const cs = Math.cos(sp),
        sn = Math.sin(sp);
      FUR.rx[i] = EM.nx[e] * cs - EM.ny[e] * sn;
      FUR.ry[i] = EM.nx[e] * sn + EM.ny[e] * cs;
      FUR.nx[i] = FUR.rx[i];
      FUR.ny[i] = FUR.ry[i];
      FUR.spd[i] =
        ART.s * (0.01 + Math.pow(rnd(), 1.8) * 0.098) * (0.24 + dr * 0.9) * (1 - pin * 0.9);
      FUR.len[i] = ART.s * (0.0022 + Math.pow(rnd(), 2.3) * 0.011) * (1 - pin * 0.28);
      FUR.br[i] = (0.74 + rnd() * 0.94) * eb * (1 + pin * 0.3);
      FUR.max[i] = (0.17 + rnd() * 0.74) * (1 - pin * 0.55) * (0.75 + dr * 0.42);
      FUR.k[i] = stepsFor(FUR.len[i], 1, 6);
      FUR.seed[i] = rnd() * 1000;
      FUR.style[i] = pickStyle();
      FUR.life[i] = seeded ? rnd() * FUR.max[i] : FUR.max[i];
    }
    function spawnRain(i: number, seeded: boolean) {
      const sp = ART.s * (0.4 + Math.pow(rnd(), 1.2) * 0.46);
      RAIN.vx[i] = WIND.x * sp;
      RAIN.vy[i] = WIND.y * sp;
      const r = rnd();
      RAIN.len[i] = ART.s * (0.035 + Math.pow(r, 1.45) * 0.15);
      RAIN.br[i] = 0.3 + Math.pow(rnd(), 1.3) * 1.05;
      RAIN.k[i] = stepsFor(RAIN.len[i], 3, 14);
      RAIN.seed[i] = rnd() * 1000;
      RAIN.style[i] = rnd() < 0.74 ? 0 : rnd() < 0.6 ? 1 : 2;
      RAIN.pin[i] = rnd() < 0.24 ? 1 : 0;
      if (seeded) {
        RAIN.x[i] = rnd() * VW;
        RAIN.y[i] = rnd() * VH;
      } else {
        const skew = (WIND.x / WIND.y) * (VH + RAIN.len[i]);
        RAIN.x[i] = -skew + rnd() * (VW + skew);
        RAIN.y[i] = -RAIN.len[i] * WIND.y - rnd() * ART.s * 0.25;
      }
      RAIN.age[i] = 0;
    }
    function waveAt(x: number) {
      curlSample(F2, (x / ART.s) * 0.55 + CT * 0.02, 0.31, _cv);
      return _cv[0] * 0.011 * ART.s;
    }
    function spawnWater(i: number, seeded: boolean) {
      const yw = WATER;
      let x: number, y: number, br: number;
      const roll = rnd();
      if (roll < 0.34) {
        x = rnd() * VW;
        y = yw + waveAt(x) + (rnd() - 0.35) * 0.013 * ART.s;
        br = 0.58 + rnd() * 0.9;
      } else if (roll < 0.68) {
        const e = EM.pick();
        const ax = ART.x + EM.x[e] * ART.s,
          ay = ART.y + EM.y[e] * ART.s;
        x = ax + (rnd() - 0.5) * 0.05 * ART.s;
        y = yw + waveAt(x) + (yw - ay) * 0.34 + (rnd() - 0.5) * 0.014 * ART.s;
        br = 0.28 + rnd() * 0.62;
        if (y < yw + 0.004 * ART.s || y > VH) {
          x = rnd() * VW;
          y = yw + rnd() * Math.max(1, VH - yw);
        }
      } else {
        x = rnd() * VW;
        y = yw + waveAt(x) + Math.pow(rnd(), 2.2) * Math.max(1, VH - yw);
        br = 0.24 + rnd() * 0.66;
      }
      WAT.x[i] = x;
      WAT.y[i] = y;
      const dir = rnd() < 0.5 ? -1 : 1;
      WAT.nx[i] = dir;
      WAT.ny[i] = (rnd() - 0.5) * 0.1;
      WAT.len[i] = ART.s * (0.01 + Math.pow(rnd(), 2.0) * 0.135);
      WAT.br[i] = br;
      WAT.k[i] = stepsFor(WAT.len[i], 2, 14);
      WAT.seed[i] = rnd() * 1000;
      WAT.style[i] = rnd() < 0.3 ? 0 : rnd() < 0.5 ? 1 : 2;
      WAT.max[i] = 0.6 + rnd() * 1.6;
      WAT.life[i] = seeded ? rnd() * WAT.max[i] : WAT.max[i];
    }

    function layout(cw: number, ch: number) {
      DPR = Math.min(2, window.devicePixelRatio || 1);
      VW = Math.round(cw * DPR);
      VH = Math.round(ch * DPR);
      cv!.width = VW;
      cv!.height = VH;
      const s = Math.min(VW, VH);
      ART = { x: (VW - s) / 2, y: VH * 0.87 - 0.888 * s, s };
      WATER = ART.y + 0.888 * s;
      LW = Math.max(0.85, (s / 1280) * 1.05);
      const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
      const D = clamp(Math.pow(s / REF_S, 0.55), 0.6, 1.9);
      BASE_NF = Math.min(CAP_F, Math.round(NF0 * D));
      BASE_NR = Math.min(CAP_R, Math.round(NR0 * D * clamp((VW * VH) / (s * s), 0.6, 3.0)));
      BASE_NW = Math.min(CAP_W, Math.round(NW0 * D * clamp(VW / s, 0.6, 3.0)));
      applyParticleCounts();
      for (let i = 0; i < CAP_F; i++) spawnFur(i, true);
      for (let i = 0; i < CAP_R; i++) spawnRain(i, true);
      for (let i = 0; i < CAP_W; i++) spawnWater(i, true);
    }

    /* ---- draw ---- */
    const LEVELS = [0.19, 0.31, 0.47, 0.68, 0.97];
    const DASHES = [[], [3.2, 3.4], [1.15, 4.6]];
    const NB = LEVELS.length * DASHES.length;
    const paths: Path2D[] = new Array(NB);
    const cur = new Float32Array(2);

    function levelOf(a: number) {
      if (a < 0.26) return 0;
      if (a < 0.39) return 1;
      if (a < 0.57) return 2;
      if (a < 0.82) return 3;
      return 4;
    }
    function lit(seed: number, k: number) {
      const v = Math.sin((seed + k * 1.7) * 127.1) * 43758.5453;
      return v - Math.floor(v) > 0.28;
    }
    function emit(
      style: number,
      lvl: number,
      moved: boolean,
      x: number,
      y: number,
      px: number,
      py: number,
    ) {
      const p = paths[style * LEVELS.length + lvl];
      if (moved) p.moveTo(px, py);
      p.lineTo(x, y);
    }

    let turb = 1,
      spr = 1;

    function strand(P: Pool, i: number, mode: number) {
      const K = P.k[i];
      let env: number;
      if (mode === 1) {
        env = Math.min(1, P.age[i] * 9);
      } else {
        const t = 1 - P.life[i] / P.max[i];
        env = Math.min(1, t * 9) * Math.min(1, (1 - t) * 3.4);
      }
      if (env <= 0.01) return;
      const style = P.style[i],
        seed = P.seed[i];
      const base = P.br[i] * env;
      const L = P.len[i] * (mode === 0 ? spr : 1),
        h = L / K;
      let x = P.x[i],
        y = P.y[i];
      const dirx = P.nx[i],
        diry = P.ny[i];
      let prevLvl = -1,
        moved = true;
      const ix = 1 / ART.s;

      for (let k = 0; k < K; k++) {
        const s = k / K;
        curlAt((x - ART.x) * ix, (y - ART.y) * ix, cur);
        let dx: number, dy: number;
        if (mode === 0) {
          const c = (0.1 + s * 0.42) * turb * (1 - P.pin[i] * 0.85);
          dx = dirx + cur[0] * c;
          dy = diry + cur[1] * c;
        } else if (mode === 1) {
          const c = (0.05 + s * 0.17) * turb;
          dx = -WIND.x + cur[0] * c;
          dy = -WIND.y + cur[1] * c;
        } else {
          dx = dirx + cur[0] * 0.1;
          dy = diry * 0.6 + cur[1] * 0.045;
        }
        const m = Math.hypot(dx, dy) || 1;
        dx /= m;
        dy /= m;
        const nx2 = x + dx * h,
          ny2 = y + dy * h;

        const a = base * Math.pow(1 - s, mode === 1 ? 0.75 : 0.95);
        if (a > 0.15 && lit(seed, k)) {
          const lvl = levelOf(a);
          if (lvl !== prevLvl) moved = true;
          emit(style, lvl, moved, nx2, ny2, x, y);
          prevLvl = lvl;
          moved = false;
        } else {
          moved = true;
          prevLvl = -1;
        }
        x = nx2;
        y = ny2;
      }
    }

    function stepRain(d: number) {
      for (let i = 0; i < NR; i++) {
        RAIN.age[i] += d;
        RAIN.x[i] += RAIN.vx[i] * d;
        RAIN.y[i] += RAIN.vy[i] * d;
        const ty = RAIN.y[i] - RAIN.len[i] * WIND.y,
          tx = RAIN.x[i] - RAIN.len[i] * WIND.x;
        if (ty > VH || tx > VW) spawnRain(i, false);
      }
    }
    function stepFur(d: number) {
      for (let i = 0; i < NF; i++) {
        FUR.life[i] -= d;
        if (FUR.life[i] <= 0) {
          spawnFur(i, false);
          continue;
        }
        const age = 1 - FUR.life[i] / FUR.max[i];
        const pin = FUR.pin[i],
          free = 1 - pin;
        curlAt((FUR.x[i] - ART.x) / ART.s, (FUR.y[i] - ART.y) / ART.s, cur);
        const rad = (Math.pow(1 - age, 1.5) * 0.9 * free + 0.62 * pin) * 1.45;
        const c = (0.34 + age * 1.25) * turb * (1 - pin * 0.88);
        let dx = FUR.rx[i] * rad + WIND.x * 0.5 * free + cur[0] * c;
        let dy = FUR.ry[i] * rad + WIND.y * 0.5 * free + cur[1] * c;
        const m = Math.hypot(dx, dy) || 1;
        dx /= m;
        dy /= m;
        FUR.x[i] += dx * FUR.spd[i] * d;
        FUR.y[i] += dy * FUR.spd[i] * d;
        FUR.nx[i] = dx;
        FUR.ny[i] = dy;
      }
    }
    function stepWater(d: number) {
      for (let i = 0; i < NW; i++) {
        WAT.life[i] -= d;
        WAT.x[i] += WAT.nx[i] * ART.s * 0.035 * d;
        if (WAT.life[i] <= 0) spawnWater(i, false);
      }
    }
    function cycle() {
      const cyc = 0.5 - 0.5 * Math.cos((CT * TAU) / 17);
      turb = (0.62 + cyc * 0.78) * controls.current.turbulence;
      spr = (0.88 + cyc * 0.44) * controls.current.spread;
    }
    function prewarm() {
      const d = 1 / 30;
      for (let n = 0; n < 30; n++) {
        CT += d;
        stepRain(d);
        stepFur(d);
        stepWater(d);
      }
      cycle();
    }

    function flush(stroke = theme.ink) {
      ctx.globalCompositeOperation = theme.blend;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = LW;
      ctx.lineCap = "butt";
      for (let s = 0; s < DASHES.length; s++) {
        ctx.setLineDash(DASHES[s].map((v) => v * LW));
        for (let l = 0; l < LEVELS.length; l++) {
          ctx.globalAlpha = LEVELS[l];
          ctx.stroke(paths[s * LEVELS.length + l]);
        }
      }
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }

    function render() {
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = theme.bg;
      ctx.fillRect(0, 0, VW, VH);

      for (let i = 0; i < NB; i++) paths[i] = new Path2D();
      for (let i = 0; i < NR; i++) if (!RAIN.pin[i]) strand(RAIN, i, 1);
      flush(theme.rain);

      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.filter = "blur(" + (ART.s * 0.004).toFixed(2) + "px)";
      ctx.drawImage(MASKS.occ, ART.x, ART.y + AY0 * ART.s, ART.s, AH * ART.s);
      ctx.restore();
      ctx.filter = "none";
      // the canvas is opaque, so restore the ground under the punched-out figure
      ctx.globalCompositeOperation = "destination-over";
      ctx.fillStyle = theme.bg;
      ctx.fillRect(0, 0, VW, VH);
      ctx.globalCompositeOperation = "source-over";

      for (let i = 0; i < NB; i++) paths[i] = new Path2D();
      for (let i = 0; i < NF; i++) strand(FUR, i, 0);
      for (let i = 0; i < NW; i++) strand(WAT, i, 2);
      flush();

      for (let i = 0; i < NB; i++) paths[i] = new Path2D();
      for (let i = 0; i < NR; i++) if (RAIN.pin[i]) strand(RAIN, i, 1);
      flush(theme.rain);
    }

    let last = 0,
      acc = 0,
      frames = 0,
      slowRun = 0,
      raf = 0,
      running = false;

    function frame(ts: number) {
      raf = requestAnimationFrame(frame);
      if (!last) last = ts;
      let dt = (ts - last) / 1000;
      last = ts;
      if (dt > 0.1) dt = 0.1;
      const rate = controls.current.speed;
      CT += dt * rate;
      cycle();
      const d = dt * rate;
      stepRain(d);
      stepFur(d);
      stepWater(d);
      render();

      // adaptive load governor
      frames++;
      acc += dt;
      if (frames >= 40) {
        const avg = acc / frames;
        frames = 0;
        acc = 0;
        if (avg > 0.022) {
          slowRun++;
          if (slowRun >= 2) {
            NF = Math.max(1100, (NF * 0.85) | 0);
            NR = Math.max(240, (NR * 0.9) | 0);
            NW = Math.max(260, (NW * 0.9) | 0);
            slowRun = 0;
          }
        } else slowRun = 0;
      }
    }

    applyRef.current = () => {
      readTheme();
      applyParticleCounts();
      if (!running) render();
    };

    let lastW = 0,
      lastH = 0,
      resizeT = 0;
    const measure = () => {
      const r = host.getBoundingClientRect();
      return [Math.max(1, Math.round(r.width)), Math.max(1, Math.round(r.height))];
    };
    const relayout = () => {
      clearTimeout(resizeT);
      resizeT = window.setTimeout(() => {
        const [w, h] = measure();
        if (w === lastW && h === lastH) return;
        lastW = w;
        lastH = h;
        layout(w, h);
        prewarm();
        render();
      }, 120);
    };
    const ro = new ResizeObserver(relayout);
    ro.observe(host);
    [lastW, lastH] = measure();
    layout(lastW, lastH);
    prewarm();
    render();

    let visible = true;
    const update = () => {
      const want = !prefersReducedMotion && visible && document.visibilityState !== "hidden";
      if (want && !running) {
        running = true;
        last = 0;
        raf = requestAnimationFrame(frame);
      } else if (!want && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    io.observe(host);
    document.addEventListener("visibilitychange", update);
    update();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      clearTimeout(resizeT);
      ro.disconnect();
      io.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", update);
      applyRef.current = () => {};
    };
  }, [prefersReducedMotion]);

  return (
    <div
      ref={hostRef}
      className={cn("absolute inset-0 overflow-hidden", className)}
      style={{ background: backgroundColor }}
      role="img"
      aria-label="Animated ember tag in rain"
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
