"use client";
// Ported from ThreeUI Community's Flux Vortex (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { animate, useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { cn } from "@/lib/utils";

interface FluxVortexProps {
  mode?: "dark" | "light";
  speed?: number;
  size?: number;
  density?: number;
  opacity?: number;
  hue?: number;
  saturation?: number;
  brightness?: number;
  /** Colour of the vortex dots and the bright spiral guide. */
  primaryColor?: string;
  /** Colour of the dim spiral guide and ambient dust. */
  secondaryColor?: string;
  backgroundColor?: string;
  className?: string;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const scaleCount = (base: number, density: number, minimum = 1) =>
  Math.max(minimum, Math.round(base * density));

export function FluxVortex({
  mode = "dark",
  speed = 1,
  size = 1,
  density = 1,
  opacity = 1,
  hue = 0,
  saturation = 1,
  brightness = 1,
  primaryColor = "#dddddd",
  secondaryColor = "#555555",
  backgroundColor = "#050505",
  className,
}: FluxVortexProps) {
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const speedRef = useRef(speed);
  speedRef.current = clamp(speed, 0, 3);

  const safeSize = clamp(size, 0.05, 200);
  const safeDensity = clamp(density, 0.25, 2.5);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor);
    scene.fog = new THREE.FogExp2(backgroundColor, 0.04);

    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
    camera.position.z = 7;

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: "high-performance",
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.domElement.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;display:block";
    host.appendChild(renderer.domElement);

    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // --- 1. Vortex Particle Field ---
    const vortexCount = scaleCount(9500, safeDensity, 1200);
    const vortexPositions = new Float32Array(vortexCount * 3);
    const vortexRadius = new Float32Array(vortexCount);
    const vortexAngle = new Float32Array(vortexCount);
    const vortexHeight = new Float32Array(vortexCount);
    const vortexSpeed = new Float32Array(vortexCount);

    for (let i = 0; i < vortexCount; i++) {
      const i3 = i * 3;
      const y = (Math.random() - 0.5) * 7.5;
      const funnel = 0.4 + Math.abs(y) * 0.2;
      const r = (0.1 + Math.pow(Math.random(), 1.5) * 2.5) * funnel;
      const a = Math.random() * Math.PI * 2;
      vortexHeight[i] = y;
      vortexRadius[i] = r;
      vortexAngle[i] = a;
      vortexSpeed[i] = 0.5 + Math.random() * 0.8;
      vortexPositions[i3] = Math.cos(a) * r;
      vortexPositions[i3 + 1] = y;
      vortexPositions[i3 + 2] = Math.sin(a) * r;
    }

    const vortexGeometry = new THREE.BufferGeometry();
    vortexGeometry.setAttribute("position", new THREE.BufferAttribute(vortexPositions, 3));
    const vortexMaterial = new THREE.PointsMaterial({
      size: Number((0.006 * safeSize).toFixed(4)),
      color: primaryColor,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    mainGroup.add(new THREE.Points(vortexGeometry, vortexMaterial));

    // --- 2. Spiral Guides ---
    const createSpiralLine = (turnOffset: number, color: string) => {
      const spiralPoints: THREE.Vector3[] = [];
      const pointCount = 400;
      for (let i = 0; i < pointCount; i++) {
        const t = i / (pointCount - 1);
        const angle = t * Math.PI * 14 + turnOffset;
        const radius = 0.2 + t * 2.8;
        const y = (0.5 - t) * 6.0;
        spiralPoints.push(new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius));
      }
      return new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(spiralPoints),
        new THREE.LineBasicMaterial({
          color,
          transparent: true,
          opacity: 0.15,
          blending: THREE.AdditiveBlending,
        }),
      );
    };
    const spiralLineA = createSpiralLine(0, secondaryColor);
    const spiralLineB = createSpiralLine(Math.PI, primaryColor);
    mainGroup.add(spiralLineA, spiralLineB);

    // --- 3. Ambient Particles ---
    const particlesCount = scaleCount(300, safeDensity, 40);
    const posArray = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i++) posArray[i] = (Math.random() - 0.5) * 12;
    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
    const particlesMaterial = new THREE.PointsMaterial({
      size: Number((0.008 * safeSize).toFixed(4)),
      color: secondaryColor,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
    });
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // --- Post Processing ---
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 1.0, 0.4, 0.85);
    bloomPass.strength = 0.6;
    bloomPass.radius = 0.3;
    bloomPass.threshold = 0.2;
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(bloomPass);

    // --- Pointer, mapped to the host centre like the original's window centre ---
    let mouseX = 0;
    let mouseY = 0;
    const onPointerMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      mouseX = event.clientX - (rect.left + rect.width / 2);
      mouseY = event.clientY - (rect.top + rect.height / 2);
    };
    window.addEventListener("pointermove", onPointerMove);

    let elapsedTime = 0;
    const render = () => {
      const targetX = mouseX * 0.001;
      const targetY = mouseY * 0.0008;
      mainGroup.rotation.y += 0.002;
      mainGroup.rotation.y += 0.03 * (targetX - mainGroup.rotation.y);
      mainGroup.rotation.x += 0.03 * (targetY - mainGroup.rotation.x);

      const positions = vortexGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < vortexCount; i++) {
        const i3 = i * 3;
        const spin = elapsedTime * vortexSpeed[i] * 0.5 + vortexHeight[i] * 0.5;
        const angle = vortexAngle[i] + spin;
        const pulse = Math.sin(elapsedTime * 1.2 + i * 0.01) * 0.05;
        const radius = vortexRadius[i] + pulse;
        positions[i3] = Math.cos(angle) * radius;
        positions[i3 + 1] = vortexHeight[i] + Math.sin(elapsedTime + i * 0.02) * 0.03;
        positions[i3 + 2] = Math.sin(angle) * radius;
      }
      vortexGeometry.attributes.position.needsUpdate = true;

      spiralLineA.rotation.y = elapsedTime * 0.15;
      spiralLineB.rotation.y = -elapsedTime * 0.12;
      particlesMesh.rotation.y = elapsedTime * 0.03;
      particlesMesh.rotation.x = -mouseY * 0.0001;

      composer.render();
    };

    const resize = () => {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      composer.setSize(width, height);
      if (prefersReducedMotion) render();
    };

    // Intro: the vortex grows in from 0.6 (power3.out, 2s, after the loader fades).
    const intro = prefersReducedMotion
      ? undefined
      : animate(0.6, 1, {
          duration: 2,
          delay: 0.5,
          ease: [0.215, 0.61, 0.355, 1],
          onUpdate: (value) => mainGroup.scale.setScalar(value),
        });
    if (!prefersReducedMotion) mainGroup.scale.setScalar(0.6);

    let last = performance.now();
    let frame = 0;
    let visible = true;
    const loop = (now: number) => {
      elapsedTime += ((now - last) / 1000) * speedRef.current;
      last = now;
      render();
      frame = requestAnimationFrame(loop);
    };
    const start = () => {
      cancelAnimationFrame(frame);
      if (prefersReducedMotion) render();
      else if (visible && !document.hidden) {
        last = performance.now();
        frame = requestAnimationFrame(loop);
      }
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
      intro?.stop();
      intersection.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", start);
      window.removeEventListener("pointermove", onPointerMove);
      vortexGeometry.dispose();
      vortexMaterial.dispose();
      [spiralLineA, spiralLineB].forEach((line) => {
        line.geometry.dispose();
        line.material.dispose();
      });
      particlesGeometry.dispose();
      particlesMaterial.dispose();
      bloomPass.dispose();
      composer.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [prefersReducedMotion, safeSize, safeDensity, primaryColor, secondaryColor, backgroundColor]);

  const safeHue = clamp(hue, -180, 180);
  const safeSaturation = clamp(saturation, 0, 2);
  const safeBrightness = clamp(brightness, 0.35, 1.65);
  const filter =
    safeHue === 0 && safeSaturation === 1 && safeBrightness === 1
      ? undefined
      : `hue-rotate(${safeHue}deg) saturate(${safeSaturation}) brightness(${safeBrightness})`;

  return (
    <div
      className={cn("absolute inset-0 overflow-hidden", className)}
      style={{ background: backgroundColor, filter, colorScheme: mode }}
      data-mode={mode}
      aria-hidden="true"
    >
      <div
        ref={hostRef}
        className="absolute inset-0"
        style={{ opacity: clamp(opacity, 0.05, 1) }}
      />
    </div>
  );
}
