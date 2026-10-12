"use client";

// Ported from ThreeUI Community's Ribbon Field (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface SilkBandsProps {
  speed?: number;
  pointerAmount?: number;
  smoothing?: number;
  brightness?: number;
  opacity?: number;
  hue?: number;
  saturation?: number;
  backgroundColor?: string;
  colors?: string[];
  className?: string;
}

const readToken = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/** A theme token with its lightness shifted, for building a ramp from one hue. */
function shade(name: string, shift: number) {
  const [h = "0", sat = "0%", l = "50%"] = readToken(name).split(/\s+/);
  return `hsl(${h} ${sat} ${Math.min(96, Math.max(4, Number.parseFloat(l) + shift))}%)`;
}

/** The six band colours, ramped from the theme's primary, foreground and muted ink. */
const themeColors = () => [
  shade("--primary", 0),
  shade("--foreground", 0),
  shade("--muted-foreground", 0),
  shade("--primary", 18),
  shade("--primary", -12),
  shade("--primary", 30),
];
const COLOR_UNIFORMS = ["teal", "cyan", "indigo", "purple", "blue", "bloomColor"];

const VERTEX_SHADER = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;
uniform vec2 resolution;
uniform float time;
uniform vec2 pointer;
uniform vec3 teal;
uniform vec3 cyan;
uniform vec3 indigo;
uniform vec3 purple;
uniform vec3 blue;
uniform vec3 bloomColor;
uniform vec3 base;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float ribbon(vec2 uv, float offset, float width, float phase) {
  float y = 0.48 + 0.16 * sin((uv.x * 1.6) + phase) + 0.045 * sin((uv.x * 7.0) - phase * 0.7);
  float d = abs(uv.y - y - offset);
  return exp(-(d * d) / width);
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec2 p = uv;
  p.x *= resolution.x / resolution.y;

  float t = time * 0.22;
  float drift = (pointer.x - 0.5) * 0.06;

  float rightFade = 1.0 - smoothstep(0.30, 0.78, uv.x);
  float centerDark = 1.0 - smoothstep(0.0, 0.88, distance(uv, vec2(0.86, 0.52)));

  float r1 = ribbon(vec2(uv.x + drift, uv.y), 0.03, 0.0065, t + 0.9);
  float r2 = ribbon(vec2(uv.x - drift * 0.7, uv.y), -0.23, 0.0085, t + 3.25);
  float r3 = ribbon(vec2(uv.x + drift * 0.4, uv.y), 0.25, 0.014, t + 1.85);

  float glow = r1 * 1.14 + r2 * 1.05 + r3 * 0.48;

  vec3 col = vec3(0.0);
  col += cyan * r1 * 0.92;
  col += teal * r1 * 0.62;
  col += indigo * r3 * 0.42;
  col += blue * r2 * 0.66;
  col += purple * (r2 + r3) * 0.30;

  float bloom = exp(-pow(distance(uv, vec2(0.26, 0.58 + 0.035 * sin(t))), 2.0) / 0.050);
  bloom += exp(-pow(distance(uv, vec2(0.32, 0.24 + 0.025 * cos(t))), 2.0) / 0.030);
  col += bloomColor * bloom * 0.34;

  vec2 grid = fract(gl_FragCoord.xy / 10.0) - 0.5;
  float dotShape = smoothstep(0.29, 0.11, length(grid));
  float noise = hash(floor(gl_FragCoord.xy / 10.0));
  float scan = 0.72 + 0.28 * sin((uv.x + uv.y) * 38.0 + time * 1.3);
  float dots = dotShape * (0.48 + 0.52 * noise) * scan;

  float micro = hash(gl_FragCoord.xy + time) * 0.035;
  float alpha = clamp((glow * 1.55 + bloom * 0.50) * dots * rightFade, 0.0, 1.0);
  alpha *= 1.0 - centerDark * 0.56;

  vec3 finalColor = mix(base, col, clamp(alpha * 1.55, 0.0, 1.0));
  finalColor += micro * rightFade;

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create Silk Bands shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) ?? "Silk Bands shader compilation failed");
  }
  return shader;
}

let probe: CanvasRenderingContext2D | null = null;
/** Resolves any CSS colour string to 0–1 RGB through a 1×1 canvas. */
function toRgb(color: string): [number, number, number] {
  probe ??= document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!probe) return [0, 0, 0];
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = color;
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
  return [r / 255, g / 255, b / 255];
}

export function SilkBands({
  speed = 1,
  pointerAmount = 1,
  smoothing = 0.035,
  brightness = 1,
  opacity = 1,
  hue = 0,
  saturation = 1,
  backgroundColor,
  colors,
  className,
}: SilkBandsProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const optionsRef = useRef({ speed, pointerAmount, smoothing, backgroundColor, colors });
  optionsRef.current = { speed, pointerAmount, smoothing, backgroundColor, colors };

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
    });
    if (!gl) return;

    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) ?? "Silk Bands program link failed");
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

    const resolution = gl.getUniformLocation(program, "resolution");
    const time = gl.getUniformLocation(program, "time");
    const pointerUniform = gl.getUniformLocation(program, "pointer");
    const baseUniform = gl.getUniformLocation(program, "base");
    const colorUniforms = COLOR_UNIFORMS.map((name) => gl.getUniformLocation(program, name));
    let base: [number, number, number] = [0, 0, 0];
    let palette: [number, number, number][] = [];
    const readTheme = () => {
      const options = optionsRef.current;
      base = toRgb(options.backgroundColor ?? `hsl(${readToken("--background")})`);
      const fallback = themeColors();
      palette = fallback.map((color, index) => toRgb(options.colors?.[index] ?? color));
    };
    readTheme();
    let mouseX = 0.72;
    let mouseY = 0.42;
    let targetX = 0.72;
    let targetY = 0.42;
    let frame = 0;
    let visible = true;
    const startedAt = performance.now();

    const draw = (elapsed: number) => {
      const options = optionsRef.current;
      mouseX += (targetX - mouseX) * options.smoothing;
      mouseY += (targetY - mouseY) * options.smoothing;
      gl.uniform1f(time, elapsed * options.speed);
      gl.uniform2f(pointerUniform, mouseX, mouseY);
      gl.uniform3f(baseUniform, ...base);
      colorUniforms.forEach((location, index) => gl.uniform3f(location, ...palette[index]));
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    const render = (now: number) => {
      draw((now - startedAt) * 0.001);
      frame = visible && !document.hidden ? requestAnimationFrame(render) : 0;
    };

    const pointer = (event: PointerEvent) => {
      const bounds = host.getBoundingClientRect();
      if (
        event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom
      ) {
        return;
      }
      const amount = optionsRef.current.pointerAmount;
      targetX = 0.72 + ((event.clientX - bounds.left) / Math.max(bounds.width, 1) - 0.72) * amount;
      targetY =
        0.42 + (1 - (event.clientY - bounds.top) / Math.max(bounds.height, 1) - 0.42) * amount;
    };

    const resize = () => {
      const bounds = host.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(bounds.width * ratio));
      canvas.height = Math.max(1, Math.floor(bounds.height * ratio));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(resolution, canvas.width, canvas.height);
      if (prefersReducedMotion) draw(4);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();
    const themeObserver = new MutationObserver(() => {
      readTheme();
      if (prefersReducedMotion) draw(4);
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme", "data-palette"],
    });

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
      window.addEventListener("pointermove", pointer, { passive: true });
      frame = requestAnimationFrame(render);
    }

    return () => {
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      intersection?.disconnect();
      window.removeEventListener("pointermove", pointer);
      gl.deleteBuffer(buffer);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      gl.deleteProgram(program);
    };
  }, [prefersReducedMotion, backgroundColor, colors]);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className={cn("absolute inset-0 isolate overflow-hidden", className)}
      style={{ background: backgroundColor ?? "hsl(var(--background))" }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full"
        style={{
          opacity,
          filter: `hue-rotate(${hue}deg) saturate(${saturation}) brightness(${brightness})`,
        }}
      />
    </div>
  );
}
