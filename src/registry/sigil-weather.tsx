"use client";
// Ported from ThreeUI Community's Elemental Marks (MIT, © 2026 Meng To).

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

export type SigilWeatherVariant = "water" | "lightning" | "flame";

type Tokens = {
  primary: string;
  foreground: string;
  muted: string;
  background: string;
  card: string;
  border: string;
  dark: boolean;
};

/** Reads the Modus theme tokens (bare HSL channels) as comma `hsl()` strings canvas and three.js both parse. */
function readTokens(): Tokens {
  const root = document.documentElement;
  const cs = getComputedStyle(root);
  const hsl = (name: string) =>
    `hsl(${cs
      .getPropertyValue(name)
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .join(", ")})`;
  return {
    primary: hsl("--primary"),
    foreground: hsl("--foreground"),
    muted: hsl("--muted-foreground"),
    background: hsl("--background"),
    card: hsl("--card"),
    border: hsl("--border"),
    dark: root.classList.contains("dark") || root.dataset.theme === "dark",
  };
}

/** The current theme tokens, re-read whenever the mode or palette on <html> changes. */
function useTokens() {
  const [tokens, setTokens] = useState<Tokens | null>(null);
  useEffect(() => {
    const update = () => setTokens(readTokens());
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "data-palette", "style"],
    });
    return () => observer.disconnect();
  }, []);
  return tokens;
}

/** Resolves any CSS colour to 0..1 RGB channels. */
function toRgb(color: string): [number, number, number] {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return [0, 0, 0];
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r / 255, g / 255, b / 255];
}

export interface SigilWeatherProps {
  variant?: SigilWeatherVariant;
  /** `theme` maps the scene's light onto the background → primary → foreground tokens; `original` keeps the source colours. */
  palette?: "theme" | "original";
  /** SVG path data (24×24 viewBox) for the mark the element plays around. */
  markPath?: string;
  speed?: number;
  size?: number;
  particleAmount?: number;
  opacity?: number;
  hue?: number;
  saturation?: number;
  brightness?: number;
  /** Darkest tone of the scene. Defaults to the theme's `--background`. */
  backgroundColor?: string;
  className?: string;
}

const DEFAULT_MARK =
  "M12 0C12.9 7 17 11.1 24 12C17 12.9 12.9 17 12 24C11.1 17 7 12.9 0 12C7 11.1 11.1 7 12 0Z";

const SDF_SIZE = 768;
const SDF_SPREAD = 192;
const D_RANGE = (SDF_SPREAD * 2) / SDF_SIZE;
const SIM_RES = 512;

const BASE_ZOOM: Record<SigilWeatherVariant, number> = {
  water: 1.56,
  lightning: 1.66,
  flame: 1.82,
};

const BASE_PARTICLES: Record<SigilWeatherVariant, number> = {
  water: 160,
  lightning: 360,
  flame: 560,
};

type ParticleCfg = {
  travel: number;
  lifeMin: number;
  lifeMax: number;
  alongNormal: number;
  wiggle: number;
  sizeMin: number;
  sizeMax: number;
  sparse: number;
  colA: [number, number, number];
  colB: [number, number, number];
};

const VARIANT_OPTS: Record<
  SigilWeatherVariant,
  { sim: boolean; shift: [number, number]; particles: ParticleCfg }
> = {
  water: {
    sim: true,
    shift: [0, 0],
    particles: {
      travel: 0.1,
      lifeMin: 4.0,
      lifeMax: 8.0,
      alongNormal: 0.15,
      wiggle: 0.02,
      sizeMin: 1.5,
      sizeMax: 3.5,
      sparse: 0.5,
      colA: [0.1, 0.24, 0.3],
      colB: [0.22, 0.4, 0.48],
    },
  },
  lightning: {
    sim: false,
    shift: [0, 0],
    particles: {
      travel: 0.075,
      lifeMin: 0.28,
      lifeMax: 0.82,
      alongNormal: 0.92,
      wiggle: 0.022,
      sizeMin: 0.8,
      sizeMax: 2.0,
      sparse: 0.72,
      colA: [0.45, 0.5, 1.0],
      colB: [0.95, 0.95, 1.0],
    },
  },
  flame: {
    sim: false,
    shift: [0, -0.11],
    particles: {
      travel: 0.34,
      lifeMin: 1.1,
      lifeMax: 2.7,
      alongNormal: 0.3,
      wiggle: 0.046,
      sizeMin: 0.9,
      sizeMax: 3.6,
      sparse: 0.42,
      colA: [1.0, 0.62, 0.28],
      colB: [1.0, 0.3, 0.1],
    },
  },
};

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

/* ---------------- rasterize -> SDF (chamfer) + edge point extraction ---------------- */
function rasterizeLogo(pathStr: string) {
  const c = document.createElement("canvas");
  c.width = c.height = SDF_SIZE;
  const ctx = c.getContext("2d")!;
  const box = SDF_SIZE * 0.6;
  const s = box / 24;
  const off = (SDF_SIZE - box) / 2;
  ctx.setTransform(s, 0, 0, s, off, off);
  ctx.fillStyle = "white";
  ctx.fill(new Path2D(pathStr));
  return ctx.getImageData(0, 0, SDF_SIZE, SDF_SIZE);
}

function chamfer(d: Float32Array, w: number, h: number) {
  const D1 = 1,
    D2 = Math.SQRT2;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      let v = d[i];
      if (x > 0) v = Math.min(v, d[i - 1] + D1);
      if (y > 0) {
        v = Math.min(v, d[i - w] + D1);
        if (x > 0) v = Math.min(v, d[i - w - 1] + D2);
        if (x < w - 1) v = Math.min(v, d[i - w + 1] + D2);
      }
      d[i] = v;
    }
  for (let y = h - 1; y >= 0; y--)
    for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x;
      let v = d[i];
      if (x < w - 1) v = Math.min(v, d[i + 1] + D1);
      if (y < h - 1) {
        v = Math.min(v, d[i + w] + D1);
        if (x < w - 1) v = Math.min(v, d[i + w + 1] + D2);
        if (x > 0) v = Math.min(v, d[i + w - 1] + D2);
      }
      d[i] = v;
    }
}

function buildSDF(img: ImageData) {
  const n = SDF_SIZE * SDF_SIZE;
  const dOut = new Float32Array(n),
    dIn = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const inside = img.data[i * 4 + 3] > 127;
    dOut[i] = inside ? 0 : 1e9;
    dIn[i] = inside ? 1e9 : 0;
  }
  chamfer(dOut, SDF_SIZE, SDF_SIZE);
  chamfer(dIn, SDF_SIZE, SDF_SIZE);
  const enc = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const d = dOut[i] - dIn[i];
    enc[i] = Math.max(0, Math.min(255, Math.round((0.5 + (0.5 * d) / SDF_SPREAD) * 255)));
  }
  return enc;
}

function edgePoints(img: ImageData) {
  const S = SDF_SIZE,
    pts: number[] = [];
  const a = (x: number, y: number) => img.data[(y * S + x) * 4 + 3] > 127;
  for (let y = 1; y < S - 1; y++) {
    for (let x = 1; x < S - 1; x++) {
      if (!a(x, y)) continue;
      const l = a(x - 1, y),
        r = a(x + 1, y),
        u = a(x, y - 1),
        dn = a(x, y + 1);
      if (l && r && u && dn) continue;
      const gx = (r ? 1 : 0) - (l ? 1 : 0);
      const gy = (dn ? 1 : 0) - (u ? 1 : 0);
      let nx = -gx,
        ny = gy;
      const len = Math.hypot(nx, ny);
      if (!len) {
        nx = 0;
        ny = 1;
      } else {
        nx /= len;
        ny /= len;
      }
      pts.push((x + 0.5) / S, 1 - (y + 0.5) / S, nx, ny);
    }
  }
  return pts;
}

function makeParticleData(pts: number[], count: number) {
  const data = new Float32Array(count * 5);
  const nPts = pts.length / 4;
  for (let i = 0; i < count; i++) {
    const j = (Math.random() * nPts) | 0;
    data[i * 5] = pts[j * 4];
    data[i * 5 + 1] = pts[j * 4 + 1];
    data[i * 5 + 2] = pts[j * 4 + 2];
    data[i * 5 + 3] = pts[j * 4 + 3];
    data[i * 5 + 4] = Math.random() * 100 + i * 0.618;
  }
  return data;
}

/* ---------------- shaders ---------------- */
const VERT = `#version 300 es
out vec2 vUv;
void main(){
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const GLSL_COMMON = `
precision highp float;
uniform sampler2D uSDF;
uniform float uTime;
uniform float uAspect;
uniform vec2  uScale;
uniform vec2  uShift;
uniform vec3  uPointer;
in vec2 vUv;
out vec4 frag;

float hash21(vec2 p){
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i), b = hash21(i + vec2(1,0));
  float c = hash21(i + vec2(0,1)), d = hash21(i + vec2(1,1));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  mat2 r = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 5; i++){ v += a * vnoise(p); p = r * p * 2.03; a *= 0.5; }
  return v;
}
float sdf(vec2 uv){
  vec2 m = 0.5 + (uv - 0.5 - uShift) * uScale;
  vec2 mc = clamp(m, 0.0, 1.0);
  float d = (texture(uSDF, vec2(mc.x, 1.0 - mc.y)).r - 0.5) * ${D_RANGE.toFixed(4)};
  return d + length(m - mc);
}
float edgeFade(vec2 uv){
  return smoothstep(0.0, 0.05, uv.x) * smoothstep(1.0, 0.95, uv.x)
       * smoothstep(0.0, 0.05, uv.y) * smoothstep(1.0, 0.95, uv.y);
}
`;

const FRAG_SIM = `#version 300 es
precision highp float;
uniform sampler2D uState;
uniform vec2 uTexel;
uniform vec3 uDrop;
in vec2 vUv;
out vec4 frag;
void main(){
  vec2 s = texture(uState, vUv).rg;
  float l = texture(uState, vUv - vec2(uTexel.x, 0.0)).r;
  float r = texture(uState, vUv + vec2(uTexel.x, 0.0)).r;
  float u = texture(uState, vUv + vec2(0.0, uTexel.y)).r;
  float d = texture(uState, vUv - vec2(0.0, uTexel.y)).r;
  float next = (l + r + u + d) * 0.5 - s.g;
  next *= 0.984;
  if (uDrop.z != 0.0){
    float dd = distance(vUv, uDrop.xy);
    next += uDrop.z * exp(-dd * dd * 3800.0);
  }
  frag = vec4(next, s.r, 0.0, 1.0);
}`;

const FRAG_WATER = `#version 300 es
${GLSL_COMMON}
uniform sampler2D uState;
uniform vec2 uSimTexel;
vec2 simUV(vec2 uv){
  return 0.5 + (uv - 0.5) * vec2(uAspect, 1.0) / max(uAspect, 1.0);
}
void main(){
  vec2 suv = simUV(vUv);
  float h  = texture(uState, suv).r;
  float hx = texture(uState, suv + vec2(uSimTexel.x, 0.0)).r - texture(uState, suv - vec2(uSimTexel.x, 0.0)).r;
  float hy = texture(uState, suv + vec2(0.0, uSimTexel.y)).r - texture(uState, suv - vec2(0.0, uSimTexel.y)).r;
  vec2 grad = vec2(hx, hy);
  vec3 nrm = normalize(vec3(-grad * 30.0, 1.0));

  vec2 ruv = vUv + grad * 0.22;
  float d  = sdf(ruv);

  vec3 col = mix(vec3(0.006, 0.030, 0.055), vec3(0.012, 0.078, 0.125), vUv.y * 0.8 + h * 0.25);
  col += vec3(0.02, 0.10, 0.13) * fbm(vUv * vec2(uAspect, 1.0) * 3.0 + uTime * 0.05) * 0.3;

  float logo = smoothstep(0.005, -0.005, d);
  float glow = exp(-max(d, 0.0) / 0.09) * 0.26;
  vec3 markCol = mix(vec3(0.55, 0.92, 1.0), vec3(0.95, 1.0, 1.0), logo * 0.6);
  col += markCol * (logo * 0.92 + glow);

  col += vec3(0.09, 0.30, 0.40) * clamp(h * 1.8, -0.06, 1.0);
  col += vec3(0.25, 0.55, 0.65) * pow(clamp(h * 2.6, 0.0, 1.0), 2.0) * 0.5;

  vec3 L = normalize(vec3(-0.35, 0.55, 0.75));
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  float spec = pow(max(dot(nrm, H), 0.0), 150.0);
  col += spec * vec3(0.65, 0.9, 1.0) * 0.9;

  col *= 0.35 + 0.65 * edgeFade(vUv);
  col += (hash21(vUv * 617.0 + uTime) - 0.5) / 128.0;
  frag = vec4(col, 1.0);
}`;

const FRAG_LIGHTNING = `#version 300 es
${GLSL_COMMON}
void main(){
  float t = uTime;
  float d = sdf(vUv);
  vec2 pp = vUv * vec2(uAspect, 1.0);

  vec3 col = vec3(0.010, 0.011, 0.024);
  col += vec3(0.035, 0.04, 0.075) * fbm(pp * 2.2 + vec2(t * 0.04, t * 0.01));

  float slot = floor(t * 0.45);
  float ph   = fract(t * 0.45);
  float big  = step(0.68, hash21(vec2(slot, 3.7))) * exp(-ph * 16.0);

  float inside = smoothstep(0.0025, -0.0025, d);
  vec3 body = vec3(0.055, 0.06, 0.10) + big * vec3(0.55, 0.58, 0.85);
  col = mix(col, body, inside);
  float rim = exp(-abs(d) / 0.0075) * 0.56;
  col += rim * vec3(0.35, 0.4, 0.8);

  vec2 dp = (vUv - uPointer.xy) * vec2(uAspect, 1.0);
  float pb = 1.0 + 2.4 * uPointer.z * exp(-dot(dp, dp) * 34.0);

  float fade = edgeFade(vUv);
  for (int i = 0; i < 5; i++){
    float fi = float(i);
    float layer = fi / 4.0;
    float coarse = fbm(pp * mix(4.0, 13.0, layer) + vec2(t * (1.3 + fi * 0.78), fi * 17.7)) - 0.5;
    float detail = fbm(pp * mix(17.0, 31.0, layer) + vec2(-t * (2.9 + fi * 0.55), fi * 31.7)) - 0.5;
    float n = coarse * mix(0.82, 0.58, layer) + detail * mix(0.18, 0.42, layer);
    float e = abs(d + n * mix(0.09, 0.038, layer));
    float fl = hash21(vec2(floor(t * (7.0 + fi * 3.4)), fi));
    fl = mix(0.12, 1.0, smoothstep(0.22, 0.94, fl));
    float width = mix(0.0034, 0.0012, layer);
    float bolt = pow(width * pb / (e + mix(0.0018, 0.0008, layer)), mix(1.42, 1.78, layer)) * fl;
    bolt = min(bolt, 7.0);
    col += bolt * mix(vec3(0.34, 0.39, 1.0), vec3(0.96, 0.94, 1.0), pow(layer, 0.75)) * fade;
  }

  float n0 = fbm(pp * 6.5 + vec2(t * 2.8, 7.7)) - 0.5;
  n0 += (fbm(pp * 23.0 + vec2(-t * 4.1, 18.2)) - 0.5) * 0.22;
  float e0 = abs(d + n0 * 0.075);
  float corefl = mix(0.22, 1.2, hash21(vec2(floor(t * 10.0), 11.0)));
  col += min(pow(0.00175 * pb / (e0 + 0.0009), 1.78), 9.0) * corefl * vec3(1.0) * fade;

  float branchNoise = fbm(pp * 16.0 + vec2(t * 3.7, -13.4)) - 0.5;
  float branchEdge = abs(d + n0 * 0.052 + branchNoise * 0.026);
  float branchLife = smoothstep(0.35, 0.92, hash21(vec2(floor(t * 13.0), 23.0)));
  col += min(pow(0.0011 * pb / (branchEdge + 0.00075), 1.72), 5.0)
       * branchLife * vec3(0.64, 0.70, 1.0) * fade;

  col += big * vec3(0.30, 0.32, 0.55) * (0.25 + 0.75 * inside);
  col = col / (1.0 + col * 0.18);
  col *= 0.4 + 0.6 * edgeFade(vUv);
  col += (hash21(vUv * 431.0 + uTime) - 0.5) / 128.0;
  frag = vec4(col, 1.0);
}`;

const FRAG_FIRE = `#version 300 es
${GLSL_COMMON}
uniform float uWind;

vec3 fireRamp(float x){
  x = clamp(x, 0.0, 1.0);
  vec3 c = mix(vec3(0.0), vec3(0.45, 0.06, 0.02), smoothstep(0.02, 0.30, x));
  c = mix(c, vec3(0.95, 0.34, 0.08), smoothstep(0.28, 0.55, x));
  c = mix(c, vec3(1.0, 0.68, 0.22), smoothstep(0.52, 0.78, x));
  c = mix(c, vec3(1.0, 0.97, 0.88), smoothstep(0.78, 0.97, x));
  return c;
}

void main(){
  float t = uTime;
  float d0 = sdf(vUv);
  vec2 pp = vUv * vec2(uAspect, 1.0);

  float e = 0.012;
  vec2 g = vec2(sdf(vUv + vec2(e, 0.0)) - sdf(vUv - vec2(e, 0.0)),
                sdf(vUv + vec2(0.0, e)) - sdf(vUv - vec2(0.0, e)));
  float upw = smoothstep(-0.2, 0.9, normalize(g + 1e-5).y);

  vec2 dp = (vUv - uPointer.xy) * vec2(uAspect, 1.0);
  float stoke = uPointer.z * exp(-dot(dp, dp) * 26.0);

  float n1 = fbm(vec2(pp.x * 11.0,        pp.y * 3.2 - t * 2.2));
  float n2 = fbm(vec2(pp.x * 6.5 + 41.3,  pp.y * 1.8 - t * 1.3));
  float n3 = fbm(vec2(pp.x * 27.0 - t * 0.7, pp.y * 7.5 - t * 4.0));
  float d0f = d0 + (hash21(vUv * 771.0 + t * 1.3) - 0.5) * 0.0025;
  float rise = max(0.0, n1 * 0.98 + n2 * 0.54 + n3 * 0.38 - 0.58) * 1.48;
  float adv  = smoothstep(-0.025, 0.24, d0f);
  float lick = 0.31 * (1.0 + stoke * 0.82);
  vec2 offs = vec2((n2 - 0.5) * 0.042 + (n3 - 0.5) * 0.018 + uWind * 0.05, -rise * lick * adv);
  float df = sdf(vUv + offs);
  float micro = fbm(pp * vec2(34.0, 9.0) + vec2(t * 1.1, -t * 5.2));
  df += (micro - 0.5) * 0.011 * adv;
  df += (hash21(vUv * 997.0 + uTime) - 0.5) * 0.0025;

  float heat = clamp(1.0 - df / 0.064, 0.0, 1.0);
  heat *= mix(0.08, 1.0, upw);
  heat *= 1.0 - 0.52 * smoothstep(0.07, 0.27, d0f);
  heat *= 0.84 + n3 * 0.24;
  float tongue = smoothstep(0.29, 0.69, heat);
  float filament = smoothstep(0.58, 0.91, heat + (n3 - 0.5) * 0.20);
  float split = smoothstep(0.38, 0.82, n3) * smoothstep(0.015, 0.23, d0f);
  float body = pow(heat, 2.35) * 0.36;
  float f = max(max(tongue * (0.72 + 0.28 * n3), filament * split * 0.88), body)
          * (0.95 + 0.25 * stoke);

  vec3 col = vec3(0.012, 0.006, 0.004);
  col += fireRamp(f * (1.05 - 0.4 * smoothstep(0.02, 0.25, d0)));
  float vein = pow(clamp(1.0 - abs(df) / 0.026, 0.0, 1.0), 3.2)
             * smoothstep(0.55, 0.9, n3) * upw * (0.35 + 0.65 * adv);
  col += fireRamp(0.82) * vein * 0.34;

  float inside = smoothstep(0.0025, -0.0025, d0);
  float core   = smoothstep(0.0, -0.016, d0);
  vec3 markCol = mix(vec3(1.0, 0.92, 0.78), vec3(1.0, 1.0, 0.98), core);
  col = mix(col, markCol, inside);
  col += exp(-max(d0, 0.0) / 0.026) * vec3(1.0, 0.55, 0.22) * 0.30 * (1.0 - inside * 0.92);
  col += exp(-max(d0, 0.0) / 0.09)  * vec3(0.55, 0.14, 0.03) * 0.28 * (0.55 + 0.45 * n2);

  col = col / (1.0 + col * 0.12);
  col *= 0.35 + 0.65 * edgeFade(vUv);
  col += (hash21(vUv * 523.0 + uTime) - 0.5) / 128.0;
  frag = vec4(col, 1.0);
}`;

const PART_VERT = `#version 300 es
precision highp float;
layout(location=0) in vec2 aPos;
layout(location=1) in vec2 aNorm;
layout(location=2) in float aSeed;
uniform float uTime;
uniform vec2  uScale;
uniform vec2  uShift;
uniform float uDpr;
uniform float uWind;
uniform vec4  uCfgA;
uniform vec4  uCfgB;
out float vFade;
out float vMixC;
float h1(float n){ return fract(sin(n) * 43758.5453); }
void main(){
  float hs   = h1(aSeed * 1.31);
  float life = mix(uCfgA.y, uCfgA.z, hs);
  float tt   = uTime / life + aSeed * 13.7;
  float ph   = fract(tt);
  float cyc  = floor(tt);
  float r1 = h1(aSeed + cyc * 0.317);
  float r2 = h1(aSeed * 2.13 + cyc * 0.771);
  float on = step(uCfgB.w, r2);

  vec2 dir = normalize(mix(vec2(0.0, 1.0), aNorm, uCfgA.w) + (vec2(r1, h1(r1 * 7.0)) - 0.5) * 0.8);
  float trav = uCfgA.x * (0.45 + 0.9 * r1);
  vec2 p = aPos + aNorm * 0.004 + dir * trav * ph;
  p.x += sin(ph * 10.0 + r1 * 40.0 + uTime * 0.5) * uCfgB.x * ph;
  p.x += uWind * 0.08 * ph;

  vec2 uv = 0.5 + uShift + (p - 0.5) / uScale;
  vFade = on * smoothstep(0.0, 0.12, ph) * smoothstep(1.0, 0.5, ph) * mix(0.35, 1.0, r2);
  vMixC = h1(aSeed * 3.7 + cyc);
  gl_Position = vec4(uv * 2.0 - 1.0, 0.0, 1.0);
  gl_PointSize = mix(uCfgB.y, uCfgB.z, h1(aSeed * 5.11 + cyc)) * uDpr * (1.0 - 0.45 * ph);
}`;

const PART_FRAG = `#version 300 es
precision highp float;
uniform vec3 uColA;
uniform vec3 uColB;
in float vFade;
in float vMixC;
out vec4 frag;
void main(){
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(q, q);
  if (r2 > 1.0) discard;
  float a = exp(-r2 * 3.5) * (1.0 - r2);
  frag = vec4(mix(uColA, uColB, vMixC) * a * vFade, 1.0);
}`;

const FRAGS: Record<SigilWeatherVariant, string> = {
  water: FRAG_WATER,
  lightning: FRAG_LIGHTNING,
  flame: FRAG_FIRE,
};

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

function program(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const v = compile(gl, gl.VERTEX_SHADER, vs);
  const f = compile(gl, gl.FRAGMENT_SHADER, fs);
  if (!v || !f) return null;
  const p = gl.createProgram()!;
  gl.attachShader(p, v);
  gl.attachShader(p, f);
  gl.linkProgram(p);
  gl.deleteShader(v);
  gl.deleteShader(f);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(p));
    return null;
  }
  return p;
}

export function SigilWeather({
  variant = "lightning",
  palette = "theme",
  markPath = DEFAULT_MARK,
  speed = 1,
  size = 1,
  particleAmount = 1,
  opacity = 1,
  hue = 0,
  saturation = 1,
  brightness = 1,
  backgroundColor,
  className,
}: SigilWeatherProps) {
  const filterId = `sigil-${useId().replace(/:/g, "")}`;
  const tokens = useTokens();
  const ground = backgroundColor ?? tokens?.background;
  // A three-stop duotone: dark scene → ground, mid light → primary, highlights → foreground.
  const ramp = useMemo(
    () =>
      palette === "theme" && tokens && ground
        ? [ground, tokens.primary, tokens.foreground].map(toRgb)
        : null,
    [palette, tokens, ground],
  );
  const table = (channel: number) => (ramp ?? []).map((rgb) => rgb[channel].toFixed(3)).join(" ");
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const speedRef = useRef(speed);
  speedRef.current = clamp(speed, 0, 3);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const gl = canvas.getContext("webgl2", { alpha: false, antialias: false });
    if (!gl) return;

    const opts = VARIANT_OPTS[variant] ?? VARIANT_OPTS.water;
    const P = opts.particles;
    const zoom = BASE_ZOOM[variant] / clamp(size, 0.65, 1.5);
    const count = Math.max(0, Math.round(BASE_PARTICLES[variant] * clamp(particleAmount, 0, 2)));
    const DPR = Math.min(Math.max(window.devicePixelRatio || 1, 1.5), 2);
    const reduced = !!prefersReducedMotion;

    const img = rasterizeLogo(markPath);
    const sdfData = buildSDF(img);
    const edges = edgePoints(img);

    const prog = program(gl, VERT, FRAGS[variant]);
    if (!prog) return;
    const uni: Record<string, WebGLUniformLocation | null> = {};
    for (const n of [
      "uSDF",
      "uTime",
      "uAspect",
      "uScale",
      "uShift",
      "uPointer",
      "uState",
      "uSimTexel",
      "uWind",
    ])
      uni[n] = gl.getUniformLocation(prog, n);

    const sdfTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, sdfTex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.R8,
      SDF_SIZE,
      SDF_SIZE,
      0,
      gl.RED,
      gl.UNSIGNED_BYTE,
      sdfData,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    let sim = opts.sim;
    let simProg: WebGLProgram | null = null;
    const simUni: Record<string, WebGLUniformLocation | null> = {};
    const simTex: WebGLTexture[] = [];
    const simFbo: WebGLFramebuffer[] = [];
    let simSrc = 0;
    if (sim) {
      simProg = gl.getExtension("EXT_color_buffer_float") ? program(gl, VERT, FRAG_SIM) : null;
      if (!simProg) sim = false;
      else {
        for (const n of ["uState", "uTexel", "uDrop"])
          simUni[n] = gl.getUniformLocation(simProg, n);
        for (let i = 0; i < 2; i++) {
          const t = gl.createTexture()!;
          gl.bindTexture(gl.TEXTURE_2D, t);
          gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RG16F,
            SIM_RES,
            SIM_RES,
            0,
            gl.RG,
            gl.HALF_FLOAT,
            null,
          );
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          const f = gl.createFramebuffer()!;
          gl.bindFramebuffer(gl.FRAMEBUFFER, f);
          gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
          simTex.push(t);
          simFbo.push(f);
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }
    }

    const partProg = count > 0 ? program(gl, PART_VERT, PART_FRAG) : null;
    const partUni: Record<string, WebGLUniformLocation | null> = {};
    let partVao: WebGLVertexArrayObject | null = null;
    let partBuf: WebGLBuffer | null = null;
    if (partProg) {
      for (const n of [
        "uTime",
        "uScale",
        "uShift",
        "uDpr",
        "uWind",
        "uCfgA",
        "uCfgB",
        "uColA",
        "uColB",
      ])
        partUni[n] = gl.getUniformLocation(partProg, n);
      partVao = gl.createVertexArray();
      gl.bindVertexArray(partVao);
      partBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, partBuf);
      gl.bufferData(gl.ARRAY_BUFFER, makeParticleData(edges, count), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 20, 0);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 20, 8);
      gl.enableVertexAttribArray(2);
      gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 20, 16);
      gl.bindVertexArray(null);
    }

    const pointer = { x: 0.5, y: 0.5, active: 0 };
    let wind = 0;
    let windTarget = 0;
    const dropQueue: { x: number; y: number; s: number }[] = [];
    let nextAutoDrop = 0.6;
    let aspect = 1;
    let needsResize = false;

    const resize = () => {
      const r = host.getBoundingClientRect();
      const w = Math.max(2, Math.round(r.width * DPR));
      const h = Math.max(2, Math.round(r.height * DPR));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      aspect = w / h;
    };

    const toSimUV = (x: number, y: number) => {
      const m = Math.max(aspect, 1);
      return { x: 0.5 + ((x - 0.5) * aspect) / m, y: 0.5 + (y - 0.5) / m };
    };

    const stepSim = (t: number) => {
      if (t > nextAutoDrop) {
        dropQueue.push({
          x: 0.12 + Math.random() * 0.76,
          y: 0.12 + Math.random() * 0.76,
          s: 0.12 + Math.random() * 0.3,
        });
        nextAutoDrop = t + 0.5 + Math.random() * 1.4;
      }
      gl.useProgram(simProg);
      gl.viewport(0, 0, SIM_RES, SIM_RES);
      gl.uniform2f(simUni.uTexel, 1 / SIM_RES, 1 / SIM_RES);
      for (let i = 0; i < 2; i++) {
        const drop = dropQueue.shift();
        if (drop) {
          const s = toSimUV(drop.x, drop.y);
          gl.uniform3f(simUni.uDrop, s.x, s.y, drop.s);
        } else gl.uniform3f(simUni.uDrop, 0, 0, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, simFbo[1 - simSrc]);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, simTex[simSrc]);
        gl.uniform1i(simUni.uState, 1);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        simSrc = 1 - simSrc;
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };

    const draw = (t: number) => {
      if (needsResize) {
        needsResize = false;
        resize();
      }
      if (sim) stepSim(t);
      wind += (windTarget - wind) * 0.04;
      windTarget *= 0.97;

      gl.useProgram(prog);
      gl.viewport(0, 0, canvas.width, canvas.height);
      const fit = Math.min(aspect, 1);
      const sc = [(aspect / fit) * zoom, (1 / fit) * zoom];
      gl.uniform1f(uni.uTime, t);
      gl.uniform1f(uni.uAspect, aspect);
      gl.uniform2f(uni.uScale, sc[0], sc[1]);
      gl.uniform2f(uni.uShift, opts.shift[0], opts.shift[1]);
      gl.uniform3f(uni.uPointer, pointer.x, pointer.y, pointer.active);
      if (uni.uWind) gl.uniform1f(uni.uWind, wind);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, sdfTex);
      gl.uniform1i(uni.uSDF, 0);
      if (sim) {
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, simTex[simSrc]);
        gl.uniform1i(uni.uState, 1);
        gl.uniform2f(uni.uSimTexel, 1 / SIM_RES, 1 / SIM_RES);
      }
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (partProg) {
        gl.useProgram(partProg);
        gl.uniform1f(partUni.uTime, t);
        gl.uniform2f(partUni.uScale, sc[0], sc[1]);
        gl.uniform2f(partUni.uShift, opts.shift[0], opts.shift[1]);
        gl.uniform1f(partUni.uDpr, DPR);
        gl.uniform1f(partUni.uWind, wind);
        gl.uniform4f(partUni.uCfgA, P.travel, P.lifeMin, P.lifeMax, P.alongNormal);
        gl.uniform4f(partUni.uCfgB, P.wiggle, P.sizeMin, P.sizeMax, P.sparse);
        gl.uniform3f(partUni.uColA, ...P.colA);
        gl.uniform3f(partUni.uColB, ...P.colB);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.bindVertexArray(partVao);
        gl.drawArrays(gl.POINTS, 0, count);
        gl.bindVertexArray(null);
        gl.disable(gl.BLEND);
      }
    };

    resize();

    const uv = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      return {
        x: (e.clientX - r.left) / r.width,
        y: 1 - (e.clientY - r.top) / r.height,
      };
    };
    let last: { x: number; y: number } | null = null;
    let lastT = 0;
    const onMove = (e: PointerEvent) => {
      const p = uv(e);
      const now = performance.now();
      pointer.x = p.x;
      pointer.y = p.y;
      pointer.active = 1;
      if (last) {
        const dt = Math.max(8, now - lastT);
        const dx = p.x - last.x,
          dy = p.y - last.y;
        const sp = Math.hypot(dx, dy) / (dt / 1000);
        if (sim && sp > 0.05 && dropQueue.length < 6)
          dropQueue.push({ x: p.x, y: p.y, s: Math.min(sp * 0.14, 0.55) });
        windTarget = Math.max(-1, Math.min(1, (dx / (dt / 1000)) * 0.55));
      }
      last = p;
      lastT = now;
    };
    const onDown = (e: PointerEvent) => {
      const p = uv(e);
      if (sim) dropQueue.push({ x: p.x, y: p.y, s: 0.9 });
      pointer.x = p.x;
      pointer.y = p.y;
      pointer.active = 1.6;
    };
    const onUp = () => {
      pointer.active = 1;
    };
    const onLeave = () => {
      pointer.active = 0;
      last = null;
      windTarget = 0;
    };
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerdown", onDown);
    host.addEventListener("pointerup", onUp);
    host.addEventListener("pointerleave", onLeave);

    let raf = 0;
    let visible = true;
    let virtual = 0;
    let prev = performance.now();
    const loop = () => {
      const now = performance.now();
      virtual += ((now - prev) / 1000) * speedRef.current;
      prev = now;
      draw(virtual);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (reduced || raf || !visible || document.hidden) return;
      prev = performance.now();
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const ro = new ResizeObserver(() => {
      if (reduced) {
        resize();
        draw(0.001);
      } else needsResize = true;
    });
    ro.observe(host);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      if (visible) start();
      else stop();
    });
    io.observe(host);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);

    if (reduced) draw(0.001);
    else start();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerdown", onDown);
      host.removeEventListener("pointerup", onUp);
      host.removeEventListener("pointerleave", onLeave);
      gl.deleteProgram(prog);
      if (simProg) gl.deleteProgram(simProg);
      if (partProg) gl.deleteProgram(partProg);
      gl.deleteTexture(sdfTex);
      simTex.forEach((t) => gl.deleteTexture(t));
      simFbo.forEach((f) => gl.deleteFramebuffer(f));
      if (partVao) gl.deleteVertexArray(partVao);
      if (partBuf) gl.deleteBuffer(partBuf);
    };
  }, [variant, markPath, size, particleAmount, prefersReducedMotion]);

  return (
    <div
      ref={hostRef}
      data-element={variant}
      className={cn("absolute inset-0 overflow-hidden", className)}
      style={{ background: ground ?? "hsl(var(--background))" }}
    >
      {ramp && (
        <svg aria-hidden="true" className="absolute h-0 w-0">
          <filter id={filterId} colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values="0.3 0.59 0.11 0 0  0.3 0.59 0.11 0 0  0.3 0.59 0.11 0 0  0 0 0 1 0"
            />
            <feComponentTransfer>
              <feFuncR type="table" tableValues={table(0)} />
              <feFuncG type="table" tableValues={table(1)} />
              <feFuncB type="table" tableValues={table(2)} />
            </feComponentTransfer>
          </filter>
        </svg>
      )}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 block h-full w-full"
        style={{
          opacity: clamp(opacity, 0.05, 1),
          filter: `${ramp ? `url(#${filterId}) ` : ""}hue-rotate(${clamp(hue, -180, 180)}deg) saturate(${clamp(saturation, 0, 2)}) brightness(${clamp(brightness, 0.35, 1.8)})`,
        }}
      />
    </div>
  );
}
