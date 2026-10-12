"use client";

// Ported from ThreeUI Community's Structure Flow (MIT, © 2026 Meng To).

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { cn } from "@/lib/utils";

interface LatticeDriftProps {
  speed?: number;
  pointSize?: number;
  opacity?: number;
  maskStart?: number;
  maskSolid?: number;
  /** Colour of most points. Defaults to the theme foreground. */
  color?: string;
  /** Colour of the scattered accent points. Defaults to the theme primary. */
  accentColor?: string;
  /** Defaults to the theme background. */
  backgroundColor?: string;
  className?: string;
}

type Rgb = [number, number, number];
const TOKENS = [
  "background",
  "foreground",
  "primary",
  "muted-foreground",
  "border",
  "card",
] as const;
type Theme = Record<(typeof TOKENS)[number], Rgb>;

/** Any CSS colour as 0–1 sRGB channels, resolved by the browser. */
function toRgb(color: string): Rgb {
  const probe = document.createElement("i");
  probe.style.display = "none";
  probe.style.color = color;
  document.body.appendChild(probe);
  const [r = 0, g = 0, b = 0] = (getComputedStyle(probe).color.match(/[\d.]+/g) ?? []).map(Number);
  probe.remove();
  return [r / 255, g / 255, b / 255];
}

/** The Modus theme tokens, re-read whenever the mode or palette on <html> changes. */
function useTheme() {
  const [theme, setTheme] = useState<Theme | null>(null);
  useEffect(() => {
    const root = document.documentElement;
    const read = () => {
      const style = getComputedStyle(root);
      setTheme(
        Object.fromEntries(
          TOKENS.map((t) => [t, toRgb(`hsl(${style.getPropertyValue(`--${t}`).trim()})`)]),
        ) as Theme,
      );
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "data-palette", "style"],
    });
    return () => observer.disconnect();
  }, []);
  return theme;
}

const mix = (a: Rgb, b: Rgb, t: number): Rgb => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

export function LatticeDrift({
  speed = 0.7,
  pointSize = 0.11,
  opacity = 0.75,
  maskStart = 0.05,
  maskSolid = 0.35,
  color,
  accentColor,
  backgroundColor,
  className,
}: LatticeDriftProps) {
  const prefersReducedMotion = useReducedMotion();
  const theme = useTheme();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const options = useRef({ speed, pointSize, opacity });
  options.current = { speed, pointSize, opacity };

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas || !theme) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    // Looking down onto the dome's crown rather than across its rim.
    camera.position.set(0, 14, 24);
    camera.lookAt(0, -2, 0);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // The original ran on three r128 (no colour management): colours reach the screen untouched.
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    const ink = color ? toRgb(color) : theme.foreground;
    const accent = accentColor ? toRgb(accentColor) : theme.primary;
    const geometry = new THREE.BufferGeometry();
    const count = 15000;
    const positions = new Float32Array(count * 3);
    const tints = new Float32Array(count * 3);
    const radius = 25;
    for (let index = 0; index < count; index += 1) {
      const u = Math.random();
      Math.random(); // The original sampled an unused v here.
      const theta = u * 2 * Math.PI;
      const phi = Math.acos(Math.random() * 0.8 + 0.2);
      positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[index * 3 + 1] = radius * Math.cos(phi) - 20;
      positions[index * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      // Points ink in the foreground, with a seeded scatter of accent points.
      tints.set(
        Math.random() < 0.14 ? accent : mix(ink, theme["muted-foreground"], Math.random() * 0.5),
        index * 3,
      );
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(tints, 3));
    const material = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    });
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    const render = (advance: boolean) => {
      const o = options.current;
      if (advance) {
        particles.rotation.y += 0.0008 * o.speed;
        particles.rotation.z += 0.0002 * o.speed;
      }
      material.size = o.pointSize;
      material.opacity = o.opacity;
      renderer.render(scene, camera);
    };
    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      camera.aspect = width / Math.max(1, height);
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
    resizeObserver.observe(host);
    intersection.observe(host);
    resize();
    start();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [prefersReducedMotion, theme, color, accentColor]);

  const mask = `linear-gradient(to bottom, transparent ${maskStart * 100}%, black ${maskSolid * 100}%, black 100%)`;

  return (
    <div
      ref={hostRef}
      className={cn("absolute inset-0 isolate overflow-hidden", className)}
      style={{ background: backgroundColor ?? "hsl(var(--background))" }}
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        style={{ WebkitMaskImage: mask, maskImage: mask }}
      />
    </div>
  );
}
