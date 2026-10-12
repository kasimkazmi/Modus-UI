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
  vec3 c1 = vec3(0.002, 0.004, 0.015);
  vec3 c2 = vec3(0.006, 0.018, 0.05);
  vec3 c3 = vec3(0.02, 0.07, 0.18);
  vec3 col = mix(c1, c2, smoothstep(0.1, 0.6, m));
  col = mix(col, c3, smoothstep(0.6, 1.0, m));
  float vein = exp(-abs(q.x - q.y) * 5.0);
  col += c3 * vein * 0.12;
  gl_FragColor = vec4(col, 1.0);
}
`;

const BTN_FS = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform float u_heat;
uniform float u_flash;
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
  vec3 c1 = vec3(0.004, 0.008, 0.035);
  vec3 c2 = vec3(0.04, 0.08, 0.35);
  vec3 c3 = vec3(0.0, 0.6, 1.0);
  vec3 c4 = vec3(0.7, 0.9, 1.0);
  vec3 col = mix(c1, c2, smoothstep(0.2, 0.52, m));
  col = mix(col, c3, smoothstep(0.52, 0.8, m));
  col = mix(col, c4, smoothstep(0.82, 1.02, m));
  float vein = exp(-abs(q.x - q.y) * 9.0);
  col += c3 * vein * (0.12 + heat * 0.25);
  vec2 e = uv * (1.0 - uv);
  float vig = pow(e.x * e.y * 16.0, 0.28);
  col *= mix(0.5, 1.0, vig);
  col *= 0.78 + heat * 0.5;
  col += vec3(0.82, 0.94, 1.0) * u_flash * 0.4 * (0.3 + v);
  gl_FragColor = vec4(col, 1.0);
}
`;

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

export interface PlasmaButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button label. */
  label?: string;
  /** Scene theme. The dark backdrop is inverted in light mode. */
  mode?: "dark" | "light";
  /** Hue rotation in degrees (-180 to 180). */
  hue?: number;
  /** Saturation multiplier (0 to 2). */
  saturation?: number;
  /** Brightness multiplier (0.35 to 1.65). */
  brightness?: number;
  /** Page colour shown in dark mode. */
  darkBackground?: string;
  /** Page colour shown in light mode. */
  lightBackground?: string;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function PlasmaButton({
  label = "MODUS DRIVE",
  mode = "dark",
  hue = 0,
  saturation = 1,
  brightness = 1,
  darkBackground = "#020614",
  lightBackground = "#f4f7fb",
  className,
  onMouseDown,
  onKeyDown,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...props
}: PlasmaButtonProps) {
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
    const s = state.current;

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
      style={{
        background: mode === "light" ? lightBackground : darkBackground,
        filter,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <canvas
        ref={bgRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 block h-full w-full"
        style={{
          filter:
            mode === "light"
              ? "invert(1) hue-rotate(180deg) saturate(.92) brightness(1.02)"
              : undefined,
        }}
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
        className="group relative z-[2] flex h-[70px] w-[250px] flex-none cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-0 bg-[#050b1a] p-0 outline-none transition-all duration-[220ms] ease-[cubic-bezier(0.34,1.4,0.5,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[5px] focus-visible:outline-[#00d2ff]"
        style={{
          boxShadow:
            hot && !prefersReducedMotion
              ? "0 30px 60px rgba(0, 150, 220, 0.35), 0 4px 12px rgba(2, 6, 20, 0.4)"
              : "0 24px 48px rgba(4, 98, 126, 0.2), 0 3px 10px rgba(2, 6, 20, 0.35)",
        }}
      >
        <canvas ref={glRef} aria-hidden="true" className="absolute inset-0 block h-full w-full" />
        <span
          className="pointer-events-none relative z-10 text-sm font-semibold tracking-[.26em] text-[#e2f1ff] [text-indent:.26em]"
          style={{ textShadow: "0 1px 12px rgba(0, 16, 40, .85)" }}
        >
          {label}
        </span>
      </button>
    </div>
  );
}
