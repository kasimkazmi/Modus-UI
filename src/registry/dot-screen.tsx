"use client";
// Ported from ThreeUI Community's Amber Halftone (MIT, © 2026 Meng To).

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { cn } from "@/lib/utils";

export interface DotScreenProps {
  className?: string;
  /** Time multiplier for the ripple. */
  speed?: number;
  /** Point size multiplier. */
  size?: number;
  /** Ripple wavelength multiplier (higher = more rings). */
  length?: number;
  /** Grid density; tightens point spacing. */
  density?: number;
  /** Top colour of the vertical gradient. Defaults to the theme's primary. */
  color?: string;
  /** Bottom colour of the vertical gradient. Defaults to the theme's muted foreground. */
  secondaryColor?: string;
  /** Clear colour behind the points. Defaults to the theme's background. */
  backgroundColor?: string;
  /** Final-frame grade, in degrees. */
  hue?: number;
  saturation?: number;
  brightness?: number;
}

const TOKENS = [
  "primary",
  "foreground",
  "background",
  "muted-foreground",
  "border",
  "card",
] as const;
type Tokens = Record<(typeof TOKENS)[number], string>;

/** Bare HSL channels of the Modus theme tokens, re-read when the theme or palette changes. */
function useThemeTokens(): Tokens | null {
  const [tokens, setTokens] = useState<Tokens | null>(null);
  useEffect(() => {
    const root = document.documentElement;
    const read = () => {
      const style = getComputedStyle(root);
      const next = Object.fromEntries(
        TOKENS.map((name) => [name, style.getPropertyValue(`--${name}`).trim()]),
      ) as Tokens;
      setTokens((prev) => (prev && TOKENS.every((k) => prev[k] === next[k]) ? prev : next));
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "data-palette", "style"],
    });
    return () => observer.disconnect();
  }, []);
  return tokens;
}

/** `hsl(h, s%, l%)` from bare channels — the comma form THREE.Color parses. */
const hslOf = (channels: string) => `hsl(${channels.split(/\s+/).slice(0, 3).join(", ")})`;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function DotScreen({
  className,
  speed = 0.6,
  size = 0.75,
  length = 1.4,
  density = 1.5,
  color,
  secondaryColor,
  backgroundColor,
  hue = 0,
  saturation = 1,
  brightness = 1,
}: DotScreenProps) {
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const speedRef = useRef(speed);
  speedRef.current = clamp(speed, 0, 3);

  const tokens = useThemeTokens();
  const top = color ?? (tokens ? hslOf(tokens.primary) : null);
  const bottom = secondaryColor ?? (tokens ? hslOf(tokens["muted-foreground"]) : null);
  const clear = backgroundColor ?? (tokens ? hslOf(tokens.background) : null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !top || !bottom || !clear) return;

    const safeSize = clamp(size, 0.05, 200);
    const safeLength = clamp(length, 0.35, 2.5);
    const safeDensity = clamp(density, 0.25, 2.5);
    // Density tightens spacing rather than growing the grid, as in ThreeUI.
    const spacing = Number((0.085 / Math.max(0.25, safeDensity)).toFixed(4));
    const gridSize = Math.max(12, Math.ceil(2.8 / spacing));
    const pointSize = Number((9 * safeSize).toFixed(2));
    const wave = Number((6 * safeLength).toFixed(2));

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(new THREE.Color(clear), 1);
    const canvas = renderer.domElement;
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    host.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const positions: number[] = [];
    const scales: number[] = [];
    for (let x = -gridSize; x <= gridSize; x++) {
      for (let y = -gridSize; y <= gridSize; y++) {
        positions.push(x * spacing, y * spacing, 0);
        scales.push(1);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("scale", new THREE.Float32BufferAttribute(scales, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color1: { value: new THREE.Color(top) },
        color2: { value: new THREE.Color(bottom) },
      },
      vertexShader: `
        attribute float scale;
        varying vec2 vUv;
        varying float vScale;
        uniform float time;

        void main() {
          vUv = position.xy;
          // Rings radiate from the lower-left corner rather than the centre.
          float dist = length(position.xy - vec2(-1.6, -1.1));
          float animatedScale = scale * (sin(dist * ${wave.toFixed(2)} - time * 2.5) * 0.5 + 0.5);
          vScale = animatedScale;

          gl_PointSize = animatedScale * ${pointSize.toFixed(2)};
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

          vec3 finalColor = mix(color2, color1, clamp((vUv.x + vUv.y) * 0.35 + 0.5, 0.0, 1.0));
          gl_FragColor = vec4(finalColor, vScale * 0.9);
        }
      `,
      transparent: true,
    });
    // The authored shader mixes sRGB hex values directly; keep them unconverted.
    material.uniforms.color1.value.convertLinearToSRGB();
    material.uniforms.color2.value.convertLinearToSRGB();

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const resize = () => {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      renderer.setSize(width, height, false);
      const aspect = width / height;
      camera.left = -aspect;
      camera.right = aspect;
      camera.bottom = -1;
      camera.top = 1;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    let elapsed = 0;
    let last = 0;
    let raf = 0;
    let visible = true;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
      last = now;
      elapsed += dt * speedRef.current;
      material.uniforms.time.value = elapsed;
      renderer.render(scene, camera);
    };
    const start = () => {
      if (prefersReducedMotion || raf || !visible || document.hidden) return;
      last = 0;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(host);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);
    start();

    return () => {
      stop();
      io.disconnect();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, [prefersReducedMotion, size, length, density, top, bottom, clear]);

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
      aria-hidden="true"
      className={cn("absolute inset-0 h-full w-full", className)}
      style={{ background: clear ?? "hsl(var(--background))", filter }}
    />
  );
}
