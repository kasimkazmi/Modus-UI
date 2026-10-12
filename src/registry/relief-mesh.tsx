"use client";
// Ported from ThreeUI Community's Topology Field (MIT, © 2026 Meng To).

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { cn } from "@/lib/utils";

interface ReliefMeshProps {
  hue?: number;
  saturation?: number;
  brightness?: number;
  /** Colour of the pulsing nodes. Defaults to the theme primary. */
  nodeColor?: string;
  /** Colour of the links between nodes. Defaults to the theme foreground. */
  lineColor?: string;
  /** Colour the far side of the globe fades into. Defaults to the theme background. */
  fogColor?: string;
  /** Defaults to the theme background. */
  backgroundColor?: string;
  className?: string;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

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

// Colours reach the screen untouched (linear output), so sRGB channels go in as-is.
const color3 = (c: Rgb) => new THREE.Color(c[0], c[1], c[2]);

export function ReliefMesh({
  hue = 0,
  saturation = 1,
  brightness = 1,
  nodeColor,
  lineColor,
  fogColor,
  backgroundColor,
  className,
}: ReliefMeshProps) {
  const prefersReducedMotion = useReducedMotion();
  const theme = useTheme();
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !theme) return;

    const fog = fogColor ? toRgb(fogColor) : theme.background;
    const link = lineColor ? toRgb(lineColor) : theme.foreground;
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(color3(fog), 300, 950);

    const camera = new THREE.PerspectiveCamera(60, 1, 1, 2000);
    camera.position.z = 650;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;display:block";
    host.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const numNodes = 120;
    // Faceted nodes instead of smooth spheres.
    const nodeGeo = new THREE.OctahedronGeometry(1, 0);
    const primary = nodeColor ? toRgb(nodeColor) : theme.primary;
    const nodeTints = [color3(primary), color3(mix(primary, link, 0.5))];
    type NodeData = { baseSize: number; pulseSpeed: number; pulseOffset: number };
    const nodes: {
      mesh: THREE.Mesh<THREE.OctahedronGeometry, THREE.MeshBasicMaterial>;
      data: NodeData;
    }[] = [];

    for (let i = 0; i < numNodes; i++) {
      const phi = Math.acos(-1 + (2 * i) / numNodes);
      const theta = Math.sqrt(numNodes * Math.PI) * phi;
      const x = Math.cos(theta) * Math.sin(phi);
      const y = Math.sin(theta) * Math.sin(phi);
      const z = Math.cos(phi);

      const mesh = new THREE.Mesh(
        nodeGeo,
        new THREE.MeshBasicMaterial({
          color: nodeTints[i % 3 === 0 ? 1 : 0],
          transparent: true,
          opacity: 0.9,
        }),
      );
      mesh.position.set(x, y, z);
      group.add(mesh);
      nodes.push({
        mesh,
        data: {
          baseSize: Math.random() * 1.5 + 1.0,
          pulseSpeed: Math.random() * 0.02 + 0.015,
          pulseOffset: Math.random() * Math.PI * 2,
        },
      });
    }

    const linePos: number[] = [];
    const lineColors: number[] = [];
    const threshold = 0.45;
    for (let i = 0; i < numNodes; i++) {
      for (let j = i + 1; j < numNodes; j++) {
        const a = nodes[i].mesh.position;
        const b = nodes[j].mesh.position;
        const dist = a.distanceTo(b);
        if (dist < threshold) {
          linePos.push(a.x, a.y, a.z, b.x, b.y, b.z);
          // Normal blending: weak links fade into the fog colour instead of adding light.
          const [cr, cg, cb] = mix(fog, link, (1 - dist / threshold) * 0.9);
          lineColors.push(cr, cg, cb, cr, cg, cb);
        }
      }
    }

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePos, 3));
    lineGeo.setAttribute("color", new THREE.Float32BufferAttribute(lineColors, 3));
    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      opacity: 0.8,
    });
    group.add(new THREE.LineSegments(lineGeo, lineMat));

    let time = 0;
    const step = () => {
      group.rotation.y = time * 0.0018;
      group.rotation.x = -0.35;
      group.rotation.z = time * 0.0006;
      nodes.forEach(({ mesh, data }) => {
        const pulse = (Math.sin(time * data.pulseSpeed + data.pulseOffset) + 1) / 2;
        const targetRadius = data.baseSize + pulse * 1.8;
        const scale = targetRadius / group.scale.x;
        mesh.scale.set(scale, scale, scale);
        mesh.material.opacity = 0.4 + pulse * 0.6;
      });
      renderer.render(scene, camera);
    };

    const resize = () => {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);

      // A globe rising from the lower left edge, cropped by the frame.
      const R = width > 768 ? 430 : 230;
      group.scale.set(R, R, R);
      const centerX = width > 768 ? -width * 0.22 : 0;
      const centerY = width > 768 ? -height * 0.3 : -height * 0.25;
      group.position.set(centerX, centerY, 0);
      if (prefersReducedMotion) step();
    };

    let frame = 0;
    let visible = true;
    const loop = () => {
      time += 1;
      step();
      frame = requestAnimationFrame(loop);
    };
    const start = () => {
      cancelAnimationFrame(frame);
      if (prefersReducedMotion) step();
      else if (visible && !document.hidden) frame = requestAnimationFrame(loop);
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
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
      nodes.forEach(({ mesh }) => mesh.material.dispose());
      nodeGeo.dispose();
      lineGeo.dispose();
      lineMat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [prefersReducedMotion, theme, nodeColor, lineColor, fogColor]);

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
      className={cn("absolute inset-0 overflow-hidden", className)}
      style={{ background: backgroundColor ?? "hsl(var(--background))", filter }}
    />
  );
}
