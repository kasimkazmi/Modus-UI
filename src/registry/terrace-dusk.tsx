"use client";
// Ported from ThreeUI Community's Expanse Field (MIT, © 2026 Meng To).

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { cn } from "@/lib/utils";

interface TerraceDuskProps {
  hue?: number;
  saturation?: number;
  brightness?: number;
  /** Colour of the bars at the bottom. */
  baseColor?: string;
  /** Gradient colour on the left side; defaults to a theme tone. */
  startColor?: string;
  /** Gradient colour on the right side; defaults to a theme tone. */
  endColor?: string;
  /** Colour above the stepped horizon. */
  horizonColor?: string;
  /** Colour behind the canvas; defaults to the theme background. */
  backgroundColor?: string;
  className?: string;
}

type Hsl = [number, number, number];

/** Theme tokens are bare HSL channels ("24 8% 20%"). */
function readTheme() {
  const style = getComputedStyle(document.documentElement);
  const read = (name: string): Hsl => {
    const [h = 0, s = 0, l = 0] = style
      .getPropertyValue(name)
      .trim()
      .split(/[\s,/%]+/)
      .map(Number);
    return [h, s, l];
  };
  const background = read("--background");
  return {
    dark: background[2] < 50,
    background,
    foreground: read("--foreground"),
    primary: read("--primary"),
    muted: read("--muted-foreground"),
  };
}

/** Comma-separated hsl(), which both canvas and THREE.Color parse. */
const hsl = ([h, s, l]: Hsl, alpha = 1) =>
  `hsla(${Math.round(h)}, ${Math.round(Math.min(100, Math.max(0, s)))}%, ${Math.round(Math.min(100, Math.max(0, l)))}%, ${alpha})`;

/** Bumps on light/dark or palette changes so canvas colours re-resolve. */
function useThemeVersion() {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const observer = new MutationObserver(() => setVersion((v) => v + 1));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "data-palette", "style"],
    });
    return () => observer.disconnect();
  }, []);
  return version;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const vertexShader = /* glsl */ `
  void main() {
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec3 u_base;
  uniform vec3 u_start;
  uniform vec3 u_end;
  uniform vec3 u_horizon;

  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    float numBars = 15.0;
    float barIndex = floor(st.x * numBars);
    float t = 1.0 - barIndex / (numBars - 1.0);

    // Breathing pulse animation
    float anim = sin(u_time * 0.5 + t * 3.0) * 0.025;

    // Curve for horizon line
    float targetHeight = 0.12 + pow(t, 1.6) * 0.62 + anim;

    vec3 colorBase = u_base;
    vec3 colorMid = mix(u_start, u_end, st.x);
    vec3 color = mix(colorBase, colorMid, smoothstep(0.1, 0.7, st.y));

    // Stepped horizon cutoff
    if (st.y > targetHeight) {
      gl_FragColor = vec4(u_horizon, 1.0);
      return;
    }

    // High-frequency film grain
    float noise = random(st * (u_time * 0.1)) * 0.08;
    gl_FragColor = vec4(color + noise, 1.0);
  }
`;

export function TerraceDusk({
  hue = 0,
  saturation = 1,
  brightness = 1,
  baseColor,
  startColor,
  endColor,
  horizonColor,
  backgroundColor = "hsl(var(--background))",
  className,
}: TerraceDuskProps) {
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const theme = useThemeVersion();

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;display:block";
    host.appendChild(renderer.domElement);

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const scene = new THREE.Scene();
    const geometry = new THREE.PlaneGeometry(2, 2);
    // The shader writes raw values; colours are passed in the same space.
    const raw = (color: string) => new THREE.Color(color).convertLinearToSRGB();
    // Terraces are a lightness ramp on the primary hue, cut out of the theme ground.
    const { dark, primary, background } = readTheme();
    const [h, s] = primary;
    const sat = Math.max(s, 34);
    const uniforms = {
      u_time: { value: 0 },
      u_resolution: { value: new THREE.Vector2() },
      u_base: { value: raw(baseColor ?? hsl([h, sat, dark ? 10 : 18])) },
      u_start: { value: raw(startColor ?? hsl([h - 26, sat + 10, dark ? 62 : 42])) },
      u_end: { value: raw(endColor ?? hsl([h, sat, dark ? 36 : 34])) },
      u_horizon: { value: raw(horizonColor ?? hsl(background)) },
    };
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
    });
    scene.add(new THREE.Mesh(geometry, material));

    const resize = () => {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      renderer.setSize(width, height, false);
      // CSS pixels, exactly as the original.
      uniforms.u_resolution.value.set(width, height);
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);

    let frame = 0;
    let visible = true;
    const render = (time: number) => {
      uniforms.u_time.value = time * 0.001;
      renderer.render(scene, camera);
    };
    const loop = (time: number) => {
      render(time);
      frame = requestAnimationFrame(loop);
    };
    const start = () => {
      cancelAnimationFrame(frame);
      if (prefersReducedMotion) render(1000);
      else if (visible && !document.hidden) frame = requestAnimationFrame(loop);
    };
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
  }, [prefersReducedMotion, baseColor, startColor, endColor, horizonColor, theme]);

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
      style={{ background: backgroundColor, filter }}
    />
  );
}
