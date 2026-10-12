"use client";
// Ported from ThreeUI Community's Plasma Button (MIT, © 2026 Meng To).

import { useEffect, useRef, useState, type ButtonHTMLAttributes } from "react";
import { useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

const VS = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";

const BG_FS = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec3 u_c1;
uniform vec3 u_c2;
uniform vec3 u_c3;
uniform vec3 u_c4;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p);
  vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),
             mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);
}
float fbm(vec2 p){
  float v=0.0; float a=0.5;
  for(int i=0;i<5;i++){ v+=a*noise(p); p=p*2.02+vec2(17.3,9.1); a*=0.5; }
  return v;
}
void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = uv * vec2(u_res.x/u_res.y, 1.0) * 1.5;
  float t = u_time * 0.12;
  vec2 q = vec2(fbm(p + vec2(0.0, t*0.28)), fbm(p + vec2(4.1, t*0.23)));
  vec2 r = vec2(fbm(p + 1.5*q + vec2(2.1, 7.2) + t*0.1),
                fbm(p + 1.4*q + vec2(5.3, 3.1) + t*0.07));
  float v = fbm(p + 1.9*r);
  float m = v*1.3;
  vec3 col = mix(u_c1, mix(u_c1, u_c2, 0.025), smoothstep(0.1, 0.6, m));
  col = mix(col, mix(u_c1, u_c2, 0.05), smoothstep(0.6, 1.0, m));
  float vein = exp(-abs(q.x - q.y) * 5.0);
  col = mix(col, u_c2, vein * 0.025);
  gl_FragColor = vec4(col, 1.0);
}
`;

const BTN_FS = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform float u_heat;
uniform float u_flash;
uniform vec3 u_c1;
uniform vec3 u_c2;
uniform vec3 u_c3;
uniform vec3 u_c4;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p);
  vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),
             mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);
}
float fbm(vec2 p){
  float v=0.0; float a=0.5;
  for(int i=0;i<5;i++){ v+=a*noise(p); p=p*2.02+vec2(17.3,9.1); a*=0.5; }
  return v;
}
void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = uv * vec2(u_res.x/u_res.y, 1.0) * 2.1;
  float t = u_time;
  float heat = u_heat + u_flash * 1.3;
  vec2 q = vec2(fbm(p + vec2(0.0, t*0.32)), fbm(p + vec2(5.2, t*0.27)));
  vec2 r = vec2(fbm(p + 1.7*q + vec2(1.7, 9.2) + t*0.12),
                fbm(p + 1.6*q + vec2(8.3, 2.8) + t*0.09));
  float v = fbm(p + 2.1*r);
  float m = v*1.4 + heat*0.22;
  vec3 c1 = u_c1; vec3 c2 = u_c2; vec3 c3 = u_c3; vec3 c4 = u_c4;
  vec3 col = mix(c1, c2, smoothstep(0.2, 0.52, m));
  col = mix(col, c3, smoothstep(0.52, 0.8, m));
  col = mix(col, c4, smoothstep(0.82, 1.02, m));
  float vein = exp(-abs(q.x - q.y) * 9.0);
  col += c3 * vein * (0.12 + heat * 0.25);
  vec2 e = uv * (1.0 - uv);
  float vig = pow(e.x * e.y * 16.0, 0.28);
  col = mix(c1, col, mix(0.55, 1.0, vig));
  col = mix(col, c4, u_flash * 0.35 * (0.3 + v));
  gl_FragColor = vec4(col, 1.0);
}
`;

/* Theme tokens are bare HSL channels ("222 47% 11%"); convert to linear-ish RGB for the shaders. */
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
/* Field: paper + ink. Button ramp: deep ink -> primary -> a pale wash -> the paper itself. */
function themeRamp() {
  const primary = readToken("--primary");
  const paper = readToken("--background");
  const ink = readToken("--foreground");
  const deep = mixRgb(primary, ink, 0.35);
  return {
    field: [paper, ink] as Rgb[],
    button: [deep, primary, mixRgb(primary, paper, 0.22), mixRgb(primary, paper, 0.45)] as Rgb[],
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

function resizeCanvas(gl: WebGLRenderingContext, canvas: HTMLCanvasElement, maxDpr = 2) {
  const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
  const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
  }
}

export interface CurrentButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
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

export function CurrentButton({
  label = "Run the draft",
  hue = 0,
  saturation = 1,
  brightness = 1,
  className,
  onMouseDown,
  onKeyDown,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...props
}: CurrentButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<HTMLCanvasElement>(null);
  const [hot, setHot] = useState(false);
  const state = useRef({ heat: 0, heatTarget: 0, flash: 0, churn: 0 });

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
    const uHeat = gl.getUniformLocation(btnProg, "u_heat");
    const uFlash = gl.getUniformLocation(btnProg, "u_flash");
    const bgCols = ["u_c1", "u_c2"].map((n) => bg.getUniformLocation(bgProg, n));
    const btnCols = ["u_c1", "u_c2", "u_c3", "u_c4"].map((n) => gl.getUniformLocation(btnProg, n));
    const s = state.current;
    const applyTheme = () => {
      const ramp = themeRamp();
      bg.useProgram(bgProg);
      ramp.field.forEach((c, i) => bg.uniform3f(bgCols[i]!, c[0], c[1], c[2]));
      gl.useProgram(btnProg);
      ramp.button.forEach((c, i) => gl.uniform3f(btnCols[i]!, c[0], c[1], c[2]));
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

    let raf = 0;
    let visible = true;
    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      s.heat += (s.heatTarget - s.heat) * Math.min(1, dt * 6);
      s.flash *= Math.exp(-3.2 * dt);
      s.churn += dt * (0.35 + s.heat * 1.1 + s.flash * 2.2);
      resizeCanvas(bg, bgCanvas, 1);
      bg.uniform2f(bgRes, bgCanvas.width, bgCanvas.height);
      bg.uniform1f(bgTime, prefersReducedMotion ? 0 : now / 1000);
      bg.drawArrays(bg.TRIANGLES, 0, 3);
      resizeCanvas(gl, btnCanvas);
      gl.uniform2f(uRes, btnCanvas.width, btnCanvas.height);
      gl.uniform1f(uTime, prefersReducedMotion ? 6.0 : s.churn);
      gl.uniform1f(uHeat, s.heat);
      gl.uniform1f(uFlash, s.flash);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const loop = (now: number) => {
      frame(now);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      cancelAnimationFrame(raf);
      if (!visible || document.hidden) return;
      last = performance.now();
      if (prefersReducedMotion) {
        // still frame, redrawn while hover/flash eases
        const settle = (now: number) => {
          frame(now);
          if (Math.abs(s.heatTarget - s.heat) > 0.002 || s.flash > 0.002)
            raf = requestAnimationFrame(settle);
          else raf = requestAnimationFrame(idle);
        };
        const idle = () => {
          if (Math.abs(s.heatTarget - s.heat) > 0.002 || s.flash > 0.002) {
            last = performance.now();
            raf = requestAnimationFrame(settle);
          } else raf = requestAnimationFrame(idle);
        };
        raf = requestAnimationFrame(settle);
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
        onMouseEnter={(e) => {
          state.current.heatTarget = 1;
          setHot(true);
          onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          state.current.heatTarget = 0;
          setHot(false);
          onMouseLeave?.(e);
        }}
        onFocus={(e) => {
          state.current.heatTarget = 1;
          setHot(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          state.current.heatTarget = 0;
          setHot(false);
          onBlur?.(e);
        }}
        onMouseDown={(e) => {
          state.current.flash = 1;
          onMouseDown?.(e);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") state.current.flash = 1;
          onKeyDown?.(e);
        }}
        className="group relative z-[2] flex h-14 w-[230px] flex-none cursor-pointer items-center justify-center overflow-hidden rounded-full border-0 bg-[hsl(var(--primary))] p-0 outline-none transition-all duration-[220ms] ease-[cubic-bezier(0.34,1.4,0.5,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[5px] focus-visible:outline-[hsl(var(--primary))]"
        style={{
          boxShadow:
            hot && !prefersReducedMotion
              ? "0 26px 50px -14px hsl(var(--primary) / 0.55), 0 0 0 1px hsl(var(--border))"
              : "0 18px 36px -16px hsl(var(--primary) / 0.4), 0 0 0 1px hsl(var(--border))",
        }}
      >
        <canvas ref={glRef} aria-hidden="true" className="absolute inset-0 block h-full w-full" />
        <span
          className="pointer-events-none relative z-10 font-mono text-[12px] font-medium uppercase tracking-[.22em] text-[hsl(var(--primary-foreground))] [text-indent:.22em]"
          style={{ textShadow: "0 1px 10px hsl(var(--primary) / .8)" }}
        >
          {label}
        </span>
      </button>
    </div>
  );
}
