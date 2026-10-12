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
uniform vec3 u_paper;
uniform vec3 u_ink;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p);
  vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),
             mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);
}
void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  float n = noise(uv * vec2(1.2, 6.0) + vec2(u_time * 0.04, 0.0));
  n += noise(uv * vec2(2.5, 12.0) - vec2(u_time * 0.03, 0.0)) * 0.5;
  float lane = exp(-pow((uv.y - 0.5) * 3.2, 2.0));
  vec3 col = mix(u_paper, u_ink, (n * 0.05 + 0.02) * lane);
  gl_FragColor = vec4(col, 1.0);
}
`;

const BTN_FS = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform float u_warp;
uniform float u_flash;
uniform vec3 u_ink;
uniform vec3 u_paper;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p);
  vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),
             mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);
}
void main(){
  vec2 sc = gl_FragCoord.xy / u_res;
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  float t = u_time;
  // Keep the field dark in both themes so the white label stays legible.
  vec3 deep = u_ink * 0.06;
  vec3 col = deep + u_ink * 0.06 * noise(uv * vec2(1.5, 5.0) + vec2(t * 0.3, 0.0));
  vec3 star = mix(u_ink, vec3(1.0), 0.72);
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float rows = 9.0 + fi * 5.0;
    vec2 sp = vec2(uv.x * (6.0 + fi * 3.0) - t * (3.0 + fi * 1.6), uv.y * rows);
    vec2 cell = floor(sp);
    vec2 f = fract(sp);
    float h = hash(cell + fi * 17.31);
    float on = step(0.62, h);
    vec2 c = vec2(0.5, 0.25 + 0.5 * hash(cell + 4.7));
    vec2 d = f - c;
    float sx = mix(90.0, 3.0, u_warp);
    float s = on * exp(-(d.x * d.x * sx + d.y * d.y * 260.0));
    float tw = mix(0.65 + 0.35 * sin(h * 81.0 + t * 7.0), 1.0, u_warp);
    col += star * s * tw * (0.5 + 0.7 * u_warp) * (0.4 + fi * 0.2);
  }
  col += star * u_warp * 0.18 * exp(-abs(uv.y) * 6.0);
  vec2 e = sc * (1.0 - sc);
  col *= 0.45 + 0.55 * pow(e.x * e.y * 16.0, 0.25);
  col = mix(col, u_paper, clamp(u_flash, 0.0, 1.0));
  gl_FragColor = vec4(col, 1.0);
}
`;

/** Resolve a bare-HSL theme token (e.g. `--primary`) to linear 0..1 RGB. */
function readToken(name: string): [number, number, number] {
  const probe = document.createElement("span");
  probe.style.color = `hsl(${getComputedStyle(document.documentElement).getPropertyValue(name).trim()})`;
  document.body.appendChild(probe);
  const m = getComputedStyle(probe).color.match(/[\d.]+/g) ?? ["0", "0", "0"];
  probe.remove();
  return [Number(m[0]) / 255, Number(m[1]) / 255, Number(m[2]) / 255];
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

export interface StarstreamButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button label. */
  label?: string;
}

export function StarstreamButton({
  label = "Engage",
  className,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...props
}: StarstreamButtonProps) {
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
    const bgPaper = bg.getUniformLocation(bgProg, "u_paper");
    const bgInk = bg.getUniformLocation(bgProg, "u_ink");
    const uInk = gl.getUniformLocation(btnProg, "u_ink");
    const uPaper = gl.getUniformLocation(btnProg, "u_paper");
    const applyTheme = () => {
      const ink = readToken("--primary");
      const paper = readToken("--background");
      bg.useProgram(bgProg);
      bg.uniform3fv(bgPaper, paper);
      bg.uniform3fv(bgInk, readToken("--foreground"));
      gl.useProgram(btnProg);
      gl.uniform3fv(uInk, ink);
      gl.uniform3fv(uPaper, paper);
    };
    applyTheme();
    const themeObserver = new MutationObserver(() => {
      applyTheme();
      last = performance.now();
      frame(last);
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "style"],
    });
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
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      bg.deleteProgram(bgProg);
      gl.deleteProgram(btnProg);
    };
  }, [prefersReducedMotion]);

  return (
    <div
      ref={rootRef}
      className={cn(
        "absolute inset-0 flex items-center justify-center overflow-hidden bg-background",
        className,
      )}
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
        className="relative z-[2] block h-[64px] w-[300px] flex-none cursor-pointer rounded-full border border-[hsl(var(--border))] bg-card p-[5px] shadow-[0_22px_44px_-18px_hsl(var(--foreground)/0.55)] outline-none transition-all duration-300 ease-[cubic-bezier(.34,1.4,.5,1)] hover:shadow-[0_28px_56px_-16px_hsl(var(--primary)/0.6)] focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-4 focus-visible:ring-offset-background"
      >
        <span className="relative flex h-full w-full items-center justify-between overflow-hidden rounded-full bg-[hsl(var(--primary))] px-6 shadow-[inset_0_2px_8px_rgb(0_0_0/0.6)]">
          <canvas ref={glRef} aria-hidden="true" className="absolute inset-0 block h-full w-full" />
          <span
            className="pointer-events-none relative z-10 font-serif text-lg italic text-white"
            style={{ textShadow: "0 1px 8px rgb(0 0 0 / 0.7)" }}
          >
            {label}
          </span>
          <span className="pointer-events-none relative z-10 font-mono text-[10px] uppercase tracking-[0.24em] text-white/70">
            →→
          </span>
        </span>
      </button>
    </div>
  );
}
