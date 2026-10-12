"use client";
// Ported from ThreeUI Community's Halftone Flow and Amber Halftone (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { cn } from "@/lib/utils";

type HalftoneFlowVariant = "halftone" | "amber";
type HalftoneFlowMode = "dark" | "light";

interface HalftoneFlowProps {
  variant?: HalftoneFlowVariant;
  mode?: HalftoneFlowMode;
  speed?: number;
  size?: number;
  length?: number;
  density?: number;
  opacity?: number;
  hue?: number;
  saturation?: number;
  brightness?: number;
  colors?: string[];
  backgroundColor?: string;
  className?: string;
}

const DEFAULTS = {
  halftone: { background: "#000000", colors: ["#050000", "#cc1a0d", "#ff9933"] },
  amber: { background: "#0a0a0a", colors: ["#fbbf24", "#ffffff"] },
  amberLight: { background: "#eef1f6", colors: ["#b45309", "#1a1f2a"] },
} as const;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const FLOW_VERTEX_SHADER = `
attribute vec4 aVertexPosition;
void main() {
  gl_Position = aVertexPosition;
}
`;

// Fragment Shader (Halftone Flow)
const FLOW_FRAGMENT_SHADER = `
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_dark;
uniform vec3 u_red;
uniform vec3 u_bright;

mat2 rot(float a) {
  float s = sin(a), c = cos(a);
  return mat2(c, -s, s, c);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 p = uv * 2.0 - 1.0;
  p.x *= u_resolution.x / u_resolution.y;

  vec2 flow_uv = p;
  float time = u_time * 0.4;

  for(float i = 1.0; i < 4.0; i++) {
    flow_uv *= rot(time * 0.1);
    flow_uv.x += sin(flow_uv.y * 2.0 * i + time) * 0.5;
    flow_uv.y += cos(flow_uv.x * 1.5 * i - time * 0.8) * 0.5;
  }

  float intensity = sin(flow_uv.x * 2.0 + flow_uv.y * 3.0) * 0.5 + 0.5;

  vec3 fluid_color = mix(u_dark, u_red, smoothstep(0.2, 0.6, intensity));
  fluid_color = mix(fluid_color, u_bright, smoothstep(0.7, 1.0, intensity));

  float gridSize = 6.0;
  vec2 grid_uv = gl_FragCoord.xy / gridSize;
  vec2 cell_uv = fract(grid_uv) - 0.5;

  float dist = length(cell_uv);
  float radius = intensity * 0.45;
  float dot_mask = smoothstep(radius, radius - 0.1, dist);

  vec3 final_color = mix(vec3(0.0), fluid_color, dot_mask);
  final_color += fluid_color * 0.15;

  gl_FragColor = vec4(final_color, 1.0);
}
`;

function glslFloat(value: number, digits = 3) {
  const fixed = Number(value).toFixed(digits);
  return fixed.includes(".") ? fixed : `${fixed}.0`;
}

function hexToVec3(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? value.replace(/./g, "$&$&") : value;
  const n = parseInt(full, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

type Scene = { setSize: () => void; draw: (time: number) => void; dispose: () => void };

function createFlowScene(
  canvas: HTMLCanvasElement,
  host: HTMLElement,
  colors: () => string[],
): Scene | null {
  const gl = canvas.getContext("webgl");
  if (!gl) return null;
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  };
  const vertexShader = compile(gl.VERTEX_SHADER, FLOW_VERTEX_SHADER);
  const fragmentShader = compile(gl.FRAGMENT_SHADER, FLOW_FRAGMENT_SHADER);
  const program = gl.createProgram()!;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.useProgram(program);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0]),
    gl.STATIC_DRAW,
  );
  const positionLocation = gl.getAttribLocation(program, "aVertexPosition");
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
  const timeLocation = gl.getUniformLocation(program, "u_time");
  const darkLocation = gl.getUniformLocation(program, "u_dark");
  const redLocation = gl.getUniformLocation(program, "u_red");
  const brightLocation = gl.getUniformLocation(program, "u_bright");

  return {
    setSize() {
      canvas.width = host.offsetWidth;
      canvas.height = host.offsetHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    },
    draw(time) {
      const [dark, red, bright] = colors();
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, time);
      gl.uniform3fv(darkLocation, hexToVec3(dark));
      gl.uniform3fv(redLocation, hexToVec3(red));
      gl.uniform3fv(brightLocation, hexToVec3(bright));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    dispose() {
      gl.deleteBuffer(positionBuffer);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteProgram(program);
    },
  };
}

function createAmberScene(
  canvas: HTMLCanvasElement,
  host: HTMLElement,
  knobs: { size: number; length: number; density: number },
  colors: () => string[],
  background: () => string,
): Scene {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  camera.position.z = 1;

  // Density tightens spacing rather than growing the grid past the frustum.
  const spacing = Number((0.085 / Math.max(0.25, knobs.density)).toFixed(4));
  const gridSize = Math.max(12, Math.ceil(2.8 / spacing));
  const pointSize = Number((9 * knobs.size).toFixed(2));
  const wave = Number((6 * knobs.length).toFixed(2));

  const geometry = new THREE.BufferGeometry();
  const positions: number[] = [];
  const scales: number[] = [];
  for (let x = -gridSize; x <= gridSize; x++) {
    for (let y = -gridSize; y <= gridSize; y++) {
      positions.push(x * spacing, y * spacing, 0);
      scales.push(1);
    }
  }
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("scale", new THREE.Float32BufferAttribute(scales, 1));

  const color1 = new THREE.Color();
  const color2 = new THREE.Color();
  const material = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      color1: { value: color1 },
      color2: { value: color2 },
    },
    vertexShader: `
      attribute float scale;
      varying vec2 vUv;
      varying float vScale;
      uniform float time;

      void main() {
        vUv = position.xy;
        float dist = length(position.xy);
        float animatedScale = scale * (sin(dist * ${glslFloat(wave, 2)} - time * 2.5) * 0.5 + 0.5);
        vScale = animatedScale;

        gl_PointSize = animatedScale * ${glslFloat(pointSize, 2)};
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color1;
      uniform vec3 color2;
      varying vec2 vUv;
      varying float vScale;

      void main() {
        vec2 coord = gl_PointCoord - vec2(0.5);
        if(length(coord) > 0.5) discard;

        vec3 finalColor = mix(color2, color1, (vUv.y + 1.0) * 0.5);
        gl_FragColor = vec4(finalColor, vScale * 0.9);
      }
    `,
    transparent: true,
  });
  scene.add(new THREE.Points(geometry, material));

  return {
    setSize() {
      const width = Math.max(1, host.offsetWidth);
      const height = Math.max(1, host.offsetHeight);
      renderer.setSize(width, height, false);
      const aspect = width / height;
      camera.left = -aspect;
      camera.right = aspect;
      camera.bottom = -1;
      camera.top = 1;
      camera.updateProjectionMatrix();
    },
    draw(time) {
      const [first, second] = colors();
      // r128 had no colour management: write the hex values straight into the shader.
      color1.setStyle(first, THREE.LinearSRGBColorSpace);
      color2.setStyle(second, THREE.LinearSRGBColorSpace);
      renderer.setClearColor(background(), 1);
      material.uniforms.time.value = time;
      renderer.render(scene, camera);
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}

export function HalftoneFlow({
  variant = "halftone",
  mode = "dark",
  speed = 1,
  size = 1,
  length = 1,
  density = 1,
  opacity = 1,
  hue = 0,
  saturation = 1,
  brightness = 1,
  colors,
  backgroundColor,
  className,
}: HalftoneFlowProps) {
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const preset =
    variant === "amber"
      ? mode === "light"
        ? DEFAULTS.amberLight
        : DEFAULTS.amber
      : DEFAULTS.halftone;
  const background = backgroundColor ?? preset.background;
  const options = useRef({ speed, colors: colors ?? [...preset.colors], background });
  options.current = { speed, colors: colors ?? [...preset.colors], background };
  const safeSize = clamp(size, 0.05, 200);
  const safeLength = clamp(length, 0.35, 2.5);
  const safeDensity = clamp(density, 0.25, 2.5);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const getColors = () => options.current.colors;
    const scene =
      variant === "amber"
        ? createAmberScene(
            canvas,
            host,
            { size: safeSize, length: safeLength, density: safeDensity },
            getColors,
            () => options.current.background,
          )
        : createFlowScene(canvas, host, getColors);
    if (!scene) return;

    let elapsed = prefersReducedMotion ? 2 : 0;
    let last = performance.now();
    let frame = 0;
    let visible = true;

    const tick = (now: number) => {
      elapsed += ((now - last) / 1000) * clamp(options.current.speed, 0, 3);
      last = now;
      scene.draw(elapsed);
      frame = visible && !document.hidden ? requestAnimationFrame(tick) : 0;
    };
    const start = () => {
      if (prefersReducedMotion || !visible || document.hidden || frame) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };
    const resize = () => {
      scene.setSize();
      scene.draw(elapsed);
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
    resizeObserver.observe(host);
    intersection.observe(host);
    resize();
    start();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      scene.dispose();
    };
  }, [prefersReducedMotion, variant, safeSize, safeLength, safeDensity]);

  const filter =
    hue === 0 && saturation === 1 && brightness === 1
      ? undefined
      : `hue-rotate(${clamp(hue, -180, 180)}deg) saturate(${clamp(saturation, 0, 2)}) brightness(${clamp(brightness, 0.35, 1.65)})`;

  return (
    <div
      ref={hostRef}
      className={cn("absolute inset-0 overflow-hidden", className)}
      style={{ background, filter }}
    >
      {/* A fresh canvas per variant: a canvas keeps the first context type it is given. */}
      <canvas
        key={variant}
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 block h-full w-full"
        style={{ opacity: variant === "amber" ? clamp(opacity, 0.05, 1) : undefined }}
      />
    </div>
  );
}
