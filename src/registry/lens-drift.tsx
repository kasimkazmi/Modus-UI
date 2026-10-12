"use client";
// Ported from ThreeUI Community's Dimensional Field (MIT, © 2026 Meng To).

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { cn } from "@/lib/utils";

type Tokens = {
  primary: string;
  foreground: string;
  muted: string;
  background: string;
  card: string;
  border: string;
  dark: boolean;
};

/** Reads the Modus theme tokens (bare HSL channels) as comma `hsl()` strings canvas and three.js both parse. */
function readTokens(): Tokens {
  const root = document.documentElement;
  const cs = getComputedStyle(root);
  const hsl = (name: string) =>
    `hsl(${cs
      .getPropertyValue(name)
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .join(", ")})`;
  return {
    primary: hsl("--primary"),
    foreground: hsl("--foreground"),
    muted: hsl("--muted-foreground"),
    background: hsl("--background"),
    card: hsl("--card"),
    border: hsl("--border"),
    dark: root.classList.contains("dark") || root.dataset.theme === "dark",
  };
}

/** The current theme tokens, re-read whenever the mode or palette on <html> changes. */
function useTokens() {
  const [tokens, setTokens] = useState<Tokens | null>(null);
  useEffect(() => {
    const update = () => setTokens(readTokens());
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "data-palette", "style"],
    });
    return () => observer.disconnect();
  }, []);
  return tokens;
}

export interface LensDriftProps {
  hue?: number;
  saturation?: number;
  brightness?: number;
  /** First beam colour. Defaults to the theme's `--primary`. */
  primaryColor?: string;
  /** Second beam colour. Defaults to the theme's `--muted-foreground`. */
  secondaryColor?: string;
  /** Ground colour behind the beams. Defaults to the theme's `--background`. */
  backgroundColor?: string;
  className?: string;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

// The original shaders write raw colour values (three r128, no colour management).
const raw = (value: string) => new THREE.Color(value).convertLinearToSRGB();

const snoiseLogic = /* glsl */ `
  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m ; m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
`;

const bgFragment = /* glsl */ `
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec3 u_color1;
  uniform vec3 u_color2;
  uniform vec3 u_base;
  uniform vec3 u_lens;
  ${snoiseLogic}
  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    uv.x *= u_resolution.x / u_resolution.y;

    vec3 baseColor = u_base;
    vec2 st = uv * 0.5;
    st += vec2(snoise(st + u_time * 0.04), snoise(st - u_time * 0.04)) * 0.4;

    float beam = smoothstep(0.2, 0.9, snoise(vec2(st.x + st.y * 2.0 - u_time * 0.1, u_time * 0.03)));
    vec3 glow = mix(u_color1, u_color2, snoise(uv * 2.0 + u_time * 0.15) * 0.5 + 0.5);

    float dist = distance(gl_FragCoord.xy / u_resolution.xy, vec2(0.5));
    float vignette = smoothstep(1.5, 0.1, dist);

    vec3 edgeColor = u_base;
    vec3 colorGlow = mix(baseColor, glow, beam * 0.45);

    gl_FragColor = vec4(mix(edgeColor, colorGlow, vignette), 1.0);
  }
`;

const glassVertex = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const glassFragment = /* glsl */ `
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec3 u_color1;
  uniform vec3 u_color2;
  uniform vec3 u_base;
  uniform vec3 u_lens;
  varying vec3 vNormal;
  ${snoiseLogic}
  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    uv += vNormal.xy * 0.2;
    uv.x *= u_resolution.x / u_resolution.y;

    vec3 baseColor = u_lens;
    vec2 st = uv * 0.6;
    st += vec2(snoise(st + u_time * 0.06), snoise(st - u_time * 0.06)) * 0.35;

    float beam = smoothstep(0.1, 0.9, snoise(vec2(st.x + st.y * 1.8 - u_time * 0.12, u_time * 0.02)));
    vec3 glow = mix(u_color1, u_color2, snoise(uv * 1.8 + u_time * 0.12) * 0.5 + 0.5);

    float fresnel = dot(vec3(0.0, 0.0, 1.0), vNormal);
    fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
    fresnel = pow(fresnel, 2.5);

    vec3 finalColor = mix(baseColor, glow, clamp((beam * 0.5) + (fresnel * 0.8), 0.0, 1.0));
    gl_FragColor = vec4(finalColor, 0.95);
  }
`;

// A single large lens low on the left, with a loose trail of smaller ones rising to the right.
const SPHERES = [
  { scale: 3.4, x: -5.2, y: -2.2, z: 0, speed: 0.002 },
  { scale: 1.5, x: 1.2, y: 0.6, z: 1.5, speed: 0.004 },
  { scale: 0.95, x: 5.0, y: 2.6, z: 2.5, speed: 0.005 },
  { scale: 0.55, x: 7.6, y: 4.4, z: 3.5, speed: 0.008 },
];

export function LensDrift({
  hue = 0,
  saturation = 1,
  brightness = 1,
  primaryColor,
  secondaryColor,
  backgroundColor,
  className,
}: LensDriftProps) {
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const tokens = useTokens();
  const color1 = primaryColor ?? tokens?.primary;
  const color2 = secondaryColor ?? tokens?.muted;
  const ground = backgroundColor ?? tokens?.background;
  const lens = tokens?.card;

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !color1 || !color2 || !ground || !lens) return;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;display:block";
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 12;

    const uniforms = {
      u_time: { value: 0 },
      u_resolution: { value: new THREE.Vector2() },
      u_color1: { value: raw(color1) },
      u_color2: { value: raw(color2) },
      u_base: { value: raw(ground) },
      u_lens: { value: raw(lens) },
    };

    const bgGeometry = new THREE.PlaneGeometry(2, 2);
    const bgMaterial = new THREE.ShaderMaterial({
      vertexShader: `void main() { gl_Position = vec4(position, 1.0); }`,
      fragmentShader: bgFragment,
      uniforms,
      depthWrite: false,
      depthTest: false,
    });
    const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
    bgMesh.position.z = -15;
    scene.add(bgMesh);

    const glassMaterial = new THREE.ShaderMaterial({
      vertexShader: glassVertex,
      fragmentShader: glassFragment,
      uniforms,
      transparent: true,
    });
    const sphereGeo = new THREE.SphereGeometry(1, 64, 64);
    const spheres = SPHERES.map((data) => {
      const mesh = new THREE.Mesh(sphereGeo, glassMaterial);
      mesh.scale.set(data.scale, data.scale, data.scale);
      mesh.position.set(data.x, data.y, data.z);
      scene.add(mesh);
      return { mesh, baseY: data.y, speed: data.speed, offset: Math.random() * Math.PI * 2 };
    });

    // Mouse offset from the host centre, like the original's offset from the window centre.
    let mouseX = 0;
    let mouseY = 0;
    const onPointerMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      mouseX = event.clientX - (rect.left + rect.width / 2);
      mouseY = event.clientY - (rect.top + rect.height / 2);
    };
    window.addEventListener("pointermove", onPointerMove);

    const render = (time: number) => {
      uniforms.u_time.value = time;
      camera.position.x += (mouseX * 0.005 - camera.position.x) * 0.05;
      camera.position.y += (-mouseY * 0.005 - camera.position.y) * 0.05;
      camera.lookAt(scene.position);
      spheres.forEach((s) => {
        s.mesh.position.y = s.baseY + Math.sin(time * s.speed * 120 + s.offset) * 0.5;
        s.mesh.rotation.x = time * s.speed * 18;
        s.mesh.rotation.y = time * s.speed * 24;
      });
      renderer.render(scene, camera);
    };

    const resize = () => {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      const dist = camera.position.z - bgMesh.position.z;
      const vFov = (camera.fov * Math.PI) / 180;
      const planeHeight = 2 * Math.tan(vFov / 2) * dist;
      bgMesh.scale.set((planeHeight * camera.aspect) / 2, planeHeight / 2, 1);
      // CSS pixels, exactly as the original (gl_FragCoord spans more on high-DPR screens).
      uniforms.u_resolution.value.set(width, height);
      if (prefersReducedMotion) render(elapsed);
    };

    let elapsed = 0;
    let last = performance.now();
    let frame = 0;
    let visible = true;
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
      window.removeEventListener("pointermove", onPointerMove);
      bgGeometry.dispose();
      bgMaterial.dispose();
      sphereGeo.dispose();
      glassMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [prefersReducedMotion, color1, color2, ground, lens]);

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
