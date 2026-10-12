"use client";

// Ported from ThreeUI Community's Bell Field (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BellFieldProps {
  speed?: number;
  pointerAmount?: number;
  strikeDuration?: number;
  emberAmount?: number;
  brightness?: number;
  opacity?: number;
  hue?: number;
  saturation?: number;
  backgroundColor?: string;
  colors?: string[];
  emberColors?: string[];
  className?: string;
}

const DEFAULT_COLORS = ["#080e0d", "#4e9b8a", "#d89b3f", "#efe9dc"];
const DEFAULT_EMBER_COLORS = ["#e7c165", "#8fcbb9"];
const EMBER_COUNT = 58;

const VERTEX_SHADER = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

const FRAGMENT_SHADER = `
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_strike;
uniform vec3 u_deep;
uniform vec3 u_patina;
uniform vec3 u_bronze;
uniform vec3 u_ash;

#define PI 3.14159265359

float hash(vec2 p) { return fract(sin(dot(p, vec2(23.71, 91.37))) * 41537.1234); }

// damped-cosine stand-in for the Bessel envelope of a circular mode
float bess(float x) { return cos(x - 0.785398) / sqrt(1.0 + abs(x)); }

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 p = uv * 2.0 - 1.0;
  p.x *= u_resolution.x / u_resolution.y;
  p.y += 0.08;

  vec2 m = u_mouse / u_resolution.xy * 2.0 - 1.0;
  m.y = -m.y;
  m.x *= u_resolution.x / u_resolution.y;
  p -= m * 0.11;

  float t = u_time * 0.09;
  float r = length(p);
  float a = atan(p.y, p.x);

  // the bell drifts between partials the way a struck bell does
  float ang = 3.0 + 1.6 * sin(t * 0.37) + sin(t * 0.19 + 1.7);
  float k   = 3.1 + 1.0 * sin(t * 0.23 + 0.6);

  float amp = 1.0 + (1.0 - u_strike) * 0.55;
  float f1 = bess(r * k * PI - t * 2.2) * cos(ang * a + t * 0.5);
  float f2 = bess(r * k * 1.6 * PI + t * 1.4) * cos((ang * 2.0 + 1.0) * a - t * 0.31);
  float f = (f1 + f2 * 0.30) * amp;

  // nodal lines — where the metal stands still
  float node = 1.0 - smoothstep(0.0, 0.075 + 0.075 * r, abs(f));
  // antinodes — where it moves, and glows hot
  float anti = smoothstep(0.40, 0.95, abs(f));

  // the crown stays quiet — clears a reading zone under the type
  float open = smoothstep(0.14, 0.92, r);
  node *= open;
  anti *= open;

  vec3 col = u_deep;
  col = mix(col, u_patina, node * 0.50);
  col = mix(col, u_bronze, anti * 0.22);
  col += u_ash * pow(node, 3.0) * 0.13;

  // shock ring travelling out from the strike
  float ring = smoothstep(0.06, 0.0, abs(r - u_strike * 2.3)) * (1.0 - u_strike);
  col += mix(u_bronze, u_ash, 0.4) * ring * 0.7;

  col *= mix(0.10, 1.0, smoothstep(2.0, 0.28, r));
  col += (hash(gl_FragCoord.xy) - 0.5) * 0.022;

  gl_FragColor = vec4(col, 1.0);
}
`;

type Ember = {
  x: number;
  y: number;
  r: number;
  vy: number;
  vx: number;
  ph: number;
  sp: number;
  hot: boolean;
};

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create Bell Field shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) ?? "Bell Field shader compilation failed");
  }
  return shader;
}

function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.replace("#", ""), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export function BellField({
  speed = 1,
  pointerAmount = 1,
  strikeDuration = 2400,
  emberAmount = 1,
  brightness = 1,
  opacity = 1,
  hue = 0,
  saturation = 1,
  backgroundColor = "#08100f",
  colors = DEFAULT_COLORS,
  emberColors = DEFAULT_EMBER_COLORS,
  className,
}: BellFieldProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef<HTMLCanvasElement>(null);
  const emberRef = useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const optionsRef = useRef({
    speed,
    pointerAmount,
    strikeDuration,
    emberAmount,
    colors,
    emberColors,
  });
  optionsRef.current = { speed, pointerAmount, strikeDuration, emberAmount, colors, emberColors };

  useEffect(() => {
    const host = hostRef.current;
    const canvas = modeRef.current;
    const emberCanvas = emberRef.current;
    if (!host || !canvas || !emberCanvas) return;
    const gl = canvas.getContext("webgl");
    const emberContext = emberCanvas.getContext("2d");
    if (!gl || !emberContext) return;

    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) ?? "Bell Field program link failed");
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1]),
      gl.STATIC_DRAW,
    );
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const resolution = gl.getUniformLocation(program, "u_resolution");
    const time = gl.getUniformLocation(program, "u_time");
    const mouseUniform = gl.getUniformLocation(program, "u_mouse");
    const strikeUniform = gl.getUniformLocation(program, "u_strike");
    const colorUniforms = ["u_deep", "u_patina", "u_bronze", "u_ash"].map((name) =>
      gl.getUniformLocation(program, name),
    );

    let width = 1;
    let height = 1;
    let dpr = 1;
    let mouseX = 0.5;
    let mouseY = 0.5;
    let targetX = 0.5;
    let targetY = 0.5;
    let frame = 0;
    let visible = true;
    let initialized = false;
    let lastStrikeMs = -1e9;
    const startedAt = performance.now();

    const embers: Ember[] = Array.from({ length: EMBER_COUNT }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.4 + Math.random() * 1.4,
      vy: -(0.1 + Math.random() * 0.26),
      vx: (Math.random() - 0.5) * 0.08,
      ph: Math.random() * Math.PI * 2,
      sp: 0.5 + Math.random() * 1.4,
      hot: Math.random() < 0.36,
    }));

    const draw = (now: number) => {
      const options = optionsRef.current;
      const t = now * 0.001 * options.speed;
      mouseX += (targetX - mouseX) * 0.04;
      mouseY += (targetY - mouseY) * 0.04;
      gl.uniform1f(time, (now - startedAt) * 0.001 * options.speed);
      gl.uniform1f(
        strikeUniform,
        Math.min(1, Math.max(0, (now - lastStrikeMs) / options.strikeDuration)),
      );
      gl.uniform2f(mouseUniform, mouseX * dpr, mouseY * dpr);
      colorUniforms.forEach((location, index) => {
        const [r, g, b] = hexToRgb(options.colors[index] ?? DEFAULT_COLORS[index]);
        gl.uniform3f(location, r / 255, g / 255, b / 255);
      });
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      const hot = hexToRgb(options.emberColors[0] ?? DEFAULT_EMBER_COLORS[0]).join(", ");
      const cool = hexToRgb(options.emberColors[1] ?? DEFAULT_EMBER_COLORS[1]).join(", ");
      emberContext.clearRect(0, 0, width, height);
      const count = Math.max(
        0,
        Math.min(EMBER_COUNT, Math.round(EMBER_COUNT * options.emberAmount)),
      );
      for (let index = 0; index < count; index += 1) {
        const ember = embers[index];
        if (!prefersReducedMotion) {
          ember.y += ember.vy * options.speed;
          ember.x += (ember.vx + Math.sin(t * ember.sp * 0.5 + ember.ph) * 0.13) * options.speed;
        }
        if (ember.y < -4) {
          ember.y = height + 4;
          ember.x = Math.random() * width;
        }
        if (ember.x < -4) ember.x = width + 4;
        if (ember.x > width + 4) ember.x = -4;
        const twinkle = 0.5 + 0.5 * Math.sin(t * ember.sp + ember.ph);
        emberContext.beginPath();
        emberContext.arc(ember.x, ember.y, ember.r, 0, Math.PI * 2);
        emberContext.fillStyle = ember.hot
          ? `rgba(${hot}, ${0.06 + twinkle * 0.34})`
          : `rgba(${cool}, ${0.04 + twinkle * 0.24})`;
        emberContext.fill();
      }
    };

    const render = (now: number) => {
      draw(now);
      frame = visible && !document.hidden ? requestAnimationFrame(render) : 0;
    };

    const resize = () => {
      const bounds = host.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      emberCanvas.width = canvas.width;
      emberCanvas.height = canvas.height;
      emberContext.setTransform(dpr, 0, 0, dpr, 0, 0);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(resolution, canvas.width, canvas.height);
      if (!initialized) {
        mouseX = targetX = width * 0.5;
        mouseY = targetY = height * 0.5;
        initialized = true;
      }
      embers.forEach((ember) => {
        if (ember.x <= 1) ember.x *= width;
        if (ember.y <= 1) ember.y *= height;
      });
      if (prefersReducedMotion) draw(startedAt + 14000 / Math.max(speed, 0.001));
    };

    const inside = (event: PointerEvent) => {
      const bounds = host.getBoundingClientRect();
      return (
        event.clientX >= bounds.left &&
        event.clientX <= bounds.right &&
        event.clientY >= bounds.top &&
        event.clientY <= bounds.bottom
      );
    };
    const pointer = (event: PointerEvent) => {
      if (!inside(event)) return;
      const bounds = host.getBoundingClientRect();
      const amount = optionsRef.current.pointerAmount;
      targetX = width * 0.5 + (event.clientX - bounds.left - width * 0.5) * amount;
      targetY = height * 0.5 + (event.clientY - bounds.top - height * 0.5) * amount;
    };
    const strike = () => {
      lastStrikeMs = performance.now();
    };
    const pointerDown = (event: PointerEvent) => {
      if (inside(event)) strike();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    if (prefersReducedMotion) {
      return () => {
        resizeObserver.disconnect();
        gl.deleteBuffer(buffer);
        gl.deleteShader(vertex);
        gl.deleteShader(fragment);
        gl.deleteProgram(program);
      };
    }

    const firstStrike = window.setTimeout(strike, 1700);
    const strikeTimer = window.setInterval(strike, 8200);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      if (visible && !frame) frame = requestAnimationFrame(render);
      if (!visible && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    });
    intersection.observe(host);
    window.addEventListener("pointermove", pointer, { passive: true });
    window.addEventListener("pointerdown", pointerDown);
    frame = requestAnimationFrame(render);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.clearTimeout(firstStrike);
      window.clearInterval(strikeTimer);
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener("pointermove", pointer);
      window.removeEventListener("pointerdown", pointerDown);
      gl.deleteBuffer(buffer);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      gl.deleteProgram(program);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefersReducedMotion]);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className={cn("absolute inset-0 isolate overflow-hidden", className)}
      style={{
        background: backgroundColor,
        opacity,
        filter: `hue-rotate(${hue}deg) saturate(${saturation}) brightness(${brightness})`,
      }}
    >
      <canvas ref={modeRef} className="absolute inset-0 z-0 block h-full w-full" />
      <canvas
        ref={emberRef}
        className="pointer-events-none absolute inset-0 z-[1] block h-full w-full"
      />
    </div>
  );
}
