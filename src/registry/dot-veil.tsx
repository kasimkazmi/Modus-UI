"use client";

// A grid of dots laid over a folding cloth: the dots ride the folds, shrink with depth and brighten on the slopes.

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { cn } from "@/lib/utils";

/** Reads a bare-HSL theme token as an `hsl(h, s%, l%)` string three.js can parse. */
const themeColor = (name: string) =>
  `hsl(${getComputedStyle(document.documentElement).getPropertyValue(name).trim().split(/\s+/).join(", ")})`;
const isLightTheme = () =>
  Number.parseFloat(
    getComputedStyle(document.documentElement)
      .getPropertyValue("--background")
      .trim()
      .split(/\s+/)[2] ?? "0",
  ) > 50;

export interface DotVeilProps {
  /** Dots along the longer side of the cloth. */
  density?: number;
  speed?: number;
  /** How deep the folds are. */
  fold?: number;
  dotSize?: number;
  /** Strength of the dent the pointer presses into the cloth. */
  pointerForce?: number;
  /** Colour of the dots on the slopes. Defaults to the theme `--primary`. */
  color?: string;
  /** Colour of the dots in the hollows. Defaults to the theme `--muted-foreground`. */
  dimColor?: string;
  backgroundColor?: string;
  className?: string;
}

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uFold;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform vec3 uPointer;
  varying float vShade;

  // Height of the cloth at a point of the grid.
  float cloth(vec2 p, float t) {
    float warp = sin(p.y * 1.7 + t * 0.4) * 1.3;
    float h = sin(p.x * 2.2 + warp) * 0.5 + sin(p.y * 3.1 - t * 0.3 + p.x * 0.8) * 0.25;
    // Sharpen the crests so the cloth reads as folded rather than rippled.
    return h / (0.35 + abs(h));
  }

  void main() {
    vec2 p = position.xy;
    float h = cloth(p, uTime);
    float e = 0.02;
    float slope = length(vec2(cloth(p + vec2(e, 0.0), uTime) - h, cloth(p + vec2(0.0, e), uTime) - h)) / e;

    float dent = exp(-dot(p - uPointer.xy, p - uPointer.xy) * 2.5) * uPointer.z;
    vec3 world = vec3(p.x, p.y, h * uFold - dent);

    vec4 view = modelViewMatrix * vec4(world, 1.0);
    gl_Position = projectionMatrix * view;
    gl_PointSize = uSize * uPixelRatio * (4.0 / -view.z) * (0.55 + 0.45 * smoothstep(-0.8, 0.8, h));
    vShade = clamp(slope * 0.55 + h * 0.25 + 0.35, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uDim;
  varying float vShade;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float disc = 1.0 - smoothstep(0.38, 0.5, d);
    if (disc < 0.01) discard;
    gl_FragColor = vec4(mix(uDim, uColor, vShade), disc * (0.25 + 0.75 * vShade));
  }
`;

export function DotVeil({
  density = 150,
  speed = 1,
  fold = 1,
  dotSize = 2.2,
  pointerForce = 0.6,
  color,
  dimColor,
  backgroundColor,
  className,
}: DotVeilProps) {
  const prefersReducedMotion = useReducedMotion();
  const [themeKey, setThemeKey] = useState(0);
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const options = useRef({ speed, fold, dotSize, pointerForce });
  options.current = { speed, fold, dotSize, pointerForce };

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
    camera.position.set(0, -1.6, 4.2);
    camera.lookAt(0, 0.1, 0);

    // The grid always spans a 4:2.4 sheet; `density` sets the dots on its long side.
    const columns = Math.max(8, Math.round(density));
    const rows = Math.max(8, Math.round(density * 0.6));
    const positions = new Float32Array(columns * rows * 3);
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < columns; x += 1) {
        const i = (y * columns + x) * 3;
        positions[i] = (x / (columns - 1) - 0.5) * 4.4;
        positions[i + 1] = (y / (rows - 1) - 0.5) * 2.7;
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const raw = (value: string) => new THREE.Color().setStyle(value, THREE.LinearSRGBColorSpace);
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: isLightTheme() ? THREE.NormalBlending : THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uFold: { value: fold },
        uSize: { value: dotSize },
        uPixelRatio: { value: renderer.getPixelRatio() },
        uPointer: { value: new THREE.Vector3(9, 9, 0) },
        uColor: { value: raw(color ?? themeColor("--primary")) },
        uDim: { value: raw(dimColor ?? themeColor("--muted-foreground")) },
      },
    });
    scene.add(new THREE.Points(geometry, material));

    // The pointer's smoothed position on the sheet, and how hard it presses.
    const target = new THREE.Vector3(9, 9, 0);
    const onMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      const nx = (event.clientX - rect.left) / rect.width - 0.5;
      const ny = 0.5 - (event.clientY - rect.top) / rect.height;
      target.set(nx * 4.4, ny * 2.7, options.current.pointerForce);
    };
    const onLeave = () => target.set(9, 9, 0);

    let time = 0;
    const render = (advance: boolean) => {
      const o = options.current;
      const uniforms = material.uniforms;
      if (advance) time += 0.016 * o.speed;
      uniforms.uTime!.value = time;
      uniforms.uFold!.value = o.fold;
      uniforms.uSize!.value = o.dotSize;
      const pointer = uniforms.uPointer!.value as THREE.Vector3;
      pointer.lerp(target, 0.08);
      renderer.render(scene, camera);
    };

    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      camera.aspect = width / Math.max(1, height);
      // Pull the camera back on tall screens so the whole sheet stays in view.
      camera.position.z = camera.aspect < 1.5 ? 4.2 * (1.5 / camera.aspect) ** 0.8 : 4.2;
      camera.lookAt(0, 0.1, 0);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      render(false);
    };

    let frame = 0;
    let visible = true;
    const tick = () => {
      render(true);
      frame = visible && !document.hidden ? requestAnimationFrame(tick) : 0;
    };
    const start = () => {
      if (!prefersReducedMotion && visible && !frame) frame = requestAnimationFrame(tick);
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
    if (!prefersReducedMotion) {
      host.addEventListener("pointermove", onMove);
      host.addEventListener("pointerleave", onLeave);
    }
    resizeObserver.observe(host);
    intersection.observe(host);
    // Re-run the scene when the site switches light/dark mode or palette.
    const themeObserver = new MutationObserver(() => setThemeKey((key) => key + 1));
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme", "data-palette"],
    });
    time = 4;
    resize();
    start();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
    // fold, dotSize and speed are read live from `options`; density, colours and theme rebuild the scene.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefersReducedMotion, themeKey, density, color, dimColor]);

  return (
    <div
      ref={hostRef}
      aria-hidden
      className={cn("absolute inset-0 isolate overflow-hidden", className)}
      style={{ background: backgroundColor ?? "hsl(var(--background))" }}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
