"use client";

// Ported from ThreeUI Community's Emerald Horizon (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { cn } from "@/lib/utils";

interface EmeraldHorizonProps {
  speed?: number;
  waveScale?: number;
  variation?: number;
  glow?: number;
  vignette?: number;
  hue?: number;
  colors?: [string, string];
  backgroundColor?: string;
  className?: string;
}

const VERTEX_SHADER = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

const FRAGMENT_SHADER = `
uniform float u_time;
uniform vec2 u_resolution;
uniform float u_wave_scale;
uniform float u_variation;
uniform float u_glow;
uniform float u_vignette;
uniform vec3 u_base;
uniform vec3 u_glow1;
uniform vec3 u_glow2;
varying vec2 vUv;
float hash(float n) { return fract(sin(n) * 1e4); }
float noise(float x) {
  float i = floor(x);
  float f = fract(x);
  float u = f * f * (3.0 - 2.0 * f);
  return mix(hash(i), hash(i + 1.0), u);
}
void main() {
  vec2 st = gl_FragCoord.xy / u_resolution.xy;
  float yPos = st.y;
  float wave1 = sin(st.x * 3.0 + u_time * 0.5) * 0.1 * u_wave_scale;
  float wave2 = sin(st.x * 5.0 - u_time * 0.3) * 0.05 * u_wave_scale;
  float combinedWave = wave1 + wave2;
  float intensity = smoothstep(0.4, -0.1, yPos + combinedWave);
  float variation = noise(st.x * 2.0 + u_time * 0.1) * 0.5 + 0.5;
  intensity *= variation * 1.5 * u_variation;
  vec3 color = u_base;
  vec3 glowColor1 = u_glow1;
  vec3 glowColor2 = u_glow2;
  vec3 finalGlow = mix(glowColor1, glowColor2, st.x + sin(u_time*0.2)*0.5);
  color += finalGlow * pow(intensity, 1.5) * 1.2 * u_glow;
  float vignette = mix(1.0, smoothstep(1.2, 0.5, length(st - vec2(0.5, 0.0))), u_vignette);
  color *= vignette;
  gl_FragColor = vec4(color, 1.0);
}
`;

const DEFAULT_COLORS: [string, string] = ["#0dcc33", "#00ff80"];

export function EmeraldHorizon({
  speed = 1,
  waveScale = 1,
  variation = 1,
  glow = 1,
  vignette = 1,
  hue = 0,
  colors = DEFAULT_COLORS,
  backgroundColor = "#000500",
  className,
}: EmeraldHorizonProps) {
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const options = useRef({ speed, waveScale, variation, glow, vignette, colors, backgroundColor });
  options.current = { speed, waveScale, variation, glow, vignette, colors, backgroundColor };

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const uniforms = {
      u_time: { value: 0 },
      u_resolution: { value: new THREE.Vector2(1, 1) },
      u_wave_scale: { value: 1 },
      u_variation: { value: 1 },
      u_glow: { value: 1 },
      u_vignette: { value: 1 },
      u_base: { value: new THREE.Color() },
      u_glow1: { value: new THREE.Color() },
      u_glow2: { value: new THREE.Color() },
    };
    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms,
      depthWrite: false,
      depthTest: false,
    });
    const geometry = new THREE.PlaneGeometry(2, 2);
    scene.add(new THREE.Mesh(geometry, material));

    const startedAt = performance.now();
    let frame = 0;
    let visible = true;
    const draw = (now: number) => {
      const o = options.current;
      uniforms.u_time.value = (now - startedAt) * 0.001 * o.speed;
      uniforms.u_wave_scale.value = o.waveScale;
      uniforms.u_variation.value = o.variation;
      uniforms.u_glow.value = o.glow;
      uniforms.u_vignette.value = o.vignette;
      // Colours go straight into the shader, as the original's literals did.
      uniforms.u_base.value.setStyle(o.backgroundColor, THREE.LinearSRGBColorSpace);
      uniforms.u_glow1.value.setStyle(o.colors[0], THREE.LinearSRGBColorSpace);
      uniforms.u_glow2.value.setStyle(o.colors[1], THREE.LinearSRGBColorSpace);
      renderer.render(scene, camera);
    };
    const tick = (now: number) => {
      draw(now);
      frame = visible && !document.hidden ? requestAnimationFrame(tick) : 0;
    };
    const start = () => {
      if (!prefersReducedMotion && visible && !frame) frame = requestAnimationFrame(tick);
    };
    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      renderer.setSize(width, height, false);
      uniforms.u_resolution.value.set(width, height);
      if (prefersReducedMotion) draw(startedAt);
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
  }, [prefersReducedMotion]);

  return (
    <div className={cn("absolute inset-0 isolate overflow-hidden", className)} ref={hostRef}>
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        style={{ filter: `hue-rotate(${hue}deg)` }}
      />
    </div>
  );
}
