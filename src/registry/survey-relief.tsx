"use client";
// Ported from ThreeUI Community's Landscape (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { cn } from "@/lib/utils";

/** `auto` follows the site's light/dark mode; `studio` and `nocturne` force one look. */
export type SurveyReliefVariant = "auto" | "studio" | "nocturne";

interface SurveyReliefProps {
  /** Lighting state: `studio` (paper model in daylight), `nocturne` (glowing contours) or `auto`. */
  variant?: SurveyReliefVariant;
  /** Seed of the procedural terrain; each value carves a different relief. */
  seed?: number;
  label?: string;
  className?: string;
}

const SIZE = 6;
const SEGMENTS = 220;
const BASE = -0.42;
const SEA = 0.06;
const BANDS = 0.09;

/* ---- deterministic value noise and the terrain height field ---- */
function makeHeight(seed: number) {
  let a = (seed * 2654435761) >>> 0;
  const rand = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const P = new Float32Array(256 * 256);
  for (let i = 0; i < P.length; i++) P[i] = rand();
  const at = (x: number, y: number) => P[(y & 255) * 256 + (x & 255)];
  const noise = (x: number, y: number) => {
    const xi = Math.floor(x),
      yi = Math.floor(y);
    const fx = x - xi,
      fy = y - yi;
    const u = fx * fx * (3 - 2 * fx),
      v = fy * fy * (3 - 2 * fy);
    const a0 = at(xi, yi) + (at(xi + 1, yi) - at(xi, yi)) * u;
    const a1 = at(xi, yi + 1) + (at(xi + 1, yi + 1) - at(xi, yi + 1)) * u;
    return a0 + (a1 - a0) * v;
  };
  const ox = rand() * 100,
    oy = rand() * 100;
  return (x: number, z: number) => {
    const nx = x / SIZE + ox,
      nz = z / SIZE + oy;
    let ridge = 0,
      amp = 0.6,
      freq = 1.6;
    for (let o = 0; o < 4; o++) {
      const r = 1 - Math.abs(noise(nx * freq, nz * freq) * 2 - 1);
      ridge += r * r * amp;
      amp *= 0.42;
      freq *= 2.0;
    }
    const swell = noise(nx * 0.9 + 7, nz * 0.9 + 3);
    const r = Math.hypot(x, z) / (SIZE * 0.62);
    const dome = 1 - Math.min(1, r * r) * 0.55;
    return Math.max(SEA, (ridge * 1.0 + swell * 0.6 - 0.12) * dome * 1.25);
  };
}

/* the model: relief top plus four cut walls down to the plinth line */
function buildRelief(height: (x: number, z: number) => number) {
  const top = new THREE.PlaneGeometry(SIZE, SIZE, SEGMENTS, SEGMENTS);
  top.rotateX(-Math.PI / 2);
  const p = top.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) p.setY(i, height(p.getX(i), p.getZ(i)));
  top.computeVertexNormals();

  const pos: number[] = [];
  const idx: number[] = [];
  const h = SIZE / 2;
  const edges: [number, number, number, number][] = [
    [-h, h, h, h],
    [h, h, h, -h],
    [h, -h, -h, -h],
    [-h, -h, -h, h],
  ];
  for (const [x0, z0, x1, z1] of edges) {
    const start = pos.length / 3;
    for (let s = 0; s <= SEGMENTS; s++) {
      const t = s / SEGMENTS;
      const x = x0 + (x1 - x0) * t,
        z = z0 + (z1 - z0) * t;
      pos.push(x, height(x, z), z, x, BASE, z);
    }
    for (let s = 0; s < SEGMENTS; s++) {
      const a = start + s * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const walls = new THREE.BufferGeometry();
  walls.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  walls.setIndex(idx);
  walls.computeVertexNormals();
  return { top, walls };
}

const VERT = /* glsl */ `
  varying vec3 vPos;
  varying vec3 vNormal;
  void main() {
    vPos = position;
    vNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  }
`;

const RELIEF_FRAG = /* glsl */ `
  uniform vec3 uPaper; uniform vec3 uInk; uniform vec3 uAccent; uniform vec3 uMuted;
  uniform float uNight; uniform vec3 uLight; uniform float uWall;
  varying vec3 vPos;
  varying vec3 vNormal;
  void main() {
    vec3 n = normalize(vNormal);
    float h = vPos.y;
    float k = h / ${BANDS.toFixed(3)};
    float band = floor(k);
    float t = clamp(band * ${BANDS.toFixed(3)} / 1.1, 0.0, 1.0);
    float fw = fwidth(k);
    float f = min(fract(k), 1.0 - fract(k));
    float major = step(4.5, mod(band + 0.5, 5.0));
    float line = 1.0 - smoothstep(0.0, fw * (1.0 + major), f);
    float halo = 1.0 - smoothstep(0.0, fw * 6.0, f);
    float sea = 1.0 - step(${(SEA + 0.002).toFixed(3)}, h);
    float lit = max(dot(n, normalize(uLight)), 0.0);
    float shade = mix(0.42, 1.08, lit);
    float hatch = smoothstep(0.55, 0.9, sin((vPos.x + vPos.z) * 70.0));
    if (uWall > 0.5) sea = 0.0;

    vec3 day = mix(uPaper, uMuted, 0.15 + 0.6 * (1.0 - t));
    day = mix(day, uAccent, 0.04 + 0.3 * t * t);
    day *= 1.0 - 0.06 * mod(band, 2.0);
    day = mix(day, mix(uMuted, uAccent, 0.35), sea * (0.7 + 0.2 * hatch));
    day *= shade;
    day = mix(day, uInk, line * (0.35 + 0.35 * major) * (1.0 - sea));

    vec3 dark = mix(uPaper, uMuted, 0.5 + 0.3 * t) * mix(0.35, 0.95, lit);
    dark = mix(dark, uPaper * 0.6, sea);
    vec3 glow = uAccent * (line * (0.35 + 0.9 * major) + halo * major * 0.25) * (0.35 + 0.8 * t);
    dark += glow * (1.0 - sea) + uAccent * sea * hatch * 0.05;

    gl_FragColor = vec4(mix(day, dark, uNight), 1.0);
    #include <colorspace_fragment>
  }
`;

const TABLE_FRAG = /* glsl */ `
  uniform vec3 uPaper; uniform vec3 uInk; uniform vec3 uMuted; uniform vec3 uAccent; uniform float uNight;
  varying vec3 vPos;
  void main() {
    vec2 q = abs(vPos.xz) / ${(SIZE / 2).toFixed(2)};
    float box = max(q.x, q.y);
    float shadow = 1.0 - smoothstep(0.92, 1.35, box);
    float fade = smoothstep(3.5, 11.0, length(vPos.xz));
    vec3 table = mix(uMuted, uPaper, 0.35 + 0.25 * uNight);
    table = mix(table, uInk, shadow * mix(0.16, 0.0, uNight));
    table += uAccent * shadow * 0.07 * uNight;
    vec2 g = abs(fract(vPos.xz * 0.5) - 0.5);
    float gl = 1.0 - smoothstep(0.0, fwidth(vPos.x), 0.5 - max(g.x, g.y));
    table = mix(table, mix(uInk, uAccent, uNight), gl * mix(0.1, 0.06, uNight) * (1.0 - fade));
    gl_FragColor = vec4(mix(table, uPaper, fade), 1.0);
    #include <colorspace_fragment>
  }
`;

function readToken(style: CSSStyleDeclaration, name: string, target: THREE.Color) {
  const raw = style.getPropertyValue(name).trim().replace(/,/g, " ").split(/\s+/);
  const [hh, ss, ll] = raw.map((v) => parseFloat(v));
  if ([hh, ss, ll].some((v) => Number.isNaN(v))) return 0.5;
  target.setHSL(hh / 360, ss / 100, ll / 100, THREE.SRGBColorSpace);
  return ll / 100;
}

function mountRelief(
  host: HTMLDivElement,
  canvas: HTMLCanvasElement,
  opts: { variant: SurveyReliefVariant; seed: number; still: boolean },
) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);

  const uniforms = {
    uPaper: { value: new THREE.Color() },
    uInk: { value: new THREE.Color() },
    uAccent: { value: new THREE.Color() },
    uMuted: { value: new THREE.Color() },
    uNight: { value: 0 },
    uLight: { value: new THREE.Vector3(-0.85, 0.32, 0.35) },
    uWall: { value: 0 },
  };
  const background = new THREE.Color();
  scene.background = background;

  const { top, walls } = buildRelief(makeHeight(opts.seed));
  const topMat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERT,
    fragmentShader: RELIEF_FRAG,
  });
  const wallMat = new THREE.ShaderMaterial({
    uniforms: { ...uniforms, uWall: { value: 1 } },
    vertexShader: VERT,
    fragmentShader: RELIEF_FRAG,
    side: THREE.DoubleSide,
  });
  const model = new THREE.Group();
  model.add(new THREE.Mesh(top, topMat), new THREE.Mesh(walls, wallMat));
  scene.add(model);

  const tableGeo = new THREE.PlaneGeometry(40, 40);
  tableGeo.rotateX(-Math.PI / 2);
  tableGeo.translate(0, BASE, 0);
  const tableMat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERT,
    fragmentShader: TABLE_FRAG,
  });
  const table = new THREE.Mesh(tableGeo, tableMat);
  scene.add(table);

  function resolveTheme() {
    const style = getComputedStyle(document.documentElement);
    const bgL = readToken(style, "--background", uniforms.uPaper.value);
    readToken(style, "--foreground", uniforms.uInk.value);
    readToken(style, "--primary", uniforms.uAccent.value);
    readToken(style, "--muted", uniforms.uMuted.value);
    const night = opts.variant === "nocturne" || (opts.variant === "auto" && bgL < 0.5);
    uniforms.uNight.value = night ? 1 : 0;
    /* the glow needs a light accent at night; a dark --primary is lifted toward the ink */
    if (night) {
      const hsl = { h: 0, s: 0, l: 0 };
      uniforms.uAccent.value.getHSL(hsl, THREE.SRGBColorSpace);
      if (hsl.l < 0.55)
        uniforms.uAccent.value.setHSL(hsl.h, Math.max(hsl.s, 0.35), 0.68, THREE.SRGBColorSpace);
    }
    background.copy(uniforms.uPaper.value);
  }

  let angle = 0.6;
  let drag: number | null = null;
  function layout() {
    const w = host.clientWidth || 1,
      h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const fit = camera.aspect < 1 ? 1 / camera.aspect : 1;
    const dist = 14 * Math.max(1, fit * 0.85);
    const elev = 0.5;
    camera.position.set(0, Math.sin(elev) * dist, Math.cos(elev) * dist);
    camera.lookAt(0, 0.05, 0);
    camera.updateProjectionMatrix();
  }
  function render() {
    model.rotation.y = angle;
    renderer.render(scene, camera);
  }

  const onDown = (e: PointerEvent) => {
    drag = e.clientX;
    canvas.setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    if (drag === null) return;
    angle += (e.clientX - drag) * 0.006;
    drag = e.clientX;
    if (opts.still) render();
  };
  const onUp = () => {
    drag = null;
  };
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);

  let raf = 0,
    prev = 0,
    visible = true,
    running = false;
  function frame(now: number) {
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    if (drag === null) angle += dt * 0.07;
    render();
    raf = requestAnimationFrame(frame);
  }
  function sync() {
    const want = !opts.still && visible && !document.hidden;
    if (want && !running) {
      running = true;
      prev = performance.now();
      raf = requestAnimationFrame(frame);
    } else if (!want && running) {
      running = false;
      cancelAnimationFrame(raf);
    }
  }

  const io = new IntersectionObserver((es) => {
    visible = es[0].isIntersecting;
    sync();
  });
  io.observe(host);
  const ro = new ResizeObserver(() => {
    layout();
    render();
  });
  ro.observe(host);
  const mo = new MutationObserver(() => {
    resolveTheme();
    render();
  });
  mo.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "data-theme", "data-palette", "style"],
  });
  document.addEventListener("visibilitychange", sync);

  resolveTheme();
  layout();
  render();
  sync();

  return () => {
    running = false;
    cancelAnimationFrame(raf);
    io.disconnect();
    ro.disconnect();
    mo.disconnect();
    document.removeEventListener("visibilitychange", sync);
    canvas.removeEventListener("pointerdown", onDown);
    canvas.removeEventListener("pointermove", onMove);
    canvas.removeEventListener("pointerup", onUp);
    canvas.removeEventListener("pointercancel", onUp);
    [top, walls, tableGeo].forEach((g) => g.dispose());
    [topMat, wallMat, tableMat].forEach((m) => m.dispose());
    renderer.dispose();
  };
}

/** A procedural topographic relief model turning slowly on a survey table, with contour bands in theme colours. */
export function SurveyRelief({
  variant = "auto",
  seed = 7,
  label = "Topographic relief model",
  className,
}: SurveyReliefProps) {
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    return mountRelief(host, canvas, { variant, seed, still: !!prefersReducedMotion });
  }, [variant, seed, prefersReducedMotion]);

  return (
    <div
      ref={hostRef}
      role="img"
      aria-label={label}
      className={cn("absolute inset-0 overflow-hidden bg-background", className)}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full cursor-grab touch-none active:cursor-grabbing"
      />
    </div>
  );
}
