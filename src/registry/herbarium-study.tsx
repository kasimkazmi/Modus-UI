"use client";
// Ported from ThreeUI Community's Sylva Living World (MIT, © 2026 Meng To).
import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { cn } from "@/lib/utils";

export interface HerbariumStudyProps {
  /** Number of fern fronds drawn around the plate. */
  fronds?: number;
  /** Multiplier for the orbit, growth and seed-drift speed. */
  speed?: number;
  /** Accessible label for the scene. */
  label?: string;
  className?: string;
}

type Ink = {
  ink: THREE.Color;
  ghost: THREE.Color;
  accent: THREE.Color;
  paper: THREE.Color;
  dark: boolean;
};

/* Theme tokens are bare HSL channels ("30 8% 12%"), so parse them by hand. */
function token(style: CSSStyleDeclaration, name: string) {
  const [h = 0, s = 0, l = 0] = style
    .getPropertyValue(name)
    .trim()
    .split(/[\s,/]+/)
    .map((part) => parseFloat(part));
  return new THREE.Color().setHSL(h / 360, s / 100, l / 100, THREE.SRGBColorSpace);
}

function readInk(): Ink {
  const style = getComputedStyle(document.documentElement);
  const paper = token(style, "--background");
  const hsl = { h: 0, s: 0, l: 0 };
  paper.getHSL(hsl);
  return {
    paper,
    ink: token(style, "--foreground"),
    ghost: token(style, "--muted-foreground"),
    accent: token(style, "--primary"),
    dark: hsl.l < 0.5,
  };
}

/* A seeded random so every mount draws the same plate. */
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

/* One fern frond as line segments, ordered base → tip so a growing draw range unfurls it. */
function frond(
  rand: () => number,
  base: THREE.Vector3,
  angle: number,
  height: number,
  out: number[],
) {
  const dir = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
  const side = new THREE.Vector3(-dir.z, 0, dir.x);
  const lean = 0.45 + rand() * 0.35;
  const at = (t: number) =>
    dir
      .clone()
      .multiplyScalar(height * lean * t * t + 0.15)
      .setY(height * t * (1 - 0.32 * t))
      .add(new THREE.Vector3(base.x, 0, base.z));
  const steps = 20;
  for (let i = 0; i < steps; i++) {
    const t0 = i / steps;
    const t1 = (i + 1) / steps;
    const a = at(t0);
    const b = at(t1);
    out.push(a.x, a.y, a.z, b.x, b.y, b.z);
    if (i < 3) continue;
    const tangent = b.clone().sub(a).normalize();
    const len = height * 0.15 * Math.sin(Math.PI * t1) * (1 - 0.35 * t1);
    for (const s of [-1, 1]) {
      // each pinna: a short curved stroke with a few leaflets
      let p = b.clone();
      const reach = side.clone().multiplyScalar(s).addScaledVector(tangent, 0.55).normalize();
      for (let k = 0; k < 3; k++) {
        const q = p
          .clone()
          .addScaledVector(reach, len / 3)
          .addScaledVector(tangent, len * 0.06 * k);
        out.push(p.x, p.y, p.z, q.x, q.y, q.z);
        const leaf = q.clone().addScaledVector(tangent, len * 0.22);
        out.push(q.x, q.y, q.z, leaf.x, leaf.y, leaf.z);
        p = q;
      }
    }
  }
}

/* A seed head: a curved stalk, then a sphere of fine rays. */
function seedHead(rand: () => number, x: number, z: number, height: number, out: number[]) {
  const bend = (rand() - 0.5) * 0.5;
  let prev = new THREE.Vector3(x, 0, z);
  for (let i = 1; i <= 12; i++) {
    const t = i / 12;
    const next = new THREE.Vector3(x + bend * t * t, height * t, z + bend * 0.4 * t * t);
    out.push(prev.x, prev.y, prev.z, next.x, next.y, next.z);
    prev = next;
  }
  const rays = 64;
  for (let i = 0; i < rays; i++) {
    const y = 1 - (2 * (i + 0.5)) / rays;
    const r = Math.sqrt(1 - y * y);
    const phi = i * 2.399963;
    const ray = new THREE.Vector3(Math.cos(phi) * r, y, Math.sin(phi) * r).multiplyScalar(0.42);
    const tip = prev.clone().add(ray);
    out.push(prev.x, prev.y, prev.z, tip.x, tip.y, tip.z);
  }
}

function lines(points: number[], material: THREE.LineBasicMaterial) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  return new THREE.LineSegments(geometry, material);
}

function fluffTexture() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.strokeStyle = "white";
  ctx.lineWidth = 1.4;
  ctx.translate(size / 2, size / 2);
  for (let i = 0; i < 12; i++) {
    ctx.rotate((Math.PI * 2) / 12);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -size * 0.42);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function mountHerbarium(
  host: HTMLDivElement,
  canvas: HTMLCanvasElement,
  opts: { fronds: number; speed: number; still: boolean },
) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(new THREE.Color(), 9, 22);
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);

  const inkMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.9 });
  const ghostMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.45 });
  const accentMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.95 });
  const fluffMat = new THREE.PointsMaterial({
    size: 0.16,
    map: fluffTexture(),
    transparent: true,
    depthWrite: false,
    opacity: 0.85,
  });

  const rand = rng(7);
  // three clumps; y carries each clump's base frond height
  const CLUMPS = [
    new THREE.Vector3(0, 2.6, 0),
    new THREE.Vector3(-2.6, 1.7, 1.4),
    new THREE.Vector3(2.2, 1.4, -2),
  ];
  const plants: THREE.LineSegments[] = [];
  for (let i = 0; i < opts.fronds; i++) {
    const pts: number[] = [];
    const clump = CLUMPS[i % CLUMPS.length]!;
    const ring = Math.floor(i / CLUMPS.length) % 2;
    const angle = rand() * Math.PI * 2;
    frond(rand, clump, angle, clump.y + rand() * 1.2, pts);
    plants.push(lines(pts, ring % 2 ? ghostMat : inkMat));
  }
  for (let i = 0; i < 5; i++) {
    const pts: number[] = [];
    const a = i * 1.37 + 0.6;
    const r = 1.6 + rand() * 1.6;
    seedHead(rand, Math.cos(a) * r, Math.sin(a) * r, 1.6 + rand() * 1.6, pts);
    plants.push(lines(pts, accentMat));
  }
  plants.forEach((plant) => scene.add(plant));

  // the plate: concentric contour rings and a few hatch strokes on the ground
  const ground: number[] = [];
  for (let r = 1; r <= 7; r += 0.75) {
    for (let i = 0; i < 96; i++) {
      if ((i + Math.round(r * 4)) % 9 === 0) continue;
      const a0 = (i / 96) * Math.PI * 2;
      const a1 = ((i + 1) / 96) * Math.PI * 2;
      ground.push(Math.cos(a0) * r, 0, Math.sin(a0) * r, Math.cos(a1) * r, 0, Math.sin(a1) * r);
    }
  }
  const groundLines = lines(ground, ghostMat);
  scene.add(groundLines);

  // drifting seed fluff
  const COUNT = 220;
  const fluffPos = new Float32Array(COUNT * 3);
  const fluffSeed = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    fluffPos[i * 3] = (rand() - 0.5) * 14;
    fluffPos[i * 3 + 1] = rand() * 6;
    fluffPos[i * 3 + 2] = (rand() - 0.5) * 14;
    fluffSeed[i] = rand() * 100;
  }
  const fluffGeo = new THREE.BufferGeometry();
  fluffGeo.setAttribute("position", new THREE.BufferAttribute(fluffPos, 3));
  const fluff = new THREE.Points(fluffGeo, fluffMat);
  scene.add(fluff);

  const applyInk = () => {
    const ink = readInk();
    inkMat.color.copy(ink.ink);
    ghostMat.color.copy(ink.ghost);
    accentMat.color.copy(ink.accent);
    fluffMat.color.copy(ink.dark ? ink.ink : ink.ghost);
    (scene.fog as THREE.Fog).color.copy(ink.paper);
    ghostMat.opacity = ink.dark ? 0.35 : 0.5;
  };
  applyInk();

  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  const onPointer = (event: PointerEvent) => {
    const box = host.getBoundingClientRect();
    pointer.x = ((event.clientX - box.left) / box.width) * 2 - 1;
    pointer.y = ((event.clientY - box.top) / box.height) * 2 - 1;
  };
  host.addEventListener("pointermove", onPointer);

  const GROW = 4.2;
  let elapsed = opts.still ? 60 : 0;
  let last = 0;
  let raf = 0;
  let active = true;

  const frame = (dt: number) => {
    elapsed += dt * opts.speed;
    const grow = Math.min(1, elapsed / GROW);
    plants.forEach((plant, i) => {
      const local = THREE.MathUtils.clamp(grow * 1.4 - (i % 7) * 0.05, 0, 1);
      const eased = 1 - Math.pow(1 - local, 3);
      const total = plant.geometry.getAttribute("position").count;
      plant.geometry.setDrawRange(0, Math.floor((total * eased) / 2) * 2);
    });
    // ink-bleed reveal: a soft round mask spreading from the centre of the plate
    const bleed = Math.min(1, elapsed / 2.6);
    const mask = `radial-gradient(circle at 50% 58%, black ${bleed * 95}%, transparent ${bleed * 95 + 18}%)`;
    canvas.style.maskImage = canvas.style.webkitMaskImage = bleed >= 1 ? "" : mask;

    if (!opts.still) {
      for (let i = 0; i < COUNT; i++) {
        const s = fluffSeed[i]!;
        fluffPos[i * 3] = fluffPos[i * 3]! + (0.18 + Math.sin(elapsed * 0.4 + s) * 0.12) * dt;
        fluffPos[i * 3 + 1] = fluffPos[i * 3 + 1]! + (0.08 + Math.sin(elapsed + s) * 0.05) * dt;
        if (fluffPos[i * 3]! > 7 || fluffPos[i * 3 + 1]! > 6.5) {
          fluffPos[i * 3] = -7;
          fluffPos[i * 3 + 1] = Math.random() * 2;
        }
      }
      fluffGeo.attributes.position!.needsUpdate = true;
    }

    pointer.sx += (pointer.x - pointer.sx) * 0.05;
    pointer.sy += (pointer.y - pointer.sy) * 0.05;
    const orbit = elapsed * 0.06 + 0.9 + pointer.sx * 0.25;
    camera.position.set(Math.cos(orbit) * 9.5, 3.4 - pointer.sy * 0.6, Math.sin(orbit) * 9.5);
    camera.lookAt(0, 1.4, 0);
    renderer.render(scene, camera);
  };

  const loop = (now: number) => {
    raf = requestAnimationFrame(loop);
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    frame(dt);
  };
  const setActive = (next: boolean) => {
    active = next;
    cancelAnimationFrame(raf);
    raf = 0;
    last = 0;
    if (active && !opts.still) raf = requestAnimationFrame(loop);
  };

  const resize = () => {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 1 ? 48 : 34;
    camera.updateProjectionMatrix();
    frame(0);
  };
  resize();
  setActive(true);

  const themeObserver = new MutationObserver(() => {
    applyInk();
    frame(0);
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "data-theme", "style"],
  });

  return {
    resize,
    setActive,
    dispose() {
      cancelAnimationFrame(raf);
      themeObserver.disconnect();
      host.removeEventListener("pointermove", onPointer);
      scene.traverse((object) => {
        if (object instanceof THREE.LineSegments || object instanceof THREE.Points) {
          object.geometry.dispose();
        }
      });
      fluffMat.map?.dispose();
      [inkMat, ghostMat, accentMat, fluffMat].forEach((material) => material.dispose());
      renderer.dispose();
    },
  };
}

export function HerbariumStudy({
  fronds = 18,
  speed = 1,
  label = "Ink-drawn ferns and seed heads growing on a paper plate while seed fluff drifts past",
  className,
}: HerbariumStudyProps) {
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const study = mountHerbarium(host, canvas, { fronds, speed, still: !!prefersReducedMotion });

    let visible = true;
    const sync = () => study.setActive(visible && !document.hidden);
    const resizeObserver = new ResizeObserver(() => study.resize());
    resizeObserver.observe(host);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      sync();
    });
    intersectionObserver.observe(host);
    document.addEventListener("visibilitychange", sync);
    return () => {
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", sync);
      study.dispose();
    };
  }, [fronds, speed, prefersReducedMotion]);

  return (
    <div
      ref={hostRef}
      role="img"
      aria-label={label}
      className={cn(
        "absolute inset-0 overflow-hidden",
        "bg-[radial-gradient(70%_55%_at_70%_18%,hsl(var(--muted))_0%,hsl(var(--background))_70%)]",
        "dark:bg-[radial-gradient(60%_50%_at_72%_16%,hsl(var(--primary)/0.22)_0%,hsl(var(--background))_70%)]",
        className,
      )}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <span className="pointer-events-none absolute bottom-4 left-5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        Plate IV · Polypodiales
      </span>
    </div>
  );
}
