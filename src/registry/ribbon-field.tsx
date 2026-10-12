"use client";

// Ported from ThreeUI Community's Ribbon Field (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface RibbonFieldProps {
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

// teal, cyan, indigo, purple, blue, bloom — the original ribbon palette.
const DEFAULT_COLORS = ["#2bd4bf", "#38d1f5", "#6361eb", "#a854fa", "#3b82f5", "#6bd9ff"];
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
  float y = 0.55 + 0.20 * sin((uv.x * 2.15) + phase) + 0.045 * sin((uv.x * 7.0) - phase * 0.7);
  float d = abs(uv.y - y - offset);
  return exp(-(d * d) / width);
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec2 p = uv;
  p.x *= resolution.x / resolution.y;

  float t = time * 0.22;
  float drift = (pointer.x - 0.5) * 0.06;

  float rightFade = smoothstep(0.28, 0.72, uv.x);
  float centerDark = 1.0 - smoothstep(0.0, 0.88, distance(uv, vec2(0.18, 0.48)));

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

  float bloom = exp(-pow(distance(uv, vec2(0.76, 0.40 + 0.035 * sin(t))), 2.0) / 0.050);
  bloom += exp(-pow(distance(uv, vec2(0.71, 0.75 + 0.025 * cos(t))), 2.0) / 0.030);
  col += bloomColor * bloom * 0.34;

  vec2 grid = fract(gl_FragCoord.xy / 7.0) - 0.5;
  float dotShape = smoothstep(0.29, 0.11, length(grid));
  float noise = hash(floor(gl_FragCoord.xy / 7.0));
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
  if (!shader) throw new Error("Unable to create Ribbon Field shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) ?? "Ribbon Field shader compilation failed");
  }
  return shader;
}

function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.replace("#", ""), 16);
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}

export function RibbonField({
  speed = 1,
  pointerAmount = 1,
  smoothing = 0.035,
  brightness = 1,
  opacity = 1,
  hue = 0,
  saturation = 1,
  backgroundColor = "#010101",
  colors = DEFAULT_COLORS,
  className,
}: RibbonFieldProps) {
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
      throw new Error(gl.getProgramInfoLog(program) ?? "Ribbon Field program link failed");
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
      gl.uniform3f(baseUniform, ...hexToRgb(options.backgroundColor));
      colorUniforms.forEach((location, index) => {
        gl.uniform3f(location, ...hexToRgb(options.colors[index] ?? DEFAULT_COLORS[index]));
      });
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
      intersection?.disconnect();
      window.removeEventListener("pointermove", pointer);
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
      className={cn("absolute inset-0 isolate overflow-hidden", className)}
      style={{ background: backgroundColor }}
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
