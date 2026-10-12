"use client";
// Ported from ThreeUI Community's Ignition Button (MIT, © 2026 Meng To).

import { useEffect, useRef, type ButtonHTMLAttributes } from "react";
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
void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  float n = noise(uv * 2.5 + vec2(u_time * 0.015, u_time * 0.025));
  n += noise(uv * 5.0 - vec2(u_time * 0.01, u_time * 0.02)) * 0.5;
  vec3 col1 = vec3(0.957, 0.945, 0.918);
  vec3 col2 = vec3(0.925, 0.910, 0.880);
  vec3 finalCol = mix(col1, col2, n * 0.6 + 0.2);
  gl_FragColor = vec4(finalCol, 1.0);
}
`;

const BTN_FS = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform float u_warp;
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
  for(int i=0;i<4;i++){ v+=a*noise(p); p=p*2.07+vec2(13.1,5.7); a*=0.5; }
  return v;
}
void main(){
  vec2 sc = gl_FragCoord.xy / u_res;
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  float r = length(uv);
  float rr = max(r, 0.08);
  float a = atan(uv.y, uv.x);
  float t = u_time;
  vec3 col = vec3(0.012, 0.011, 0.014);
  float hz = fbm(uv * 2.6 + vec2(t * 0.35, 1.7));
  col += vec3(0.13, 0.06, 0.032) * hz * (0.7 + 0.6 * u_warp);
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float ringN = 26.0 + fi * 9.0;
    vec2 sp = vec2((a / 6.28318 + 0.5) * ringN,
                   (0.3 + fi * 0.22) / rr + t * (2.0 + fi * 1.2));
    vec2 cell = floor(sp);
    vec2 f = fract(sp);
    float h = hash(cell + fi * 17.31);
    float on = step(0.68, h);
    vec2 c = vec2(0.2 + 0.6 * hash(cell + 4.7), 0.5);
    vec2 dlt = f - c;
    float sy = mix(130.0, 8.0, u_warp);
    float star = on * exp(-(dlt.x * dlt.x * 150.0 + dlt.y * dlt.y * sy));
    float tw = 0.7 + 0.3 * sin(h * 81.0 + t * 9.0);
    tw = mix(tw, 1.0, u_warp);
    vec3 sCol = mix(vec3(1.0, 0.94, 0.85), vec3(1.0, 0.6, 0.33), step(0.9, h));
    float fade = smoothstep(0.02, 0.25, r);
    col += sCol * star * tw * fade * (1.1 + 0.7 * u_warp);
  }
  col += vec3(1.0, 0.8, 0.58) * u_warp * 0.32 * exp(-r * 4.0);
  vec2 e = sc * (1.0 - sc);
  col *= 0.3 + 0.7 * pow(e.x * e.y * 16.0, 0.3);
  col = mix(col, vec3(1.0, 0.97, 0.92), clamp(u_flash, 0.0, 1.0));
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

export interface IgnitionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button label. */
  label?: string;
  /** Scene theme. The cream backdrop is inverted in dark mode. */
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

export function IgnitionButton({
  label = "LAUNCH",
  mode = "dark",
  hue = 0,
  saturation = 1,
  brightness = 1,
  darkBackground = "#121316",
  lightBackground = "#f0ede7",
  className,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...props
}: IgnitionButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<HTMLCanvasElement>(null);
  const state = useRef({ warp: 0, warpTarget: 0, flash: 0, z: 0 });

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
    const uWarp = gl.getUniformLocation(btnProg, "u_warp");
    const uFlash = gl.getUniformLocation(btnProg, "u_flash");
    const s = state.current;

    let raf = 0;
    let visible = true;
    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      s.warp += (s.warpTarget - s.warp) * Math.min(1, dt * 2.6);
      s.flash *= Math.exp(-4.5 * dt);
      s.z += dt * (0.05 + s.warp * 1.35);
      resizeCanvas(bg, bgCanvas);
      bg.uniform2f(bgRes, bgCanvas.width, bgCanvas.height);
      bg.uniform1f(bgTime, prefersReducedMotion ? 0 : now / 1000);
      bg.drawArrays(bg.TRIANGLES, 0, 3);
      resizeCanvas(gl, btnCanvas);
      gl.uniform2f(uRes, btnCanvas.width, btnCanvas.height);
      gl.uniform1f(uTime, prefersReducedMotion ? 4.0 : s.z);
      gl.uniform1f(uWarp, s.warp);
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
          if (Math.abs(s.warpTarget - s.warp) > 0.002 || s.flash > 0.002)
            raf = requestAnimationFrame(settle);
          else raf = requestAnimationFrame(idle);
        };
        const idle = () => {
          if (Math.abs(s.warpTarget - s.warp) > 0.002 || s.flash > 0.002) {
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
            mode === "dark"
              ? "invert(1) hue-rotate(180deg) saturate(.92) brightness(1.02)"
              : undefined,
        }}
      />
      <button
        type="button"
        {...props}
        onMouseEnter={(e) => {
          state.current.warpTarget = 1;
          onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          state.current.warpTarget = 0;
          onMouseLeave?.(e);
        }}
        onFocus={(e) => {
          state.current.warpTarget = 1;
          onFocus?.(e);
        }}
        onBlur={(e) => {
          state.current.warpTarget = 0;
          onBlur?.(e);
        }}
        onClick={(e) => {
          state.current.flash = 1;
          state.current.warp = 0;
          state.current.z = 0;
          onClick?.(e);
        }}
        className="relative z-[2] block h-[78px] w-[264px] flex-none cursor-pointer rounded-[24px] border-0 bg-[linear-gradient(180deg,#3c3f46_0%,#15171b_55%,#2a2d33_100%)] p-[7px] shadow-[0_26px_52px_rgba(15,12,10,.35),0_3px_10px_rgba(0,0,0,.35),inset_0_1px_0_rgba(255,255,255,.14)] outline-none transition-all duration-300 ease-[cubic-bezier(.34,1.4,.5,1)] hover:shadow-[0_32px_64px_rgba(160,60,12,.3),0_4px_12px_rgba(0,0,0,.4),inset_0_1px_0_rgba(255,255,255,.16)] focus-visible:outline-2 focus-visible:outline-offset-[5px] focus-visible:outline-[#d43d17]"
      >
        <span className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[17px] bg-[#06050a] shadow-[inset_0_2px_8px_rgba(0,0,0,.9)]">
          <canvas ref={glRef} aria-hidden="true" className="absolute inset-0 block h-full w-full" />
          <span
            className="pointer-events-none relative z-10 text-sm font-medium tracking-[0.34em] text-[#fdf6ee] [text-indent:0.34em]"
            style={{
              textShadow: "0 0 14px rgba(255, 170, 100, .55), 0 1px 6px rgba(0, 0, 0, .9)",
            }}
          >
            {label}
          </span>
        </span>
      </button>
    </div>
  );
}
