"use client";
// Ported from ThreeUI Community's Tactile Button (MIT, © 2026 Meng To).

import { useEffect, useRef, type ButtonHTMLAttributes } from "react";
import { useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

const VS = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";

const BG_FS = `
precision mediump float;
uniform vec2 u_res;
uniform float u_time;
uniform vec3 u_paper;
uniform vec3 u_ink;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p);
  vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),
             mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.0; a *= 0.5; }
  return v;
}
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  uv.x *= u_res.x / u_res.y;
  float t = u_time * 0.15;
  vec2 q = vec2(fbm(uv + t), fbm(uv + vec2(1.0) + t));
  vec2 r = vec2(fbm(uv + 1.0*q + vec2(1.7, 9.2) + 0.15*t),
                fbm(uv + 1.0*q + vec2(8.3, 2.8) + 0.126*t));
  float f = fbm(uv + r);
  vec3 col = mix(u_paper, u_ink, 0.03 + 0.05 * f);
  col = mix(col, u_ink, 0.06 * clamp(length(q) * 0.5, 0.0, 1.0));
  gl_FragColor = vec4(col, 1.0);
}
`;

const BTN_FS = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform float u_level;
uniform float u_tilt;
uniform float u_slosh;
uniform vec3 u_glass;
uniform vec3 u_deep;
uniform vec3 u_ink;
uniform vec3 u_light;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p);
  vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),
             mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);
}
float fbm(vec2 p){
  float v=0.0; float a=0.5;
  for(int i=0;i<4;i++){ v+=a*noise(p); p=p*2.04+vec2(11.3,7.1); a*=0.5; }
  return v;
}
void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  float ar = u_res.x / u_res.y;
  float x = uv.x * ar;
  float t = u_time;
  float amp = 0.012 + u_slosh * 0.045;
  float surf = u_level
    + u_tilt * (uv.x - 0.5) * 0.34
    + amp * sin(x * 5.1 + t * 4.6)
    + amp * 0.62 * sin(x * 9.7 + t * (-6.8) + 1.7)
    + amp * 0.38 * sin(x * 14.3 + t * 8.9 + 4.2);
  float d = surf - uv.y;
  vec3 col = mix(u_glass, mix(u_glass, u_light, 0.25), uv.y);
  float inside = smoothstep(0.0, 0.012, d);
  float depth = clamp(d / max(u_level, 0.001), 0.0, 1.0);
  vec3 liq = mix(u_ink, u_deep, depth);
  float caust = fbm(vec2(x * 4.2, (uv.y + t * 0.14) * 4.2));
  liq = mix(liq, u_light, 0.12 * caust + 0.1 * pow(max(0.0, d * 3.0), 1.5) * u_slosh);
  col = mix(col, liq, inside);
  col = mix(col, u_light, exp(-abs(d) * 90.0) * 0.6);
  gl_FragColor = vec4(col, 1.0);
}
`;

const BASE = 0.42;

/* Theme tokens are bare HSL channels ("222 47% 11%"); convert to RGB for the shaders. */
type Rgb = [number, number, number];
function readToken(name: string): Rgb {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const [h = 0, sat = 0, lig = 0] = raw.split(/[\s,/]+/).map((v) => parseFloat(v));
  const s = sat / 100;
  const l = lig / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)];
}
const mixRgb = (a: Rgb, b: Rgb, t: number): Rgb => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
/* A well of the theme's primary ink inside a card-coloured glass, over a faint paper field. */
function themeColors() {
  const primary = readToken("--primary");
  const paper = readToken("--background");
  const ink = readToken("--foreground");
  const card = readToken("--card");
  return {
    u_paper: paper,
    u_ink: ink,
    u_glass: card,
    u_deep: mixRgb(primary, ink, 0.45),
    u_inkBtn: primary,
    u_light: mixRgb(primary, paper, 0.8),
  };
}

function createProgram(gl: WebGLRenderingContext, fs: string) {
  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog);
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const locP = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(locP);
  gl.vertexAttribPointer(locP, 2, gl.FLOAT, false, 0, 0);
  return prog;
}

function resizeCanvas(gl: WebGLRenderingContext, canvas: HTMLCanvasElement) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
  const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
  }
}

export interface InkwellProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button label. */
  label?: string;
  /** Hue rotation in degrees (-180 to 180). */
  hue?: number;
  /** Saturation multiplier (0 to 2). */
  saturation?: number;
  /** Brightness multiplier (0.35 to 1.65). */
  brightness?: number;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function Inkwell({
  label = "Fill",
  hue = 0,
  saturation = 1,
  brightness = 1,
  className,
  onClick,
  onMouseMove,
  onMouseLeave,
  onFocus,
  ...props
}: InkwellProps) {
  const prefersReducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<HTMLCanvasElement>(null);
  const state = useRef({
    level: BASE,
    gulp: 0,
    slosh: 0.4,
    tilt: 0,
    tiltTarget: 0,
    lastX: null as number | null,
  });

  useEffect(() => {
    const root = rootRef.current;
    const bgCanvas = bgRef.current;
    const btnCanvas = glRef.current;
    if (!root || !bgCanvas || !btnCanvas) return;
    const bg = bgCanvas.getContext("webgl");
    const gl = btnCanvas.getContext("webgl");
    if (!bg || !gl) return;
    const bgProg = createProgram(bg, BG_FS);
    const btnProg = createProgram(gl, BTN_FS);
    const bgRes = bg.getUniformLocation(bgProg, "u_res");
    const bgTime = bg.getUniformLocation(bgProg, "u_time");
    const uRes = gl.getUniformLocation(btnProg, "u_res");
    const uTime = gl.getUniformLocation(btnProg, "u_time");
    const uLevel = gl.getUniformLocation(btnProg, "u_level");
    const uTilt = gl.getUniformLocation(btnProg, "u_tilt");
    const uSlosh = gl.getUniformLocation(btnProg, "u_slosh");
    const s = state.current;
    const applyTheme = () => {
      const c = themeColors();
      bg.useProgram(bgProg);
      bg.uniform3f(bg.getUniformLocation(bgProg, "u_paper"), ...c.u_paper);
      bg.uniform3f(bg.getUniformLocation(bgProg, "u_ink"), ...c.u_ink);
      gl.useProgram(btnProg);
      gl.uniform3f(gl.getUniformLocation(btnProg, "u_glass"), ...c.u_glass);
      gl.uniform3f(gl.getUniformLocation(btnProg, "u_deep"), ...c.u_deep);
      gl.uniform3f(gl.getUniformLocation(btnProg, "u_ink"), ...c.u_inkBtn);
      gl.uniform3f(gl.getUniformLocation(btnProg, "u_light"), ...c.u_light);
    };
    applyTheme();
    const themeObserver = new MutationObserver(() => {
      applyTheme();
      if (prefersReducedMotion) frame(performance.now());
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "data-palette", "style"],
    });
    const startTime = performance.now();

    let raf = 0;
    let visible = true;
    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      s.slosh *= Math.exp(-1.5 * dt);
      s.gulp *= Math.exp(-1.1 * dt);
      s.tilt += (s.tiltTarget - s.tilt) * Math.min(1, dt * 5);
      const levelTarget = BASE - 0.36 * s.gulp;
      s.level += (levelTarget - s.level) * Math.min(1, dt * 5.5);
      resizeCanvas(bg, bgCanvas);
      bg.uniform2f(bgRes, bgCanvas.width, bgCanvas.height);
      bg.uniform1f(bgTime, prefersReducedMotion ? 0 : (now - startTime) / 1000);
      bg.drawArrays(bg.TRIANGLES, 0, 3);
      resizeCanvas(gl, btnCanvas);
      gl.uniform2f(uRes, btnCanvas.width, btnCanvas.height);
      gl.uniform1f(uTime, prefersReducedMotion ? 2.0 : now / 1000);
      gl.uniform1f(uLevel, s.level);
      gl.uniform1f(uTilt, s.tilt);
      gl.uniform1f(uSlosh, prefersReducedMotion ? 0.25 : s.slosh);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const settling = () => Math.abs(s.tiltTarget - s.tilt) > 0.002 || s.gulp > 0.002;
    const loop = (now: number) => {
      frame(now);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      cancelAnimationFrame(raf);
      if (!visible || document.hidden) return;
      last = performance.now();
      if (prefersReducedMotion) {
        // still frame, redrawn only while the level/tilt eases
        const tick = (now: number) => {
          if (settling()) frame(now);
          else last = now;
          raf = requestAnimationFrame(tick);
        };
        frame(last);
        raf = requestAnimationFrame(tick);
      } else raf = requestAnimationFrame(loop);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e?.isIntersecting ?? true;
      start();
    });
    io.observe(root);
    const onVis = () => start();
    document.addEventListener("visibilitychange", onVis);
    start();
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      bg.deleteProgram(bgProg);
      gl.deleteProgram(btnProg);
    };
  }, [prefersReducedMotion]);

  const filter =
    hue === 0 && saturation === 1 && brightness === 1
      ? undefined
      : `hue-rotate(${clamp(hue, -180, 180)}deg) saturate(${clamp(saturation, 0, 2)}) brightness(${clamp(brightness, 0.35, 1.65)})`;

  return (
    <div
      ref={rootRef}
      className={cn("absolute inset-0 flex items-center justify-center overflow-hidden", className)}
      style={{ filter }}
    >
      <canvas
        ref={bgRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 block h-full w-full"
      />
      <button
        type="button"
        {...props}
        onMouseMove={(e) => {
          const s = state.current;
          const rect = e.currentTarget.getBoundingClientRect();
          const x = (e.clientX - rect.left) / Math.max(1, rect.width);
          if (s.lastX !== null) s.slosh = Math.min(1.4, s.slosh + Math.abs(x - s.lastX) * 2.6);
          s.lastX = x;
          s.tiltTarget = Math.max(-1, Math.min(1, (x - 0.5) * 2));
          onMouseMove?.(e);
        }}
        onMouseLeave={(e) => {
          state.current.lastX = null;
          state.current.tiltTarget = 0;
          onMouseLeave?.(e);
        }}
        onFocus={(e) => {
          state.current.slosh = Math.min(1.4, state.current.slosh + 0.5);
          onFocus?.(e);
        }}
        onClick={(e) => {
          state.current.gulp = 1;
          state.current.slosh = Math.min(1.4, state.current.slosh + 0.7);
          onClick?.(e);
        }}
        className="relative z-[2] flex h-[132px] w-[132px] flex-none cursor-pointer items-center justify-center overflow-hidden rounded-full border-0 bg-[hsl(var(--card))] p-0 shadow-[0_22px_44px_-18px_hsl(var(--foreground)/0.45),inset_0_0_0_1px_hsl(var(--border))] transition-all duration-300 ease-out hover:shadow-[0_26px_52px_-16px_hsl(var(--primary)/0.5),inset_0_0_0_1px_hsl(var(--primary)/0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[5px] focus-visible:outline-[hsl(var(--primary))]"
      >
        <canvas ref={glRef} aria-hidden="true" className="absolute inset-0 block h-full w-full" />
        <span className="pointer-events-none relative z-10 flex flex-col items-center gap-1 font-mono text-[11px] font-medium uppercase tracking-[0.24em] text-foreground [text-indent:0.24em]">
          {label}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="rotate-90 opacity-80"
          >
            <path
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M4 12h16m0 0l-6-6m6 6l-6 6"
            />
          </svg>
        </span>
      </button>
    </div>
  );
}
