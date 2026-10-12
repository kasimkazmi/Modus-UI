"use client";

// Ported from ThreeUI Community's Dot Matrix (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { cn } from "@/lib/utils";

interface DotMatrixProps {
  speed?: number;
  gridScale?: number;
  mouseAmount?: number;
  pulseSpeed?: number;
  radius?: number;
  opacity?: number;
  hue?: number;
  color?: string;
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
varying vec2 vUv;
void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  float aspect = uResolution.x / uResolution.y;
  uv.x *= aspect;
  uv += uMouse * uMouseAmount;
  vec2 grid = fract(uv * uGridScale);
  vec2 id = floor(uv * uGridScale);
  float dist = length(grid - vec2(0.5));
  float pulse = sin(uTime * uPulseSpeed + id.x * 0.05 + id.y * 0.05) * 0.5 + 0.5;
  float radius = 0.08 + pulse * uRadius;
  float alpha = smoothstep(radius, radius - 0.05, dist);
  vec2 center = vec2(0.5 * aspect, 0.5);
  float depthFade = smoothstep(1.2, 0.1, length(uv - center));
  vec3 color = uColor * pulse;
  gl_FragColor = vec4(color, alpha * depthFade * uOpacity);
}
`;

export function DotMatrix({
  speed = 1,
  gridScale = 60,
  mouseAmount = 0.04,
  pulseSpeed = 0.4,
  radius = 0.15,
  opacity = 0.35,
  hue = 0,
  color = "#00e6ff",
  backgroundColor = "#030304",
  className,
}: DotMatrixProps) {
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const options = useRef({ speed, gridScale, mouseAmount, pulseSpeed, radius, opacity, color });
  options.current = { speed, gridScale, mouseAmount, pulseSpeed, radius, opacity, color };

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
      // The colour is written straight into the shader, as the original's literal was.
      uniforms.uColor.value.setStyle(o.color, THREE.LinearSRGBColorSpace);
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

  return (
    <div
      ref={hostRef}
      className={cn("absolute inset-0 isolate overflow-hidden", className)}
      style={{ background: backgroundColor }}
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        style={{ filter: `hue-rotate(${hue}deg)` }}
      />
    </div>
  );
}
