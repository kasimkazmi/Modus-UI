"use client";

// Ported from ThreeUI Community's Portal Field (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { cn } from "@/lib/utils";

interface PortalFieldProps {
  speed?: number;
  size?: number;
  length?: number;
  opacity?: number;
  hue?: number;
  saturation?: number;
  brightness?: number;
  coreColor?: string;
  fringeColor?: string;
  backgroundColor?: string;
  className?: string;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

// Shader colours are raw sRGB values, as in the original three r134 page (no colour management).
const rawColor = (target: THREE.Color, hex: string) =>
  target.setStyle(hex, THREE.LinearSRGBColorSpace);

/** WebGL1 GLSL ES requires float literals (10.0), not ints (10). */
const glslFloat = (value: number, digits = 3) => {
  const fixed = Number(value).toFixed(digits);
  return fixed.includes(".") ? fixed : `${fixed}.0`;
};

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = (size: number, length: number) => `
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec2 u_mouse;
  uniform vec3 u_colorCore;
  uniform vec3 u_colorFringe;
  uniform float u_isLightMode;
  varying vec2 vUv;

  vec2 hash( vec2 p ) {
    p = vec2( dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)) );
    return -1.0 + 2.0*fract(sin(p)*43758.5453123);
  }
  float noise( in vec2 p ) {
    const float K1 = 0.366025404;
    const float K2 = 0.211324865;
    vec2 i = floor( p + (p.x+p.y)*K1 );
    vec2 a = p - i + (i.x+i.y)*K2;
    vec2 o = (a.x>a.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
    vec2 b = a - o + K2;
    vec2 c = a - 1.0 + 2.0*K2;
    vec3 h = max( 0.5-vec3(dot(a,a), dot(b,b), dot(c,c) ), 0.0 );
    vec3 n = h*h*h*h*vec3( dot(a,hash(i+0.0)), dot(b,hash(i+o)), dot(c,hash(i+1.0)));
    return dot( n, vec3(70.0) );
  }

  float sdArc(vec2 p, vec2 center, float radius, float width, float warp) {
    p.y += sin(p.x * 2.0 + u_time * 0.3) * warp;
    p.x += noise(p * 1.5 + u_time * 0.1) * (warp * 0.8);
    float d = length(p - center) - radius;
    return abs(d) - width;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 st = uv;
    st.x *= u_resolution.x / u_resolution.y;

    vec2 mouseOffset = (u_mouse - 0.5) * 0.05;
    st += mouseOffset;

    vec2 center = vec2(0.5, 0.5);

    float d1 = sdArc(st, center, ${glslFloat(0.6 * length, 3)}, ${glslFloat(0.02 * size, 4)}, 0.15);
    float d2 = sdArc(st, center, ${glslFloat(0.65 * length, 3)}, ${glslFloat(0.06 * size, 4)}, 0.2);

    float coreGlow = exp(-d1 * 30.0);
    float fringeGlow = exp(-d2 * 10.0);
    float wash = smoothstep(1.5, -0.5, length(st - center)) * 0.15;

    vec3 finalColor = vec3(0.0);
    finalColor += u_colorCore * coreGlow;
    finalColor += u_colorFringe * fringeGlow;
    finalColor += u_colorFringe * wash * (sin(u_time * 0.5) * 0.2 + 0.8);

    float alpha = clamp(coreGlow + fringeGlow + wash, 0.0, 1.0);
    finalColor = vec3(1.0) - exp(-finalColor * 1.5);

    if(u_isLightMode > 0.5) {
      alpha = clamp((coreGlow * 1.2 + fringeGlow + wash * 0.4), 0.0, 0.4);
    }

    gl_FragColor = vec4(finalColor, alpha * 0.6);
  }
`;

export function PortalField({
  speed = 1,
  size = 1,
  length = 1,
  opacity = 1,
  hue = 0,
  saturation = 1,
  brightness = 1,
  coreColor = "#FFFFFF",
  fringeColor = "#1e3a8a",
  backgroundColor = "#05060a",
  className,
}: PortalFieldProps) {
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const live = useRef({ speed, coreColor, fringeColor });
  live.current = { speed: clamp(speed, 0, 3), coreColor, fringeColor };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    host.appendChild(renderer.domElement);

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: fragmentShader(clamp(size, 0.05, 200), clamp(length, 0.35, 2.5)),
      uniforms: {
        u_time: { value: 0 },
        u_resolution: { value: new THREE.Vector2(1, 1) },
        u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
        u_colorCore: { value: rawColor(new THREE.Color(), live.current.coreColor) },
        u_colorFringe: { value: rawColor(new THREE.Color(), live.current.fringeColor) },
        u_isLightMode: { value: 0 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const targetMouse = new THREE.Vector2(0.5, 0.5);
    const onPointerMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      targetMouse.x = (event.clientX - rect.left) / rect.width;
      targetMouse.y = 1 - (event.clientY - rect.top) / rect.height;
    };

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      renderer.setSize(width, height, false);
      // The original passes CSS pixels here while gl_FragCoord is in device pixels.
      material.uniforms.u_resolution.value.set(width, height);
    };

    let time = 0;
    let last = performance.now();
    const render = () => {
      const now = performance.now();
      time += ((now - last) / 1000) * live.current.speed;
      last = now;
      material.uniforms.u_time.value = time;
      rawColor(material.uniforms.u_colorCore.value, live.current.coreColor);
      rawColor(material.uniforms.u_colorFringe.value, live.current.fringeColor);
      material.uniforms.u_mouse.value.lerp(targetMouse, 0.03);
      renderer.render(scene, camera);
    };

    let frame = 0;
    let visible = true;
    const tick = () => {
      render();
      frame = visible && !document.hidden ? requestAnimationFrame(tick) : 0;
    };
    const start = () => {
      if (prefersReducedMotion || frame || !visible || document.hidden) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };

    const resizeObserver = new ResizeObserver(() => {
      resize();
      render();
    });
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      if (visible) start();
      else stop();
    });
    const onVisibility = () => (document.hidden ? stop() : start());

    resize();
    render();
    resizeObserver.observe(host);
    intersection.observe(host);
    window.addEventListener("pointermove", onPointerMove);
    document.addEventListener("visibilitychange", onVisibility);
    start();

    return () => {
      stop();
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibility);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [prefersReducedMotion, size, length]);

  const safeHue = clamp(hue, -180, 180);
  const safeSaturation = clamp(saturation, 0, 2);
  const safeBrightness = clamp(brightness, 0.35, 1.65);
  const filter =
    safeHue === 0 && safeSaturation === 1 && safeBrightness === 1
      ? undefined
      : `hue-rotate(${safeHue}deg) saturate(${safeSaturation}) brightness(${safeBrightness})`;

  return (
    <div
      className={cn("absolute inset-0 isolate overflow-hidden", className)}
      style={{ background: backgroundColor, filter }}
    >
      <div
        ref={hostRef}
        className="absolute inset-0 mix-blend-screen"
        style={{ opacity: clamp(opacity, 0.05, 1) }}
      />
    </div>
  );
}
