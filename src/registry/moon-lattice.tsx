"use client";

// Ported from ThreeUI Community's Orbital Sphere (MIT, © 2026 Meng To).

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

export interface MoonLatticeProps {
  speed?: number;
  particleSize?: number;
  particleOpacity?: number;
  orbitOpacity?: number;
  scale?: number;
  haloOpacity?: number;
  hue?: number;
  particleColor?: string;
  particleDimColor?: string;
  orbitColor?: string;
  nodeColor?: string;
  haloColor?: string;
  backgroundColor?: string;
  className?: string;
}

export function MoonLattice({
  speed = 1,
  particleSize = 0.022,
  particleOpacity = 0.8,
  orbitOpacity = 0.35,
  scale = 1,
  haloOpacity = 0.2,
  hue = 0,
  particleColor,
  particleDimColor,
  orbitColor,
  nodeColor,
  haloColor,
  backgroundColor,
  className,
}: MoonLatticeProps) {
  const prefersReducedMotion = useReducedMotion();
  const [themeKey, setThemeKey] = useState(0);
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const options = useRef({
    speed,
    particleSize,
    particleOpacity,
    orbitOpacity,
    scale,
    haloOpacity,
  });
  options.current = { speed, particleSize, particleOpacity, orbitOpacity, scale, haloOpacity };

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // The original ran on three r128 (no colour management): colours reach the screen untouched.
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    const raw = (value: string) => new THREE.Color().setStyle(value, THREE.LinearSRGBColorSpace);
    const light = isLightTheme();
    const blending = light ? THREE.NormalBlending : THREE.AdditiveBlending;
    const networkGroup = new THREE.Group();
    scene.add(networkGroup);

    const radius = 2.2;
    const particleCount = 15000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const colorBright = raw(particleColor ?? themeColor("--primary"));
    const colorDim = raw(particleDimColor ?? themeColor("--muted-foreground"));
    let validIndex = 0;
    for (let index = 0; index < particleCount; index += 1) {
      const phi = Math.acos(-1 + (2 * index) / particleCount);
      const theta = Math.sqrt(particleCount * Math.PI) * phi;
      const x = radius * Math.cos(theta) * Math.sin(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(phi);
      const noise =
        Math.sin(x * 3.5) * Math.cos(y * 3.5) * Math.sin(z * 3.5) + Math.cos(x * 6) * 0.4;
      if (noise <= -0.1) continue;
      const distortion = 1 + noise * 0.1;
      positions[validIndex * 3] = x * distortion;
      positions[validIndex * 3 + 1] = y * distortion;
      positions[validIndex * 3 + 2] = z * distortion;
      const mixedColor = colorDim.clone().lerp(colorBright, noise > 0.5 ? 1 : 0.3);
      colors[validIndex * 3] = mixedColor.r;
      colors[validIndex * 3 + 1] = mixedColor.g;
      colors[validIndex * 3 + 2] = mixedColor.b;
      validIndex += 1;
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions.slice(0, validIndex * 3), 3),
    );
    particleGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(colors.slice(0, validIndex * 3), 3),
    );
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.015,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending,
      depthWrite: false,
    });
    networkGroup.add(new THREE.Points(particleGeometry, particleMaterial));

    const orbitMaterial = new THREE.LineBasicMaterial({
      color: raw(orbitColor ?? themeColor("--foreground")),
      transparent: true,
      opacity: 0.25,
      blending,
    });
    const orbitGeometries: THREE.BufferGeometry[] = [];
    const nodeGeometries: THREE.BufferGeometry[] = [];
    const nodeMaterials: THREE.Material[] = [];
    const haloMaterials: THREE.MeshBasicMaterial[] = [];
    let responsiveScale = 1;
    for (let index = 0; index < 6; index += 1) {
      const geometry = new THREE.BufferGeometry();
      const points: number[] = [];
      const orbitRadius = radius * (1.08 + Math.random() * 0.2);
      for (let point = 0; point <= 90; point += 1) {
        const angle = (point / 90) * Math.PI * 2;
        points.push(
          Math.cos(angle) * orbitRadius,
          Math.sin(angle) * orbitRadius,
          Math.sin(angle * 4) * 0.1,
        );
      }
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
      orbitGeometries.push(geometry);
      const line = new THREE.Line(geometry, orbitMaterial);
      line.rotation.x = Math.random() * Math.PI * 2;
      line.rotation.y = Math.random() * Math.PI * 2;
      networkGroup.add(line);
      if (index % 2 !== 0) {
        const nodeGeometry = new THREE.SphereGeometry(0.025, 16, 16);
        const nodeMaterial = new THREE.MeshBasicMaterial({
          color: raw(nodeColor ?? themeColor("--primary")),
        });
        const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
        const angle = Math.random() * Math.PI * 2;
        node.position.set(Math.cos(angle) * orbitRadius, Math.sin(angle) * orbitRadius, 0);
        line.add(node);
        const haloGeometry = new THREE.SphereGeometry(0.08, 16, 16);
        const haloMaterial = new THREE.MeshBasicMaterial({
          color: raw(haloColor ?? themeColor("--primary")),
          transparent: true,
          opacity: 0.2,
          blending,
        });
        node.add(new THREE.Mesh(haloGeometry, haloMaterial));
        nodeGeometries.push(nodeGeometry, haloGeometry);
        nodeMaterials.push(nodeMaterial, haloMaterial);
        haloMaterials.push(haloMaterial);
      }
    }

    const render = (advance: boolean) => {
      const o = options.current;
      particleMaterial.size = o.particleSize;
      particleMaterial.opacity = o.particleOpacity;
      orbitMaterial.opacity = o.orbitOpacity;
      haloMaterials.forEach((material) => (material.opacity = o.haloOpacity));
      networkGroup.scale.setScalar(responsiveScale * o.scale);
      if (advance) {
        networkGroup.rotation.y += 0.0008 * o.speed;
        networkGroup.rotation.x += 0.0003 * o.speed;
        networkGroup.children.forEach((child, index) => {
          if (child.type === "Line")
            child.rotation.z += 0.0004 * o.speed * (index % 2 === 0 ? 1 : -1);
        });
      }
      renderer.render(scene, camera);
    };

    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      if (width >= 1024) {
        networkGroup.position.set(0, 0, -1.5);
        responsiveScale = 0.95;
        camera.position.z = 6;
      } else {
        networkGroup.position.set(0, 0, -3);
        responsiveScale = 1;
        camera.position.z = 6.5;
      }
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
    networkGroup.rotation.set(0.5, 0, 0.35);
    // Re-run the scene when the site switches light/dark mode or palette.
    const themeObserver = new MutationObserver(() => setThemeKey((key) => key + 1));
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme", "data-palette"],
    });
    resize();
    start();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      particleGeometry.dispose();
      particleMaterial.dispose();
      orbitMaterial.dispose();
      orbitGeometries.forEach((item) => item.dispose());
      nodeGeometries.forEach((item) => item.dispose());
      nodeMaterials.forEach((item) => item.dispose());
      renderer.dispose();
    };
  }, [
    prefersReducedMotion,
    themeKey,
    particleColor,
    particleDimColor,
    orbitColor,
    nodeColor,
    haloColor,
  ]);

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
