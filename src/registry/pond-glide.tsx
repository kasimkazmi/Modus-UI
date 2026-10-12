"use client";
// Ported from ThreeUI Community's Koi Studies (MIT, © 2026 Meng To).

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface PondGlideCard {
  /** Name shown in the lockup. */
  name: string;
  /** Characters inside the seal. */
  seal: string;
  /** Quote, one entry per line. */
  lines: string[];
  /** Painting or photo for the upper field. */
  image: string;
  /** Card panel colour; defaults to a theme surface. */
  panel?: string;
  /** Text colour; defaults to the theme foreground. */
  ink?: string;
  /** Wash colour behind the quote; defaults to the theme primary. */
  accent?: string;
}

export interface PondGlideProps {
  /** The three cards of the stack, front first. */
  cards?: PondGlideCard[];
  /** Hint under the stack. */
  hint?: string;
  /** Scene background colour; defaults to the theme background. */
  backgroundColor?: string;
  /** Two colours of the swirling background shader; default to theme background and a primary-tinted muted tone. */
  swirlColors?: [string, string];
  className?: string;
}

const commons = (path: string) => `https://upload.wikimedia.org/wikipedia/commons/thumb/${path}`;

const DEFAULT_CARDS: PondGlideCard[] = [
  {
    name: "Shallows",
    seal: "II",
    lines: ["Slow water", "keeps its", "own time."],
    image: commons("7/76/Shusui.JPG/960px-Shusui.JPG"),
  },
  {
    name: "Ripple",
    seal: "III",
    lines: ["Every turn", "leaves a quiet", "ring."],
    image: commons("8/85/Ginrinshiroutsuri.JPG/960px-Ginrinshiroutsuri.JPG"),
    panel: "hsl(var(--muted))",
  },
  {
    name: "Still Pool",
    seal: "I",
    lines: ["Drift first,", "decide", "later."],
    image: commons(
      "e/e3/Kohaku_nishikigoi_Konishi_Koi_Farm_Martin_Kammerer_ID7185-.jpg/960px-Kohaku_nishikigoi_Konishi_Koi_Farm_Martin_Kammerer_ID7185-.jpg",
    ),
  },
];

const WIDTH = 676;
const HEIGHT = 644;
const TILE = 10;
const COLUMNS = Math.ceil(WIDTH / TILE);
const ROWS = Math.ceil(HEIGHT / TILE);
const MASK_FPS = 30;
const FRAME_COUNT = 300;
const LOOP_MS = (FRAME_COUNT / MASK_FPS) * 1000;
const MAX_TRAIL_POINTS = 16;
const ENTRY_REVEAL_MS = 940;
const STACK_ROTATIONS = [0, 3.4, -5.2];
const STACK_SCALE_STEP = 0.018;
const STACK_X = [0, -4.2, 5.4];
const STACK_Y = [0, 3.2, 6.8];
const STACK_Z = ["0px", "-14cqw", "-28cqw"];
const SEAL_ROTATIONS = [-2.4, 1.8, -1.1];
const MAX_RIPPLES = 8;

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.max(minimum, Math.min(maximum, value));
const hash = (x: number, y: number) => {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return value - Math.floor(value);
};

const CSS = `
.koi-root{--field:hsl(var(--background));--paper:hsl(var(--foreground));--accent:hsl(var(--primary));container-type:size;display:grid;place-items:center;isolation:isolate;font-family:var(--font-body),ui-sans-serif,sans-serif}
.koi-root *{box-sizing:border-box}
.koi-root .koi-veil{position:absolute;inset:0;z-index:1;pointer-events:none;background:radial-gradient(circle at 50% 46%,transparent 16%,hsl(var(--background)/.18) 100%),radial-gradient(circle at 52% 42%,hsl(var(--primary)/.065),transparent 30rem),linear-gradient(hsl(var(--background)/.16),hsl(var(--background)/.22))}
.koi-root .koi-fluid{position:absolute;inset:0;z-index:0;width:100%;height:100%;display:block;pointer-events:none}
.koi-root .stack-scene{position:relative;z-index:2;width:min(26.40625cqw,46.94444cqh);aspect-ratio:676/1010;perspective:900px;container-type:inline-size;isolation:isolate}
.koi-root .orbital-field{position:absolute;left:50%;top:50%;z-index:0;width:220%;aspect-ratio:1;pointer-events:none;translate:-50% -50%}
.koi-root .orbit{position:absolute;left:50%;top:50%;width:var(--orbit-size);aspect-ratio:1;border-radius:50%;background:conic-gradient(from var(--orbit-angle),transparent 0 13%,hsl(var(--foreground)/.07) 19%,hsl(var(--foreground)/.26) 27%,hsl(var(--primary)/.24) 34%,transparent 45% 67%,hsl(var(--foreground)/.17) 76%,transparent 88%);opacity:var(--orbit-opacity);translate:-50% -50%;rotate:0deg;-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - var(--orbit-line)),black calc(100% - var(--orbit-line) + .75px));mask:radial-gradient(farthest-side,transparent calc(100% - var(--orbit-line)),black calc(100% - var(--orbit-line) + .75px));animation:koi-orbit-spin var(--orbit-speed) linear infinite;will-change:rotate}
.koi-root .orbit-one{--orbit-size:58%;--orbit-line:1.5px;--orbit-angle:18deg;--orbit-opacity:.9;--orbit-speed:18s}
.koi-root .orbit-two{--orbit-size:79%;--orbit-line:1px;--orbit-angle:154deg;--orbit-opacity:.7;--orbit-speed:27s;animation-direction:reverse}
.koi-root .orbit-three{--orbit-size:100%;--orbit-line:1px;--orbit-angle:252deg;--orbit-opacity:.5;--orbit-speed:36s}
@keyframes koi-orbit-spin{to{rotate:360deg}}
.koi-root .stack{position:absolute;inset:0;z-index:1;transform-style:preserve-3d}
.koi-root .stack-shell{--stack-x:0%;--stack-y:0%;--stack-z:0px;position:absolute;inset:0;cursor:grab;outline:none;touch-action:none;overscroll-behavior:none;user-select:none;transform:translate3d(var(--stack-x),var(--stack-y),var(--stack-z));transform-style:preserve-3d;transition:transform 360ms cubic-bezier(.22,1,.36,1);will-change:transform}
.koi-root .drag-plane{--drag-x:0px;--drag-y:0px;--drag-turn:0deg;--tilt-x:0deg;--tilt-y:0deg;--release-blur:0px;position:absolute;inset:0;transform:translate3d(var(--drag-x),var(--drag-y),0) rotateX(var(--tilt-x)) rotateY(var(--tilt-y)) rotateZ(var(--drag-turn));filter:blur(var(--release-blur));transform-style:preserve-3d;transition:transform 300ms cubic-bezier(.22,1,.36,1),opacity 180ms ease,filter 140ms ease;will-change:transform,opacity,filter}
.koi-root .stack-shell.is-tracking .drag-plane{transition-duration:70ms;transition-timing-function:linear}
.koi-root .stack-shell.is-dragging{cursor:grabbing}
.koi-root .stack-shell.is-dragging .drag-plane{transition:none}
.koi-root .stack-shell.is-releasing .drag-plane{transition:transform 180ms cubic-bezier(.32,0,.2,1),opacity 90ms ease-out,filter 120ms ease-out}
.koi-root .artwork{--stack-rotation:0deg;--stack-scale:1;position:absolute;inset:0;overflow:hidden;container-type:inline-size;background:var(--panel);border-radius:clamp(20px,2cqw,30px);box-shadow:0 2.6cqw 6.5cqw hsl(0 0% 0%/.3),inset 0 0 0 1px hsl(var(--card)/.1);transform:rotateZ(var(--stack-rotation)) scale(var(--stack-scale));transform-origin:90% 90%;transition:transform 420ms cubic-bezier(.22,1,.36,1),box-shadow 220ms ease;will-change:transform;-webkit-user-drag:none}
.koi-root .artwork::after{content:"";position:absolute;inset:0;z-index:3;border-radius:inherit;padding:1px;background:linear-gradient(145deg,hsl(var(--card)/.22),hsl(var(--foreground)/.11) 42%,hsl(var(--card)/.035) 72%,hsl(var(--primary)/.19));pointer-events:none;-webkit-mask:linear-gradient(white 0 0) content-box,linear-gradient(white 0 0);-webkit-mask-composite:xor;mask-composite:exclude}
.koi-root .image-field{position:absolute;inset:0 0 auto;width:100%;height:63.76238%;display:block;background:var(--panel);pointer-events:none}
.koi-root .copy-panel{position:absolute;inset:63.76238% 0 0;background:var(--panel);color:var(--ink);box-shadow:inset 0 1px hsl(var(--foreground)/.09)}
.koi-root .copy-panel::before{content:"";position:absolute;inset:-10% 16% 5% -12%;background:radial-gradient(ellipse at 24% 48%,var(--accent-card),transparent 44%),radial-gradient(ellipse at 58% 62%,hsl(var(--foreground)/.16),transparent 52%);opacity:0;filter:blur(1.8cqw);mix-blend-mode:screen;pointer-events:none;transform-origin:18% 52%}
.koi-root .copy{position:absolute;top:23.5%;left:6.7%;margin:0;font-family:var(--font-heading),serif;font-size:9.05cqw;font-weight:400;line-height:.92;letter-spacing:-.055em;text-wrap:balance}
.koi-root .word-reveal{display:inline-block;padding:.12em .035em;margin:-.12em -.035em;vertical-align:bottom}
.koi-root .reveal-word{display:inline-block}
.koi-root .brand-lockup{position:absolute;right:5.62%;bottom:5.15cqw;display:flex;align-items:center;gap:1.45cqw;color:var(--ink)}
.koi-root .wordmark{font-size:2.05cqw;font-weight:700;line-height:1;letter-spacing:.16em;text-transform:uppercase;white-space:nowrap}
.koi-root .hanko{position:relative;display:grid;place-items:center;flex:0 0 auto;width:9.3cqw;height:9.3cqw;overflow:hidden;color:var(--panel);background:radial-gradient(circle at 13% 24%,hsl(var(--background)/.42) 0 .26cqw,transparent .35cqw),radial-gradient(circle at 78% 17%,hsl(var(--background)/.34) 0 .2cqw,transparent .3cqw),radial-gradient(circle at 68% 82%,hsl(var(--background)/.38) 0 .24cqw,transparent .34cqw),radial-gradient(circle at 27% 74%,hsl(var(--background)/.3) 0 .17cqw,transparent .27cqw),hsl(var(--primary));border-radius:1.05cqw .72cqw 1.18cqw .82cqw;box-shadow:inset 0 0 0 .28cqw hsl(var(--background)/.2),inset .32cqw -.25cqw .7cqw hsl(var(--background)/.16),0 .45cqw 1.25cqw hsl(0 0% 0%/.16);filter:saturate(.96)}
.koi-root .hanko::before{content:"";position:absolute;inset:.72cqw;border:.26cqw solid currentColor;border-radius:.42cqw .26cqw .52cqw .22cqw;opacity:.82}
.koi-root .hanko::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(103deg,transparent 0 42%,hsl(var(--background)/.14) 44% 46%,transparent 48%),radial-gradient(ellipse at 22% 13%,hsl(var(--background)/.22) 0 .42cqw,transparent .58cqw),radial-gradient(ellipse at 89% 62%,hsl(var(--background)/.22) 0 .45cqw,transparent .62cqw);mix-blend-mode:multiply}
.koi-root .hanko span{position:relative;z-index:1;writing-mode:vertical-rl;text-orientation:upright;font-family:var(--font-mono),ui-monospace,monospace;font-size:3.38cqw;font-weight:900;line-height:.92;letter-spacing:-.14em;transform:translateY(-.03em)}
.koi-root .stack-scene.reveal-enabled .reveal-word,.koi-root .stack-scene.reveal-enabled .reveal-lockup{opacity:0;filter:blur(.32em);translate:0 .72em}
.koi-root .stack-scene.reveal-enabled .reveal-lockup{scale:.92}
.koi-root .stack-scene.reveal-enabled .stack-shell.is-active .copy-panel::before{animation:koi-paper-wash-bloom 1.25s cubic-bezier(.16,1,.3,1) 140ms both}
.koi-root .stack-scene.reveal-enabled .stack-shell.is-active .reveal-word{animation:koi-word-ink-in 720ms cubic-bezier(.16,1,.3,1) both;animation-delay:calc(250ms + var(--reveal-index)*68ms);will-change:opacity,filter,translate}
.koi-root .stack-scene.reveal-enabled .stack-shell.is-active .reveal-lockup{animation:koi-lockup-ink-in 660ms cubic-bezier(.16,1,.3,1) both;animation-delay:calc(285ms + var(--reveal-index)*68ms);will-change:opacity,filter,translate,scale}
@keyframes koi-word-ink-in{from{opacity:0;filter:blur(.32em);translate:0 .72em}to{opacity:1;filter:blur(0);translate:0 0}}
@keyframes koi-lockup-ink-in{from{opacity:0;filter:blur(.32em);translate:0 .72em;scale:.92}to{opacity:1;filter:blur(0);translate:0 0;scale:1}}
@keyframes koi-paper-wash-bloom{0%{opacity:0;translate:-8% 5%;scale:.52}55%{opacity:.16}100%{opacity:.045;translate:1% 0;scale:1.12}}
.koi-root .interaction-hint{position:absolute;left:50%;top:calc(100% + clamp(28px,4.5cqh,52px));z-index:2;margin:0;color:hsl(var(--foreground)/.5);font-size:clamp(9px,.72cqw,12px);font-weight:500;letter-spacing:.18em;line-height:1;text-transform:uppercase;white-space:nowrap;transform:translateX(-50%);transition:opacity 260ms ease}
.koi-root .stack-scene[data-interacted="true"] .interaction-hint{opacity:0}
@container (max-aspect-ratio:3/4){.koi-root .stack-scene{width:min(72cqw,44cqh)}}
.koi-root[data-still] .stack-shell,.koi-root[data-still] .artwork,.koi-root[data-still] .interaction-hint{transition-duration:1ms}
.koi-root[data-still] .orbit{animation:none}
.koi-root[data-still] .orbit-one{rotate:22deg}.koi-root[data-still] .orbit-two{rotate:148deg}.koi-root[data-still] .orbit-three{rotate:276deg}
.koi-root[data-still] .stack-scene.reveal-enabled .reveal-word,.koi-root[data-still] .stack-scene.reveal-enabled .reveal-lockup{opacity:1;filter:none;translate:none;scale:1;animation:none}
.koi-root[data-still] .stack-scene.reveal-enabled .copy-panel::before{display:none}
`;

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
// Swirl + multiplied fractal noise + cursor ripples + watercolour bleed, after the
// "Fluid Pastels" preset the original loads from the shaders.com runtime.
const FRAG = `precision highp float;
uniform vec2 uRes;uniform float uTime;uniform vec3 uA;uniform vec3 uB;uniform float uDark;
uniform vec4 uRipples[${MAX_RIPPLES}];
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p,int o){float v=0.,a=.5;for(int i=0;i<4;i++){if(i>=o)break;v+=a*n(p);p*=2.03;a*=.5;}return v;}
vec3 cineon(vec3 c){c=max(vec3(0.),c-.004);return pow((c*(6.2*c+.5))/(c*(6.2*c+1.7)+.06),vec3(2.2));}
void main(){
  vec2 uv=gl_FragCoord.xy/uRes;vec2 q=(gl_FragCoord.xy-.5*uRes)/min(uRes.x,uRes.y);
  for(int i=0;i<${MAX_RIPPLES};i++){vec4 r=uRipples[i];if(r.w<=0.)continue;
    vec2 d=q-r.xy;float dist=length(d);float age=r.z;
    float wave=sin(dist*38.-age*9.)*exp(-age*3.3)*exp(-dist*2.2)*r.w;
    q+=normalize(d+1e-4)*wave*.0174;}
  float t=uTime*.06;
  vec2 w=q*1.4;float ang=length(w)*2.2-t*1.6;
  w=mat2(cos(ang),-sin(ang),sin(ang),cos(ang))*w;
  float s=fbm(w*1.2+vec2(t,-t*.7),3)*.6+.5*sin(w.x*1.6+t)*.4;
  vec3 col=mix(uA,uB,clamp(s,0.,1.));
  float a=radians(-32.);vec2 nq=mat2(cos(a),-sin(a),sin(a),cos(a))*q;
  float fn=fbm(nq*2.2*3.+vec2(uTime*.57*.15,0.),1);
  fn=clamp((fn-.5)*(1.+.54)+.5,0.,1.);
  col=mix(col,col*fn,.34*mix(.35,1.,uDark));
  float bleed=fbm(q*6.+fbm(q*3.,2)*2.9,2);
  col*=1.-.07*(bleed-.5);
  col=mix(col,cineon(col*1.1),uDark);
  gl_FragColor=vec4(col,1.);
}`;

/** Resolves any CSS colour (layers painted bottom-up) to linear 0–1 RGB via a 1×1 canvas. */
function colourToVec(...layers: string[]): [number, number, number] {
  const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!ctx) return [0, 0, 0];
  for (const layer of layers) {
    ctx.fillStyle = layer;
    ctx.fillRect(0, 0, 1, 1);
  }
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r / 255, g / 255, b / 255];
}

/** Bumps on light/dark or palette changes so colours re-resolve. */
function useThemeVersion() {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const observer = new MutationObserver(() => setVersion((v) => v + 1));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "data-palette", "style"],
    });
    return () => observer.disconnect();
  }, []);
  return version;
}

/** Procedural stand-in for the original's baked 300-frame mask: drifting blobs of hidden tiles. */
function maskHidden(column: number, row: number, frame: number) {
  const phi = (frame / FRAME_COUNT) * Math.PI * 2;
  const x = column / COLUMNS;
  const y = row / ROWS;
  const v =
    Math.sin(x * 5.1 + Math.sin(phi) * 1.8 + y * 1.3) +
    Math.sin(y * 4.3 - Math.cos(phi) * 1.6 + x * 0.9) +
    0.7 * Math.sin((x + y) * 6.2 + phi * 2) +
    (hash(column, row + frame * 0.01) - 0.5) * 0.5;
  return v > 0.95;
}

export function PondGlide({
  cards: cardData = DEFAULT_CARDS,
  hint = "drag · tap · let it drift",
  backgroundColor = "hsl(var(--background))",
  swirlColors,
  className,
}: PondGlideProps) {
  const prefersReducedMotion = useReducedMotion();
  const themeVersion = useThemeVersion();
  const rootRef = useRef<HTMLDivElement>(null);
  const fluidRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<HTMLElement>(null);
  const swirlKey = swirlColors?.join("|") ?? "";

  // Background shader.
  useEffect(() => {
    const root = rootRef.current;
    const canvas = fluidRef.current;
    const gl = canvas?.getContext("webgl", { antialias: false, premultipliedAlpha: false });
    if (!root || !canvas || !gl) return;
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, "uRes");
    const uTime = gl.getUniformLocation(prog, "uTime");
    const uRipples = gl.getUniformLocation(prog, "uRipples");
    const token = (name: string) =>
      `hsl(${getComputedStyle(document.documentElement).getPropertyValue(name).trim()})`;
    const [a, b] = swirlKey ? swirlKey.split("|") : [];
    const swirlA = a ? colourToVec(a) : colourToVec(token("--background"));
    const swirlB = b
      ? colourToVec(b)
      : colourToVec(token("--muted"), token("--primary").replace(")", " / 0.14)"));
    gl.uniform3fv(gl.getUniformLocation(prog, "uA"), swirlA);
    const [r, g, bl] = colourToVec(token("--background"));
    gl.uniform1f(gl.getUniformLocation(prog, "uDark"), r + g + bl < 1.5 ? 1 : 0);
    gl.uniform3fv(gl.getUniformLocation(prog, "uB"), swirlB);

    const ripples: { x: number; y: number; born: number }[] = [];
    let lastRipple = 0;
    let time = 0;
    const draw = () => {
      const data = new Float32Array(MAX_RIPPLES * 4);
      ripples.forEach((r, i) => {
        const age = time - r.born;
        data.set([r.x, r.y, age, age < 2 ? 1 : 0], i * 4);
      });
      gl.uniform4fv(uRipples, data);
      gl.uniform1f(uTime, time);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { width, height } = root.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(width * dpr * 0.5));
      canvas.height = Math.max(1, Math.round(height * dpr * 0.5));
      gl.viewport(0, 0, canvas.width, canvas.height);
      draw();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(root);
    resize();

    const onMove = (event: PointerEvent) => {
      if (prefersReducedMotion) return;
      const rect = root.getBoundingClientRect();
      const m = Math.min(rect.width, rect.height);
      const x = (event.clientX - rect.left - rect.width / 2) / m;
      const y = (rect.height / 2 - (event.clientY - rect.top)) / m;
      if (time - lastRipple < 0.06) return;
      lastRipple = time;
      ripples.unshift({ x, y, born: time });
      if (ripples.length > MAX_RIPPLES) ripples.length = MAX_RIPPLES;
    };
    window.addEventListener("pointermove", onMove);

    let raf = 0;
    let last = -1;
    let visible = true;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (last >= 0) time += Math.min(0.05, (now - last) / 1000);
      last = now;
      draw();
    };
    const start = () => {
      if (prefersReducedMotion || raf || !visible || document.hidden) return;
      last = -1;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(root);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);
    start();
    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVis);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [swirlKey, prefersReducedMotion, themeVersion]);

  // Card stack.
  useEffect(() => {
    const root = rootRef.current;
    const scene = sceneRef.current;
    if (!root || !scene) return;
    const reduced = !!prefersReducedMotion;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const shellElements = Array.from(scene.querySelectorAll<HTMLDivElement>(".stack-shell"));
    const edgeNoise = new Float32Array(COLUMNS * ROWS);
    const entryOrder = new Float32Array(COLUMNS * ROWS);
    for (let row = 0; row < ROWS; row += 1) {
      for (let column = 0; column < COLUMNS; column += 1) {
        const cell = row * COLUMNS + column;
        const jitter = hash(column * 1.91 + 17, row * 2.17 + 31);
        edgeNoise[cell] = hash(column, row) - 0.5;
        entryOrder[cell] = clamp(
          (column / Math.max(1, COLUMNS - 1)) * 0.72 +
            jitter * 0.24 +
            Math.abs(row / Math.max(1, ROWS - 1) - 0.5) * 0.04 +
            Math.sin(row * 0.48) * 0.035,
          0,
          1,
        );
      }
    }

    type Card = {
      id: number;
      shell: HTMLDivElement;
      dragPlane: HTMLDivElement;
      artwork: HTMLElement;
      canvas: HTMLCanvasElement;
      context: CanvasRenderingContext2D;
      image: HTMLImageElement;
      imageReady: boolean;
      imageUsable: boolean;
      panelColor: string;
      entryRevealStart: number;
      pointer: {
        currentFrame: number;
        hasInteracted: boolean;
        lastMove: number;
        targetFrame: number;
        x: number;
        y: number;
      };
      trail: { life: number; radius: number; x: number; y: number }[];
      suppressClickUntil: number;
    };

    const cards: Card[] = shellElements.map((shell, id) => {
      const canvas = shell.querySelector<HTMLCanvasElement>(".image-field")!;
      const artwork = shell.querySelector<HTMLElement>(".artwork")!;
      return {
        id,
        shell,
        dragPlane: shell.querySelector<HTMLDivElement>(".drag-plane")!,
        artwork,
        canvas,
        context: canvas.getContext("2d", { alpha: false })!,
        image: new Image(),
        imageReady: false,
        imageUsable: false,
        panelColor: getComputedStyle(artwork).getPropertyValue("--panel").trim(),
        entryRevealStart: 0,
        pointer: {
          currentFrame: 0,
          hasInteracted: false,
          lastMove: 0,
          targetFrame: 0,
          x: 0.5,
          y: 0.5,
        },
        trail: [],
        suppressClickUntil: 0,
      };
    });
    if (!cards.length) return;

    let order = cards.map((c) => c.id).reverse();
    let activeDrag: {
      card: Card;
      pointerId: number;
      startX: number;
      startY: number;
      committedDirection: number;
      traveled: number;
    } | null = null;
    let animationFrame = 0;
    let initialRevealReady = false;
    let inView = true;
    let lastFrameTime = performance.now();
    const startTime = performance.now();
    let transitioning = false;
    const timers: number[] = [];

    const topCard = () => cards[order[order.length - 1]];
    const canAnimateField = () => finePointer.matches && !reduced;
    const shouldAnimateCanvas = () =>
      cards.every((c) => c.imageReady) && inView && !document.hidden && !reduced;

    const setShellTransform = (card: Card, x = 0, y = 0, tiltX = 0, tiltY = 0, turn = 0) => {
      const s = card.dragPlane.style;
      s.setProperty("--drag-x", `${x.toFixed(2)}px`);
      s.setProperty("--drag-y", `${y.toFixed(2)}px`);
      s.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
      s.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);
      s.setProperty("--drag-turn", `${turn.toFixed(2)}deg`);
    };
    const resetShellTransform = (card: Card) => {
      setShellTransform(card);
      card.dragPlane.style.opacity = "";
      card.dragPlane.style.setProperty("--release-blur", "0px");
      card.shell.classList.remove("is-dragging", "is-tracking", "is-releasing");
    };

    const updateStack = () => {
      const top = topCard();
      for (let index = 0; index < order.length; index += 1) {
        const card = cards[order[index]];
        const depth = order.length - index - 1;
        const isTop = card === top;
        const wasActive = card.shell.classList.contains("is-active");
        card.shell.style.zIndex = String(index + 1);
        card.shell.style.pointerEvents = isTop ? "auto" : "none";
        card.shell.tabIndex = isTop ? 0 : -1;
        card.shell.setAttribute("aria-hidden", isTop ? "false" : "true");
        card.shell.classList.toggle("is-active", isTop);
        if (isTop && !wasActive) card.entryRevealStart = performance.now();
        card.shell.style.setProperty("--stack-x", `${STACK_X[depth] ?? 0}%`);
        card.shell.style.setProperty("--stack-y", `${STACK_Y[depth] ?? 0}%`);
        card.shell.style.setProperty("--stack-z", STACK_Z[depth] ?? "0px");
        card.artwork.style.setProperty("--stack-rotation", `${STACK_ROTATIONS[depth] ?? 0}deg`);
        card.artwork.style.setProperty("--stack-scale", String(1 - depth * STACK_SCALE_STEP));
        if (!isTop) resetShellTransform(card);
      }
    };

    const drawMediaAndGrid = (card: Card) => {
      if (!card.imageReady) return;
      const { context } = card;
      context.fillStyle = card.panelColor;
      context.fillRect(0, 0, WIDTH, HEIGHT);
      if (!card.imageUsable) return;
      const source = card.image;
      const sourceWidth = source.naturalWidth || WIDTH;
      const sourceHeight = source.naturalHeight || HEIGHT;
      const targetRatio = WIDTH / HEIGHT;
      let sourceX = 0;
      let sourceY = 0;
      let cropWidth = sourceWidth;
      let cropHeight = sourceHeight;
      if (sourceWidth / sourceHeight > targetRatio) {
        cropWidth = sourceHeight * targetRatio;
        sourceX = (sourceWidth - cropWidth) / 2;
      } else {
        cropHeight = sourceWidth / targetRatio;
        sourceY = (sourceHeight - cropHeight) / 2;
      }
      context.drawImage(source, sourceX, sourceY, cropWidth, cropHeight, 0, 0, WIDTH, HEIGHT);
      context.save();
      context.globalAlpha = 0.18;
      context.strokeStyle = card.panelColor;
      context.lineWidth = 0.9;
      context.beginPath();
      for (let x = TILE; x < WIDTH; x += TILE) {
        context.moveTo(x + 0.5, 0);
        context.lineTo(x + 0.5, HEIGHT);
      }
      for (let y = TILE; y < HEIGHT; y += TILE) {
        context.moveTo(0, y + 0.5);
        context.lineTo(WIDTH, y + 0.5);
      }
      context.stroke();
      context.restore();
    };

    const revealAtCell = (card: Card, cellX: number, cellY: number, cell: number) => {
      for (const point of card.trail) {
        const dx = cellX - point.x;
        const dy = cellY - point.y;
        const radius = point.radius * (0.32 + point.life * 0.68);
        if (Math.sqrt(dx * dx + dy * dy) < radius + edgeNoise[cell] * 0.034) return true;
      }
      return false;
    };

    const drawMaskedFrame = (card: Card, frame: number, isTop: boolean, now: number) => {
      if (!card.imageReady) return;
      drawMediaAndGrid(card);
      const revealRaw = reduced ? 1 : clamp((now - card.entryRevealStart) / ENTRY_REVEAL_MS, 0, 1);
      const revealProgress = revealRaw * revealRaw * (3 - 2 * revealRaw);
      const ctx = card.context;
      ctx.save();
      ctx.fillStyle = card.panelColor;
      for (let row = 0; row < ROWS; row += 1) {
        for (let column = 0; column < COLUMNS; column += 1) {
          const cell = row * COLUMNS + column;
          const hidden = maskHidden(column, row, frame);
          const entryHidden = isTop && revealProgress < 1 && entryOrder[cell] > revealProgress;
          const pointerRevealed =
            isTop &&
            card.trail.length > 0 &&
            revealAtCell(card, (column + 0.5) / COLUMNS, (row + 0.5) / ROWS, cell);
          if ((hidden || entryHidden) && !pointerRevealed) {
            ctx.globalAlpha = entryHidden ? 1 : 0.82;
            ctx.fillRect(column * TILE, row * TILE, TILE, TILE);
          }
        }
      }
      ctx.restore();
    };

    const render = (now: number) => {
      animationFrame = 0;
      const deltaTime = Math.min(48, Math.max(0, now - lastFrameTime));
      const top = topCard();
      lastFrameTime = now;
      for (const card of cards) {
        for (let index = card.trail.length - 1; index >= 0; index -= 1) {
          card.trail[index].life -= deltaTime / 760;
          if (card.trail[index].life <= 0) card.trail.splice(index, 1);
        }
        const phaseOffset = card.id * LOOP_MS * 0.19;
        const autoFrame = Math.floor(
          (((now - startTime + phaseOffset) % LOOP_MS) * MASK_FPS) / 1000,
        );
        const usesPointer = card === top && card.pointer.hasInteracted;
        const response = 1 - Math.pow(0.72, deltaTime / 16.667);
        if (usesPointer)
          card.pointer.currentFrame +=
            (card.pointer.targetFrame - card.pointer.currentFrame) * response;
        else card.pointer.currentFrame = autoFrame;
        drawMaskedFrame(
          card,
          Math.round(card.pointer.currentFrame) % FRAME_COUNT,
          card === top,
          now,
        );
      }
      if (shouldAnimateCanvas()) animationFrame = requestAnimationFrame(render);
    };

    const syncAnimation = () => {
      if (!shouldAnimateCanvas()) {
        if (animationFrame) cancelAnimationFrame(animationFrame);
        animationFrame = 0;
        const now = performance.now();
        for (const card of cards) drawMaskedFrame(card, 0, card === topCard(), now);
        return;
      }
      if (!animationFrame) {
        lastFrameTime = performance.now();
        animationFrame = requestAnimationFrame(render);
      }
    };

    const startInitialPixelReveal = () => {
      if (initialRevealReady || !cards.every((c) => c.imageReady)) return;
      initialRevealReady = true;
      topCard().entryRevealStart = performance.now();
    };

    const updatePointerField = (event: PointerEvent) => {
      if (!canAnimateField() || (event.pointerType && event.pointerType !== "mouse")) return;
      const card = topCard();
      const now = performance.now();
      const rect = card.canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const elapsed = Math.max(8, now - card.pointer.lastMove);
      const distance = Math.hypot(x - card.pointer.x, y - card.pointer.y);
      const speed = clamp((distance * 1000) / elapsed / 2.2, 0, 1);
      const rootRect = root.getBoundingClientRect();
      const globalX = clamp((event.clientX - rootRect.left) / rootRect.width, 0, 1);
      const globalY = clamp((event.clientY - rootRect.top) / rootRect.height, 0, 1);
      const phase = clamp(globalX * 0.72 + (1 - globalY) * 0.28, 0, 1);
      card.pointer.hasInteracted = true;
      card.pointer.lastMove = now;
      card.pointer.targetFrame = phase * (FRAME_COUNT - 1);
      card.pointer.x = x;
      card.pointer.y = y;
      if (x > -0.3 && x < 1.3 && y > -0.3 && y < 1.3) {
        card.trail.unshift({ life: 1, radius: 0.105 + speed * 0.115, x, y });
        if (card.trail.length > MAX_TRAIL_POINTS) card.trail.length = MAX_TRAIL_POINTS;
      }
      syncAnimation();
    };

    const updatePointerTilt = (event: PointerEvent) => {
      if (!finePointer.matches || reduced || activeDrag || transitioning) return;
      const card = topCard();
      const rect = scene.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      if (!(x > -0.22 && x < 1.22 && y > -0.18 && y < 1.18)) {
        card.shell.classList.remove("is-tracking");
        setShellTransform(card);
        return;
      }
      card.shell.classList.add("is-tracking");
      setShellTransform(
        card,
        0,
        0,
        clamp((0.5 - y) * 10, -4.75, 4.75),
        clamp((x - 0.5) * 10, -4.75, 4.75),
        0,
      );
    };

    const markInteracted = () => {
      scene.dataset.interacted = "true";
    };
    const getDragCommitThreshold = () => clamp(scene.getBoundingClientRect().width * 0.18, 52, 88);
    const getCommittedDirection = (x: number, y: number, threshold: number) =>
      Math.abs(x) >= threshold && Math.abs(x) >= Math.abs(y) * 0.75 ? Math.sign(x) : 0;

    const later = (fn: () => void, ms: number) => {
      timers.push(window.setTimeout(fn, ms));
    };

    const sendToBack = (card: Card, vectorX = 1, vectorY = 0) => {
      if (transitioning || card !== topCard()) return;
      markInteracted();
      transitioning = true;
      const magnitude = Math.max(1, Math.hypot(vectorX, vectorY));
      const directionX = vectorX / magnitude;
      const directionY = vectorY / magnitude;
      const distance = Math.max(190, scene.getBoundingClientRect().width * 0.66);
      const duration = reduced ? 0 : 180;
      const incoming = cards[order[order.length - 2]];
      card.shell.classList.remove("is-dragging", "is-tracking");
      card.shell.classList.add("is-releasing");
      setShellTransform(
        card,
        directionX * distance,
        directionY * distance * 0.58,
        -directionY * 7,
        directionX * 8,
        directionX * 9,
      );
      card.dragPlane.style.opacity = duration ? "0" : "";
      card.dragPlane.style.setProperty("--release-blur", duration ? "16px" : "0px");
      later(() => {
        const hadFocus = document.activeElement === card.shell;
        order = [card.id, ...order.filter((id) => id !== card.id)];
        for (const el of [card.shell, card.dragPlane, incoming.shell, incoming.dragPlane])
          el.style.transition = "none";
        resetShellTransform(card);
        updateStack();
        void incoming.shell.offsetWidth;
        for (const el of [card.shell, card.dragPlane, incoming.shell, incoming.dragPlane])
          el.style.transition = "";
        transitioning = false;
        if (hadFocus) incoming.shell.focus({ preventScroll: true });
        syncAnimation();
      }, duration);
    };

    const bringPreviousToFront = () => {
      if (transitioning) return;
      markInteracted();
      transitioning = true;
      const outgoing = topCard();
      const incoming = cards[order[0]];
      const hadFocus = document.activeElement === outgoing.shell;
      const distance = Math.max(190, scene.getBoundingClientRect().width * 0.66);
      const duration = reduced ? 0 : 360;
      incoming.shell.style.transition = "none";
      incoming.dragPlane.style.transition = "none";
      setShellTransform(incoming, -distance, 0, 0, -6, -8);
      incoming.dragPlane.style.opacity = duration ? "0.12" : "";
      order = [...order.slice(1), incoming.id];
      updateStack();
      void incoming.shell.offsetWidth;
      incoming.shell.style.transition = "";
      incoming.dragPlane.style.transition = "";
      const reveal = () => {
        setShellTransform(incoming);
        incoming.dragPlane.style.opacity = "";
      };
      const finish = () => {
        transitioning = false;
        if (hadFocus) incoming.shell.focus({ preventScroll: true });
        syncAnimation();
      };
      if (duration) {
        later(reveal, 18);
        later(finish, duration);
      } else {
        reveal();
        finish();
      }
    };

    const cancelDrag = (event?: PointerEvent) => {
      if (
        !activeDrag ||
        (event?.pointerId !== undefined && event.pointerId !== activeDrag.pointerId)
      )
        return;
      const { card, pointerId } = activeDrag;
      activeDrag = null;
      try {
        if (card.shell.hasPointerCapture?.(pointerId)) card.shell.releasePointerCapture(pointerId);
      } catch {
        // capture may already be gone
      }
      card.shell.classList.remove("is-dragging");
      setShellTransform(card);
    };

    const handlePointerDown = (card: Card, event: PointerEvent) => {
      if (card !== topCard() || transitioning || (event.button !== undefined && event.button !== 0))
        return;
      activeDrag = {
        card,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        committedDirection: 0,
        traveled: 0,
      };
      card.shell.classList.remove("is-tracking");
      card.shell.classList.add("is-dragging");
      card.shell.focus({ preventScroll: true });
      try {
        card.shell.setPointerCapture?.(event.pointerId);
      } catch {
        cancelDrag(event);
        return;
      }
      event.preventDefault();
    };

    const handleDragPointerMove = (card: Card, event: PointerEvent) => {
      if (!activeDrag || activeDrag.card !== card || event.pointerId !== activeDrag.pointerId)
        return;
      const x = event.clientX - activeDrag.startX;
      const y = event.clientY - activeDrag.startY;
      const width = Math.max(1, scene.getBoundingClientRect().width);
      const committedDirection = getCommittedDirection(x, y, getDragCommitThreshold());
      activeDrag.traveled = Math.max(activeDrag.traveled, Math.hypot(x, y));
      if (committedDirection) activeDrag.committedDirection = committedDirection;
      setShellTransform(
        card,
        x,
        y,
        clamp((-y / width) * 6, -6, 6),
        clamp((x / width) * 7, -7, 7),
        clamp((x / width) * 11, -12, 12),
      );
      markInteracted();
      event.preventDefault();
    };

    const handlePointerUp = (card: Card, event: PointerEvent) => {
      if (!activeDrag || activeDrag.card !== card || event.pointerId !== activeDrag.pointerId)
        return;
      const { committedDirection: latched, startX, startY, traveled } = activeDrag;
      const x = event.clientX - startX;
      const y = event.clientY - startY;
      const committedDirection = getCommittedDirection(x, y, getDragCommitThreshold()) || latched;
      const isTap = traveled <= 3 && Math.hypot(x, y) <= 3;
      activeDrag = null;
      try {
        if (card.shell.hasPointerCapture?.(event.pointerId))
          card.shell.releasePointerCapture(event.pointerId);
      } catch {
        // already released
      }
      card.shell.classList.remove("is-dragging");
      card.suppressClickUntil = performance.now() + 360;
      if (committedDirection) {
        if (committedDirection < 0) sendToBack(card, -1, 0);
        else bringPreviousToFront();
      } else if (isTap) sendToBack(card, x || 1, y);
      else setShellTransform(card);
      event.preventDefault();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        bringPreviousToFront();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        sendToBack(topCard(), 1, 0);
      }
    };
    const onWindowMove = (event: PointerEvent) => {
      if (activeDrag) handleDragPointerMove(activeDrag.card, event);
      updatePointerField(event);
      updatePointerTilt(event);
    };
    const onWindowUp = (event: PointerEvent) => {
      if (activeDrag) handlePointerUp(activeDrag.card, event);
    };
    const onWindowCancel = (event: PointerEvent) => cancelDrag(event);
    const onMouseOut = (event: MouseEvent) => {
      if (!event.relatedTarget && !activeDrag) {
        const card = topCard();
        card.shell.classList.remove("is-tracking");
        setShellTransform(card);
      }
    };
    const onBlur = () => {
      cancelDrag();
      syncAnimation();
    };

    const cleanups: (() => void)[] = [];
    for (const card of cards) {
      card.context.imageSmoothingEnabled = true;
      const onLoad = () => {
        card.imageReady = true;
        card.imageUsable = true;
        startInitialPixelReveal();
        syncAnimation();
      };
      const onError = () => {
        card.imageReady = true;
        startInitialPixelReveal();
        syncAnimation();
      };
      card.image.crossOrigin = "anonymous";
      card.image.addEventListener("load", onLoad, { once: true });
      card.image.addEventListener("error", onError, { once: true });
      const down = (e: PointerEvent) => handlePointerDown(card, e);
      const lost = (e: PointerEvent) => cancelDrag(e);
      const click = () => {
        if (performance.now() >= card.suppressClickUntil) sendToBack(card, 1, 0);
      };
      const key = (e: KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          sendToBack(card, 1, 0);
        }
      };
      card.shell.addEventListener("pointerdown", down);
      card.shell.addEventListener("lostpointercapture", lost);
      card.shell.addEventListener("click", click);
      card.shell.addEventListener("keydown", key);
      cleanups.push(() => {
        card.image.removeEventListener("load", onLoad);
        card.image.removeEventListener("error", onError);
        card.shell.removeEventListener("pointerdown", down);
        card.shell.removeEventListener("lostpointercapture", lost);
        card.shell.removeEventListener("click", click);
        card.shell.removeEventListener("keydown", key);
      });
      card.image.src = cardData[card.id]?.image ?? "";
    }

    scene.classList.add("reveal-enabled");
    updateStack();
    root.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointermove", onWindowMove);
    window.addEventListener("pointerup", onWindowUp);
    window.addEventListener("pointercancel", onWindowCancel);
    window.addEventListener("mouseout", onMouseOut);
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", syncAnimation);
    finePointer.addEventListener?.("change", syncAnimation);
    const observer = new IntersectionObserver(
      (entries) => {
        inView = entries[0]?.isIntersecting ?? true;
        syncAnimation();
      },
      { rootMargin: "100px" },
    );
    observer.observe(scene);

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      timers.forEach(clearTimeout);
      cleanups.forEach((fn) => fn());
      observer.disconnect();
      root.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointermove", onWindowMove);
      window.removeEventListener("pointerup", onWindowUp);
      window.removeEventListener("pointercancel", onWindowCancel);
      window.removeEventListener("mouseout", onMouseOut);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", syncAnimation);
      finePointer.removeEventListener?.("change", syncAnimation);
      scene.classList.remove("reveal-enabled");
      for (const card of cards) {
        card.shell.classList.remove("is-active");
        resetShellTransform(card);
      }
    };
  }, [cardData, prefersReducedMotion]);

  return (
    <div
      ref={rootRef}
      data-still={prefersReducedMotion ? "" : undefined}
      className={cn("koi-root absolute inset-0 overflow-hidden", className)}
      style={{
        background: `radial-gradient(circle at 52% 42%, hsl(var(--primary)/0.055), transparent 27rem), radial-gradient(circle at 45% 55%, hsl(var(--foreground)/0.035), transparent 40rem), ${backgroundColor}`,
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <canvas
        ref={fluidRef}
        className="koi-fluid"
        aria-hidden="true"
        style={{ background: backgroundColor }}
      />
      <div className="koi-veil" aria-hidden="true" />
      <main
        ref={sceneRef}
        className="stack-scene"
        aria-label="Interactive stack of koi studies"
        data-interacted="false"
      >
        <div className="orbital-field" aria-hidden="true">
          <span className="orbit orbit-one" />
          <span className="orbit orbit-two" />
          <span className="orbit orbit-three" />
        </div>
        <div
          className="stack"
          role="group"
          aria-label="Drag left for the next card or right for the previous card. Tap for next. Use the Left and Right Arrow keys."
        >
          {cardData.map((card, id) => {
            let wordIndex = 0;
            return (
              <div
                key={id}
                className="stack-shell"
                role="button"
                tabIndex={id === 0 ? 0 : -1}
                aria-label={`${card.name}: ${card.lines.join(" ")} Drag left for next or right for previous.`}
              >
                <div className="drag-plane">
                  <article
                    className="artwork"
                    style={
                      {
                        "--panel": card.panel ?? "hsl(var(--card))",
                        "--ink": card.ink ?? "hsl(var(--foreground))",
                        "--accent-card": card.accent ?? "hsl(var(--primary) / 0.35)",
                      } as CSSProperties
                    }
                  >
                    <canvas
                      className="image-field"
                      width={WIDTH}
                      height={HEIGHT}
                      aria-hidden="true"
                    />
                    <section className="copy-panel" aria-label={card.lines.join(" ")}>
                      <p className="copy" aria-hidden="true">
                        {card.lines.map((line, li) => (
                          <span key={li}>
                            {li > 0 && <br />}
                            {line.split(" ").map((word, wi) => (
                              <span key={wi}>
                                {wi > 0 && " "}
                                <span className="word-reveal">
                                  <span
                                    className="reveal-word"
                                    style={{ "--reveal-index": wordIndex++ } as CSSProperties}
                                  >
                                    {word}
                                  </span>
                                </span>
                              </span>
                            ))}
                          </span>
                        ))}
                      </p>
                      <div className="brand-lockup" aria-label={card.name}>
                        <span
                          className="wordmark reveal-lockup"
                          style={{ "--reveal-index": wordIndex } as CSSProperties}
                        >
                          {card.name}
                        </span>
                        <span
                          className="hanko reveal-lockup"
                          style={
                            {
                              "--reveal-index": wordIndex + 1,
                              transform: `rotate(${SEAL_ROTATIONS[id % SEAL_ROTATIONS.length]}deg)`,
                            } as CSSProperties
                          }
                          aria-hidden="true"
                        >
                          <span lang="ja">{card.seal}</span>
                        </span>
                      </div>
                    </section>
                  </article>
                </div>
              </div>
            );
          })}
        </div>
        <p className="interaction-hint" aria-hidden="true">
          {hint}
        </p>
      </main>
    </div>
  );
}
