"use client";

// Ported from ThreeUI Community's Structure Flow (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { cn } from "@/lib/utils";

interface StructureFlowProps {
  speed?: number;
  pointSize?: number;
  opacity?: number;
  maskStart?: number;
  maskSolid?: number;
  color?: string;
  backgroundColor?: string;
  className?: string;
}

export function StructureFlow({
  speed = 1,
  pointSize = 0.08,
  opacity = 0.4,
  maskStart = 0.2,
  maskSolid = 0.5,
  color = "#ffffff",
  backgroundColor = "#030304",
  className,
}: StructureFlowProps) {
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const options = useRef({ speed, pointSize, opacity });
  options.current = { speed, pointSize, opacity };

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    camera.position.z = 30;
    camera.position.y = 5;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // The original ran on three r128 (no colour management): colours reach the screen untouched.
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    const raw = (value: string) => new THREE.Color().setStyle(value, THREE.LinearSRGBColorSpace);
    const geometry = new THREE.BufferGeometry();
    const count = 15000;
    const positions = new Float32Array(count * 3);
    const radius = 25;
    for (let index = 0; index < count; index += 1) {
      const u = Math.random();
      Math.random(); // The original sampled an unused v here.
      const theta = u * 2 * Math.PI;
      const phi = Math.acos(Math.random() * 0.8 + 0.2);
      positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[index * 3 + 1] = radius * Math.cos(phi) - 20;
      positions[index * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      size: 0.08,
      color: raw(color),
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
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
  }, [prefersReducedMotion, color]);

  const mask = `linear-gradient(to bottom, transparent ${maskStart * 100}%, black ${maskSolid * 100}%, black 100%)`;

  // The original masks its host and lets the dark stage behind it show through.
  return (
    <div
      ref={hostRef}
      className={cn("absolute inset-0 isolate overflow-hidden", className)}
      style={{ background: backgroundColor }}
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        style={{ opacity: 0.8, WebkitMaskImage: mask, maskImage: mask }}
      />
    </div>
  );
}
