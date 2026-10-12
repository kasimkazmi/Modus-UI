"use client";

// Ported from ThreeUI Community's Stream Convergence (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StreamConvergenceProps {
  speed?: number;
  fidelity?: number;
  scale?: number;
  brightness?: number;
  opacity?: number;
  hue?: number;
  saturation?: number;
  backgroundColor?: string;
  colors?: string[];
  className?: string;
}

// One colour per stream; the original adds pure red, green and blue bands.
const DEFAULT_COLORS = ["#ff0000", "#00ff00", "#0000ff"];
// Per-band gain from the original violet-indigo mix.
const BAND_GAIN = [1.2, 0.5, 1.8];

const VERTEX_SHADER = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform float u_interactive_fidelity;
uniform vec3 u_band0;
uniform vec3 u_band1;
uniform vec3 u_band2;
varying vec2 vUv;

mat2 rotate2d(float _angle){
  return mat2(cos(_angle),-sin(_angle),
              sin(_angle),cos(_angle));
}

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  p.x *= u_resolution.x / u_resolution.y;
  p = rotate2d(0.55) * p;

  vec3 color = vec3(0.0);
  float spread = 0.06 * (0.3 + u_interactive_fidelity * 0.7);

  for(int i = 0; i < 3; i++) {
    float offset = float(1 - i) * spread;
    float y = p.y + offset + (sin(p.x * 2.5 - u_time * 1.5) * 0.12);
    float wave = smoothstep(0.85, 0.99, sin(y * 6.0 + u_time * 2.0) * 0.5 + 0.5);

    // Modulating color mixing logic for the violet-indigo theme
    if(i == 0) color += wave * u_band0;
    if(i == 1) color += wave * u_band1;
    if(i == 2) color += wave * u_band2;
  }

  float vignette = exp(-length(vUv * 2.0 - 1.0) * 0.8);
  color *= vignette;

  gl_FragColor = vec4(color, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create Stream Convergence shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) ?? "Stream Convergence shader compilation failed");
  }
  return shader;
}

function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.replace("#", ""), 16);
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}

export function StreamConvergence({
  speed = 1,
  fidelity = 0.5,
  scale = 1,
  brightness = 1,
  opacity = 1,
  hue = 0,
  saturation = 1,
  backgroundColor = "#030304",
  colors = DEFAULT_COLORS,
  className,
}: StreamConvergenceProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const optionsRef = useRef({ speed, fidelity, colors });
  optionsRef.current = { speed, fidelity, colors };

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
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
      throw new Error(gl.getProgramInfoLog(program) ?? "Stream Convergence program link failed");
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
    let frame = 0;
    let visible = true;

    const draw = (now: number) => {
      const options = optionsRef.current;
      gl.uniform1f(uTime, now * 0.0003 * options.speed);
      gl.uniform1f(uFidelity, options.fidelity);
      uBands.forEach((location, index) => {
        const [r, g, b] = hexToRgb(options.colors[index] ?? DEFAULT_COLORS[index]);
        const gain = BAND_GAIN[index];
        gl.uniform3f(location, r * gain, g * gain, b * gain);
      });
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
  }, [prefersReducedMotion]);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 isolate overflow-hidden", className)}
      style={{ background: backgroundColor }}
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
