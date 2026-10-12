"use client";
// Ported from ThreeUI Community's Topology Field (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { cn } from "@/lib/utils";

interface TopologyFieldProps {
  mode?: "dark" | "light";
  hue?: number;
  saturation?: number;
  brightness?: number;
  /** Colour of the pulsing nodes. */
  nodeColor?: string;
  /** Colour the far side of the globe fades into. */
  fogColor?: string;
  backgroundColor?: string;
  className?: string;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

// The original ran on three r128 without colour management: hex values are used as-is.
const raw = (value: string) => new THREE.Color(value).convertLinearToSRGB();

export function TopologyField({
  mode = "dark",
  hue = 0,
  saturation = 1,
  brightness = 1,
  nodeColor = "#ffffff",
  fogColor = "#0a0a0a",
  backgroundColor = "#070707",
  className,
}: TopologyFieldProps) {
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(raw(fogColor), 300, 950);

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
    const nodeGeo = new THREE.SphereGeometry(1, 16, 16);
    const nodeTint = raw(nodeColor);
    type NodeData = { baseSize: number; pulseSpeed: number; pulseOffset: number };
    const nodes: {
      mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
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
        new THREE.MeshBasicMaterial({ color: nodeTint, transparent: true, opacity: 0.9 }),
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
          const alpha = (1 - dist / threshold) * 0.8;
          lineColors.push(alpha, alpha, alpha, alpha, alpha, alpha);
        }
      }
    }

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePos, 3));
    lineGeo.setAttribute("color", new THREE.Float32BufferAttribute(lineColors, 3));
    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.65,
    });
    group.add(new THREE.LineSegments(lineGeo, lineMat));

    let time = 0;
    const step = () => {
      group.rotation.y = time * 0.0018;
      group.rotation.x = 0.2;
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

      const R = width > 768 ? 380 : 200;
      group.scale.set(R, R, R);
      const centerX = width > 768 ? width * 0.2 : 0;
      const centerY = width > 768 ? -height * 0.05 : -height * 0.2;
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
  }, [prefersReducedMotion, nodeColor, fogColor]);

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
