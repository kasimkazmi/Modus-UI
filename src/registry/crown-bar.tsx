"use client";
// Ported from ThreeUI Community's Animated Top Dock (MIT, © 2026 Meng To).

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { cn } from "@/lib/utils";

export type CrownBarVariant = "pill" | "modern" | "retro" | "glass";

export interface CrownBarProps {
  variant?: CrownBarVariant;
  proximity?: number;
  spring?: number;
  damping?: number;
  widthGrowth?: number;
  heightGrowth?: number;
  drop?: number;
  /* retro field */
  pixelSize?: number;
  speed?: number;
  noise?: number;
  levels?: number;
  scanlines?: number;
  /* glass field */
  particles?: number;
  thickness?: number;
  dispersion?: number;
  specular?: number;
  rim?: number;
  drift?: number;
  className?: string;
}

type DockOptions = Required<Omit<CrownBarProps, "className">>;

type DockItem = { id: string; label: string; icon: ReactNode };

const ITEMS: readonly DockItem[] = [
  {
    id: "system",
    label: "SYSTEM",
    icon: (
      <>
        <rect x="2.25" y="2.25" width="4.5" height="4.5" rx=".8" />
        <rect x="9.25" y="2.25" width="4.5" height="4.5" rx=".8" />
        <rect x="2.25" y="9.25" width="4.5" height="4.5" rx=".8" />
        <rect x="9.25" y="9.25" width="4.5" height="4.5" rx=".8" />
      </>
    ),
  },
  {
    id: "method",
    label: "METHOD",
    icon: (
      <>
        <circle cx="3" cy="8" r="1.5" />
        <circle cx="12.5" cy="3.5" r="1.5" />
        <circle cx="12.5" cy="12.5" r="1.5" />
        <path d="M4.5 7.3 11 4.2M4.5 8.7l6.5 3.1" />
      </>
    ),
  },
  {
    id: "work",
    label: "WORK",
    icon: (
      <>
        <rect x="2" y="3" width="12" height="10" rx="1.5" />
        <path d="M2 6h12M5 4.5h.01M7 4.5h.01" />
      </>
    ),
  },
  {
    id: "access",
    label: "ACCESS",
    icon: (
      <>
        <circle cx="5.2" cy="6.2" r="2.7" />
        <path d="m7.2 8.2 5.9 5.1M10.2 10.8l1.5-1.5M12 12.4l1.4-1.4" />
      </>
    ),
  },
  {
    id: "notes",
    label: "NOTES",
    icon: (
      <>
        <path d="M4 2.25h5.4L12 4.85v8.9H4z" />
        <path d="M9.25 2.25V5h2.7M6 8h4M6 10.5h4" />
      </>
    ),
  },
];

const MODERN_ITEMS: readonly DockItem[] = [
  {
    id: "product",
    label: "Product",
    icon: (
      <>
        <path d="M8 1.9 14.1 5v6L8 14.1 1.9 11V5z" />
        <path d="M1.9 5 8 8.1 14.1 5M8 8.1v6" />
      </>
    ),
  },
  {
    id: "solutions",
    label: "Solutions",
    icon: (
      <>
        <path d="M8 1.9 14.4 5.6 8 9.3 1.6 5.6z" />
        <path d="m2.6 8 5.4 3.1L13.4 8M2.6 10.7 8 13.8l5.4-3.1" />
      </>
    ),
  },
  {
    id: "docs",
    label: "Docs",
    icon: (
      <>
        <path d="M3.4 2.4h5.4l3.8 3.8v7.4H3.4z" />
        <path d="M8.8 2.4v3.8h3.8M5.9 9h4.2M5.9 11.2h3" />
      </>
    ),
  },
  {
    id: "pricing",
    label: "Pricing",
    icon: (
      <>
        <path d="M8.6 2.2H13v4.4l-6.6 6.6a1.2 1.2 0 0 1-1.7 0L2.2 10.5a1.2 1.2 0 0 1 0-1.7z" />
        <circle cx="10.6" cy="4.6" r=".9" />
      </>
    ),
  },
  {
    id: "changelog",
    label: "Changelog",
    icon: (
      <>
        <circle cx="8" cy="8" r="5.9" />
        <path d="M8 4.6V8l2.4 1.5" />
      </>
    ),
  },
];

/* every retro glyph is drawn on a 7x7 lattice of whole units so the icons stay
   on the same pixel grid as the dithered field behind them */
const RETRO_ITEMS: readonly DockItem[] = [
  {
    id: "system",
    label: "SYSTEM",
    icon: (
      <>
        <rect x="1" y="1" width="2" height="2" />
        <rect x="4" y="1" width="2" height="2" />
        <rect x="1" y="4" width="2" height="2" />
        <rect x="4" y="4" width="2" height="2" />
      </>
    ),
  },
  {
    id: "files",
    label: "FILES",
    icon: (
      <>
        <rect x="1" y="0" width="4" height="1" />
        <rect x="1" y="1" width="1" height="5" />
        <rect x="5" y="1" width="1" height="5" />
        <rect x="1" y="6" width="5" height="1" />
        <rect x="2" y="2" width="3" height="1" />
        <rect x="2" y="4" width="3" height="1" />
      </>
    ),
  },
  {
    id: "net",
    label: "NET",
    icon: (
      <>
        <rect x="3" y="0" width="1" height="7" />
        <rect x="0" y="3" width="7" height="1" />
        <rect x="1" y="1" width="1" height="1" />
        <rect x="5" y="1" width="1" height="1" />
        <rect x="1" y="5" width="1" height="1" />
        <rect x="5" y="5" width="1" height="1" />
      </>
    ),
  },
  {
    id: "disk",
    label: "DISK",
    icon: (
      <>
        <rect x="0" y="1" width="7" height="5" />
        <rect x="2" y="0" width="3" height="2" />
        <rect x="1" y="4" width="5" height="1" />
      </>
    ),
  },
  {
    id: "help",
    label: "HELP",
    icon: (
      <>
        <rect x="2" y="0" width="3" height="1" />
        <rect x="4" y="1" width="2" height="2" />
        <rect x="3" y="3" width="2" height="1" />
        <rect x="3" y="4" width="1" height="1" />
        <rect x="3" y="6" width="1" height="1" />
      </>
    ),
  },
];

const GLASS_ITEMS: readonly DockItem[] = [
  {
    id: "overview",
    label: "Overview",
    icon: (
      <>
        <circle cx="8" cy="8" r="5.8" />
        <path d="M2.4 8c2.4-3.5 9-3.5 11.3 0" />
      </>
    ),
  },
  {
    id: "studio",
    label: "Studio",
    icon: (
      <>
        <rect x="2.2" y="2.2" width="11.6" height="11.6" rx="3.6" />
        <circle cx="8" cy="8" r="2.5" />
      </>
    ),
  },
  {
    id: "library",
    label: "Library",
    icon: (
      <>
        <rect x="2.1" y="2.6" width="3" height="10.8" rx="1" />
        <rect x="6.4" y="2.6" width="3" height="10.8" rx="1" />
        <path d="m10.9 3.7 2.9 1-2.4 8.6-2.2-.8" />
      </>
    ),
  },
  {
    id: "motion",
    label: "Motion",
    icon: (
      <>
        <path d="M1.8 10.6c2.6 0 3-5.2 6.2-5.2s3.6 5.2 6.2 5.2" />
        <circle cx="8" cy="5.4" r=".9" />
      </>
    ),
  },
  {
    id: "labs",
    label: "Labs",
    icon: (
      <>
        <path d="M6.4 2.2v4L3 12.1a1.3 1.3 0 0 0 1.1 2h7.8a1.3 1.3 0 0 0 1.1-2L9.6 6.2v-4" />
        <path d="M5.6 2.2h4.8M4.9 9.6h6.2" />
      </>
    ),
  },
];

const VARIANT_ITEMS: Record<CrownBarVariant, readonly DockItem[]> = {
  pill: ITEMS,
  modern: MODERN_ITEMS,
  retro: RETRO_ITEMS,
  glass: GLASS_ITEMS,
};

const BRAND_MARK = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect width="24" height="24" rx="4.5" fill="currentColor" />
    <path d="M6 6h8.6L18 9.35v8.15H9.15L6 14.35V6Z" fill="hsl(var(--background))" />
    <path d="M9 9h5.15L15 9.85V15H9.85L9 14.15V9Z" fill="currentColor" />
    <path d="M12 9v6M9 12h6" stroke="hsl(var(--background))" strokeWidth=".7" />
  </svg>
);

/* ── Proximity spring controller ─────────────────────────────────────────── */

type ControllerOptions = DockOptions & {
  axis: "x" | "y";
  distribute: boolean;
  lockTrack: boolean;
  reduced: boolean;
};

type DockItemState = {
  element: HTMLElement;
  baseWidth: number;
  baseHeight: number;
  value: number;
  velocity: number;
  target: number;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function createTopDockController(root: HTMLElement, getOptions: () => ControllerOptions) {
  const precisionQuery = window.matchMedia("(hover:hover) and (pointer:fine)");
  const items: DockItemState[] = Array.from(
    root.querySelectorAll<HTMLElement>("[data-dock-item]"),
  ).map((element) => ({
    element,
    baseWidth: 0,
    baseHeight: 0,
    value: 0,
    velocity: 0,
    target: 0,
  }));

  let enabled = false;
  let pointerActive = false;
  let dirty = false;
  let frame = 0;

  const canAnimate = () =>
    !getOptions().reduced &&
    root.clientWidth > 0 &&
    window.innerWidth > 600 &&
    precisionQuery.matches;

  /* the only place item geometry is written, so the three fits stay one
     behaviour with three ways of spending the same spring value */
  const applyLayout = () => {
    const options = getOptions();
    if (options.distribute && options.axis !== "y") {
      const weights = items.map(
        (state) => state.baseWidth + options.widthGrowth * clamp(state.value, 0, 1.08),
      );
      const total = weights.reduce((sum, weight) => sum + weight, 0);
      const natural = items.reduce((sum, state) => sum + state.baseWidth, 0);
      const track = root.clientWidth >= natural ? root.clientWidth : 0;
      items.forEach((state, index) => {
        state.element.style.width = track
          ? `${((track * weights[index]) / total).toFixed(2)}px`
          : "";
        state.element.style.height = "";
        state.element.style.transform = "";
      });
      return;
    }
    for (const state of items) {
      const value = clamp(state.value, 0, 1.08);
      if (options.axis === "y") {
        state.element.style.width = "";
        state.element.style.height = `${(state.baseHeight + options.heightGrowth * value).toFixed(2)}px`;
        state.element.style.transform = `translateX(${(value * options.drop).toFixed(2)}px)`;
        continue;
      }
      const isLogo = state.element.classList.contains("animated-top-dock__logo");
      const extraWidth = isLogo
        ? options.widthGrowth * (14 / 17)
        : Math.min(options.widthGrowth, state.baseWidth * 0.24);
      const extraHeight = isLogo ? options.heightGrowth * (14 / 16) : options.heightGrowth;
      state.element.style.width = `${(state.baseWidth + extraWidth * value).toFixed(2)}px`;
      state.element.style.height = `${(state.baseHeight + extraHeight * value).toFixed(2)}px`;
      state.element.style.transform = `translateY(${(value * options.drop).toFixed(2)}px)`;
    }
  };

  const measure = () => {
    enabled = canAnimate();
    /* released first, so the rest width is measured against the track's own
       content rather than against the width the last measurement pinned */
    if (getOptions().lockTrack) root.style.width = "";
    for (const state of items) {
      state.element.style.width = "";
      state.element.style.height = "";
      state.element.style.transform = "";
      state.element.dataset.dockNear = "false";
    }
    for (const state of items) {
      const rect = state.element.getBoundingClientRect();
      state.baseWidth = rect.width;
      state.baseHeight = rect.height;
      state.value = 0;
      state.velocity = 0;
      state.target = 0;
    }
    pointerActive = false;
    dirty = false;
    if (getOptions().distribute) applyLayout();
    if (getOptions().lockTrack)
      root.style.width = `${root.getBoundingClientRect().width.toFixed(2)}px`;
    root.dataset.dockState = enabled ? "idle" : "static";
    root.dataset.dockMax = "0.00";
  };

  const setTargets = (clientX: number, clientY: number) => {
    if (!enabled) return;
    const options = getOptions();
    const vertical = options.axis === "y";
    const pointer = vertical ? clientY : clientX;
    const rects = items.map((state) => state.element.getBoundingClientRect());
    for (let index = 0; index < items.length; index += 1) {
      const rect = rects[index];
      const center = vertical ? rect.top + rect.height * 0.5 : rect.left + rect.width * 0.5;
      const proximity = clamp(
        1 - Math.abs(pointer - center) / Math.max(1, options.proximity),
        0,
        1,
      );
      const influence = proximity * proximity * (3 - 2 * proximity);
      items[index].target = influence;
      items[index].element.dataset.dockNear = influence > 0.08 ? "true" : "false";
    }
    pointerActive = true;
    dirty = true;
    root.dataset.dockState = "active";
  };

  const focusItem = (item: HTMLElement) => {
    if (!enabled) return;
    const index = items.findIndex((state) => state.element === item);
    if (index < 0) return;
    items.forEach((state, itemIndex) => {
      state.target = itemIndex === index ? 1 : Math.abs(itemIndex - index) === 1 ? 0.24 : 0;
      state.element.dataset.dockNear = state.target > 0.08 ? "true" : "false";
    });
    pointerActive = false;
    dirty = true;
    root.dataset.dockState = "focus";
  };

  const reset = () => {
    pointerActive = false;
    dirty = true;
    items.forEach((state) => {
      state.target = 0;
      state.element.dataset.dockNear = "false";
    });
  };

  const draw = () => {
    if (enabled && dirty) {
      const options = getOptions();
      let moving = false;
      let maxValue = 0;
      for (const state of items) {
        state.velocity += (state.target - state.value) * options.spring;
        state.velocity *= options.damping;
        state.value += state.velocity;
        if (Math.abs(state.target - state.value) < 0.001 && Math.abs(state.velocity) < 0.001) {
          state.value = state.target;
          state.velocity = 0;
        } else {
          moving = true;
        }
        maxValue = Math.max(maxValue, clamp(state.value, 0, 1.08));
      }
      applyLayout();
      root.dataset.dockMax = maxValue.toFixed(2);
      if (!moving) {
        dirty = false;
        if (items.every((state) => state.target === 0)) root.dataset.dockState = "idle";
      }
    }
    frame = requestAnimationFrame(draw);
  };

  const onPointerMove = (event: PointerEvent) => setTargets(event.clientX, event.clientY);
  const onWindowPointerMove = (event: PointerEvent) => {
    if (!pointerActive) return;
    const rootRect = root.getBoundingClientRect();
    const itemRects = items.map((state) => state.element.getBoundingClientRect());
    const bottom = Math.max(rootRect.bottom, ...itemRects.map((rect) => rect.bottom));
    const outside =
      event.clientX < rootRect.left ||
      event.clientX > rootRect.right ||
      event.clientY < rootRect.top ||
      event.clientY > bottom;
    if (outside) reset();
  };
  const onFocusIn = (event: FocusEvent) => {
    const item = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-dock-item]");
    if (item) focusItem(item);
  };
  const onFocusOut = () =>
    requestAnimationFrame(() => {
      if (!root.contains(document.activeElement)) reset();
    });
  const onKeyDown = (event: KeyboardEvent) => {
    const item = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-dock-item]");
    if (item && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      item.click();
    }
  };
  const onClick = () => reset();

  /* measured after the label font is available, so auto-width items do not
     lock in a box their own text then overflows */
  let released = false;
  const remeasure = () => {
    if (!released) measure();
  };
  document.fonts?.ready.then(remeasure);

  const resizeObserver = new ResizeObserver(measure);
  resizeObserver.observe(
    root.closest<HTMLElement>("[data-dock-frame]") ?? root.parentElement ?? root,
  );
  root.addEventListener("pointermove", onPointerMove);
  root.addEventListener("pointerleave", reset);
  root.addEventListener("focusin", onFocusIn);
  root.addEventListener("focusout", onFocusOut);
  root.addEventListener("keydown", onKeyDown);
  root.addEventListener("click", onClick);
  window.addEventListener("pointermove", onWindowPointerMove, { passive: true });
  precisionQuery.addEventListener("change", measure);
  measure();
  frame = requestAnimationFrame(draw);

  return () => {
    released = true;
    root.style.width = "";
    cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    root.removeEventListener("pointermove", onPointerMove);
    root.removeEventListener("pointerleave", reset);
    root.removeEventListener("focusin", onFocusIn);
    root.removeEventListener("focusout", onFocusOut);
    root.removeEventListener("keydown", onKeyDown);
    root.removeEventListener("click", onClick);
    window.removeEventListener("pointermove", onWindowPointerMove);
    precisionQuery.removeEventListener("change", measure);
  };
}

/* ── Retro pixel field (raw WebGL) ───────────────────────────────────────── */

type ShaderField = {
  resize: (width: number, height: number) => void;
  render: (now: number) => void;
  setPointer?: (x: number, y: number) => void;
  dispose: () => void;
};

const RETRO_VERTEX = "attribute vec2 aPos;\nvoid main(){ gl_Position = vec4(aPos, 0.0, 1.0); }";

/* the scene is a single luminance field, dithered with an ordered 8x8 Bayer
   threshold, snapped to uLevels steps, then mapped through an eight-stop dusk ramp */
const RETRO_FRAGMENT = `precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uNoise;
uniform float uLevels;
uniform vec3 uPaper;
uniform vec3 uAccent;
uniform vec3 uInk;

float hash(vec2 p){ p = fract(p * vec2(127.1, 311.7)); p += dot(p, p + 34.23); return fract(p.x * p.y); }

float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i), b = hash(i + vec2(1.0, 0.0)), c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p){
  float sum = 0.0, amp = 0.5;
  for (int i = 0; i < 5; i++){ sum += amp * vnoise(p); p = p * 2.03 + 11.7; amp *= 0.5; }
  return sum;
}

float bayer2(vec2 a){ a = floor(a); return fract(a.x * 0.5 + a.y * a.y * 0.75); }
float bayer4(vec2 a){ return bayer2(a * 0.5) * 0.25 + bayer2(a); }
float bayer8(vec2 a){ return bayer4(a * 0.5) * 0.25 + bayer2(a); }

vec3 stop(float index){
  float t = index / 7.0;
  return t < 0.6 ? mix(uPaper, uAccent, t / 0.6) : mix(uAccent, uInk, (t - 0.6) / 0.4 * 0.7);
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float t = uTime;

  vec2 cloud = vec2(uv.x * 3.4, uv.y * 2.1);
  float weather = fbm(cloud + vec2(t * 0.055, t * -0.021));
  weather = mix(weather, fbm(cloud * 1.9 + vec2(-t * 0.032, t * 0.044)), 0.42);

  float sky = smoothstep(0.98, 0.20, uv.y) * 0.36;
  float heat = smoothstep(0.60, 0.16, uv.y) * 0.32;
  float ground = smoothstep(0.26, 0.08, uv.y);
  float sun = smoothstep(0.38, 0.0, length((uv - vec2(0.5, 0.29)) * vec2(0.70, 1.5))) * 0.20;
  float field = 0.11 + sky + heat + sun - ground * 0.80 + (weather - 0.5) * 0.82 * uNoise;

  float grain = hash(floor(gl_FragCoord.xy) + floor(t * 12.0)) - 0.5;
  field += grain * 0.055 * uNoise;
  field *= 1.0 - 0.34 * smoothstep(0.45, 1.05, length((uv - vec2(0.5, 0.46)) * vec2(1.06, 1.0)));

  float levels = max(uLevels, 2.0);
  float dither = bayer8(gl_FragCoord.xy) - 0.5;
  float quantised = clamp(field + dither / levels, 0.0, 0.9999);
  gl_FragColor = vec4(stop(floor(quantised * levels) * (7.0 / (levels - 1.0))), 1.0);
}`;

type Rgb = [number, number, number];
type Palette = { paper: Rgb; ink: Rgb; accent: Rgb };

/* theme tokens are bare HSL channels; resolve them to linear 0-1 RGB for the shaders */
function readToken(name: string): Rgb {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const [h = 0, sat = 0, l = 50] = raw.split(/[\s,/]+/).map((part) => parseFloat(part) || 0);
  const s = sat / 100;
  const li = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(li, 1 - li);
  const f = (n: number) => li - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)];
}

function readPalette(): Palette {
  return {
    paper: readToken("--background"),
    ink: readToken("--foreground"),
    accent: readToken("--primary"),
  };
}

const INERT: ShaderField = { resize: () => {}, render: () => {}, dispose: () => {} };

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createRetroPixelField(
  canvas: HTMLCanvasElement,
  getOptions: () => DockOptions,
  getPalette: () => Palette,
): ShaderField {
  const gl = canvas.getContext("webgl", {
    antialias: false,
    alpha: false,
    depth: false,
    preserveDrawingBuffer: false,
  });
  if (!gl) return INERT;

  const program = gl.createProgram();
  const vertex = compileShader(gl, gl.VERTEX_SHADER, RETRO_VERTEX);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, RETRO_FRAGMENT);
  if (!program || !vertex || !fragment) return INERT;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return INERT;
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "aPos");

  const uRes = gl.getUniformLocation(program, "uRes");
  const uTime = gl.getUniformLocation(program, "uTime");
  const uNoise = gl.getUniformLocation(program, "uNoise");
  const uLevels = gl.getUniformLocation(program, "uLevels");
  const uPaper = gl.getUniformLocation(program, "uPaper");
  const uAccent = gl.getUniformLocation(program, "uAccent");
  const uInk = gl.getUniformLocation(program, "uInk");

  let width = 1;
  let height = 1;
  let clock = 0;
  let lastAt = performance.now();

  const resize = (cssWidth: number, cssHeight: number) => {
    const { pixelSize } = getOptions();
    /* the drawing buffer is the low-resolution artwork; CSS blows it up with
       nearest-neighbour sampling, so every pixel stays square and hard-edged */
    width = Math.max(2, Math.round(cssWidth / Math.max(1, pixelSize)));
    height = Math.max(2, Math.round(cssHeight / Math.max(1, pixelSize)));
    if (canvas.width === width && canvas.height === height) return;
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
  };

  const render = (now: number) => {
    const options = getOptions();
    clock += Math.min(96, now - lastAt) * 0.001 * options.speed;
    lastAt = now;
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(uRes, width, height);
    gl.uniform1f(uTime, clock);
    gl.uniform1f(uNoise, options.noise);
    gl.uniform1f(uLevels, options.levels);
    const palette = getPalette();
    gl.uniform3fv(uPaper, palette.paper);
    gl.uniform3fv(uAccent, palette.accent);
    gl.uniform3fv(uInk, palette.ink);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const dispose = () => {
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
  };

  return { resize, render, dispose };
}

/* ── Glass bead field (Three.js) ─────────────────────────────────────────── */

const MAX_BEADS = 34;

const QUAD_VERTEX = "void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }";

const BACKDROP_FRAGMENT = `precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uPointer;
uniform vec3 uPaper;
uniform vec3 uAccent;
uniform vec3 uInk;


void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float t = uTime * 0.17;
  vec3 col = uPaper;
  vec3 deep = mix(uAccent, uInk, 0.35);
  col = mix(col, uAccent, smoothstep(0.86, 0.0, length((uv - vec2(0.23 + 0.055 * sin(t * 0.9), 0.76 + 0.045 * cos(t * 0.7))) * vec2(uRes.x / max(uRes.y, 1.0), 1.0))) * 0.55);
  col = mix(col, deep, smoothstep(0.80, 0.0, length((uv - vec2(0.82 + 0.05 * cos(t * 0.8), 0.34 + 0.055 * sin(t * 1.1))) * vec2(uRes.x / max(uRes.y, 1.0), 1.0))) * 0.5);
  col = mix(col, uInk, smoothstep(0.5, 0.0, length((uv - vec2(0.5 + uPointer.x * 0.20, 0.56 + uPointer.y * 0.16)) * vec2(uRes.x / max(uRes.y, 1.0), 1.0))) * 0.12);
  float stripes = step(0.5, fract((gl_FragCoord.x + gl_FragCoord.y) / 14.0));
  col = mix(col, uInk, stripes * 0.025);
  float vignette = smoothstep(1.34, 0.30, length((uv - 0.5) * vec2(1.05, 1.0)));
  col = mix(col * 0.9, col, vignette);
  gl_FragColor = vec4(col, 1.0);
}`;

const GLASS_VERTEX = `varying vec3 vNormalView;
varying vec3 vViewPos;
varying vec4 vScreen;

void main(){
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vNormalView = normalize(normalMatrix * normal);
  vViewPos = mvPosition.xyz;
  vScreen = projectionMatrix * mvPosition;
  gl_Position = vScreen;
}`;

/* screen-space refraction with a slightly different index per channel, so the
   bead edges split into colour the way real glass does */
const GLASS_FRAGMENT = `precision highp float;
uniform sampler2D uBackdrop;
uniform float uThickness;
uniform float uDispersion;
uniform float uSpecular;
uniform float uRim;
uniform vec3 uTint;
uniform vec3 uLight;
varying vec3 vNormalView;
varying vec3 vViewPos;
varying vec4 vScreen;

void main(){
  vec2 screenUV = (vScreen.xy / vScreen.w) * 0.5 + 0.5;
  vec3 N = normalize(vNormalView);
  vec3 V = normalize(-vViewPos);
  vec3 I = -V;
  float fresnel = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 3.4);

  vec2 offsetR = refract(I, N, 1.0 / (1.44 - uDispersion)).xy * uThickness;
  vec2 offsetG = refract(I, N, 1.0 / 1.44).xy * uThickness;
  vec2 offsetB = refract(I, N, 1.0 / (1.44 + uDispersion)).xy * uThickness;

  vec3 col;
  col.r = texture2D(uBackdrop, clamp(screenUV + offsetR, 0.002, 0.998)).r;
  col.g = texture2D(uBackdrop, clamp(screenUV + offsetG, 0.002, 0.998)).g;
  col.b = texture2D(uBackdrop, clamp(screenUV + offsetB, 0.002, 0.998)).b;
  col *= uTint;

  vec3 L = normalize(uLight);
  vec3 H = normalize(L + V);
  float ndoth = max(dot(N, H), 0.0);
  col += pow(ndoth, 150.0) * uSpecular;
  col += pow(ndoth, 16.0) * uSpecular * 0.11;
  vec3 H2 = normalize(normalize(vec3(0.55, -0.7, 0.45)) + V);
  col += pow(max(dot(N, H2), 0.0), 44.0) * uSpecular * 0.22;
  col += fresnel * uRim * vec3(0.86, 0.90, 1.0);

  float haze = smoothstep(7.4, 11.4, -vViewPos.z);
  col = mix(col, texture2D(uBackdrop, screenUV).rgb, haze * 0.7);
  gl_FragColor = vec4(col, 1.0);
}`;

type Bead = {
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
  origin: THREE.Vector3;
  bob: number;
  phase: number;
  spin: THREE.Vector3;
  radius: number;
};

/* one deterministic sequence so the arrangement is identical on every load */
function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function createGlassParticleField(
  canvas: HTMLCanvasElement,
  getOptions: () => DockOptions,
  getPalette: () => Palette,
): ShaderField {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const backdropScene = new THREE.Scene();
  const backdropCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const backdropUniforms = {
    uRes: { value: new THREE.Vector2(1, 1) },
    uTime: { value: 0 },
    uPointer: { value: new THREE.Vector2() },
    uPaper: { value: new THREE.Vector3() },
    uAccent: { value: new THREE.Vector3() },
    uInk: { value: new THREE.Vector3() },
  };
  const backdropMaterial = new THREE.ShaderMaterial({
    uniforms: backdropUniforms,
    vertexShader: QUAD_VERTEX,
    fragmentShader: BACKDROP_FRAGMENT,
    depthTest: false,
    depthWrite: false,
  });
  const backdropGeometry = new THREE.PlaneGeometry(2, 2);
  backdropScene.add(new THREE.Mesh(backdropGeometry, backdropMaterial));

  const target = new THREE.WebGLRenderTarget(2, 2, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
  });

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0, 7.4);
  const group = new THREE.Group();
  scene.add(group);

  const geometries = [
    new THREE.SphereGeometry(1, 44, 30),
    new THREE.IcosahedronGeometry(1, 1),
    new THREE.TorusGeometry(0.78, 0.3, 22, 56),
  ];
  const tints = [
    new THREE.Color(1.04, 1.0, 1.02),
    new THREE.Color(0.97, 1.0, 1.06),
    new THREE.Color(1.05, 0.99, 0.97),
  ];

  const random = seeded(20260826);
  const beads: Bead[] = [];
  for (let index = 0; index < MAX_BEADS; index += 1) {
    const hero = index < 8;
    const radius = hero ? 0.4 + random() * 0.34 : 0.09 + random() * 0.18;
    const geometry = geometries[hero ? (index === 3 ? 1 : index === 6 ? 2 : 0) : 0];
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uBackdrop: { value: target.texture },
        uThickness: { value: 0.1 },
        uDispersion: { value: 0.05 },
        uSpecular: { value: 0.85 },
        uRim: { value: 0.5 },
        uTint: { value: tints[index % tints.length] },
        uLight: { value: new THREE.Vector3(-0.45, 0.86, 0.62) },
      },
      vertexShader: GLASS_VERTEX,
      fragmentShader: GLASS_FRAGMENT,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.setScalar(radius);
    /* hero beads are rejection-sampled so two large spheres never intersect */
    const origin = new THREE.Vector3();
    for (let attempt = 0; attempt < 48; attempt += 1) {
      origin.set(
        (random() - 0.5) * 8.4,
        (random() - 0.5) * 5.0 - 0.25,
        hero ? -1.4 + random() * 2.6 : -3.6 + random() * 2.4,
      );
      if (!hero) break;
      const clear = beads.every((placed) => {
        const dx = placed.origin.x - origin.x;
        const dy = placed.origin.y - origin.y;
        return Math.hypot(dx, dy) > (placed.radius + radius) * 1.25 + 0.3;
      });
      if (clear) break;
    }
    mesh.position.copy(origin);
    mesh.rotation.set(random() * 6.28, random() * 6.28, random() * 6.28);
    group.add(mesh);
    beads.push({
      mesh,
      material,
      origin,
      radius,
      bob: 0.14 + random() * 0.34,
      phase: random() * 6.28,
      spin: new THREE.Vector3(
        (random() - 0.5) * 0.28,
        (random() - 0.5) * 0.34,
        (random() - 0.5) * 0.2,
      ),
    });
  }

  const pointer = new THREE.Vector2();
  const pointerTarget = new THREE.Vector2();
  let width = 1;
  let height = 1;
  let clock = 0;
  let lastAt = performance.now();

  const resize = (cssWidth: number, cssHeight: number) => {
    const nextWidth = Math.max(1, Math.round(cssWidth));
    const nextHeight = Math.max(1, Math.round(cssHeight));
    if (nextWidth === width && nextHeight === height) return;
    width = nextWidth;
    height = nextHeight;
    const ratio = Math.min(window.devicePixelRatio, 2);
    renderer.setSize(width, height, false);
    target.setSize(Math.round(width * ratio), Math.round(height * ratio));
    backdropUniforms.uRes.value.set(width * ratio, height * ratio);
    camera.aspect = width / height;
    camera.fov = camera.aspect > 1 ? 42 : 42 / Math.max(0.62, camera.aspect);
    camera.updateProjectionMatrix();
    for (const bead of beads) bead.material.uniforms.uBackdrop.value = target.texture;
  };

  const setPointer = (x: number, y: number) => pointerTarget.set(x, y);

  const render = (now: number) => {
    const options = getOptions();
    clock += Math.min(96, now - lastAt) * 0.001;
    lastAt = now;
    pointer.lerp(pointerTarget, 0.045);

    const visible = Math.max(4, Math.min(MAX_BEADS, Math.round(options.particles)));
    for (let index = 0; index < beads.length; index += 1) {
      const bead = beads[index];
      bead.mesh.visible = index < visible;
      if (!bead.mesh.visible) continue;
      const uniforms = bead.material.uniforms;
      uniforms.uThickness.value = options.thickness * (0.55 + bead.radius * 0.9);
      uniforms.uDispersion.value = options.dispersion;
      uniforms.uSpecular.value = options.specular;
      uniforms.uRim.value = options.rim;
      const t = clock * options.drift;
      bead.mesh.position.set(
        bead.origin.x + Math.sin(t * 0.21 + bead.phase) * bead.bob * 0.9,
        bead.origin.y + Math.cos(t * 0.27 + bead.phase * 1.3) * bead.bob,
        bead.origin.z + Math.sin(t * 0.17 + bead.phase * 0.7) * bead.bob * 0.5,
      );
      bead.mesh.rotation.x += bead.spin.x * 0.0075 * options.drift;
      bead.mesh.rotation.y += bead.spin.y * 0.0075 * options.drift;
      bead.mesh.rotation.z += bead.spin.z * 0.0075 * options.drift;
    }

    group.rotation.y = pointer.x * 0.14;
    group.rotation.x = -pointer.y * 0.1;
    group.position.x = pointer.x * 0.28;
    group.position.y = pointer.y * 0.2;

    const palette = getPalette();
    backdropUniforms.uPaper.value.fromArray(palette.paper);
    backdropUniforms.uAccent.value.fromArray(palette.accent);
    backdropUniforms.uInk.value.fromArray(palette.ink);
    backdropUniforms.uTime.value = clock;
    backdropUniforms.uPointer.value.set(pointer.x, pointer.y);

    renderer.setRenderTarget(target);
    renderer.render(backdropScene, backdropCamera);
    renderer.setRenderTarget(null);
    renderer.render(backdropScene, backdropCamera);
    renderer.autoClear = false;
    renderer.render(scene, camera);
    renderer.autoClear = true;
  };

  const dispose = () => {
    for (const bead of beads) bead.material.dispose();
    for (const geometry of geometries) geometry.dispose();
    backdropGeometry.dispose();
    backdropMaterial.dispose();
    target.dispose();
    renderer.dispose();
  };

  return { resize, render, setPointer, dispose };
}

/* shared host lifecycle: measure from the shell, pause off-screen and on a
   hidden tab, and hand the renderer a css-pixel box */
function useShaderField(
  active: boolean,
  reduced: boolean,
  create: (canvas: HTMLCanvasElement) => ShaderField,
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const createRef = useRef(create);
  createRef.current = create;

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!active || !host || !canvas) return undefined;
    const field = createRef.current(canvas);
    let frame = 0;
    let visible = true;
    let bounds = host.getBoundingClientRect();
    const resize = () => {
      bounds = host.getBoundingClientRect();
      field.resize(bounds.width, bounds.height);
      if (reduced) field.render(performance.now());
    };
    const tick = (now: number) => {
      field.resize(bounds.width, bounds.height);
      field.render(now);
      frame = visible && !document.hidden && !reduced ? requestAnimationFrame(tick) : 0;
    };
    const start = () => {
      if (!frame && visible && !document.hidden) frame = requestAnimationFrame(tick);
    };
    const onPointerMove = (event: PointerEvent) => {
      field.setPointer?.(
        ((event.clientX - bounds.left) / Math.max(1, bounds.width)) * 2 - 1,
        -(((event.clientY - bounds.top) / Math.max(1, bounds.height)) * 2 - 1),
      );
    };
    const onVisibility = () => {
      if (!reduced) start();
    };
    const resizeObserver = new ResizeObserver(resize);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      if (visible && !reduced) start();
      if (!visible && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    });
    resizeObserver.observe(host);
    intersection.observe(host);
    host.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    resize();
    frame = requestAnimationFrame(tick);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersection.disconnect();
      host.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibility);
      field.dispose();
    };
  }, [active, reduced]);

  return { hostRef, canvasRef };
}

export function CrownBar({
  variant = "modern",
  proximity = 122,
  spring = 0.19,
  damping = 0.7,
  widthGrowth = 17,
  heightGrowth = 16,
  drop = 3.5,
  pixelSize = 4,
  speed = 1,
  noise = 1,
  levels = 7,
  scanlines = 0.32,
  particles = 22,
  thickness = 0.115,
  dispersion = 0.05,
  specular = 0.85,
  rim = 0.5,
  drift = 1,
  className,
}: CrownBarProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduced = Boolean(prefersReducedMotion);
  const options: DockOptions = {
    variant,
    proximity,
    spring,
    damping,
    widthGrowth,
    heightGrowth,
    drop,
    pixelSize,
    speed,
    noise,
    levels,
    scanlines,
    particles,
    thickness,
    dispersion,
    specular,
    rim,
    drift,
  };
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  const items = VARIANT_ITEMS[variant] ?? ITEMS;
  const [active, setActive] = useState(items[0].id);
  useEffect(() => setActive(items[0].id), [items]);

  /* one spring, three fits: the command bar pins its track, the terminal
     renormalises its cells across the strip, and the glass rail runs the
     proximity field down the y axis */
  const rootRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    return createTopDockController(root, () => ({
      ...optionsRef.current,
      axis: variant === "glass" ? "y" : "x",
      distribute: variant === "retro",
      lockTrack: variant === "modern",
      reduced: reducedRef.current,
    }));
  }, [variant, reduced]);

  /* shader colours follow the theme tokens and re-resolve when <html> switches mode or palette */
  const paletteRef = useRef<Palette | null>(null);
  useEffect(() => {
    paletteRef.current = readPalette();
    const observer = new MutationObserver(() => {
      paletteRef.current = readPalette();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "style"],
    });
    return () => observer.disconnect();
  }, []);
  const getPalette = () => (paletteRef.current ??= readPalette());

  const retro = useShaderField(variant === "retro", reduced, (canvas) =>
    createRetroPixelField(canvas, () => optionsRef.current, getPalette),
  );
  const glass = useShaderField(variant === "glass", reduced, (canvas) =>
    createGlassParticleField(canvas, () => optionsRef.current, getPalette),
  );

  const dockItems = (itemClass: string, iconClass: string, viewBox: string) =>
    items.map((item) => (
      <button
        key={item.id}
        className={itemClass}
        data-dock-item
        type="button"
        aria-pressed={active === item.id}
        onClick={() => setActive(item.id)}
      >
        <span className={iconClass} aria-hidden="true">
          <svg viewBox={viewBox}>{item.icon}</svg>
        </span>
        <span>{item.label}</span>
      </button>
    ));

  const styles = <style dangerouslySetInnerHTML={{ __html: CROWN_BAR_CSS }} />;

  if (variant === "modern") {
    return (
      <div className={cn("animated-top-dock-component atd-modern", className)}>
        {styles}
        <div className="atd-modern__aurora" aria-hidden="true" />
        <header className="atd-modern__bar">
          <a
            className="atd-modern__brand"
            href="#crown-bar"
            onClick={(event) => event.preventDefault()}
          >
            <span className="atd-modern__mark" aria-hidden="true">
              {BRAND_MARK}
            </span>
            <span className="atd-modern__word">Modus</span>
          </a>
          <nav
            ref={rootRef}
            className="atd-modern__dock"
            aria-label="Primary"
            data-dock-state="idle"
            data-dock-max="0.00"
          >
            {dockItems("atd-modern__item", "atd-modern__icon", "0 0 16 16")}
          </nav>
          <div className="atd-modern__actions">
            <button className="atd-modern__ghost" type="button">
              Sign in
            </button>
            <button className="atd-modern__cta" type="button">
              <span>Read the issue</span>
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M3.2 8h9.1M8.6 4.3 12.4 8l-3.8 3.7" />
              </svg>
            </button>
          </div>
        </header>
        <div className="atd-modern__stage" aria-hidden="true">
          <p className="atd-modern__eyebrow">Issue 04 · Navigation</p>
          <p className="atd-modern__headline">Set in the house style</p>
        </div>
        <p className="animated-top-dock-component__caption">
          LOGO LEFT · DOCK CENTRE · ACTION RIGHT
        </p>
      </div>
    );
  }

  if (variant === "retro") {
    return (
      <div
        ref={retro.hostRef}
        className={cn("animated-top-dock-component atd-retro", className)}
        style={{ "--atd-retro-scan": scanlines } as CSSProperties}
      >
        {styles}
        <canvas ref={retro.canvasRef} className="atd-retro__field" aria-hidden="true" />
        <div className="atd-retro__vignette" aria-hidden="true" />
        <header className="atd-retro__bar">
          <div className="atd-retro__brand">
            <span className="atd-retro__badge" aria-hidden="true">
              <svg viewBox="0 0 7 7">
                <rect x="0" y="2" width="7" height="3" />
                <rect x="2" y="0" width="3" height="7" />
              </svg>
            </span>
            MODUS//OS
          </div>
          <nav
            ref={rootRef}
            className="atd-retro__dock"
            aria-label="Primary"
            data-dock-state="idle"
            data-dock-max="0.00"
          >
            {dockItems("atd-retro__item", "atd-retro__icon", "0 0 7 7")}
          </nav>
          <button className="atd-retro__cta" type="button">
            <span aria-hidden="true">▶</span>
            RUN
          </button>
        </header>
        <p className="atd-retro__readout">
          <span>MEM 640K</span>
          <span>DITHER 8×8</span>
          <span>PAL 8</span>
        </p>
        <p className="animated-top-dock-component__caption">FITTED STRIP · ORDERED DITHER</p>
      </div>
    );
  }

  if (variant === "glass") {
    return (
      <div
        ref={glass.hostRef}
        className={cn("animated-top-dock-component atd-glass", className)}
        data-dock-frame
      >
        {styles}
        <canvas ref={glass.canvasRef} className="atd-glass__field" aria-hidden="true" />
        <header className="atd-glass__rail">
          <a
            className="atd-glass__brand"
            href="#crown-bar"
            onClick={(event) => event.preventDefault()}
          >
            <span className="atd-glass__mark" aria-hidden="true">
              {BRAND_MARK}
            </span>
            <span className="atd-glass__word">Modus</span>
          </a>
          <span className="atd-glass__hairline" aria-hidden="true" />
          <nav
            ref={rootRef}
            className="atd-glass__dock"
            aria-label="Primary"
            data-dock-state="idle"
            data-dock-max="0.00"
          >
            {dockItems("atd-glass__item", "atd-glass__icon", "0 0 16 16")}
          </nav>
          <span className="atd-glass__hairline" aria-hidden="true" />
          <button className="atd-glass__cta" type="button">
            Get the app
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3.4 8h9.2M8.8 4.2 12.6 8l-3.8 3.8" />
            </svg>
          </button>
        </header>
        <p className="animated-top-dock-component__caption">
          VERTICAL RAIL · SCREEN-SPACE DISPERSION
        </p>
      </div>
    );
  }

  return (
    <div className={cn("animated-top-dock-component", className)}>
      {styles}
      <nav
        ref={rootRef}
        className="animated-top-dock__nav"
        aria-label="Animated top dock"
        data-dock-state="idle"
        data-dock-max="0.00"
      >
        <button
          className="animated-top-dock__item animated-top-dock__logo"
          data-dock-item
          type="button"
          aria-label="Home"
          onClick={() => setActive("system")}
        >
          {BRAND_MARK}
        </button>
        {items.map((item) => (
          <button
            key={item.id}
            className="animated-top-dock__item animated-top-dock__link"
            data-dock-item
            type="button"
            aria-pressed={active === item.id}
            onClick={() => setActive(item.id)}
          >
            <span className="animated-top-dock__icon" aria-hidden="true">
              <svg viewBox="0 0 16 16">{item.icon}</svg>
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <p className="animated-top-dock-component__caption">MOVE ACROSS THE DOCK · FOCUS WITH TAB</p>
    </div>
  );
}

/* the original stylesheet, ported verbatim: the dock's container-query scale,
   pseudo-element overlays and attribute-driven states do not map to utilities */
const CROWN_BAR_CSS = `
.animated-top-dock-component {
  position: relative;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  container-type: inline-size;
  color: hsl(var(--foreground));
  background: hsl(var(--background));
  font-family: var(--font-body), ui-sans-serif, system-ui, sans-serif;
}
.animated-top-dock-component::after {
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;
  content: "";
  opacity: 0.12;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.16'/%3E%3C/svg%3E");
  mix-blend-mode: soft-light;
}
.animated-top-dock-component__caption {
  position: absolute;
  z-index: 6;
  color: hsl(var(--muted-foreground));
  font: 400 9px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.1em;
}
.animated-top-dock-component {
  position: relative;
  display: grid;
  place-items: center;
  isolation: isolate;
  background:
    radial-gradient(circle at 50% 20%, hsl(var(--foreground) / 0.035), transparent 34%),
    hsl(var(--background));
}

.animated-top-dock__nav {
  position: absolute;
  top: clamp(24px, 5cqw, 46px);
  left: 50%;
  z-index: 10;
  display: flex;
  align-items: flex-start;
  gap: 3px;
  height: 38px;
  padding: 4px;
  overflow: visible;
  border: 1px solid hsl(var(--card));
  border-radius: 11px;
  background: hsl(var(--background) / 0.86);
  box-shadow: 0 12px 34px rgba(0, 0, 0, 0.48), inset 0 1px hsl(var(--foreground) / 0.035);
  backdrop-filter: blur(18px) saturate(75%);
  transform: translateX(-50%);
  isolation: isolate;
}

.animated-top-dock__item {
  position: relative;
  z-index: 6;
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  height: 28px;
  min-width: 0;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 7px;
  outline: none;
  color: hsl(var(--muted-foreground));
  background: hsl(var(--background) / 0.9);
  font: 400 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.1em;
  white-space: nowrap;
  backdrop-filter: blur(14px) saturate(70%);
  transform-origin: 50% 0;
  transition: color 0.15s, border-color 0.18s, background 0.18s, box-shadow 0.18s;
  will-change: width, height, transform;
  cursor: pointer;
}

.animated-top-dock__item[data-dock-near="true"],
.animated-top-dock__item:focus-visible {
  z-index: 7;
  color: hsl(var(--foreground));
  border-color: hsl(var(--border));
  background: hsl(var(--card) / 0.94);
  box-shadow: 0 7px 16px rgba(0, 0, 0, 0.26);
}

.animated-top-dock__logo {
  width: 28px;
  height: 28px;
  overflow: hidden;
  background: hsl(var(--foreground));
}

.animated-top-dock__logo svg {
  display: block;
  width: 100%;
  height: 100%;
}

.animated-top-dock__link {
  gap: 6px;
  width: 94px;
  padding: 0 9px;
}

.animated-top-dock__link[aria-pressed="true"] {
  color: hsl(var(--background));
  border-color: hsl(var(--foreground));
  background: hsl(var(--foreground));
  box-shadow: 0 7px 18px rgba(0, 0, 0, 0.28);
}

.animated-top-dock__icon {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 13px;
  height: 13px;
  opacity: 0.62;
  transition: opacity 0.16s;
}

.animated-top-dock__icon svg {
  display: block;
  width: 100%;
  height: 100%;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.animated-top-dock__item[data-dock-near="true"] .animated-top-dock__icon,
.animated-top-dock__item:focus-visible .animated-top-dock__icon {
  opacity: 1;
}

.animated-top-dock-component__caption {
  right: 18px;
  bottom: 16px;
}

@media (max-width: 600px) {

  .animated-top-dock__nav {
    top: 24px;
    gap: 2px;
    height: 36px;
  }

  .animated-top-dock__item {
    height: 26px !important;
    transform: none !important;
  }

  .animated-top-dock__logo {
    width: 26px !important;
    height: 26px !important;
  }

  .animated-top-dock__link {
    width: auto !important;
    padding: 0 7px;
    font-size: 8px;
    letter-spacing: 0.07em;
  }

  .animated-top-dock__icon {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .animated-top-dock__item {
    transform: none !important;
  }
}

/* ── Top dock variants ────────────────────────────────────────────────────
   Every dimension below is a container query unit with a clamp, because these
   bars are shown at anything from a 600 px card to a 1920 px capture frame: a
   fixed 56 px bar that reads correctly in the catalogue frame becomes a thin
   strip of small type at full width. One scale block feeds all three. */

.animated-top-dock-component.atd-modern,
.animated-top-dock-component.atd-retro,
.animated-top-dock-component.atd-glass {
  --atd-top: clamp(16px, 2.6cqw, 46px);
  --atd-bar-width: min(1460px, calc(100% - clamp(24px, 4.2cqw, 96px)));
  --atd-bar-height: clamp(48px, 3.4cqw, 68px);
  --atd-bar-pad: clamp(5px, 0.42cqw, 9px);
  --atd-bar-lead: clamp(14px, 1.15cqw, 25px);
  --atd-item-height: clamp(30px, 2.2cqw, 44px);
  --atd-item-pad: clamp(10px, 0.86cqw, 18px);
  --atd-label: clamp(12px, 0.78cqw, 17px);
  --atd-icon: clamp(13px, 0.92cqw, 19px);
  --atd-gap: clamp(5px, 0.44cqw, 9px);
  --atd-brand: clamp(13px, 0.94cqw, 20px);
  --atd-mark: clamp(22px, 1.55cqw, 33px);
  --atd-action-height: clamp(34px, 2.5cqw, 50px);
  display: block;
  overflow: hidden;
}

.atd-modern__bar,
.atd-retro__bar {
  position: absolute;
  top: var(--atd-top);
  left: 50%;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: var(--atd-bar-width);
  height: var(--atd-bar-height);
  transform: translateX(-50%);
}

/* Command bar: the bar hugs its own content — brand, dock and actions sit in
   one flow with a gap between them rather than being pushed to the far edges of
   a full-bleed strip. That only holds because the dock's track is locked to its
   rest width (lockTrack in the controller): the spring then grows its items
   outside that track instead of widening the bar and shoving the brand and the
   actions around on every pointer move. */
.atd-modern__bar {
  /* space-between is inherited rather than centred on purpose: at its natural
     width the three groups already fill the box, and in a shell too narrow for
     them the overflow then runs off the right instead of taking the brand off
     the left as well */
  width: max-content;
  max-width: var(--atd-bar-width);
  padding: var(--atd-bar-pad) var(--atd-bar-pad) var(--atd-bar-pad) var(--atd-bar-lead);
}

.atd-modern__dock {
  display: flex;
  flex: none;
  gap: clamp(2px, 0.2cqw, 5px);
  align-items: flex-start;
  /* the track is one item tall and its rest width wide, and the row is centred
     inside it, so a growing item overflows evenly on all four sides without
     moving a single neighbour in the bar */
  justify-content: center;
  height: var(--atd-item-height);
}

.atd-modern__item,
.atd-retro__item,
.atd-glass__item {
  display: inline-flex;
  flex: none;
  gap: var(--atd-gap);
  align-items: center;
  justify-content: center;
  height: var(--atd-item-height);
  padding: 0 var(--atd-item-pad);
  outline: none;
  white-space: nowrap;
  transform-origin: 50% 0;
  will-change: width, height, transform;
  cursor: pointer;
}

.atd-modern__brand,
.atd-glass__brand,
.atd-retro__brand {
  display: inline-flex;
  flex: none;
  gap: clamp(7px, 0.6cqw, 13px);
  align-items: center;
  text-decoration: none;
}

.atd-modern__mark,
.atd-glass__mark {
  display: block;
  width: var(--atd-mark);
  height: var(--atd-mark);
  overflow: hidden;
}

.atd-modern__mark svg,
.atd-glass__mark svg {
  display: block;
  width: 100%;
  height: 100%;
}

.atd-modern__word,
.atd-glass__word {
  font-family: var(--font-heading), ui-serif, Georgia, serif;
  font-size: calc(var(--atd-brand) * 1.25);
  font-style: italic;
  font-weight: 400;
  letter-spacing: -0.01em;
}

.atd-modern__actions {
  display: inline-flex;
  flex: none;
  gap: clamp(4px, 0.34cqw, 8px);
  align-items: center;
}

.atd-modern__ghost {
  height: var(--atd-action-height);
  padding: 0 clamp(12px, 0.95cqw, 20px);
  border: 0;
  border-radius: 999px;
  background: transparent;
  font: 500 var(--atd-label) / 1 inherit;
  transition: color 0.16s, background 0.16s;
  cursor: pointer;
}

.atd-modern__cta,
.atd-glass__cta {
  height: var(--atd-action-height);
  border-radius: 999px;
  font: 600 var(--atd-label) / 1 inherit;
  letter-spacing: -0.01em;
  white-space: nowrap;
  transition: transform 0.18s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.18s;
  cursor: pointer;
}

/* ── Modern command bar ─────────────────────────────────────────────────── */

.animated-top-dock-component.atd-modern {
  /* a ceiling rather than a width: the command bar sizes itself to its own
     cluster, and only falls back to an inset strip in a shell too narrow to
     hold it */
  --atd-bar-width: min(1240px, calc(100% - clamp(24px, 5cqw, 120px)));
  background: hsl(var(--background));
}

.atd-modern__aurora {
  position: absolute;
  inset: -24% -12% auto -12%;
  z-index: 1;
  height: 82%;
  pointer-events: none;
  background:
    radial-gradient(58% 62% at 22% 36%, hsl(var(--primary) / 0.4), transparent 68%),
    radial-gradient(46% 56% at 78% 20%, hsl(var(--primary) / 0.3), transparent 70%),
    radial-gradient(40% 48% at 52% 6%, hsl(var(--primary) / 0.2), transparent 72%),
    radial-gradient(34% 40% at 50% 14%, hsl(var(--foreground) / 0.07), transparent 76%);
  filter: blur(8px);
}

.atd-modern__bar {
  gap: clamp(14px, 2.4cqw, 40px);
  border: 1px solid hsl(var(--foreground) / 0.045);
  border-radius: 999px;
  background: linear-gradient(180deg, hsl(var(--card) / 0.86), hsl(var(--background) / 0.82));
  box-shadow: 0 22px 52px -24px rgba(0, 0, 0, 0.92), inset 0 1px hsl(var(--foreground) / 0.045);
  backdrop-filter: blur(22px) saturate(150%);
  -webkit-backdrop-filter: blur(22px) saturate(150%);
}

.atd-modern__brand {
  color: hsl(var(--foreground));
}

.atd-modern__mark {
  /* a full circle: the shared brand mark is a rounded square, so the disc is cut
     from it by the mark box's own clip rather than by a second svg */
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.42);
}

.atd-modern__item {
  border: 1px solid transparent;
  border-radius: 999px;
  color: hsl(var(--muted-foreground));
  background: transparent;
  font: 500 var(--atd-label) / 1 inherit;
  letter-spacing: -0.005em;
  transition: color 0.16s, border-color 0.18s, background 0.18s, box-shadow 0.18s, backdrop-filter 0.18s;
}

/* :hover is carried alongside the proximity flag so the glass still lands when
   the spring is off — reduced motion, a coarse pointer, a narrow viewport */
.atd-modern__item[data-dock-near="true"],
.atd-modern__item:hover,
.atd-modern__item:focus-visible {
  color: hsl(var(--foreground));
  border-color: hsl(var(--foreground) / 0.055);
  background: hsl(var(--foreground) / 0.055);
  box-shadow: 0 8px 20px -14px rgba(0, 0, 0, 0.9), inset 0 1px hsl(var(--foreground) / 0.05);
  backdrop-filter: blur(18px) saturate(170%);
  -webkit-backdrop-filter: blur(18px) saturate(170%);
}

.atd-modern__item[aria-pressed="true"] {
  color: hsl(var(--background));
  border-color: transparent;
  background: linear-gradient(180deg, hsl(var(--foreground)), hsl(var(--foreground)));
  box-shadow: 0 10px 24px -12px hsl(var(--primary) / 0.75), inset 0 -1px rgba(0, 0, 0, 0.14);
}

.atd-modern__icon,
.atd-glass__icon {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: var(--atd-icon);
  height: var(--atd-icon);
  opacity: 0.72;
  transition: opacity 0.16s;
}

.atd-modern__icon svg,
.atd-glass__icon svg {
  display: block;
  width: 100%;
  height: 100%;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.25;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.atd-modern__item[data-dock-near="true"] .atd-modern__icon,
.atd-modern__item[aria-pressed="true"] .atd-modern__icon,
.atd-glass__item[data-dock-near="true"] .atd-glass__icon,
.atd-glass__item[aria-pressed="true"] .atd-glass__icon {
  opacity: 1;
}

.atd-modern__ghost {
  color: hsl(var(--muted-foreground));
}

.atd-modern__ghost:hover {
  color: hsl(var(--foreground));
  background: hsl(var(--foreground) / 0.06);
}

.atd-modern__cta {
  display: inline-flex;
  gap: var(--atd-gap);
  align-items: center;
  padding: 0 var(--atd-bar-pad) 0 clamp(14px, 1.1cqw, 24px);
  border: 0;
  color: hsl(var(--background));
  background: linear-gradient(180deg, hsl(var(--foreground)), hsl(var(--foreground)));
  box-shadow: 0 10px 26px -14px hsl(var(--primary) / 0.95), inset 0 -1px rgba(0, 0, 0, 0.16);
}

.atd-modern__cta svg {
  box-sizing: border-box;
  width: calc(var(--atd-action-height) - clamp(12px, 0.9cqw, 20px));
  height: calc(var(--atd-action-height) - clamp(12px, 0.9cqw, 20px));
  padding: clamp(4px, 0.3cqw, 7px);
  border-radius: 999px;
  background: hsl(var(--background) / 0.1);
  fill: none;
  stroke: currentColor;
  stroke-width: 1.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.atd-modern__cta:hover {
  box-shadow: 0 16px 32px -14px hsl(var(--primary)), inset 0 -1px rgba(0, 0, 0, 0.16);
  transform: translateY(-1px);
}

.atd-modern__stage {
  position: absolute;
  top: 58%;
  left: 50%;
  z-index: 4;
  width: min(88cqw, 1120px);
  text-align: center;
  pointer-events: none;
  transform: translate(-50%, -50%);
}

.atd-modern__eyebrow {
  margin: 0 0 clamp(8px, 0.9cqw, 18px);
  color: hsl(var(--muted-foreground));
  font: 400 clamp(8px, 0.62cqw, 13px) / 1 ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.atd-modern__headline {
  /* background-clip: text paints only inside the element box, so at this size a
     1.0-ish line-height would cut the ascenders and descenders out of the fill.
     The padding buys the ink its own room back. */
  margin: 0;
  padding: 0.08em 0 0.14em;
  color: transparent;
  background: linear-gradient(180deg, hsl(var(--foreground)) 16%, hsl(var(--foreground) / 0.3));
  background-clip: text;
  -webkit-background-clip: text;
  font-family: var(--font-heading), ui-serif, Georgia, serif;
  font-size: clamp(30px, 7.6cqw, 150px);
  font-weight: 400;
  line-height: 1.04;
  letter-spacing: -0.03em;
  text-wrap: balance;
}

/* ── Retro pixel terminal ───────────────────────────────────────────────────
   The field canvas is a small drawing buffer stretched by CSS with
   nearest-neighbour sampling, so its dither pattern arrives as real square
   pixels. Every chrome edge here is square to sit on that same grid. */

.animated-top-dock-component.atd-retro {
  --atd-label: clamp(9px, 0.68cqw, 15px);
  --atd-icon: clamp(10px, 0.78cqw, 17px);
  --atd-brand: clamp(11px, 0.8cqw, 18px);
  background: hsl(var(--background));
}

.atd-retro__field {
  position: absolute;
  inset: 0;
  z-index: 0;
  display: block;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
}

.atd-retro__vignette {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    radial-gradient(124% 90% at 50% 34%, transparent 28%, hsl(var(--background) / 0.62) 100%),
    linear-gradient(180deg, hsl(var(--background) / 0.6) 0%, transparent 24%, transparent 62%, hsl(var(--background) / 0.58) 100%);
}

/* the raster runs at screen resolution, not at the field's pixel scale, so the
   line structure stays a raster instead of banding the chunky artwork */
.atd-retro::before {
  position: absolute;
  inset: 0;
  z-index: 11;
  pointer-events: none;
  content: "";
  opacity: calc(var(--atd-retro-scan, 0.32) * 1.5);
  background: repeating-linear-gradient(180deg, rgba(0, 0, 0, 0.42) 0 1px, transparent 1px 3px);
}

/* Horizontal fit: the bar is one continuous strip and the menu cells own all of
   it. There are no gaps and no rounded ends — every cell is separated by a rule
   and runs the full height, and the controller renormalises the widths so
   opening one cell takes its room from the neighbours. */
.atd-retro__bar {
  gap: 0;
  padding: 0;
  overflow: hidden;
  border: 2px solid hsl(var(--foreground));
  background: hsl(var(--background));
  box-shadow: 6px 6px 0 hsl(var(--background) / 0.62);
}

.atd-retro__brand {
  height: 100%;
  padding: 0 clamp(12px, 1.1cqw, 26px);
  border-right: 2px solid color-mix(in hsl, hsl(var(--primary)) 38%, hsl(var(--background)));
  color: hsl(var(--primary));
  background: hsl(var(--background));
  font: 400 var(--atd-brand) / 1 ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.12em;
}

.atd-retro__dock {
  display: flex;
  flex: 1 1 0;
  gap: 0;
  align-items: stretch;
  min-width: 0;
  height: 100%;
}

.atd-retro__badge {
  display: inline-flex;
  width: var(--atd-icon);
  height: var(--atd-icon);
}

.atd-retro__badge svg,
.atd-retro__icon svg {
  display: block;
  width: 100%;
  height: 100%;
  fill: currentColor;
  shape-rendering: crispEdges;
}

.atd-retro__item {
  height: 100%;
  min-width: 0;
  padding: 0 clamp(6px, 0.5cqw, 12px);
  overflow: hidden;
  border: 0;
  border-right: 2px solid color-mix(in hsl, hsl(var(--primary)) 38%, hsl(var(--background)));
  color: hsl(var(--primary));
  background: hsl(var(--card));
  font: 400 var(--atd-label) / 1 ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.14em;
  transition: color 0.1s steps(2), background 0.1s steps(2);
}

.atd-retro__item[data-dock-near="true"],
.atd-retro__item:focus-visible {
  color: hsl(var(--foreground));
  background: color-mix(in hsl, hsl(var(--primary)) 32%, hsl(var(--background)));
}

.atd-retro__item[aria-pressed="true"] {
  color: hsl(var(--background));
  background: hsl(var(--primary));
}

.atd-retro__icon {
  display: inline-flex;
  flex: none;
  width: var(--atd-icon);
  height: var(--atd-icon);
}

.atd-retro__cta {
  display: inline-flex;
  flex: none;
  gap: var(--atd-gap);
  align-items: center;
  height: 100%;
  padding: 0 clamp(14px, 1.2cqw, 28px);
  border: 0;
  border-left: 2px solid hsl(var(--foreground));
  color: hsl(var(--background));
  background: hsl(var(--primary));
  font: 400 var(--atd-label) / 1 ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.16em;
  transition: background 0.1s steps(2), color 0.1s steps(2);
  cursor: pointer;
}

.atd-retro__cta:hover {
  color: hsl(var(--background));
  background: hsl(var(--primary));
}

.atd-retro__readout {
  position: absolute;
  bottom: clamp(30px, 4.2cqw, 74px);
  left: 50%;
  z-index: 8;
  display: flex;
  gap: clamp(12px, 2.4cqw, 42px);
  margin: 0;
  color: hsl(var(--primary));
  font: 400 clamp(9px, 0.62cqw, 13px) / 1 ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.2em;
  transform: translateX(-50%);
}

/* ── Liquid glass ───────────────────────────────────────────────────────────
   Vertical fit: the dock leaves the top edge for a rail down the left side. The
   proximity field runs on the y axis, so an item grows taller and leans out to
   the right instead of widening and dropping. The rail is a real
   backdrop-filter panel over the refracting Three.js bead field, so its blur
   samples the same pixels the glass shader refracts. */

.animated-top-dock-component.atd-glass {
  --atd-rail-width: clamp(158px, 12.5cqw, 250px);
  background: hsl(var(--background));
}

.atd-glass__field {
  position: absolute;
  inset: 0;
  z-index: 0;
  display: block;
  width: 100%;
  height: 100%;
}

/* a scrim behind the rail: the bead field is bright enough in places to swallow
   the wordmark, and the panel's own blur cannot darken what it samples */
.atd-glass::before {
  position: absolute;
  inset: 0 auto 0 0;
  z-index: 5;
  width: 42%;
  pointer-events: none;
  content: "";
  background: linear-gradient(90deg, hsl(var(--background) / 0.66), hsl(var(--background) / 0));
}

.atd-glass__rail {
  position: absolute;
  top: 50%;
  left: clamp(20px, 3.4cqw, 68px);
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: clamp(6px, 0.5cqw, 11px);
  align-items: stretch;
  width: var(--atd-rail-width);
  padding: var(--atd-bar-pad);
  border-radius: clamp(20px, 1.7cqw, 34px);
  background: linear-gradient(160deg, hsl(var(--foreground) / 0.15), hsl(var(--foreground) / 0.05));
  box-shadow:
    0 30px 64px -26px rgba(0, 0, 0, 0.92),
    inset 0 1px 0 hsl(var(--foreground) / 0.44),
    inset 0 -1px 0 hsl(var(--foreground) / 0.12),
    inset 0 0 0 1px hsl(var(--foreground) / 0.14);
  backdrop-filter: blur(26px) saturate(190%);
  -webkit-backdrop-filter: blur(26px) saturate(190%);
  transform: translateY(-50%);
}

.atd-glass__rail::before {
  position: absolute;
  inset: 0;
  pointer-events: none;
  content: "";
  border-radius: inherit;
  background: linear-gradient(168deg, hsl(var(--foreground) / 0.22) 0%, hsl(var(--foreground) / 0) 30%, hsl(var(--foreground) / 0) 76%, hsl(var(--foreground) / 0.14) 100%);
}

.atd-glass__brand {
  position: relative;
  padding: clamp(6px, 0.5cqw, 12px) clamp(8px, 0.7cqw, 15px);
  color: hsl(var(--foreground));
}

.atd-glass__mark {
  border-radius: clamp(7px, 0.5cqw, 11px);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.42), inset 0 0 0 1px hsl(var(--foreground) / 0.3);
}

.atd-glass__hairline {
  height: 1px;
  margin: clamp(2px, 0.2cqw, 5px) clamp(6px, 0.5cqw, 12px);
  background: linear-gradient(90deg, hsl(var(--foreground) / 0.04), hsl(var(--foreground) / 0.26), hsl(var(--foreground) / 0.04));
}

.atd-glass__dock {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: clamp(2px, 0.2cqw, 5px);
  align-items: stretch;
}

.atd-glass__item {
  justify-content: flex-start;
  width: 100%;
  border: 1px solid transparent;
  border-radius: clamp(12px, 1cqw, 22px);
  color: hsl(var(--foreground) / 0.66);
  background: transparent;
  font: 500 var(--atd-label) / 1 inherit;
  letter-spacing: -0.005em;
  /* the rail grows downward from each item's own top edge */
  transform-origin: 0 50%;
  transition: color 0.18s, border-color 0.2s, background 0.2s, box-shadow 0.2s;
}

.atd-glass__item[data-dock-near="true"],
.atd-glass__item:focus-visible {
  color: hsl(var(--foreground));
  border-color: hsl(var(--foreground) / 0.24);
  background: linear-gradient(180deg, hsl(var(--foreground) / 0.22), hsl(var(--foreground) / 0.07));
  box-shadow: inset 0 1px 0 hsl(var(--foreground) / 0.46), 0 8px 18px -10px rgba(0, 0, 0, 0.8);
}

.atd-glass__item[aria-pressed="true"] {
  color: hsl(var(--background));
  border-color: hsl(var(--foreground) / 0.6);
  background: linear-gradient(180deg, hsl(var(--foreground)), hsl(var(--foreground)));
  box-shadow: 0 10px 24px -12px hsl(var(--foreground) / 0.5), inset 0 -1px rgba(0, 0, 0, 0.14);
}

.atd-glass__cta {
  display: inline-flex;
  gap: var(--atd-gap);
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0 clamp(12px, 1cqw, 22px);
  border: 1px solid hsl(var(--foreground) / 0.55);
  color: hsl(var(--background));
  background: linear-gradient(180deg, hsl(var(--foreground)), hsl(var(--foreground)));
  box-shadow: 0 12px 30px -14px hsl(var(--foreground) / 0.6), inset 0 -1px rgba(0, 0, 0, 0.16);
}

.atd-glass__cta svg {
  width: var(--atd-icon);
  height: var(--atd-icon);
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.atd-glass__cta:hover {
  box-shadow: 0 16px 34px -14px hsl(var(--foreground) / 0.75), inset 0 -1px rgba(0, 0, 0, 0.16);
  transform: translateY(-1px);
}

.atd-modern .animated-top-dock-component__caption,
.atd-glass .animated-top-dock-component__caption {
  color: hsl(var(--foreground) / 0.34);
}

.atd-retro .animated-top-dock-component__caption {
  z-index: 12;
  color: hsl(var(--primary));
}

@container (max-width: 900px) {
  .atd-modern__ghost {
    display: none;
  }

  .atd-modern__item span:last-child,
  .atd-retro__item span:last-child {
    display: none;
  }

  /* the bar is sized by its content now, so a shell this narrow has to give the
     content back: the call to action drops to its glyph rather than pushing the
     cluster past the bar's own max width */
  .atd-modern__cta span {
    display: none;
  }

  .atd-modern__cta {
    padding: 0 var(--atd-bar-pad);
  }

  /* the rail collapses to its icons rather than keeping a 158 px column in a
     card that is only a few hundred pixels wide */
  .animated-top-dock-component.atd-glass {
    --atd-rail-width: auto;
  }

  .atd-glass__item {
    justify-content: center;
  }

  .atd-glass__item span:last-child,
  .atd-glass__word,
  .atd-glass__cta span {
    display: none;
  }

  .atd-glass__cta {
    justify-content: center;
  }
}

@media (max-width: 600px) {
  .atd-modern__word {
    display: none;
  }

  .atd-modern__item {
    height: 28px !important;
    transform: none !important;
  }

  .atd-glass__item {
    height: auto !important;
    transform: none !important;
  }

  /* the strip keeps its full-height cells on a phone; only the spring stops */
  .atd-retro__item {
    height: 100% !important;
    transform: none !important;
  }

  .atd-modern__stage {
    top: 62%;
  }

  .atd-retro__readout {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .atd-modern__item,
  .atd-retro__item,
  .atd-glass__item {
    transform: none !important;
  }
}
`;
