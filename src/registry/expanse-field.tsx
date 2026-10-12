"use client";
// Ported from ThreeUI Community's Expanse Field (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { cn } from "@/lib/utils";

interface ExpanseFieldProps {
  mode?: "dark" | "light";
  hue?: number;
  saturation?: number;
  brightness?: number;
  /** Colour of the bars at the bottom. */
  baseColor?: string;
  /** Gradient colour on the left side. */
  startColor?: string;
  /** Gradient colour on the right side. */
  endColor?: string;
  /** Colour above the stepped horizon. */
  horizonColor?: string;
  backgroundColor?: string;
  className?: string;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const vertexShader = /* glsl */ `
  void main() {
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec3 u_base;
  uniform vec3 u_start;
  uniform vec3 u_end;
  uniform vec3 u_horizon;

  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    float numBars = 11.0;
    float barIndex = floor(st.x * numBars);
    float t = barIndex / (numBars - 1.0);

    // Breathing pulse animation
    float anim = sin(u_time * 0.5 + t * 3.0) * 0.025;

    // Curve for horizon line
    float targetHeight = 0.15 + pow(t, 1.3) * 0.5 + anim;

    vec3 colorBase = u_base;
    vec3 colorMid = mix(u_start, u_end, st.x);
    vec3 color = mix(colorBase, colorMid, smoothstep(0.1, 0.7, st.y));

    // Stepped horizon cutoff
    if (st.y > targetHeight) {
      gl_FragColor = vec4(u_horizon, 1.0);
      return;
    }

    // High-frequency film grain
    float noise = random(st * (u_time * 0.1)) * 0.15;
    gl_FragColor = vec4(color + noise, 1.0);
  }
`;

export function ExpanseField({
  mode = "dark",
  hue = 0,
  saturation = 1,
  brightness = 1,
  baseColor = "#0a0a0f",
  startColor = "#1a4dcc",
  endColor = "#cc3380",
  horizonColor = "#f6f5f4",
  backgroundColor = "#07080b",
  className,
}: ExpanseFieldProps) {
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;display:block";
    host.appendChild(renderer.domElement);

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const scene = new THREE.Scene();
    const geometry = new THREE.PlaneGeometry(2, 2);
    // The original shader writes raw values; colours are passed in the same space.
    const raw = (hex: string) => new THREE.Color(hex).convertLinearToSRGB();
    const uniforms = {
      u_time: { value: 0 },
      u_resolution: { value: new THREE.Vector2() },
      u_base: { value: raw(baseColor) },
      u_start: { value: raw(startColor) },
      u_end: { value: raw(endColor) },
      u_horizon: { value: raw(horizonColor) },
    };
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
    });
    scene.add(new THREE.Mesh(geometry, material));

    const resize = () => {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      renderer.setSize(width, height, false);
      // CSS pixels, exactly as the original.
      uniforms.u_resolution.value.set(width, height);
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);

    let frame = 0;
    let visible = true;
    const render = (time: number) => {
      uniforms.u_time.value = time * 0.001;
      renderer.render(scene, camera);
    };
    const loop = (time: number) => {
      render(time);
      frame = requestAnimationFrame(loop);
    };
    const start = () => {
      cancelAnimationFrame(frame);
      if (prefersReducedMotion) render(1000);
      else if (visible && !document.hidden) frame = requestAnimationFrame(loop);
    };
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      start();
    });
    intersection.observe(host);
    document.addEventListener("visibilitychange", start);
    start();

    return () => {
      cancelAnimationFrame(frame);
      intersection.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", start);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [prefersReducedMotion, baseColor, startColor, endColor, horizonColor]);

  const safeHue = clamp(hue, -180, 180);
  const safeSaturation = clamp(saturation, 0, 2);
  const safeBrightness = clamp(brightness, 0.35, 1.65);
  const filter =
    safeHue === 0 && safeSaturation === 1 && safeBrightness === 1
      ? undefined
      : `hue-rotate(${safeHue}deg) saturate(${safeSaturation}) brightness(${safeBrightness})`;

  return (
    <div
      ref={hostRef}
      data-mode={mode}
      aria-hidden="true"
      className={cn("absolute inset-0 overflow-hidden", className)}
      style={{ background: backgroundColor, filter, colorScheme: mode }}
    />
  );
}
