"use client";
// Ported from ThreeUI Community's Void Field (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface VoidFieldProps {
  speed?: number;
  hue?: number;
  saturation?: number;
  brightness?: number;
  color?: string;
  backgroundColor?: string;
  className?: string;
}

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

  // Clamp edges
  if(uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  // Dot matrix resolution
  vec2 gridCount = vec2(100.0, 100.0 * (iResolution.y / iResolution.x));
  vec2 gridUv = fract(uv * gridCount);
  vec2 id = floor(uv * gridCount);

  // Radial symmetry distance
  vec2 cc = id / gridCount - 0.5;
  float dist = length(cc);

  // Slow breathing pulse
  float pulse = sin(iTime * 1.5 - dist * 10.0) * 0.5 + 0.5;

  // Dot formulation
  float dotSize = 0.35 * pulse;
  float d = length(gridUv - 0.5);
  float circle = smoothstep(dotSize, dotSize - 0.05, d);

  // Digital scanlines
  float scanline = sin(uv.y * 800.0) * 0.03;

  // Randomized flicker
  float flicker = rand(vec2(iTime, id.y)) > 0.98 ? 0.4 : 1.0;

  // Base color compilation (tinted monotone)
  vec3 col = vec3(circle * pulse * flicker);
  col -= scanline;
  col *= uTint;

  // Vignette edge masking
  col *= smoothstep(0.8, 0.2, dist);

  gl_FragColor = vec4(col, 1.0);
}
`;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function hexToVec3(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? value.replace(/./g, "$&$&") : value;
  const n = parseInt(full, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

export function VoidField({
  speed = 1,
  hue = 0,
  saturation = 1,
  brightness = 1,
  color = "#b34dff",
  backgroundColor = "#030305",
  className,
}: VoidFieldProps) {
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const options = useRef({ speed, color });
  options.current = { speed, color };

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl", { alpha: true, antialias: false });
    if (!host || !canvas || !gl) return;

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
    const uTintLoc = gl.getUniformLocation(program, "uTint");

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
      gl.uniform3fv(uTintLoc, hexToVec3(options.current.color));
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
  }, [prefersReducedMotion]);

  const filter =
    hue === 0 && saturation === 1 && brightness === 1
      ? undefined
      : `hue-rotate(${clamp(hue, -180, 180)}deg) saturate(${clamp(saturation, 0, 2)}) brightness(${clamp(brightness, 0.35, 1.65)})`;

  return (
    <div
      ref={hostRef}
      className={cn("absolute inset-0 isolate overflow-hidden", className)}
      style={{ background: backgroundColor, filter }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 block h-full w-full mix-blend-screen"
      />
    </div>
  );
}
