"use client";

// Ported from ThreeUI Community's Gallery (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { cn } from "@/lib/utils";

export interface PlateWheelProps {
  images?: string[];
  speed?: number;
  scale?: number;
  opacity?: number;
  hue?: number;
  saturation?: number;
  brightness?: number;
  backgroundColor?: string;
  dotColor?: string;
  className?: string;
}

const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1755331039789-7e5680e26e8f?q=80&w=774&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1755569309049-98410b94f66d?q=80&w=772&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1755497595318-7e5e3523854f?q=80&w=774&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1755353985163-c2a0fe5ac3d8?q=80&w=774&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1745965976680-d00be7dc0377?q=80&w=774&auto=format&fit=crop",
];

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

export function PlateWheel({
  images = DEFAULT_IMAGES,
  speed = 1,
  scale = 1,
  opacity = 1,
  hue = 0,
  saturation = 0.55,
  brightness = 1,
  backgroundColor = "hsl(var(--background))",
  dotColor = "hsl(var(--foreground) / 0.08)",
  className,
}: PlateWheelProps) {
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const settings = useRef({ speed, scale });
  settings.current = { speed, scale };
  const imageKey = images.join("\n");

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    const urls = imageKey.split("\n").filter(Boolean);
    if (!host || !canvas || urls.length === 0) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 3.2, 17);
    camera.lookAt(0, 0, 0);
    const gallery = new THREE.Group();
    gallery.rotation.z = -0.12;
    scene.add(gallery);

    const geometry = new THREE.CylinderGeometry(5, 5, 1.8, 64, 1, true, 0, Math.PI * 0.4);
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    let disposed = false;
    let frame = 0;
    let elapsed = 0;
    let previousTime = 0;
    let hostVisible = true;

    const render = (time = performance.now()) => {
      const safeSpeed = clamp(settings.current.speed, 0, 3);
      const safeScale = clamp(settings.current.scale, 0.7, 1.35);
      if (previousTime) elapsed += Math.min((time - previousTime) / 1000, 0.05) * safeSpeed;
      previousTime = time;
      gallery.rotation.y = elapsed * 0.18;
      gallery.position.y = Math.sin(elapsed) * 1.5;
      gallery.scale.setScalar(safeScale);
      renderer.render(scene, camera);
    };

    const textures = urls.map((url) => {
      const texture = loader.load(url, () => {
        if (disposed) {
          texture.dispose();
          return;
        }
        renderer.render(scene, camera);
      });
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      return texture;
    });
    const materials = Array.from(
      { length: 16 },
      (_, index) =>
        new THREE.MeshBasicMaterial({
          map: textures[index % textures.length],
          opacity: 0.85,
          side: THREE.DoubleSide,
          toneMapped: false,
          transparent: true,
        }),
    );
    materials.forEach((material, index) => {
      const panel = new THREE.Mesh(geometry, material);
      panel.position.y = (index - 8) * 2.4;
      panel.rotation.y = (index / 16) * Math.PI * 4;
      gallery.add(panel);
    });

    const tick = (time: number) => {
      if (disposed || !hostVisible || document.hidden) {
        frame = 0;
        previousTime = 0;
        return;
      }
      render(time);
      frame = requestAnimationFrame(tick);
    };
    const start = () => {
      if (prefersReducedMotion) {
        render(0);
        return;
      }
      if (!frame && hostVisible && !document.hidden) frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
    };
    const resize = () => {
      const bounds = host.getBoundingClientRect();
      const width = Math.max(1, Math.round(bounds.width));
      const height = Math.max(1, Math.round(bounds.height));
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      render();
    };

    const resizeObserver = new ResizeObserver(resize);
    const intersection = new IntersectionObserver(([entry]) => {
      hostVisible = entry?.isIntersecting ?? true;
      if (hostVisible) start();
      else stop();
    });
    const onVisibility = () => (document.hidden ? stop() : start());
    resizeObserver.observe(host);
    intersection.observe(host);
    document.addEventListener("visibilitychange", onVisibility);
    resize();
    start();

    return () => {
      disposed = true;
      stop();
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      gallery.clear();
      geometry.dispose();
      materials.forEach((material) => material.dispose());
      textures.forEach((texture) => texture.dispose());
      renderer.dispose();
    };
  }, [prefersReducedMotion, imageKey]);

  return (
    <div
      ref={hostRef}
      role="img"
      aria-label="Turning wheel of image plates"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      style={{
        backgroundColor,
        backgroundImage: `linear-gradient(${dotColor} 1px, transparent 1px), linear-gradient(90deg, ${dotColor} 1px, transparent 1px)`,
        backgroundSize: "44px 44px",
      }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 block h-full w-full"
        style={{
          opacity: clamp(opacity, 0.05, 1),
          filter: `hue-rotate(${clamp(hue, -180, 180)}deg) saturate(${clamp(saturation, 0, 2)}) brightness(${clamp(brightness, 0.35, 1.65)})`,
        }}
      />
    </div>
  );
}
