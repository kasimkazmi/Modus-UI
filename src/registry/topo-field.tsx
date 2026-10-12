"use client";
// Ported from ThreeUI Community's Topo Field (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface TopoFieldProps {
  className?: string;
  mode?: "dark" | "light";
  speed?: number;
  length?: number;
  density?: number;
  opacity?: number;
  hue?: number;
  saturation?: number;
  brightness?: number;
  backgroundColor?: string;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const glslFloat = (value: number, digits = 3) => {
  const fixed = Number(value).toFixed(digits);
  return fixed.includes(".") ? fixed : `${fixed}.0`;
};

const VERTEX = `
attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`;

function fragment(noiseScale: string, numBands: string, light: boolean) {
  const lines = light
    ? `gridLines = clamp(gridLines, 0.0, 1.0) * 0.55;`
    : `gridLines = clamp(gridLines, 0.0, 1.0) * 0.12;`;
  const topo = light
    ? `float topoLines = smoothstep(0.03, 0.00, triangleWave) * 0.95;`
    : `float topoLines = smoothstep(0.02, 0.00, triangleWave) * 0.45;`;
  const color = light
    ? `vec3 paper = vec3(0.933, 0.945, 0.965);
    vec3 ink = vec3(0.12, 0.14, 0.18);
    float lines = clamp(gridLines + topoLines, 0.0, 1.0);
    vec3 color = mix(paper, ink, lines);`
    : `vec3 color = vec3(0.0);
    color += vec3(1.0) * gridLines;
    color += vec3(1.0) * topoLines;`;
  return `
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_dpr;

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

  float gridSize = 48.0 * u_dpr;
  vec2 gridSt = gl_FragCoord.xy / gridSize;
  vec2 gridFract = fract(gridSt);
  float lineThickness = 1.0 / gridSize;
  float gridLines = step(1.0 - lineThickness, gridFract.x) + step(1.0 - lineThickness, gridFract.y);
  ${lines}

  float noiseScale = ${noiseScale};
  vec2 noisePos = st * noiseScale + vec2(u_time * 0.015, u_time * 0.025);
  float n = snoise(noisePos) * 0.5 + 0.5;
  float numBands = ${numBands};
  float bandVal = n * numBands;
  float triangleWave = abs(fract(bandVal) - 0.5) * 2.0;

  ${topo}

  ${color}

  gl_FragColor = vec4(color, 1.0);
}
`;
}

export function TopoField({
  className,
  mode = "dark",
  speed = 1,
  length = 1,
  density = 1,
  opacity = 1,
  hue = 0,
  saturation = 1,
  brightness = 1,
  backgroundColor,
}: TopoFieldProps) {
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const speedRef = useRef(speed);
  speedRef.current = clamp(speed, 0, 3);

  const light = mode === "light";
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
    if (!host || !canvas || !gl) return;

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };
    const vs = compile(gl.VERTEX_SHADER, VERTEX);
    const fs = compile(
      gl.FRAGMENT_SHADER,
      fragment(glslFloat(1.4 * safeLength, 3), glslFloat(10 * safeDensity, 2), light),
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
  }, [light, safeLength, safeDensity, prefersReducedMotion]);

  const filter =
    hue === 0 && saturation === 1 && brightness === 1
      ? undefined
      : `hue-rotate(${clamp(hue, -180, 180)}deg) saturate(${clamp(saturation, 0, 2)}) brightness(${clamp(brightness, 0.35, 1.65)})`;

  return (
    <div
      ref={hostRef}
      className={cn("absolute inset-0 overflow-hidden", className)}
      style={{
        background: backgroundColor ?? (light ? "#eef1f6" : "#000000"),
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
