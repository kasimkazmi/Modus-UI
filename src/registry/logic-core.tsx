"use client";
// Ported from ThreeUI Community's Logic Core (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { cn } from "@/lib/utils";

interface LogicCoreProps {
  mode?: "dark" | "light";
  hue?: number;
  saturation?: number;
  brightness?: number;
  /** Glow colour of the core, accent nodes and point light. */
  accentColor?: string;
  /** Colour of the base platform. */
  platformColor?: string;
  /** Colour of the non-accent orbiting nodes. */
  nodeColor?: string;
  backgroundColor?: string;
  className?: string;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

// The original ran on three r136 without colour management: hex values are used as-is.
const raw = (value: string | number) => new THREE.Color(value).convertLinearToSRGB();

export function LogicCore({
  mode = "dark",
  hue = 0,
  saturation = 1,
  brightness = 1,
  accentColor = "#00E5FF",
  platformColor = "#111111",
  nodeColor = "#222222",
  backgroundColor = "#050505",
  className,
}: LogicCoreProps) {
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = hostRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const d = 12; // Camera frustum size
    const aspect = Math.max(1, container.clientWidth) / Math.max(1, container.clientHeight);
    const camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
    camera.position.set(20, 20, 20); // Isometric angle
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;display:block";
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const disposables: { dispose: () => void }[] = [];
    const track = <T extends { dispose: () => void }>(item: T) => {
      disposables.push(item);
      return item;
    };

    const basePlatformMat = track(
      new THREE.MeshStandardMaterial({ color: raw(platformColor), roughness: 0.9, metalness: 0.1 }),
    );
    const coreEmissiveMat = track(
      new THREE.MeshStandardMaterial({
        color: raw(accentColor),
        emissive: raw(accentColor),
        emissiveIntensity: 0.5,
        roughness: 0.2,
      }),
    );
    const wireframeMat = track(
      new THREE.LineBasicMaterial({ color: raw(0x333333), transparent: true, opacity: 0.4 }),
    );

    const platformGeo = track(new THREE.BoxGeometry(16, 0.5, 16));
    const platform = new THREE.Mesh(platformGeo, basePlatformMat);
    platform.position.y = -2;
    group.add(platform);
    platform.add(new THREE.LineSegments(track(new THREE.EdgesGeometry(platformGeo)), wireframeMat));

    const coreGeo = track(new THREE.BoxGeometry(2, 4, 2));
    const core = new THREE.Mesh(coreGeo, coreEmissiveMat);
    core.position.y = 0.25;
    group.add(core);

    type NodeData = {
      angle: number;
      radius: number;
      speed: number;
      yBase: number;
      yOffset: number;
    };
    const nodes: { mesh: THREE.Mesh; data: NodeData }[] = [];
    const nodeCount = 12;
    const nodeEdgeMat = track(
      new THREE.LineBasicMaterial({ color: raw(0x555555), transparent: true, opacity: 0.3 }),
    );
    for (let i = 0; i < nodeCount; i++) {
      const isAccent = Math.random() > 0.7;
      const nodeMat = isAccent
        ? coreEmissiveMat
        : track(new THREE.MeshStandardMaterial({ color: raw(nodeColor), roughness: 0.8 }));
      const size = 0.4 + Math.random() * 0.4;
      const nodeGeo = track(new THREE.BoxGeometry(size, size, size));
      const node = new THREE.Mesh(nodeGeo, nodeMat);

      const angle = (i / nodeCount) * Math.PI * 2;
      const radius = 4 + Math.random() * 4;
      node.position.set(Math.cos(angle) * radius, -1 + Math.random() * 4, Math.sin(angle) * radius);
      node.add(new THREE.LineSegments(track(new THREE.EdgesGeometry(nodeGeo)), nodeEdgeMat));

      nodes.push({
        mesh: node,
        data: {
          angle,
          radius,
          speed: 0.005 + Math.random() * 0.015,
          yBase: node.position.y,
          yOffset: Math.random() * Math.PI * 2,
        },
      });
      group.add(node);
    }

    // Legacy (pre-r155) light intensities scaled by PI to keep the original look.
    scene.add(new THREE.AmbientLight(raw(0xffffff), 0.3 * Math.PI));
    const dirLight = new THREE.DirectionalLight(raw(0xffffff), 0.6 * Math.PI);
    dirLight.position.set(10, 20, 5);
    scene.add(dirLight);
    const pointLight = new THREE.PointLight(raw(accentColor), 1.5 * Math.PI, 25, 0);
    pointLight.position.set(0, 1, 0);
    scene.add(pointLight);

    let time = 0;
    const step = () => {
      time += 0.016;
      group.rotation.y = Math.sin(time * 0.1) * 0.15;
      group.position.y = Math.sin(time * 0.5) * 0.2;

      const pulse = (Math.sin(time * 2.5) + 1) * 0.5;
      coreEmissiveMat.emissiveIntensity = 0.4 + pulse * 0.6;
      pointLight.intensity = (1.0 + pulse * 1.5) * Math.PI;

      nodes.forEach(({ mesh, data }) => {
        data.angle += data.speed;
        mesh.position.x = Math.cos(data.angle) * data.radius;
        mesh.position.z = Math.sin(data.angle) * data.radius;
        mesh.position.y = data.yBase + Math.sin(time * 1.5 + data.yOffset) * 0.5;
        mesh.rotation.x += 0.01;
        mesh.rotation.y += 0.02;
      });
      renderer.render(scene, camera);
    };

    const resize = () => {
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      const newAspect = width / height;
      camera.left = -d * newAspect;
      camera.right = d * newAspect;
      camera.top = d;
      camera.bottom = -d;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      if (prefersReducedMotion) renderer.render(scene, camera);
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    let frame = 0;
    let visible = true;
    const loop = () => {
      step();
      frame = requestAnimationFrame(loop);
    };
    const start = () => {
      cancelAnimationFrame(frame);
      if (prefersReducedMotion) step();
      else if (visible && !document.hidden) frame = requestAnimationFrame(loop);
    };
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
      disposables.forEach((item) => item.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [prefersReducedMotion, accentColor, platformColor, nodeColor]);

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
