"use client";

// Ported from ThreeUI Community's Stream Convergence (MIT, © 2026 Meng To).

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ConfluenceLinesProps {
  speed?: number;
  fidelity?: number;
  scale?: number;
  brightness?: number;
  opacity?: number;
  hue?: number;
  saturation?: number;
  /** Defaults to the theme background. */
  backgroundColor?: string;
  /** One CSS colour per stream. Defaults to the theme primary, foreground and muted foreground. */
  colors?: string[];
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

// Per-band ink strength: the middle stream is the boldest.
const BAND_GAIN = [0.75, 1, 0.55];

const VERTEX_SHADER = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = /* glsl */ `
precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform float u_interactive_fidelity;
uniform vec3 u_band0;
uniform vec3 u_band1;
uniform vec3 u_band2;
uniform vec3 u_background;
varying vec2 vUv;

mat2 rotate2d(float _angle){
  return mat2(cos(_angle),-sin(_angle),
              sin(_angle),cos(_angle));
}

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  p.x *= u_resolution.x / u_resolution.y;
  p = rotate2d(-0.32) * p;

  vec3 color = u_background;
  float spread = 0.09 * (0.3 + u_interactive_fidelity * 0.7);
  float fade = exp(-length(vUv * 2.0 - 1.0) * 0.9);

  // Streams are inked onto the paper one over the other, so they hold on light and dark grounds.
  for(int i = 0; i < 3; i++) {
    float offset = float(1 - i) * spread;
    float y = p.y + offset + (sin(p.x * 1.8 - u_time * 1.2) * 0.18);
    float line = sin(y * 4.5 + u_time * 1.6) * 0.5 + 0.5;
    float wave = smoothstep(0.9, 0.995, line) + smoothstep(0.7, 0.995, line) * 0.18;
    vec3 ink = i == 0 ? u_band0 : (i == 1 ? u_band1 : u_band2);
    float gain = i == 0 ? ${BAND_GAIN[0].toFixed(2)} : (i == 1 ? ${BAND_GAIN[1].toFixed(2)} : ${BAND_GAIN[2].toFixed(2)});
    color = mix(color, ink, clamp(wave * gain * fade, 0.0, 1.0));
  }

  gl_FragColor = vec4(color, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create Confluence Lines shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) ?? "Confluence Lines shader compilation failed");
  }
  return shader;
}

export function ConfluenceLines({
  speed = 1,
  fidelity = 0.5,
  scale = 1,
  brightness = 1,
  opacity = 1,
  hue = 0,
  saturation = 1,
  backgroundColor,
  colors,
  className,
}: ConfluenceLinesProps) {
  const theme = useTheme();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const optionsRef = useRef({ speed, fidelity, inks: [] as Rgb[], ground: [0, 0, 0] as Rgb });
  const colorKey = colors?.join(",");
  useEffect(() => {
    if (!theme) return;
    optionsRef.current.ground = backgroundColor ? toRgb(backgroundColor) : theme.background;
    optionsRef.current.inks = colorKey
      ? colorKey.split(",").map(toRgb)
      : [theme.primary, theme.foreground, theme["muted-foreground"]];
  }, [theme, backgroundColor, colorKey]);
  optionsRef.current.speed = speed;
  optionsRef.current.fidelity = fidelity;

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas || !theme) return;
    const gl = canvas.getContext("webgl", { alpha: true, antialias: false });
    if (!gl) return;

    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) ?? "Confluence Lines program link failed");
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, "u_time");
    const uResolution = gl.getUniformLocation(program, "u_resolution");
    const uFidelity = gl.getUniformLocation(program, "u_interactive_fidelity");
    const uBands = ["u_band0", "u_band1", "u_band2"].map((name) =>
      gl.getUniformLocation(program, name),
    );
    const uBackground = gl.getUniformLocation(program, "u_background");
    let frame = 0;
    let visible = true;

    const draw = (now: number) => {
      const options = optionsRef.current;
      gl.uniform1f(uTime, now * 0.0003 * options.speed);
      gl.uniform1f(uFidelity, options.fidelity);
      uBands.forEach((location, index) => {
        gl.uniform3fv(location, options.inks[index] ?? options.inks[0] ?? options.ground);
      });
      gl.uniform3fv(uBackground, options.ground);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    const render = (now: number) => {
      draw(now);
      frame = visible && !document.hidden ? requestAnimationFrame(render) : 0;
    };

    const resize = () => {
      const bounds = host.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(bounds.width * dpr));
      canvas.height = Math.max(1, Math.round(bounds.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      if (prefersReducedMotion) draw(8000);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    let intersection: IntersectionObserver | undefined;
    if (!prefersReducedMotion) {
      intersection = new IntersectionObserver(([entry]) => {
        visible = entry?.isIntersecting ?? true;
        if (visible && !frame) frame = requestAnimationFrame(render);
        if (!visible && frame) {
          cancelAnimationFrame(frame);
          frame = 0;
        }
      });
      intersection.observe(host);
      frame = requestAnimationFrame(render);
    }

    return () => {
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersection?.disconnect();
      gl.deleteBuffer(buffer);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      gl.deleteProgram(program);
    };
  }, [prefersReducedMotion, theme]);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 isolate overflow-hidden", className)}
      style={{ background: backgroundColor ?? "hsl(var(--background))" }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full"
        style={{
          opacity,
          filter: `hue-rotate(${hue}deg) saturate(${saturation}) brightness(${brightness})`,
          transform: `scale(${scale})`,
        }}
      />
    </div>
  );
}
