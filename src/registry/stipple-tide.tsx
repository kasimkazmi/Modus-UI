"use client";

// Ported from ThreeUI Community's Dot Matrix (MIT, © 2026 Meng To).

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { cn } from "@/lib/utils";

type Tokens = {
  primary: string;
  foreground: string;
  muted: string;
  background: string;
  card: string;
  border: string;
  dark: boolean;
};

/** Reads the Modus theme tokens (bare HSL channels) as comma `hsl()` strings canvas and three.js both parse. */
function readTokens(): Tokens {
  const root = document.documentElement;
  const cs = getComputedStyle(root);
  const hsl = (name: string) =>
    `hsl(${cs
      .getPropertyValue(name)
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .join(", ")})`;
  return {
    primary: hsl("--primary"),
    foreground: hsl("--foreground"),
    muted: hsl("--muted-foreground"),
    background: hsl("--background"),
    card: hsl("--card"),
    border: hsl("--border"),
    dark: root.classList.contains("dark") || root.dataset.theme === "dark",
  };
}

/** The current theme tokens, re-read whenever the mode or palette on <html> changes. */
function useTokens() {
  const [tokens, setTokens] = useState<Tokens | null>(null);
  useEffect(() => {
    const update = () => setTokens(readTokens());
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "data-palette", "style"],
    });
    return () => observer.disconnect();
  }, []);
  return tokens;
}

export interface StippleTideProps {
  speed?: number;
  gridScale?: number;
  mouseAmount?: number;
  pulseSpeed?: number;
  radius?: number;
  opacity?: number;
  hue?: number;
  /** Dot colour at the crest of a ripple. Defaults to the theme's `--primary`. */
  color?: string;
  /** Background behind the dots. Defaults to the theme's `--background`. */
  backgroundColor?: string;
  className?: string;
}

const VERTEX_SHADER = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

const FRAGMENT_SHADER = `
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uGridScale;
uniform float uMouseAmount;
uniform float uPulseSpeed;
uniform float uRadius;
uniform float uOpacity;
uniform vec3 uColor;
uniform vec3 uBase;
varying vec2 vUv;
void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  float aspect = uResolution.x / uResolution.y;
  uv.x *= aspect;
  uv += uMouse * uMouseAmount;
  vec2 grid = fract(uv * uGridScale);
  vec2 id = floor(uv * uGridScale);
  float dist = length(grid - vec2(0.5));
  vec2 center = vec2(0.5 * aspect, 0.5);
  float ring = length(id - center * uGridScale);
  float pulse = sin(uTime * uPulseSpeed * 6.2831 - ring * 0.32) * 0.5 + 0.5;
  pulse = pow(pulse, 2.2);
  float radius = 0.06 + pulse * uRadius;
  float alpha = smoothstep(radius, radius - 0.05, dist);
  float depthFade = smoothstep(1.05, 0.05, length(uv - center));
  vec3 color = mix(uBase, uColor, pulse);
  gl_FragColor = vec4(color, alpha * mix(0.35, 1.0, pulse) * depthFade * uOpacity);
}
`;

export function StippleTide({
  speed = 1,
  gridScale = 36,
  mouseAmount = 0.03,
  pulseSpeed = 0.25,
  radius = 0.26,
  opacity = 0.9,
  hue = 0,
  color,
  backgroundColor,
  className,
}: StippleTideProps) {
  const prefersReducedMotion = useReducedMotion();
  const tokens = useTokens();
  const ink = color ?? tokens?.primary ?? "currentColor";
  const base = tokens?.muted ?? ink;
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const options = useRef({ speed, gridScale, mouseAmount, pulseSpeed, radius, opacity, ink, base });
  options.current = { speed, gridScale, mouseAmount, pulseSpeed, radius, opacity, ink, base };
  const redraw = useRef<() => void>(() => {});

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;
    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2() },
      uMouse: { value: new THREE.Vector2() },
      uGridScale: { value: 60 },
      uMouseAmount: { value: 0.04 },
      uPulseSpeed: { value: 0.4 },
      uRadius: { value: 0.15 },
      uOpacity: { value: 0.35 },
      uColor: { value: new THREE.Color() },
      uBase: { value: new THREE.Color() },
    };
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
    });
    scene.add(new THREE.Mesh(geometry, material));

    const mouse = new THREE.Vector2();
    const target = new THREE.Vector2();
    const startedAt = performance.now();
    let frame = 0;
    let visible = true;

    // Listen on window so overlaid content does not block the pointer drift.
    const onPointer = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      target.x = ((event.clientX - bounds.left) / Math.max(1, bounds.width)) * 2 - 1;
      target.y = -(((event.clientY - bounds.top) / Math.max(1, bounds.height)) * 2 - 1);
    };
    const draw = (now: number) => {
      const o = options.current;
      mouse.lerp(target, 0.05);
      uniforms.uTime.value = (now - startedAt) * 0.001 * o.speed;
      uniforms.uMouse.value = mouse;
      uniforms.uGridScale.value = o.gridScale;
      uniforms.uMouseAmount.value = o.mouseAmount;
      uniforms.uPulseSpeed.value = o.pulseSpeed;
      uniforms.uRadius.value = o.radius;
      uniforms.uOpacity.value = o.opacity;
      if (o.ink !== "currentColor") {
        uniforms.uColor.value.setStyle(o.ink, THREE.LinearSRGBColorSpace);
        uniforms.uBase.value.setStyle(o.base, THREE.LinearSRGBColorSpace);
      }
      renderer.render(scene, camera);
    };
    const tick = (now: number) => {
      draw(now);
      frame = visible && !document.hidden ? requestAnimationFrame(tick) : 0;
    };
    const start = () => {
      if (!prefersReducedMotion && visible && !frame) frame = requestAnimationFrame(tick);
    };
    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      renderer.setSize(width, height, false);
      uniforms.uResolution.value.set(width, height);
      if (prefersReducedMotion) draw(startedAt);
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
    redraw.current = () => {
      if (prefersReducedMotion) draw(startedAt);
    };
    resizeObserver.observe(host);
    intersection.observe(host);
    if (!prefersReducedMotion) window.addEventListener("pointermove", onPointer, { passive: true });
    resize();
    start();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointer);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [prefersReducedMotion]);

  // A still frame has to be repainted when the theme changes under it.
  useEffect(() => {
    redraw.current();
  }, [ink, base]);

  return (
    <div
      ref={hostRef}
      className={cn("absolute inset-0 isolate overflow-hidden", className)}
      style={{ background: backgroundColor ?? "hsl(var(--background))" }}
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        style={{ filter: `hue-rotate(${hue}deg)` }}
      />
    </div>
  );
}
