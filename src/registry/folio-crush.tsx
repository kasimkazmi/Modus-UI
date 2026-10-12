"use client";
// A printed sheet in WebGL: press and hold to crush it into a ball, drag it around, let go to smooth it out.

import { useEffect, useRef, type CSSProperties } from "react";
import { animate, useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { cn } from "@/lib/utils";

type CrushState = "flat" | "crushing" | "crushed" | "restoring";

interface FolioCrushProps {
  src: string;
  alt?: string;
  backSrc?: string;
  width?: number;
  height?: number;
  sceneHeight?: number;
  imageFit?: "cover" | "contain";
  releaseBehavior?: "restore" | "stay";
  crumpleAmount?: number;
  crumpleDuration?: number;
  releaseDuration?: number;
  foldCount?: number;
  foldSharpness?: number;
  wrinkleDepth?: number;
  creaseStrength?: number;
  paperColor?: string;
  roughness?: number;
  paperTexture?: number;
  lightIntensity?: number;
  lightAngle?: number;
  shadow?: boolean;
  shadowOpacity?: number;
  draggable?: boolean;
  dragRotation?: number;
  dragRadius?: number;
  returnToOrigin?: boolean;
  rotation?: number;
  seed?: number;
  detail?: number;
  disabled?: boolean;
  resetKey?: number;
  onStateChange?: (state: CrushState) => void;
  onError?: (error: unknown) => void;
  style?: CSSProperties;
  className?: string;
}

/** Small deterministic PRNG so a seed always gives the same crumple. */
function mulberry(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Turns any CSS colour (theme tokens included) into a THREE.Color. */
function resolveColor(el: HTMLElement, css: string) {
  const probe = document.createElement("span");
  probe.style.color = css;
  el.appendChild(probe);
  const rgb = getComputedStyle(probe).color;
  probe.remove();
  return new THREE.Color(rgb.replace(/\s*\/\s*[\d.]+\)/, ")"));
}

function grainTexture(rand: () => number) {
  const size = 128;
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < data.length; i += 4) {
    const v = 128 + (rand() - 0.5) * 255;
    data[i] = data[i + 1] = data[i + 2] = v;
    data[i + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, size, size);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.needsUpdate = true;
  return tex;
}

export function FolioCrush({
  src,
  alt = "Folio print",
  backSrc = "",
  width = 320,
  height = 400,
  sceneHeight = 560,
  imageFit = "cover",
  releaseBehavior = "restore",
  crumpleAmount = 0.85,
  crumpleDuration = 0.55,
  releaseDuration = 0.4,
  foldCount = 6,
  foldSharpness = 0.6,
  wrinkleDepth = 0.65,
  creaseStrength = 0.18,
  paperColor = "hsl(var(--muted))",
  roughness = 0.92,
  paperTexture = 0.08,
  lightIntensity = 1.8,
  lightAngle = -35,
  shadow = true,
  shadowOpacity = 0.08,
  draggable = true,
  dragRotation = 10,
  dragRadius = 180,
  returnToOrigin = true,
  rotation = -4,
  seed = 7,
  detail = 64,
  disabled = false,
  resetKey = 0,
  onStateChange,
  onError,
  style,
  className,
}: FolioCrushProps) {
  const reduce = useReducedMotion();
  const host = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onStateChange, onError });
  callbacks.current = { onStateChange, onError };

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const rand = mulberry(seed);
    const time = (s: number) => (reduce ? 0 : s);

    // Scene, with a camera placed so one world unit is one CSS pixel at z = 0.
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 1, 5000);
    camera.position.z = sceneHeight / 2 / Math.tan((15 * Math.PI) / 180);
    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const sun = new THREE.DirectionalLight(0xffffff, lightIntensity);
    const a = (lightAngle * Math.PI) / 180;
    sun.position.set(Math.sin(a) * 400, Math.cos(a) * 400, 500);
    scene.add(sun);

    // Geometry: precompute flat, creased and balled positions per vertex.
    const geo = new THREE.PlaneGeometry(width, height, detail, detail);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const count = pos.count;
    const flat = Float32Array.from(pos.array as Float32Array);
    const relief = new Float32Array(count);
    const ball = new Float32Array(count * 3);
    const folds = Array.from({ length: foldCount }, () => {
      const t = rand() * Math.PI;
      return {
        nx: Math.cos(t),
        ny: Math.sin(t),
        c: (rand() - 0.5) * width,
        amp: (rand() < 0.5 ? -1 : 1) * (8 + rand() * 14),
      };
    });
    const waves = Array.from({ length: 4 }, () => ({
      k: 0.02 + rand() * 0.04,
      p: rand() * 6.28,
      t: rand() * 6.28,
    }));
    const reach = 4 + (1 - foldSharpness) * 30;
    const radius = Math.sqrt((width * height) / (4 * Math.PI)) * 0.8;
    for (let i = 0; i < count; i++) {
      const x = flat[i * 3];
      const y = flat[i * 3 + 1];
      let z = 0;
      for (const f of folds) z += f.amp * Math.exp(-Math.abs(x * f.nx + y * f.ny - f.c) / reach);
      for (const w of waves)
        z += 4 * wrinkleDepth * Math.sin(w.k * (x * Math.cos(w.t) + y * Math.sin(w.t)) + w.p);
      relief[i] = z;
      const lon = (x / (width / 2)) * Math.PI;
      const lat = (y / (height / 2)) * (Math.PI / 2) * 0.96;
      const r = radius * (1 + (z / 40) * wrinkleDepth);
      ball[i * 3] = r * Math.sin(lon) * Math.cos(lat);
      ball[i * 3 + 1] = r * Math.sin(lat);
      ball[i * 3 + 2] = r * Math.cos(lon) * Math.cos(lat);
    }
    const shade = new Float32Array(count * 3).fill(1);
    geo.setAttribute("color", new THREE.BufferAttribute(shade, 3));
    const maxRelief = Math.max(1, ...Array.from(relief, Math.abs));

    const paper = resolveColor(el, paperColor);
    const grain = paperTexture > 0 ? grainTexture(rand) : null;
    const material = (side: THREE.Side) =>
      new THREE.MeshStandardMaterial({
        color: paper,
        side,
        roughness,
        vertexColors: true,
        bumpMap: grain,
        bumpScale: paperTexture * 4,
      });
    const front = material(THREE.FrontSide);
    const back = material(THREE.BackSide);
    const sheet = new THREE.Group();
    sheet.add(new THREE.Mesh(geo, front), new THREE.Mesh(geo, back));
    sheet.rotation.z = (rotation * Math.PI) / 180;
    scene.add(sheet);

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    const load = (url: string, target: THREE.MeshStandardMaterial, mirror: boolean) =>
      loader.load(
        url,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          const img = tex.image as HTMLImageElement;
          const ratio = img.width / img.height / (width / height);
          const fit = imageFit === "cover" ? ratio > 1 : ratio < 1;
          if (fit) tex.repeat.set(1 / ratio, 1);
          else tex.repeat.set(1, ratio);
          if (mirror) tex.repeat.x *= -1;
          tex.offset.set((1 - tex.repeat.x) / 2, (1 - tex.repeat.y) / 2);
          if (imageFit === "contain") tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
          target.map = tex;
          target.color.set(0xffffff);
          target.needsUpdate = true;
          dirty = true;
        },
        undefined,
        (err) => callbacks.current.onError?.(err),
      );
    load(src, front, false);
    if (backSrc) load(backSrc, back, true);

    // State, animated with framer-motion and read each frame.
    let crush = 0;
    let dirty = true;
    const offset = { x: 0, y: 0, tilt: 0 };
    let state: CrushState = "flat";
    const setState = (s: CrushState) => {
      state = s;
      callbacks.current.onStateChange?.(s);
    };
    let crushAnim: ReturnType<typeof animate> | null = null;
    const crushTo = (to: number, duration: number, after: CrushState) => {
      crushAnim?.stop();
      crushAnim = animate(crush, to, {
        duration: time(duration),
        ease: to ? [0.5, 0, 0.2, 1] : [0.2, 0.8, 0.3, 1],
        onUpdate: (v) => {
          crush = v;
          dirty = true;
        },
        onComplete: () => setState(after),
      });
    };
    const moveTo = (x: number, y: number) => {
      animate(
        offset,
        { x, y, tilt: 0 },
        { type: "spring", bounce: 0.3, duration: time(0.6), onUpdate: () => (dirty = true) },
      );
    };

    const apply = () => {
      const t = crush * crumpleAmount;
      const e = t * t * (3 - 2 * t);
      const arr = pos.array as Float32Array;
      for (let i = 0; i < count; i++) {
        const j = i * 3;
        const fz = relief[i] * Math.min(1, crush * 3) * wrinkleDepth;
        arr[j] = flat[j] + (ball[j] - flat[j]) * e;
        arr[j + 1] = flat[j + 1] + (ball[j + 1] - flat[j + 1]) * e;
        arr[j + 2] = fz * (1 - e) + ball[j + 2] * e;
        const c = 1 - creaseStrength * crush * (Math.abs(relief[i]) / maxRelief);
        shade[j] = shade[j + 1] = shade[j + 2] = c;
      }
      pos.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;
      geo.computeVertexNormals();
      sheet.position.set(offset.x, offset.y, 0);
      sheet.rotation.set(offset.tilt * 0.5, offset.tilt, (rotation * Math.PI) / 180 + offset.tilt);
    };

    let raf = 0;
    const frame = () => {
      if (dirty) {
        dirty = false;
        apply();
        renderer.render(scene, camera);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const resize = () => {
      const w = el.clientWidth;
      renderer.setSize(w, sceneHeight);
      camera.aspect = w / sceneHeight;
      camera.updateProjectionMatrix();
      dirty = true;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();

    // Pointer: press to crush, drag while held, release to restore.
    const canvas = renderer.domElement;
    let grab: { x: number; y: number; ox: number; oy: number; lx: number; smooth: boolean } | null =
      null;
    const down = (e: PointerEvent) => {
      if (disabled) return;
      canvas.setPointerCapture(e.pointerId);
      grab = {
        x: e.clientX,
        y: e.clientY,
        ox: offset.x,
        oy: offset.y,
        lx: e.clientX,
        smooth: state === "crushed",
      };
      if (state === "flat" || state === "restoring") {
        setState("crushing");
        crushTo(1, crumpleDuration, "crushed");
      }
    };
    const move = (e: PointerEvent) => {
      if (!grab || !draggable) return;
      let x = grab.ox + e.clientX - grab.x;
      let y = grab.oy - (e.clientY - grab.y);
      const d = Math.hypot(x, y);
      if (d > dragRadius) {
        x *= dragRadius / d;
        y *= dragRadius / d;
      }
      const max = (dragRotation * Math.PI) / 180;
      offset.tilt = Math.max(-max, Math.min(max, (e.clientX - grab.lx) * 0.02));
      grab.lx = e.clientX;
      offset.x = x;
      offset.y = y;
      dirty = true;
    };
    const up = () => {
      if (!grab) return;
      const { smooth } = grab;
      grab = null;
      if (returnToOrigin) moveTo(0, 0);
      else moveTo(offset.x, offset.y);
      // With "stay", a second press smooths the ball back out.
      if (releaseBehavior === "restore" || smooth) {
        setState("restoring");
        crushTo(0, releaseDuration, "flat");
      }
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas.style.touchAction = "none";
    canvas.style.cursor = disabled ? "default" : "grab";

    return () => {
      cancelAnimationFrame(raf);
      crushAnim?.stop();
      observer.disconnect();
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      geo.dispose();
      front.map?.dispose();
      back.map?.dispose();
      grain?.dispose();
      front.dispose();
      back.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, [
    src,
    backSrc,
    width,
    height,
    sceneHeight,
    imageFit,
    releaseBehavior,
    crumpleAmount,
    crumpleDuration,
    releaseDuration,
    foldCount,
    foldSharpness,
    wrinkleDepth,
    creaseStrength,
    paperColor,
    roughness,
    paperTexture,
    lightIntensity,
    lightAngle,
    draggable,
    dragRotation,
    dragRadius,
    returnToOrigin,
    rotation,
    seed,
    detail,
    disabled,
    resetKey,
    reduce,
  ]);

  return (
    <div
      ref={host}
      role="img"
      aria-label={alt}
      className={cn("relative w-full overflow-hidden", className)}
      style={{
        height: sceneHeight,
        filter: shadow
          ? `drop-shadow(0 18px 22px hsl(var(--foreground) / ${shadowOpacity * 3}))`
          : undefined,
        ...style,
      }}
    />
  );
}
