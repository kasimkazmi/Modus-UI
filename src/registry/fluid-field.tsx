"use client";
// Ported from ThreeUI Community's Fluid Field (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { cn } from "@/lib/utils";

interface FluidFieldProps {
  mode?: "dark" | "light";
  hue?: number;
  saturation?: number;
  brightness?: number;
  /** First colour of the flowing light beams. */
  primaryColor?: string;
  /** Second colour of the flowing light beams. */
  secondaryColor?: string;
  backgroundColor?: string;
  className?: string;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

// The original shader writes raw colour values (three r128, no colour management).
const raw = (value: string) => new THREE.Color(value).convertLinearToSRGB();

const fragmentShader = /* glsl */ `
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec3 u_color1;
  uniform vec3 u_color2;

  // Compact 2D Simplex Noise
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
  
  float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m;
      m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
  }

  void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution.xy;
      uv.x *= u_resolution.x / u_resolution.y;

      vec3 baseColor = vec3(0.012, 0.012, 0.02);
      vec2 st = uv * 0.7;
      st += vec2(snoise(st + u_time * 0.05), snoise(st - u_time * 0.05)) * 0.3;

      float beam = smoothstep(0.1, 0.8, snoise(vec2(st.x + st.y * 1.5 - u_time * 0.15, u_time * 0.02)));
      vec3 glow = mix(u_color1, u_color2, snoise(uv * 1.5 + u_time * 0.1) * 0.5 + 0.5);

      gl_FragColor = vec4(baseColor + (glow * beam * 0.7), 1.0);
  }
        
`;

export function FluidField({
  mode = "dark",
  hue = 0,
  saturation = 1,
  brightness = 1,
  primaryColor = "#2640d9",
  secondaryColor = "#6633e6",
  backgroundColor = "#030306",
  className,
}: FluidFieldProps) {
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;display:block";
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const uniforms = {
      u_time: { value: 0 },
      u_resolution: { value: new THREE.Vector2() },
      u_color1: { value: raw(primaryColor) },
      u_color2: { value: raw(secondaryColor) },
    };
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: "void main(){ gl_Position = vec4(position, 1.0); }",
      fragmentShader,
    });
    scene.add(new THREE.Mesh(geometry, material));

    let elapsed = 0;
    const render = () => {
      uniforms.u_time.value = elapsed;
      renderer.render(scene, camera);
    };

    const resize = () => {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      renderer.setSize(width, height, false);
      // CSS pixels, exactly as the original.
      uniforms.u_resolution.value.set(width, height);
      if (prefersReducedMotion) render();
    };

    let last = performance.now();
    let frame = 0;
    let visible = true;
    const loop = (now: number) => {
      elapsed += (now - last) / 1000;
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
      intersection.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", start);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [prefersReducedMotion, primaryColor, secondaryColor]);

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
