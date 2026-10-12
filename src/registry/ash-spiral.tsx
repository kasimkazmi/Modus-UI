"use client";
// Ported from ThreeUI Community's Ember Storm (MIT, © 2026 Meng To).

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { cn } from "@/lib/utils";

interface AshSpiralProps {
  hue?: number;
  saturation?: number;
  brightness?: number;
  /** Colour of the outer, cooling sparks. */
  emberColor?: string;
  /** Colour of the hot, inner sparks. */
  heatColor?: string;
  /** Colour of the bright spiral core. */
  coreColor?: string;
  /** Colour behind the spiral; defaults to the theme background. */
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

// The shaders write raw colour values: CSS colours are used as-is.
const raw = (value: string) => new THREE.Color(value).convertLinearToSRGB();

const COUNT = 12000;
const RES = 0.5;

const vertexShader = /* glsl */ `
  attribute float aSeed;
  attribute float aAng;
  attribute float aRad;
  uniform float uTime;
  uniform float uScale;
  uniform float uAspect;
  varying float vHeat;
  varying float vFlick;
  varying float vCore;
  float hash(float n){ return fract(sin(n*12.9898)*43758.5453); }
  void main(){
      float life = hash(aSeed*7.31);
      float u = fract(uTime*(0.045 + life*0.06) + aSeed);
      float rmax = 0.58 + aRad*0.48;
      float r = max(rmax*(1.0 - u*0.82), 0.018);
      float omega = (0.55 + life*0.55) / (r*0.9 + 0.12);
      float spiral = (rmax - r)*5.2;
      float theta = aAng + uTime*omega*0.34 + spiral;
      float t1 = sin(theta*3.0 + aSeed*10.0 + uTime*0.8);
      float t2 = sin(r*9.0 - uTime*1.1 + aSeed*4.0);
      r += t1*0.022 + t2*0.016;
      float cx = -0.24, cy = -0.02;
      float x = cx + (cos(theta)*r)/uAspect;
      float y = cy + sin(theta)*r;
      y += u*0.11 + sin(uTime*5.0 + aSeed*30.0)*0.006;
      x += sin(uTime*3.3 + aSeed*22.0)*0.004/uAspect;

      vCore  = 1.0 - smoothstep(0.0, 0.17, r);
      vHeat  = clamp(pow(1.0-u, 1.3) * (0.5 + 0.5*(1.0-r)), 0.0, 1.0);
      vFlick = 0.55 + 0.45*sin(uTime*9.0 + aSeed*40.0);
      float sz = (0.7 + hash(aSeed*12.3)*2.7) * (0.45 + vHeat*1.55 + vCore*1.4);
      gl_Position = vec4(x, y, 0.0, 1.0);
      gl_PointSize = sz * uScale;
  }
                
`;

const fragmentShader = /* glsl */ `
  precision mediump float;
  varying float vHeat;
  varying float vFlick;
  varying float vCore;
  uniform vec3 uCrimson;
  uniform vec3 uAmber;
  uniform vec3 uWhite;
  uniform float uInk;
  void main(){
      vec2 p = gl_PointCoord*2.0 - 1.0;
      float d = dot(p,p);
      if(d>1.0) discard;
      float core = (1.0-d); core *= core;
      vec3 crimson = uCrimson;
      vec3 amber   = uAmber;
      vec3 white   = uWhite;
      vec3 c = mix(crimson, amber, vHeat);
      c = mix(c, white, vCore*0.85);
      float a = core*(0.28 + 0.85*vHeat)*vFlick + core*vCore*0.55;
      gl_FragColor = vec4(c*mix(1.0 + vHeat*0.5 + vCore*0.7, 1.0, uInk), a*mix(1.0, 1.6, uInk));
  }
                
`;

export function AshSpiral({
  hue = 0,
  saturation = 1,
  brightness = 1,
  emberColor,
  heatColor,
  coreColor,
  backgroundColor = "hsl(var(--background))",
  className,
}: AshSpiralProps) {
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const theme = useThemeVersion();

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    // Sparks are inks on the primary hue: light on the dark ground, dark on paper.
    const { dark, primary } = readTheme();
    const [h, s] = primary;
    const sat = Math.max(s, dark ? 26 : 42);
    const outer = emberColor ?? hsl([h - 14, sat, dark ? 52 : 40]);
    const inner = heatColor ?? hsl([h, sat + 18, dark ? 74 : 24]);
    const core = coreColor ?? hsl([h, dark ? 40 : sat, dark ? 92 : 14]);

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: "high-performance",
    });
    // Rendered at half resolution and stretched, exactly as the original.
    renderer.setPixelRatio(1);
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.cssText = `position:absolute;inset:0;width:100%;height:100%;display:block;mix-blend-mode:${dark ? "screen" : "multiply"}`;
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const seeds = new Float32Array(COUNT);
    const angs = new Float32Array(COUNT);
    const rads = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      seeds[i] = Math.random();
      angs[i] = Math.random() * Math.PI * 2.0;
      rads[i] = Math.sqrt(Math.random());
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geo.setAttribute("aAng", new THREE.BufferAttribute(angs, 1));
    geo.setAttribute("aRad", new THREE.BufferAttribute(rads, 1));

    const uniforms = {
      uTime: { value: 0 },
      uScale: { value: 1 },
      uAspect: { value: 1.6 },
      uCrimson: { value: raw(outer) },
      uAmber: { value: raw(inner) },
      uWhite: { value: raw(core) },
      uInk: { value: dark ? 0 : 1 },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: dark ? THREE.AdditiveBlending : THREE.NormalBlending,
      vertexShader,
      fragmentShader,
    });
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    scene.add(points);

    const render = () => renderer.render(scene, camera);

    const resize = () => {
      const w = Math.max(1, host.clientWidth);
      const h = Math.max(1, host.clientHeight);
      renderer.setSize(Math.round(w * RES), Math.round(h * RES), false);
      uniforms.uAspect.value = Math.max(0.6, w / h);
      uniforms.uScale.value = Math.max(0.6, (h * RES) / 900);
      if (prefersReducedMotion) render();
    };

    let frame = 0;
    let visible = true;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      uniforms.uTime.value += dt;
      render();
      frame = requestAnimationFrame(loop);
    };
    const start = () => {
      cancelAnimationFrame(frame);
      if (prefersReducedMotion) {
        uniforms.uTime.value = 9.1;
        render();
      } else if (visible && !document.hidden) {
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
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [prefersReducedMotion, emberColor, heatColor, coreColor, theme]);

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
