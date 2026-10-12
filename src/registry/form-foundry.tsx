"use client";
// Ported from ThreeUI Community's Japanese Tower (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { cn } from "@/lib/utils";

export type FormFoundryVariant = "ziggurat" | "monoliths" | "lattice" | "arch" | "ring" | "columns";

const VARIANTS: FormFoundryVariant[] = [
  "ziggurat",
  "monoliths",
  "lattice",
  "arch",
  "ring",
  "columns",
];

const LABELS: Record<FormFoundryVariant, string> = {
  ziggurat: "A stepped ziggurat",
  monoliths: "Three stacked monoliths",
  lattice: "A lattice spire",
  arch: "A stone arch",
  ring: "A ring tower",
  columns: "A field of columns",
};

interface FormFoundryProps {
  /** Which abstract form assembles on the plinth. */
  variant?: FormFoundryVariant;
  className?: string;
}

/** A block in the form: grid position and whether it carries the accent colour. */
interface Block {
  x: number;
  y: number;
  z: number;
  accent: boolean;
}

function buildForm(variant: FormFoundryVariant): Block[] {
  const out: Block[] = [];
  const add = (x: number, y: number, z: number, accent = false) => out.push({ x, y, z, accent });
  switch (variant) {
    case "ziggurat":
      for (let k = 0; k < 6; k++) {
        const h = 5 - k;
        for (let x = -h; x <= h; x++)
          for (let z = -h; z <= h; z++)
            add(x, k, z, k === 5 || (Math.abs(x) === h && Math.abs(z) === h));
      }
      break;
    case "monoliths":
      [
        { ox: -3, oz: 0.5, h: 8 },
        { ox: 0, oz: -1, h: 12 },
        { ox: 3, oz: 1, h: 6 },
      ].forEach(({ ox, oz, h }) => {
        for (let y = 0; y < h; y++)
          for (let dx = 0; dx < 2; dx++) add(ox + dx - 0.5, y, oz, y === h - 1);
      });
      break;
    case "lattice":
      for (let y = 0; y < 16; y++) {
        const r = y < 5 ? 2 : y < 10 ? 1.5 : y < 14 ? 1 : 0;
        if (r === 0) {
          add(0, y, 0, true);
          continue;
        }
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(sx * r, y, sz * r);
        if (y % 3 === 2)
          for (let t = -r + 1; t <= r - 1; t += 1) {
            add(t, y, -r, true);
            add(t, y, r, true);
            add(-r, y, t, true);
            add(r, y, t, true);
          }
      }
      break;
    case "arch":
      for (let y = 0; y < 6; y++)
        for (const px of [-4, 4])
          for (let dx = 0; dx < 2; dx++) for (let z = 0; z < 2; z++) add(px + dx - 0.5, y, z - 0.5);
      for (let i = 0; i <= 12; i++) {
        const a = Math.PI - (i / 12) * Math.PI;
        for (let z = 0; z < 2; z++) add(Math.cos(a) * 4, 6 + Math.sin(a) * 4, z - 0.5, i === 6);
      }
      break;
    case "ring":
      for (let y = 0; y < 12; y++) {
        const n = 14;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 + (y % 2) * (Math.PI / n);
          add(Math.cos(a) * 3.2, y, Math.sin(a) * 3.2, y === 7 || y === 11);
        }
      }
      break;
    case "columns": {
      for (let x = -3; x <= 3; x++)
        for (let z = -3; z <= 3; z++) {
          if ((x + z) % 2 !== 0) continue;
          const h = Math.round(
            3 + 6 * Math.exp(-(x * x + z * z) / 8) + Math.sin(x * 1.7 + z) * 1.2,
          );
          for (let y = 0; y < h; y++) add(x * 1.4, y, z * 1.4, y === h - 1 && x === 0 && z === 0);
        }
      break;
    }
  }
  /* bottom-up, then outside-in, so each course reads as it is laid */
  return out.sort((a, b) => a.y - b.y || a.x * a.x + a.z * a.z - (b.x * b.x + b.z * b.z));
}

function readToken(name: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  const [h, s, l] = v.split(/\s+/).map((p) => parseFloat(p));
  return new THREE.Color().setHSL(
    (h || 0) / 360,
    (s || 0) / 100,
    (l || 0) / 100,
    THREE.SRGBColorSpace,
  );
}

function readPalette() {
  const background = readToken("--background", "0 0 98%");
  const foreground = readToken("--foreground", "0 0 8%");
  const primary = readToken("--primary", "0 0 10%");
  const muted = readToken("--muted", "0 0 92%");
  const dark = background.getHSL({ h: 0, s: 0, l: 0 }).l < 0.5;
  return { background, foreground, primary, muted, dark };
}

const BLOCK = 0.94;
const STEP = 0.07; // seconds between consecutive blocks
const FALL = 0.7; // seconds a block takes to settle
const HOLD = 3.2; // seconds the finished form is held before it is rebuilt

function mountScene(
  host: HTMLDivElement,
  canvas: HTMLCanvasElement,
  initial: FormFoundryVariant,
  still: boolean,
) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xffffff, 26, 70);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);

  /* lights */
  const hemi = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
  const sun = new THREE.DirectionalLight(0xffffff, 2);
  sun.position.set(-12, 22, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = sun.shadow.camera.bottom = -14;
  sun.shadow.camera.right = sun.shadow.camera.top = 14;
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.03;
  const rim = new THREE.DirectionalLight(0xffffff, 1);
  rim.position.set(14, 6, -14);
  const glow = new THREE.PointLight(0xffffff, 0, 30, 1.6);
  scene.add(hemi, sun, rim, glow);

  /* ground, plinth and sky disc */
  const groundMat = new THREE.MeshStandardMaterial({ roughness: 1 });
  const ground = new THREE.Mesh(new THREE.CircleGeometry(90, 64), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  const plinthMat = new THREE.MeshStandardMaterial({ roughness: 0.85 });
  const plinth = new THREE.Group();
  [
    { r: 9, h: 0.5, y: 0.25 },
    { r: 7.6, h: 0.5, y: 0.75 },
  ].forEach(({ r, h, y }) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r + 0.15, h, 72), plinthMat);
    m.position.y = y;
    m.castShadow = m.receiveShadow = true;
    plinth.add(m);
  });
  const lineMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.5 });
  const line = new THREE.Mesh(new THREE.RingGeometry(7.0, 7.06, 96), lineMat);
  line.rotation.x = -Math.PI / 2;
  line.position.y = 1.01;
  plinth.add(line);
  const discMat = new THREE.MeshBasicMaterial({ fog: false, transparent: true });
  const disc = new THREE.Mesh(new THREE.CircleGeometry(5, 64), discMat);
  disc.position.set(-15, 8, -70);
  camera.add(disc);
  scene.add(ground, plinth, camera);

  /* the form: one instanced mesh, every block animated through its matrix */
  const blockGeo = new THREE.BoxGeometry(BLOCK, BLOCK, BLOCK);
  const blockMat = new THREE.MeshStandardMaterial({ roughness: 0.7, metalness: 0.05 });
  const MAX = 400;
  const mesh = new THREE.InstancedMesh(blockGeo, blockMat, MAX);
  mesh.castShadow = mesh.receiveShadow = true;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(mesh);

  let variant = initial;
  let blocks = buildForm(variant);
  let jitter: number[] = [];
  let palette = readPalette();
  const dummy = new THREE.Object3D();
  const tmp = new THREE.Color();

  const applyColors = () => {
    const { background, foreground, primary, muted, dark } = palette;
    const bg = background.clone();
    scene.background = bg;
    (scene.fog as THREE.Fog).color.copy(bg);
    if (dark) {
      /* dusk: a dim cool key, a primary-tinted rim and accent blocks that glow */
      hemi.color.copy(muted).lerp(primary, 0.3);
      hemi.groundColor.copy(background);
      hemi.intensity = 0.55;
      sun.color.copy(foreground).lerp(primary, 0.25);
      sun.intensity = 0.9;
      rim.color.copy(primary);
      rim.intensity = 2.2;
      glow.color.copy(primary);
      glow.intensity = 26;
      groundMat.color.copy(background).lerp(foreground, 0.05);
      plinthMat.color.copy(background).lerp(foreground, 0.16);
      lineMat.color.copy(primary);
      discMat.color.copy(foreground).lerp(primary, 0.3);
      discMat.opacity = 0.9;
      disc.scale.setScalar(0.55);
    } else {
      /* daylight: paper haze, a bright sun and ink-toned stone */
      hemi.color.set(0xffffff);
      hemi.groundColor.copy(background).lerp(foreground, 0.12);
      hemi.intensity = 1.5;
      sun.color.copy(background).lerp(primary, 0.06);
      sun.intensity = 2.6;
      rim.color.copy(background);
      rim.intensity = 0.6;
      glow.intensity = 0;
      groundMat.color.copy(background).lerp(muted, 0.6);
      plinthMat.color.copy(background).lerp(foreground, 0.06);
      lineMat.color.copy(foreground);
      discMat.color.copy(background).lerp(primary, 0.08).offsetHSL(0, 0, 0.04);
      discMat.opacity = 0.75;
      disc.scale.setScalar(1);
    }
    const stone = dark
      ? background.clone().lerp(foreground, 0.42)
      : background.clone().lerp(muted, 0.5).lerp(foreground, 0.2);
    const accent = dark ? primary.clone().lerp(foreground, 0.2) : primary.clone();
    blocks.forEach((b, i) => {
      tmp.copy(b.accent ? accent : stone).offsetHSL(0, 0, jitter[i] * (b.accent ? 0.02 : 0.05));
      mesh.setColorAt(i, tmp);
    });
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  };

  const setForm = (v: FormFoundryVariant) => {
    variant = v;
    blocks = buildForm(v).slice(0, MAX);
    jitter = blocks.map(() => Math.random() * 2 - 1);
    mesh.count = blocks.length;
    const top = blocks.reduce((m, b) => Math.max(m, b.y), 0);
    glow.position.set(4, top * 0.6 + 3, 6);
    applyColors();
  };
  setForm(variant);

  /* camera: a low three-quarter view that slowly circles the plinth */
  let azimuth = 0.62;
  let dragging = false;
  let lastX = 0;
  const frame = (t: number) => {
    const top = blocks.reduce((m, b) => Math.max(m, b.y), 0);
    const dist = 19 + top * 0.6;
    const az = azimuth + (still ? 0 : t * 0.05);
    camera.position.set(Math.sin(az) * dist, 5 + top * 0.3, Math.cos(az) * dist);
    camera.lookAt(0, 1 + top * 0.42, 0);
  };

  const ease = (x: number) => 1 - Math.pow(1 - x, 3);
  let buildStart = 0;
  const layBlocks = (t: number) => {
    const elapsed = t - buildStart;
    const total = blocks.length * STEP + FALL;
    let out = 0;
    if (elapsed > total + HOLD) out = Math.min(1, (elapsed - total - HOLD) / 0.8);
    blocks.forEach((b, i) => {
      const p = still ? 1 : Math.min(1, Math.max(0, (elapsed - i * STEP) / FALL));
      const e = ease(p);
      const s = (p > 0 ? 1 : 0) * (1 - out);
      dummy.position.set(b.x, 1 + BLOCK / 2 + b.y + (1 - e) * 6, b.z);
      dummy.rotation.set(0, (1 - e) * 0.8, 0);
      dummy.scale.setScalar(Math.max(0.0001, s * (0.6 + 0.4 * e)));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (out >= 1) buildStart = t;
  };

  const resize = () => {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();

  const clock = new THREE.Clock();
  let raf = 0;
  let running = false;
  let paused = false;
  let visible = true;
  let time = 0;
  const render = () => {
    frame(time);
    layBlocks(time);
    renderer.render(scene, camera);
  };
  const tick = () => {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(clock.getDelta(), 0.1);
    if (!paused) time += dt;
    render();
  };
  const sync = () => {
    const should = !still && visible && !document.hidden;
    if (should && !running) {
      running = true;
      clock.getDelta();
      raf = requestAnimationFrame(tick);
    } else if (!should && running) {
      running = false;
      cancelAnimationFrame(raf);
    }
  };
  const redraw = () => {
    if (!running) render();
  };

  const ro = new ResizeObserver(() => {
    resize();
    redraw();
  });
  ro.observe(host);
  const io = new IntersectionObserver((es) => {
    visible = es[0]?.isIntersecting ?? true;
    sync();
  });
  io.observe(host);
  document.addEventListener("visibilitychange", sync);
  const mo = new MutationObserver(() => {
    palette = readPalette();
    applyColors();
    redraw();
  });
  mo.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "data-theme", "style"],
  });

  const onDown = (e: PointerEvent) => {
    dragging = true;
    lastX = e.clientX;
    canvas.setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    if (!dragging) return;
    azimuth -= (e.clientX - lastX) * 0.006;
    lastX = e.clientX;
    redraw();
  };
  const onUp = () => {
    dragging = false;
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === " ") {
      e.preventDefault();
      paused = !paused;
    } else if (e.key === "r" || e.key === "R") {
      buildStart = time;
    } else if (e.key === "s" || e.key === "S") {
      setForm(VARIANTS[(VARIANTS.indexOf(variant) + 1) % VARIANTS.length]);
      buildStart = time;
    } else return;
    redraw();
  };
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  host.addEventListener("keydown", onKey);

  render();
  sync();

  return () => {
    running = false;
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    mo.disconnect();
    document.removeEventListener("visibilitychange", sync);
    canvas.removeEventListener("pointerdown", onDown);
    canvas.removeEventListener("pointermove", onMove);
    canvas.removeEventListener("pointerup", onUp);
    canvas.removeEventListener("pointercancel", onUp);
    host.removeEventListener("keydown", onKey);
    scene.traverse((o) => {
      if (o instanceof THREE.Mesh) o.geometry.dispose();
    });
    [groundMat, plinthMat, lineMat, discMat, blockMat].forEach((m) => m.dispose());
    mesh.dispose();
    renderer.dispose();
  };
}

export function FormFoundry({ variant = "ziggurat", className }: FormFoundryProps) {
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    return mountScene(host, canvas, variant, !!prefersReducedMotion);
  }, [variant, prefersReducedMotion]);

  return (
    <div
      ref={hostRef}
      tabIndex={0}
      role="img"
      aria-label={`${LABELS[variant] ?? LABELS.ziggurat} assembling block by block on a plinth`}
      className={cn("absolute inset-0 overflow-hidden outline-none", className)}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full cursor-grab touch-none"
      />
    </div>
  );
}
