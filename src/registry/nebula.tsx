"use client";
// Ported from ThreeUI Community's Nebula (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { cn } from "@/lib/utils";

interface NebulaProps {
  mode?: "dark" | "light";
  hue?: number;
  saturation?: number;
  brightness?: number;
  /** Colour of the outer nebula mass. */
  deepColor?: string;
  /** Colour of the dense nebula core. */
  coreColor?: string;
  /** Colour of the vertical tongue of light. */
  glowColor?: string;
  backgroundColor?: string;
  className?: string;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

// The original shader writes raw colour values (three r128, no colour management).
const raw = (value: string) => new THREE.Color(value).convertLinearToSRGB();

const fragmentShader = /* glsl */ `
  precision highp float;
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec2 u_mouse;
  uniform vec3 u_deep;
  uniform vec3 u_purple;
  uniform vec3 u_violet;

  vec3 mod289(vec3 x){return x - floor(x*(1.0/289.0))*289.0;}
  vec2 mod289(vec2 x){return x - floor(x*(1.0/289.0))*289.0;}
  vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}
  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
  float fbm(vec2 p){
    float v = 0.0; float a = 0.55;
    for(int i=0;i<4;i++){ v += a*snoise(p); p *= 2.05; a *= 0.5; }
    return v;
  }

  void main(){
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = uv;
    p.x *= u_resolution.x / u_resolution.y;

    float t = u_time * 0.05;
    vec2 drift = (u_mouse - 0.5) * 0.12;

    // warp coordinates for fluid motion
    vec2 st = p * 0.85 + drift;
    st += vec2(fbm(st + t), fbm(st - t)) * 0.35;

    vec3 col = vec3(0.005, 0.005, 0.012); // deep zinc base

    // main indigo mass, weighted to the right / upper-right
    vec2 c1 = vec2(u_resolution.x / u_resolution.y * 0.62, 0.85) + drift;
    float d1 = length(p - c1);
    float n1 = fbm(st * 1.4 + t * 2.0);
    float mass = smoothstep(1.15, 0.05, d1 + n1 * 0.32);

    // vertical sweeping tongue of light
    float tongue = smoothstep(0.55, 0.02, abs(p.x - (u_resolution.x/u_resolution.y*0.58) - n1*0.22)) * smoothstep(1.2, 0.1, abs(uv.y - 0.55));

    // secondary far-right glow
    vec2 c2 = vec2(u_resolution.x / u_resolution.y * 1.05, 0.5);
    float d2 = length(p - c2);
    float mass2 = smoothstep(0.9, 0.0, d2 + fbm(st*1.1 - t)*0.25);

    vec3 deepIndigo = u_deep;
    vec3 purple = u_purple;
    vec3 hotViolet = u_violet;

    col = mix(col, deepIndigo, clamp(mass*0.9 + mass2*0.7, 0.0, 1.0));
    col = mix(col, purple, clamp(mass*mass*1.1 + mass2*0.55, 0.0, 1.0));
    col += hotViolet * tongue * mass * 0.85;

    // breathing pulse
    float pulse = 0.92 + 0.08 * sin(u_time * 0.4);
    col *= pulse;

    // vignette
    float vig = smoothstep(1.6, 0.35, length(uv - vec2(0.45, 0.5)));
    col *= mix(0.55, 1.0, vig);

    // keep left side dark for the sans name
    col *= mix(0.35, 1.0, smoothstep(0.0, 0.55, uv.x));

    gl_FragColor = vec4(col, 1.0);
  }
`;

export function Nebula({
  mode = "dark",
  hue = 0,
  saturation = 1,
  brightness = 1,
  deepColor = "#0d0526",
  coreColor = "#331a99",
  glowColor = "#804dff",
  backgroundColor = "#09090b",
  className,
}: NebulaProps) {
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
      u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
      u_deep: { value: raw(deepColor) },
      u_purple: { value: raw(coreColor) },
      u_violet: { value: raw(glowColor) },
    };
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: "void main(){ gl_Position = vec4(position, 1.0); }",
      fragmentShader,
    });
    scene.add(new THREE.Mesh(geometry, material));

    // Pointer position normalised to the host, like the original's window.
    const mouseTarget = { x: 0.5, y: 0.5 };
    const onPointerMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      mouseTarget.x = (event.clientX - rect.left) / Math.max(1, rect.width);
      mouseTarget.y = 1.0 - (event.clientY - rect.top) / Math.max(1, rect.height);
    };
    window.addEventListener("pointermove", onPointerMove);

    let elapsed = 0;
    const render = () => {
      uniforms.u_time.value = elapsed;
      uniforms.u_mouse.value.x += (mouseTarget.x - uniforms.u_mouse.value.x) * 0.03;
      uniforms.u_mouse.value.y += (mouseTarget.y - uniforms.u_mouse.value.y) * 0.03;
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
      window.removeEventListener("pointermove", onPointerMove);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [prefersReducedMotion, deepColor, coreColor, glowColor]);

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
