"use client";
// Ported from ThreeUI Community's Topo Field (MIT, © 2026 Meng To).

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface ContourSheetProps {
  className?: string;
  speed?: number;
  length?: number;
  density?: number;
  opacity?: number;
  hue?: number;
  saturation?: number;
  brightness?: number;
  /** Paper colour. Defaults to the theme background. */
  backgroundColor?: string;
  /** Contour ink. Defaults to the theme foreground. */
  lineColor?: string;
  /** Colour of every fifth (index) contour. Defaults to the theme primary. */
  accentColor?: string;
}

type Rgb = [number, number, number];
const TOKENS = [
  "background",
  "foreground",
  "primary",
  "muted-foreground",
  "border",
  "card",
] as const;
type Theme = Record<(typeof TOKENS)[number], Rgb>;

/** Any CSS colour as 0–1 sRGB channels, resolved by the browser. */
function toRgb(color: string): Rgb {
  const probe = document.createElement("i");
  probe.style.display = "none";
  probe.style.color = color;
  document.body.appendChild(probe);
  const [r = 0, g = 0, b = 0] = (getComputedStyle(probe).color.match(/[\d.]+/g) ?? []).map(Number);
  probe.remove();
  return [r / 255, g / 255, b / 255];
}

/** The Modus theme tokens, re-read whenever the mode or palette on <html> changes. */
function useTheme() {
  const [theme, setTheme] = useState<Theme | null>(null);
  useEffect(() => {
    const root = document.documentElement;
    const read = () => {
      const style = getComputedStyle(root);
      setTheme(
        Object.fromEntries(
          TOKENS.map((t) => [t, toRgb(`hsl(${style.getPropertyValue(`--${t}`).trim()})`)]),
        ) as Theme,
      );
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "data-palette", "style"],
    });
    return () => observer.disconnect();
  }, []);
  return theme;
}

const mix = (a: Rgb, b: Rgb, t: number): Rgb => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const glslFloat = (value: number, digits = 3) => {
  const fixed = Number(value).toFixed(digits);
  return fixed.includes(".") ? fixed : `${fixed}.0`;
};

const VERTEX = `
attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`;

function fragment(noiseScale: string, numBands: string) {
  return `
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_dpr;
uniform vec3 u_paper;
uniform vec3 u_ink;
uniform vec3 u_accent;
uniform vec3 u_grid;

vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1; i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5; vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox; m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g; g.x  = a0.x  * x0.x  + h.x  * x0.y; g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 st = gl_FragCoord.xy / u_resolution.xy;
  st.x *= u_resolution.x / u_resolution.y;

  // A survey grid of crosses rather than full rules.
  float gridSize = 64.0 * u_dpr;
  vec2 cell = abs(fract(gl_FragCoord.xy / gridSize + 0.5) - 0.5) * gridSize;
  float crossArm = 6.0 * u_dpr;
  float grid = (step(cell.x, 0.6 * u_dpr) * step(cell.y, crossArm)) +
    (step(cell.y, 0.6 * u_dpr) * step(cell.x, crossArm));
  grid = clamp(grid, 0.0, 1.0);

  float noiseScale = ${noiseScale};
  vec2 noisePos = st * noiseScale + vec2(u_time * 0.02, -u_time * 0.012);
  float n = snoise(noisePos) * 0.5 + 0.5;
  float numBands = ${numBands};
  float bandVal = n * numBands;
  float triangleWave = abs(fract(bandVal) - 0.5) * 2.0;

  // Every fifth contour is an index line: thicker and in the accent colour.
  float nearest = floor(bandVal + 0.5);
  bool isIndex = mod(nearest, 5.0) < 0.5;
  float width = isIndex ? 0.06 : 0.03;
  float contour = smoothstep(width, width * 0.25, triangleWave);

  vec3 color = mix(u_paper, u_grid, grid * 0.9);
  color = mix(color, isIndex ? u_accent : u_ink, contour * (isIndex ? 0.95 : 0.6));

  gl_FragColor = vec4(color, 1.0);
}
`;
}

export function ContourSheet({
  className,
  speed = 0.7,
  length = 0.8,
  density = 1.4,
  opacity = 1,
  hue = 0,
  saturation = 1,
  brightness = 1,
  backgroundColor,
  lineColor,
  accentColor,
}: ContourSheetProps) {
  const prefersReducedMotion = useReducedMotion();
  const theme = useTheme();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const speedRef = useRef(speed);
  speedRef.current = clamp(speed, 0, 3);

  const safeLength = clamp(length, 0.35, 2.5);
  const safeDensity = clamp(density, 0.25, 2.5);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
    });
    if (!host || !canvas || !gl || !theme) return;

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };
    const vs = compile(gl.VERTEX_SHADER, VERTEX);
    const fs = compile(
      gl.FRAGMENT_SHADER,
      fragment(glslFloat(1.4 * safeLength, 3), glslFloat(10 * safeDensity, 2)),
    );
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const timeLocation = gl.getUniformLocation(program, "u_time");
    const dprLocation = gl.getUniformLocation(program, "u_dpr");
    const paper = backgroundColor ? toRgb(backgroundColor) : theme.background;
    gl.uniform3fv(gl.getUniformLocation(program, "u_paper"), paper);
    gl.uniform3fv(
      gl.getUniformLocation(program, "u_ink"),
      lineColor ? toRgb(lineColor) : theme.foreground,
    );
    gl.uniform3fv(
      gl.getUniformLocation(program, "u_accent"),
      accentColor ? toRgb(accentColor) : theme.primary,
    );
    gl.uniform3fv(
      gl.getUniformLocation(program, "u_grid"),
      mix(paper, theme["muted-foreground"], 0.55),
    );

    let time = 0;
    const draw = () => {
      gl.uniform1f(timeLocation, time);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(dprLocation, dpr);
      draw();
    };

    let raf = 0;
    let last = 0;
    let inView = true;
    const loop = (now: number) => {
      if (last) time += ((now - last) / 1000) * speedRef.current;
      last = now;
      draw();
      raf = requestAnimationFrame(loop);
    };
    const sync = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
      if (prefersReducedMotion) draw();
      else if (inView && !document.hidden) raf = requestAnimationFrame(loop);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    });
    io.observe(host);
    document.addEventListener("visibilitychange", sync);
    sync();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [
    theme,
    backgroundColor,
    lineColor,
    accentColor,
    safeLength,
    safeDensity,
    prefersReducedMotion,
  ]);

  const filter =
    hue === 0 && saturation === 1 && brightness === 1
      ? undefined
      : `hue-rotate(${clamp(hue, -180, 180)}deg) saturate(${clamp(saturation, 0, 2)}) brightness(${clamp(brightness, 0.35, 1.65)})`;

  return (
    <div
      ref={hostRef}
      className={cn("absolute inset-0 overflow-hidden", className)}
      style={{
        background: backgroundColor ?? "hsl(var(--background))",
        filter,
      }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 block h-full w-full"
        style={{ opacity: clamp(opacity, 0.05, 1) }}
      />
    </div>
  );
}
