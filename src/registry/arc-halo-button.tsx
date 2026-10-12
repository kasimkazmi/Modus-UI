"use client";
// Ported from ThreeUI Community's Induction Button (MIT, © 2026 Meng To).

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
  vec2 uv = gl_FragCoord.xy / u_res.y;
  float t = u_time * 0.1;
  float n = noise(uv * 2.0 + vec2(t, -t * 0.6));
  vec2 dots = fract(uv * 28.0) - 0.5;
  float dot = 1.0 - smoothstep(0.05, 0.09, length(dots));
  vec3 col = mix(u_paper, u_ink, dot * (0.06 + 0.1 * n));
  gl_FragColor = vec4(col, 1.0);
}
`;

const BTN_FS = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform float u_arcs;
uniform float u_flash;
uniform vec3 u_ink;
uniform vec3 u_card;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p);
  vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),
             mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);
}
float fbm(vec2 p){
  float v=0.0; float a=0.5;
  for(int i=0;i<4;i++){ v+=a*noise(p); p=p*2.05+vec2(9.7,3.1); a*=0.5; }
  return v;
}
float sdRBox(vec2 p, vec2 b, float r){
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
void main(){
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  float ar = u_res.x / u_res.y;
  vec2 hs = vec2(ar * 0.5 - 0.2, 0.5 - 0.2);
  float d = sdRBox(p, hs, 0.14);
  float t = u_time;
  float hover = clamp(u_arcs / 6.0, 0.0, 1.0);
  // Premultiplied output: everything outside the plate stays transparent so
  // the dotted field shows through instead of a flat rectangle.
  float plate = 1.0 - smoothstep(-0.004, 0.004, d);
  vec3 plateCol = u_card * (0.94 + 0.08 * fbm(p * 9.0));
  plateCol = mix(plateCol, u_ink, exp(d * 9.0) * (0.12 + hover * 0.25));
  vec3 col = plateCol * plate;
  float alpha = plate;

  float a = atan(p.y, p.x);
  vec3 arcCol = vec3(0.0);
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    float w = clamp(u_arcs - fi, 0.0, 1.0);
    float n1 = fbm(vec2(a * 2.4 + fi * 11.3, t * (1.6 + fi * 0.27) + fi * 53.1));
    float off = (n1 - 0.5) * (0.11 + u_flash * 0.1);
    float seg = smoothstep(0.35, 0.75, noise(vec2(a * 1.8 + fi * 7.7, t * (0.9 + fi * 0.13) + fi * 19.0)));
    seg = 0.3 + 0.7 * seg;
    float g = 0.0026 / (abs(d + off) + 0.005);
    arcCol += min(g, 1.0) * w * seg;
  }
  float outerMask = 1.0 - smoothstep(0.04, 0.15, d);
  float ink = clamp(arcCol.x * (0.55 + 0.45 * hover), 0.0, 1.0) * outerMask;
  col = col * (1.0 - ink) + u_ink * ink;
  alpha = alpha * (1.0 - ink) + ink;
  float ring = 0.006 / (abs(d) + 0.006);
  float flash = clamp(ring * u_flash, 0.0, 1.0) * outerMask;
  col = col * (1.0 - flash) + u_ink * flash;
  alpha = alpha * (1.0 - flash) + flash;
  gl_FragColor = vec4(col, alpha);
}
`;

/** Resolve a bare-HSL theme token (e.g. `--primary`) to 0..1 RGB. */
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

export interface ArcHaloButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button label. */
  label?: string;
}

export function ArcHaloButton({
  label = "Charge the field",
  className,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...props
}: ArcHaloButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<HTMLCanvasElement>(null);
  const state = useRef({ arcs: 2.4, arcsTarget: 2.4, flash: 0, crawl: 0 });

  useEffect(() => {
    const root = rootRef.current;
    const bgCanvas = bgRef.current;
    const btnCanvas = glRef.current;
    if (!root || !bgCanvas || !btnCanvas) return;
    const bg = bgCanvas.getContext("webgl", { alpha: false, antialias: false });
    const gl = btnCanvas.getContext("webgl", { alpha: true, antialias: true });
    if (!bg || !gl) return;
    const bgProg = createProgram(bg, BG_FS);
    const btnProg = createProgram(gl, BTN_FS);
    const bgRes = bg.getUniformLocation(bgProg, "u_res");
    const bgTime = bg.getUniformLocation(bgProg, "u_time");
    const uRes = gl.getUniformLocation(btnProg, "u_res");
    const uTime = gl.getUniformLocation(btnProg, "u_time");
    const uArcs = gl.getUniformLocation(btnProg, "u_arcs");
    const uFlash = gl.getUniformLocation(btnProg, "u_flash");
    const bgPaper = bg.getUniformLocation(bgProg, "u_paper");
    const bgInk = bg.getUniformLocation(bgProg, "u_ink");
    const uInk = gl.getUniformLocation(btnProg, "u_ink");
    const uCard = gl.getUniformLocation(btnProg, "u_card");
    const applyTheme = () => {
      const paper = readToken("--background");
      bg.useProgram(bgProg);
      bg.uniform3fv(bgPaper, paper);
      bg.uniform3fv(bgInk, readToken("--foreground"));
      gl.useProgram(btnProg);
      gl.uniform3fv(uInk, readToken("--primary"));
      gl.uniform3fv(uCard, readToken("--card"));
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
      s.arcs += (s.arcsTarget - s.arcs) * Math.min(1, dt * 5);
      s.flash *= Math.exp(-3.6 * dt);
      s.crawl += dt * (0.6 + (s.arcs / 6) * 1.1 + s.flash * 2.0);
      resizeCanvas(bg, bgCanvas);
      bg.uniform2f(bgRes, bgCanvas.width, bgCanvas.height);
      bg.uniform1f(bgTime, prefersReducedMotion ? 0 : now / 1000);
      bg.drawArrays(bg.TRIANGLES, 0, 3);
      resizeCanvas(gl, btnCanvas);
      gl.uniform2f(uRes, btnCanvas.width, btnCanvas.height);
      gl.uniform1f(uTime, prefersReducedMotion ? 3.0 : s.crawl);
      gl.uniform1f(uArcs, s.arcs);
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
          if (Math.abs(s.arcsTarget - s.arcs) > 0.002 || s.flash > 0.002)
            raf = requestAnimationFrame(settle);
          else raf = requestAnimationFrame(idle);
        };
        const idle = () => {
          if (Math.abs(s.arcsTarget - s.arcs) > 0.002 || s.flash > 0.002) {
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
          state.current.arcsTarget = 5.8;
          onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          state.current.arcsTarget = 2.4;
          onMouseLeave?.(e);
        }}
        onFocus={(e) => {
          state.current.arcsTarget = 5.8;
          onFocus?.(e);
        }}
        onBlur={(e) => {
          state.current.arcsTarget = 2.4;
          onBlur?.(e);
        }}
        onClick={(e) => {
          state.current.flash = 1;
          onClick?.(e);
        }}
        className="group relative z-[2] flex h-[96px] w-[280px] flex-none cursor-pointer items-center justify-center rounded-[18px] bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <canvas
          ref={glRef}
          aria-hidden="true"
          className="absolute inset-0 block h-full w-full rounded-[18px]"
        />
        <span className="pointer-events-none relative z-10 font-serif text-xl text-foreground">
          {label}
        </span>
      </button>
    </div>
  );
}
