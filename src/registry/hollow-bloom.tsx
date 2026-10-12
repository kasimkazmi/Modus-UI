"use client";
// Ported from ThreeUI Community's Void Field (MIT, © 2026 Meng To).

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface HollowBloomProps {
  speed?: number;
  hue?: number;
  saturation?: number;
  brightness?: number;
  /** Colour of the blooming marks. Defaults to the theme primary. */
  color?: string;
  /** Defaults to the theme background. */
  backgroundColor?: string;
  className?: string;
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

const VERTEX_SHADER = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec2 uMouse;
uniform vec3 uTint;
uniform vec3 uInk;
uniform vec3 uPaper;

vec2 barrel(vec2 uv, float amt) {
  vec2 cc = uv - 0.5;
  float r = dot(cc, cc);
  return uv + cc * r * amt;
}

float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898,78.233))) * 43758.5453);
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;

  // Parallax drift based on uMouse
  vec2 mouseOffset = (uMouse - 0.5) * 0.05;
  uv += mouseOffset;

  // Barrel distortion curvature
  uv = barrel(uv, 0.2);

  // Outside the lens is plain paper.
  if(uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor = vec4(uPaper, 1.0);
    return;
  }

  // Coarser grid of diamond marks
  vec2 gridCount = vec2(64.0, 64.0 * (iResolution.y / iResolution.x));
  vec2 gridUv = fract(uv * gridCount) - 0.5;
  vec2 id = floor(uv * gridCount);

  vec2 cc = (id + 0.5) / gridCount - 0.5;
  cc.y *= iResolution.y / iResolution.x;
  float dist = length(cc);

  // Rings bloom inward, from the rim toward a hollow centre
  float pulse = sin(iTime * 1.2 + dist * 14.0) * 0.5 + 0.5;
  float hollow = smoothstep(0.04, 0.16, dist);

  float size = 0.42 * pulse * hollow;
  float d = abs(gridUv.x) + abs(gridUv.y);
  float mark = smoothstep(size, size - 0.06, d);

  float flicker = rand(vec2(floor(iTime * 4.0), id.y)) > 0.985 ? 0.35 : 1.0;
  float fade = smoothstep(0.75, 0.15, dist);

  // Inner rings ink in the accent; the outer ones settle into the foreground.
  vec3 ink = mix(uTint, uInk, smoothstep(0.15, 0.55, dist));
  vec3 col = mix(uPaper, ink, clamp(mark * flicker * fade, 0.0, 1.0));

  gl_FragColor = vec4(col, 1.0);
}
`;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

export function HollowBloom({
  speed = 0.8,
  hue = 0,
  saturation = 1,
  brightness = 1,
  color,
  backgroundColor,
  className,
}: HollowBloomProps) {
  const prefersReducedMotion = useReducedMotion();
  const theme = useTheme();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const options = useRef({ speed });
  options.current = { speed };

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl", { alpha: true, antialias: false });
    if (!host || !canvas || !gl || !theme) return;

    const vertexShader = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragmentShader = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]),
      gl.STATIC_DRAW,
    );
    const positionLocation = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const iResLoc = gl.getUniformLocation(program, "iResolution");
    const iTimeLoc = gl.getUniformLocation(program, "iTime");
    const uMouseLoc = gl.getUniformLocation(program, "uMouse");
    gl.uniform3fv(gl.getUniformLocation(program, "uTint"), color ? toRgb(color) : theme.primary);
    gl.uniform3fv(gl.getUniformLocation(program, "uInk"), theme.foreground);
    gl.uniform3fv(
      gl.getUniformLocation(program, "uPaper"),
      backgroundColor ? toRgb(backgroundColor) : theme.background,
    );

    // Interactive pointer drift tracking
    let mouseX = 0.5;
    let mouseY = 0.5;
    let elapsed = 0;
    let last = performance.now();
    let frame = 0;
    let visible = true;

    const draw = () => {
      gl.uniform2f(iResLoc, canvas.width, canvas.height);
      gl.uniform1f(iTimeLoc, elapsed);
      gl.uniform2f(uMouseLoc, mouseX, mouseY);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    const tick = (now: number) => {
      elapsed += ((now - last) / 1000) * clamp(options.current.speed, 0, 3);
      last = now;
      draw();
      frame = visible && !document.hidden ? requestAnimationFrame(tick) : 0;
    };
    const start = () => {
      if (prefersReducedMotion || !visible || document.hidden || frame) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };
    const resize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
      draw();
    };
    const onPointerMove = (event: PointerEvent) => {
      const bounds = host.getBoundingClientRect();
      mouseX = (event.clientX - bounds.left) / Math.max(1, bounds.width);
      mouseY = 1.0 - (event.clientY - bounds.top) / Math.max(1, bounds.height);
      if (prefersReducedMotion) draw();
    };

    const resizeObserver = new ResizeObserver(resize);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      if (visible) start();
      else if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    });
    const onVisibility = () => !document.hidden && start();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    resizeObserver.observe(host);
    intersection.observe(host);
    if (prefersReducedMotion) elapsed = 1.2;
    resize();
    start();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointerMove);
      gl.deleteBuffer(buffer);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteProgram(program);
    };
  }, [prefersReducedMotion, theme, color, backgroundColor]);

  const filter =
    hue === 0 && saturation === 1 && brightness === 1
      ? undefined
      : `hue-rotate(${clamp(hue, -180, 180)}deg) saturate(${clamp(saturation, 0, 2)}) brightness(${clamp(brightness, 0.35, 1.65)})`;

  return (
    <div
      ref={hostRef}
      className={cn("absolute inset-0 isolate overflow-hidden", className)}
      style={{ background: backgroundColor ?? "hsl(var(--background))", filter }}
    >
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block h-full w-full" />
    </div>
  );
}
