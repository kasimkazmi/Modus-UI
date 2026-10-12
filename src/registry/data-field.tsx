"use client";
// Ported from ThreeUI Community's Data Field (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { cn } from "@/lib/utils";

interface DataFieldProps {
  mode?: "dark" | "light";
  hue?: number;
  saturation?: number;
  brightness?: number;
  /** Colour of the first line in the field. */
  startColor?: string;
  /** Colour of the last line in the field. */
  endColor?: string;
  backgroundColor?: string;
  className?: string;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

// The original ran on three r128 without colour management: hex values are used as-is.
const raw = (value: string) => new THREE.Color(value).convertLinearToSRGB();

export function DataField({
  mode = "dark",
  hue = 0,
  saturation = 1,
  brightness = 1,
  startColor = "#D1C5B4",
  endColor = "#7A7B76",
  backgroundColor = "#050505",
  className,
}: DataFieldProps) {
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = hostRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.set(0, -2, 9);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;display:block";
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const numLines = 60;
    const pointsPerLine = 100;
    const colorStart = raw(startColor);
    const colorEnd = raw(endColor);
    const lines: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>[] = [];

    for (let i = 0; i < numLines; i++) {
      const points: THREE.Vector3[] = [];
      const xPos = (i - numLines / 2) * 0.22;
      for (let j = 0; j < pointsPerLine; j++) {
        const yPos = (j - pointsPerLine / 2) * 0.2;
        points.push(new THREE.Vector3(xPos, yPos, 0));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const color = new THREE.Color().lerpColors(colorStart, colorEnd, i / numLines);
      const material = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.1 + Math.random() * 0.25,
        blending: THREE.AdditiveBlending,
      });
      const line = new THREE.Line(geometry, material);
      group.add(line);
      lines.push(line);
    }

    // Tilt to create a flowing plane
    group.rotation.x = Math.PI / 3;
    group.rotation.z = -Math.PI / 8;

    const render = (seconds: number) => {
      const time = seconds * 0.4; // Slower, more relaxed pace
      lines.forEach((line) => {
        const attribute = line.geometry.attributes.position as THREE.BufferAttribute;
        const positions = attribute.array as Float32Array;
        for (let j = 0; j < pointsPerLine; j++) {
          const idx = j * 3;
          const x = positions[idx];
          const y = positions[idx + 1];
          // Smooth, rolling, gentle waves reminiscent of water or silk
          const wave1 = Math.sin(y * 1.2 + time + x * 0.8) * 0.8;
          const wave2 = Math.cos(x * 1.5 - time * 0.8 + y * 0.5) * 0.6;
          positions[idx + 2] = wave1 + wave2;
        }
        attribute.needsUpdate = true;
      });
      renderer.render(scene, camera);
    };

    let elapsed = 0;
    let last = performance.now();
    let frame = 0;
    let visible = true;

    const resize = () => {
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      if (prefersReducedMotion) render(elapsed);
    };

    const loop = (now: number) => {
      elapsed += (now - last) / 1000;
      last = now;
      render(elapsed);
      frame = requestAnimationFrame(loop);
    };
    const start = () => {
      cancelAnimationFrame(frame);
      if (prefersReducedMotion) render(elapsed);
      else if (visible && !document.hidden) {
        last = performance.now();
        frame = requestAnimationFrame(loop);
      }
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      start();
    });
    intersection.observe(container);
    document.addEventListener("visibilitychange", start);
    start();

    return () => {
      cancelAnimationFrame(frame);
      intersection.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", start);
      lines.forEach((line) => {
        line.geometry.dispose();
        line.material.dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [prefersReducedMotion, startColor, endColor]);

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
