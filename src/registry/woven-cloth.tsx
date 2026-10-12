"use client";
// Ported from ThreeUI Community's WovenCloth (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { cn } from "@/lib/utils";

export type WovenClothVariant = "woven-cloth" | "iridescent" | "atelier" | "washi";

interface WovenClothProps {
  variant?: WovenClothVariant;
  hue?: number;
  saturation?: number;
  brightness?: number;
  backgroundColor?: string;
  className?: string;
}

const BACKGROUNDS: Record<WovenClothVariant, string> = {
  "woven-cloth": "#16090b",
  iridescent: "#05060d",
  atelier: "#12100d",
  washi: "#0d0a07",
};

const VIGNETTES: Record<WovenClothVariant, string> = {
  "woven-cloth": "radial-gradient(90% 80% at 50% 46%, transparent 55%, rgba(10,5,6,.72) 100%)",
  iridescent: "radial-gradient(78% 70% at 50% 44%, transparent 46%, rgba(3,4,10,.78) 100%)",
  atelier: "radial-gradient(84% 76% at 46% 42%, transparent 50%, rgba(14,12,10,.72) 100%)",
  washi: "radial-gradient(80% 74% at 50% 44%, transparent 46%, rgba(10,7,5,.80) 100%)",
};

type Runtime = {
  /** Steps of the simulation run before the first frame. */
  warm: number;
  /** Steps run before the still frame when motion is reduced. */
  still: number;
  step: (t: number) => void;
  commit: () => void;
  draw: (t: number) => void;
  fit: (w: number, h: number) => void;
  dispose: () => void;
};

type Disposable = { dispose: () => void };

const DT = 0.016;

function surface(w: number, h: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
  return { canvas, ctx };
}

/* --------------------------------------------------------------- verlet --
   The shared Verlet sheet every cloth hangs from: integrate, satisfy the
   structural links a few times, then hold the pinned edge. */
type SheetOptions = {
  GX: number;
  GY: number;
  GRAV: number;
  DAMP: number;
  iterations: number;
  pin: (ix: number, iy: number) => boolean;
  wind: (ix: number, iy: number, t: number) => [number, number, number];
  linked?: (ix: number, iy: number) => boolean;
  restD?: number;
  hold: (cur: Float32Array, prev: Float32Array, rest: Float32Array, t: number) => void;
};

function createSheet(geo: THREE.PlaneGeometry, BW: number, BH: number, o: SheetOptions) {
  const { GX, GY, GRAV, DAMP } = o;
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const N = (GX + 1) * (GY + 1);
  const cur = new Float32Array(N * 3);
  const prev = new Float32Array(N * 3);
  const rest = new Float32Array(N * 3);
  const pinned = new Uint8Array(N);
  const idx = (ix: number, iy: number) => ix + iy * (GX + 1);

  for (let i = 0; i < N; i++) {
    const ax = pos.getX(i);
    const ay = pos.getY(i);
    cur[i * 3] = prev[i * 3] = rest[i * 3] = ax;
    cur[i * 3 + 1] = prev[i * 3 + 1] = rest[i * 3 + 1] = ay;
    cur[i * 3 + 2] = prev[i * 3 + 2] = rest[i * 3 + 2] = 0;
  }
  for (let iy = 0; iy <= GY; iy++)
    for (let ix = 0; ix <= GX; ix++) if (o.pin(ix, iy)) pinned[idx(ix, iy)] = 1;

  const restH = BW / GX;
  const restV = BH / GY;
  const linked = o.linked ?? (() => true);

  function solve(a: number, b: number, rl: number) {
    const ax = cur[a * 3];
    const ay = cur[a * 3 + 1];
    const az = cur[a * 3 + 2];
    let dx = cur[b * 3] - ax;
    let dy = cur[b * 3 + 1] - ay;
    let dz = cur[b * 3 + 2] - az;
    const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6;
    const diff = ((d - rl) / d) * 0.5;
    dx *= diff;
    dy *= diff;
    dz *= diff;
    const pa = pinned[a];
    const pb = pinned[b];
    if (!pa && !pb) {
      cur[a * 3] += dx;
      cur[a * 3 + 1] += dy;
      cur[a * 3 + 2] += dz;
      cur[b * 3] -= dx;
      cur[b * 3 + 1] -= dy;
      cur[b * 3 + 2] -= dz;
    } else if (pa && !pb) {
      cur[b * 3] -= dx * 2;
      cur[b * 3 + 1] -= dy * 2;
      cur[b * 3 + 2] -= dz * 2;
    } else if (!pa && pb) {
      cur[a * 3] += dx * 2;
      cur[a * 3 + 1] += dy * 2;
      cur[a * 3 + 2] += dz * 2;
    }
  }

  function step(t: number) {
    for (let iy = 0; iy <= GY; iy++) {
      for (let ix = 0; ix <= GX; ix++) {
        const i = idx(ix, iy);
        if (pinned[i]) continue;
        const f = o.wind(ix, iy, t);
        for (let k = 0; k < 3; k++) {
          const j = i * 3 + k;
          const a = k === 0 ? f[0] : k === 1 ? f[1] + GRAV : f[2];
          const v = (cur[j] - prev[j]) * DAMP;
          prev[j] = cur[j];
          cur[j] = cur[j] + v + a * DT * DT;
        }
      }
    }
    for (let it = 0; it < o.iterations; it++) {
      for (let iy = 0; iy <= GY; iy++)
        for (let ix = 0; ix < GX; ix++)
          if (linked(ix, iy)) solve(idx(ix, iy), idx(ix + 1, iy), restH);
      for (let iy = 0; iy < GY; iy++)
        for (let ix = 0; ix <= GX; ix++) solve(idx(ix, iy), idx(ix, iy + 1), restV);
      if (o.restD !== undefined) {
        for (let iy = 0; iy < GY; iy++) {
          for (let ix = 0; ix < GX; ix++) {
            if (!linked(ix, iy) || !linked(ix, iy + 1)) continue;
            solve(idx(ix, iy), idx(ix + 1, iy + 1), o.restD);
            solve(idx(ix + 1, iy), idx(ix, iy + 1), o.restD);
          }
        }
      }
    }
    o.hold(cur, prev, rest, t);
  }

  function commit() {
    for (let i = 0; i < N; i++) pos.setXYZ(i, cur[i * 3], cur[i * 3 + 1], cur[i * 3 + 2]);
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  }

  return { step, commit };
}

function holdTopRow(GX: number) {
  return (cur: Float32Array, prev: Float32Array, rest: Float32Array) => {
    for (let i = 0; i <= GX; i++) {
      for (let k = 0; k < 3; k++) {
        cur[i * 3 + k] = rest[i * 3 + k];
        prev[i * 3 + k] = rest[i * 3 + k];
      }
    }
  };
}

function disposeScene(scene: THREE.Scene) {
  scene.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const mats = mesh.material
      ? Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material]
      : [];
    mats.forEach((m) => m.dispose());
  });
}

function blurHeight(height: Float32Array, TW: number, TH: number, passes: number) {
  const tmp = new Float32Array(TW * TH);
  for (let n = 0; n < passes; n++) {
    for (let y = 0; y < TH; y++) {
      const row = y * TW;
      for (let x = 0; x < TW; x++) {
        const a = height[row + (x > 0 ? x - 1 : x)];
        const b = height[row + x];
        const c = height[row + (x < TW - 1 ? x + 1 : x)];
        tmp[row + x] = (a + b + b + c) * 0.25;
      }
    }
    for (let x = 0; x < TW; x++) {
      for (let y = 0; y < TH; y++) {
        const a = tmp[(y > 0 ? y - 1 : y) * TW + x];
        const b = tmp[y * TW + x];
        const c = tmp[(y < TH - 1 ? y + 1 : y) * TW + x];
        height[y * TW + x] = (a + b + b + c) * 0.25;
      }
    }
  }
}

function makeNormalTexture(height: Float32Array, TW: number, TH: number, strength: number) {
  const s = surface(TW, TH);
  const img = s.ctx.createImageData(TW, TH);
  const d = img.data;
  for (let y = 0; y < TH; y++) {
    const yp = y > 0 ? y - 1 : y;
    const yn = y < TH - 1 ? y + 1 : y;
    for (let x = 0; x < TW; x++) {
      const xp = x > 0 ? x - 1 : x;
      const xn = x < TW - 1 ? x + 1 : x;
      const dx = (height[y * TW + xp] - height[y * TW + xn]) * strength;
      const dy = (height[yp * TW + x] - height[yn * TW + x]) * strength;
      const len = Math.sqrt(dx * dx + dy * dy + 1);
      const o = (y * TW + x) * 4;
      d[o] = ((dx / len) * 0.5 + 0.5) * 255;
      d[o + 1] = ((dy / len) * 0.5 + 0.5) * 255;
      d[o + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      d[o + 3] = 255;
    }
  }
  s.ctx.putImageData(img, 0, 0);
  return new THREE.CanvasTexture(s.canvas);
}

function makeStudioEnvironment(
  renderer: THREE.WebGLRenderer,
  stops: [string, string, string],
  boxes: [number, number, number, number, string, number][],
) {
  const W = 1024;
  const H = 512;
  const s = surface(W, H);
  const x = s.ctx;
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, stops[0]);
  g.addColorStop(stops === IRIDESCENT_ENV ? 0.5 : 0.46, stops[1]);
  g.addColorStop(1, stops[2]);
  x.fillStyle = g;
  x.fillRect(0, 0, W, H);
  boxes.forEach(([fx, fy, w, h, color, alpha]) => {
    const cx = W * fx;
    const cy = H * fy;
    const grad = x.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h));
    grad.addColorStop(0, color);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    x.globalAlpha = alpha;
    x.fillStyle = grad;
    x.save();
    x.translate(cx, cy);
    x.scale(w / Math.max(w, h), h / Math.max(w, h));
    x.beginPath();
    x.arc(0, 0, Math.max(w, h), 0, Math.PI * 2);
    x.fill();
    x.restore();
    x.globalAlpha = 1;
  });
  const tex = new THREE.CanvasTexture(s.canvas);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const env = pmrem.fromEquirectangular(tex).texture;
  pmrem.dispose();
  tex.dispose();
  return env;
}

const IRIDESCENT_ENV: [string, string, string] = ["#0a0c1c", "#05060e", "#02030a"];
const ATELIER_ENV: [string, string, string] = ["#2a2620", "#1a1713", "#0d0b09"];

/* ------------------------------------------------------------ woven cloth */
function buildWovenCloth(canvas: HTMLCanvasElement): Runtime {
  const textures: Disposable[] = [];

  function makeClothTexture() {
    const W = 1280;
    const H = 800;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const x = c.getContext("2d") as CanvasRenderingContext2D;

    const g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#efe6d4");
    g.addColorStop(0.5, "#e9dfca");
    g.addColorStop(1, "#e3d7bf");
    x.fillStyle = g;
    x.fillRect(0, 0, W, H);

    x.strokeStyle = "#a5202c";
    x.lineWidth = 10;
    x.strokeRect(46, 46, W - 92, H - 92);
    x.lineWidth = 3;
    x.strokeStyle = "#7c1622";
    x.strokeRect(66, 66, W - 132, H - 132);

    x.fillStyle = "#a5202c";
    x.font = 'bold 78px Georgia, "Times New Roman", serif';
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText("W C", W / 2, 190);

    x.font = 'normal 20px "Helvetica Neue", Arial, sans-serif';
    x.fillStyle = "#7c1622";
    x.fillText("· WOVEN CLOTH ·", W / 2, 246);

    x.fillStyle = "#9e1e2a";
    x.font = 'bold 118px Georgia, "Times New Roman", serif';
    x.fillText("WOVEN", W / 2, 400);
    x.fillText("CLOTH", W / 2, 520);

    x.fillStyle = "#7c1622";
    x.font = '600 30px "Helvetica Neue", Arial, sans-serif';
    x.fillText("T E X T I L E   S I M U L A T I O N", W / 2, 626);

    x.globalAlpha = 1;
    for (let yy = 0; yy < H; yy += 3) {
      x.strokeStyle = "rgba(60,30,20,0.05)";
      x.lineWidth = 1;
      x.beginPath();
      x.moveTo(0, yy + 0.5);
      x.lineTo(W, yy + 0.5);
      x.stroke();
    }
    for (let xx = 0; xx < W; xx += 3) {
      x.strokeStyle = "rgba(255,250,235,0.06)";
      x.lineWidth = 1;
      x.beginPath();
      x.moveTo(xx + 0.5, 0);
      x.lineTo(xx + 0.5, H);
      x.stroke();
    }

    const id = x.getImageData(0, 0, W, H);
    const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() * 2 - 1) * 10;
      d[i] += n;
      d[i + 1] += n;
      d[i + 2] += n;
    }
    x.putImageData(id, 0, 0);

    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 4;
    tex.colorSpace = THREE.SRGBColorSpace;
    textures.push(tex);
    return tex;
  }

  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  let camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);

  const BW = 4.4;
  const BH = 2.75;
  const GX = 40;
  const GY = 26;
  const geo = new THREE.PlaneGeometry(BW, BH, GX, GY);
  const mat = new THREE.MeshPhongMaterial({
    map: makeClothTexture(),
    side: THREE.DoubleSide,
    shininess: 6,
    specular: 0x2a1410,
    color: 0xffffff,
  });
  scene.add(new THREE.Mesh(geo, mat));

  scene.add(new THREE.AmbientLight(0xffe9d0, 0.62));
  const key = new THREE.DirectionalLight(0xfff0dc, 1.15);
  key.position.set(-3, 3.5, 3.2);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xb02330, 0.42);
  rim.position.set(3, -1.5, 2.0);
  scene.add(rim);

  const sheet = createSheet(geo, BW, BH, {
    GX,
    GY,
    GRAV: -3.1,
    DAMP: 0.985,
    iterations: 3,
    pin: (_ix, iy) => iy === 0,
    wind: (ix, iy, t) => {
      const cx = ix / GX;
      const cy = iy / GY;
      const travel = t * 1.7 - cy * 4.2;
      const gust = 0.6 + 0.42 * Math.sin(t * 0.6) + 0.18 * Math.sin(t * 1.9 + 1.3);
      const amp = 4.3 * cy;
      const fz =
        (Math.sin(travel + cx * 3.3) + 0.5 * Math.sin(travel * 1.7 + cx * 6.0)) * amp * gust;
      const fx = Math.sin(t * 0.9 + cy * 2.2) * 0.6 * cy;
      const fy = -0.4 * cy;
      return [fx, fy, fz];
    },
    hold: holdTopRow(GX),
  });

  return {
    warm: 40,
    still: 220,
    step: sheet.step,
    commit: sheet.commit,
    draw: () => renderer.render(scene, camera),
    fit: (w, h) => {
      renderer.setSize(w, h, false);
      const aspect = w / h;
      camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 100);
      const vFit = BH / 2 / Math.tan((42 * Math.PI) / 360);
      const hFit = BW / 2 / Math.tan((42 * Math.PI) / 360) / aspect;
      camera.position.set(0, 0.05, Math.max(vFit, hFit) * 1.16 + 0.4);
      camera.lookAt(0, 0, 0);
    },
    dispose: () => {
      disposeScene(scene);
      textures.forEach((t) => t.dispose());
      renderer.dispose();
    },
  };
}

/* ------------------------------------------------------- iridescent silk */
function buildIridescent(canvas: HTMLCanvasElement): Runtime {
  const TW = 1600;
  const TH = 1000;

  function makeWordmarkMask() {
    const s = surface(TW, TH);
    const x = s.ctx;
    x.fillStyle = "#000";
    x.fillRect(0, 0, TW, TH);
    x.fillStyle = "#fff";
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.font = 'bold 96px Georgia, "Times New Roman", serif';
    x.fillText("W C", TW / 2, 208);
    x.font = '700 30px "Helvetica Neue", Arial, sans-serif';
    x.fillText("· A T E L I E R ·", TW / 2, 278);
    x.font = 'bold 150px Georgia, "Times New Roman", serif';
    x.fillText("WOVEN", TW / 2, 452);
    x.fillText("CLOTH", TW / 2, 600);
    x.font = '700 38px "Helvetica Neue", Arial, sans-serif';
    x.fillText("I R I D E S C E N T   S I L K", TW / 2, 718);
    x.strokeStyle = "#fff";
    x.lineWidth = 7;
    x.strokeRect(64, 64, TW - 128, TH - 128);
    x.lineWidth = 3;
    x.strokeRect(92, 92, TW - 184, TH - 184);
    return x.getImageData(0, 0, TW, TH).data;
  }

  function weaveHeight(x: number, y: number) {
    const p = 8;
    const cx = Math.floor(x / p);
    const cy = Math.floor(y / p);
    const u = (x % p) / p;
    const v = (y % p) / p;
    const binding = (cx * 2 + cy) % 5 === 0;
    const profile = (t: number) => Math.sin(t * Math.PI);
    let h = binding ? profile(v) * 0.9 : profile(u);
    h += Math.sin(cx * 12.9898) * Math.sin(cx * 4.1414 + 2.3) * 0.16;
    h += Math.sin(cy * 7.233 + 1.7) * 0.06;
    return h;
  }

  function valueNoise(seed: number) {
    const G = 64;
    const grid = new Float32Array(G * G);
    let s = seed;
    const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    for (let i = 0; i < G * G; i++) grid[i] = rnd();
    const smooth = (t: number) => t * t * (3 - 2 * t);
    return (u: number, v: number) => {
      const fx = u * G;
      const fy = v * G;
      const ix = Math.floor(fx);
      const iy = Math.floor(fy);
      const tx = smooth(fx - ix);
      const ty = smooth(fy - iy);
      const at = (a: number, b: number) => grid[(((b % G) + G) % G) * G + (((a % G) + G) % G)];
      const a = at(ix, iy);
      const b = at(ix + 1, iy);
      const c = at(ix, iy + 1);
      const d = at(ix + 1, iy + 1);
      return a + (b - a) * tx + (c + (d - c) * tx - (a + (b - a) * tx)) * ty;
    };
  }

  const mask = makeWordmarkMask();
  const height = new Float32Array(TW * TH);
  for (let y = 0; y < TH; y++) {
    for (let x = 0; x < TW; x++) {
      const i = y * TW + x;
      const m = mask[i * 4] / 255;
      height[i] = weaveHeight(x, y) * (1 - m * 0.3) + m * 1.15;
    }
  }

  function makeAlbedoTexture() {
    const s = surface(TW, TH);
    const x = s.ctx;
    const g = x.createLinearGradient(0, 0, TW * 0.35, TH);
    g.addColorStop(0, "#161033");
    g.addColorStop(0.45, "#0d1030");
    g.addColorStop(1, "#100b26");
    x.fillStyle = g;
    x.fillRect(0, 0, TW, TH);
    const img = x.getImageData(0, 0, TW, TH);
    const d = img.data;
    for (let i = 0; i < TW * TH; i++) {
      const m = mask[i * 4] / 255;
      const shade = 0.88 + height[i] * 0.1;
      const o = i * 4;
      d[o] = Math.min(255, d[o] * shade + m * 96);
      d[o + 1] = Math.min(255, d[o + 1] * shade + m * 78);
      d[o + 2] = Math.min(255, d[o + 2] * shade + m * 118);
    }
    x.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(s.canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function makeRoughnessTexture() {
    const s = surface(TW, TH);
    const x = s.ctx;
    const img = x.createImageData(TW, TH);
    const d = img.data;
    const grain = valueNoise(9271);
    for (let y = 0; y < TH; y++) {
      for (let xx = 0; xx < TW; xx++) {
        const i = y * TW + xx;
        const m = mask[i * 4] / 255;
        const n = grain((xx / TW) * 5, (y / TH) * 5);
        let r = 0.3 - height[i] * 0.07 + n * 0.09 - m * 0.16;
        r = Math.max(0.04, Math.min(0.8, r));
        const o = i * 4;
        d[o] = d[o + 1] = d[o + 2] = r * 255;
        d[o + 3] = 255;
      }
    }
    x.putImageData(img, 0, 0);
    return new THREE.CanvasTexture(s.canvas);
  }

  function makeThicknessTexture() {
    const W = 512;
    const H = 320;
    const s = surface(W, H);
    const x = s.ctx;
    const img = x.createImageData(W, H);
    const d = img.data;
    const a = valueNoise(4471);
    const b = valueNoise(88231);
    for (let y = 0; y < H; y++) {
      for (let xx = 0; xx < W; xx++) {
        const u = xx / W;
        const v = y / H;
        const n = a(u * 3.4, v * 2.4) * 0.58 + b(u * 8.5, v * 5.6) * 0.42;
        const o = (y * W + xx) * 4;
        const sweep = 0.5 + 0.42 * Math.sin(u * Math.PI * 2 - v * 1.15);
        const t = Math.max(0, Math.min(1, sweep + (n - 0.5) * 0.26));
        d[o] = d[o + 1] = d[o + 2] = t * 255;
        d[o + 3] = 255;
      }
    }
    x.putImageData(img, 0, 0);
    return new THREE.CanvasTexture(s.canvas);
  }

  function makeBackdropTexture() {
    const W = 512;
    const H = 320;
    const s = surface(W, H);
    const x = s.ctx;
    x.fillStyle = "#04050c";
    x.fillRect(0, 0, W, H);
    const g = x.createRadialGradient(W * 0.5, H * 0.42, 0, W * 0.5, H * 0.42, W * 0.62);
    g.addColorStop(0, "rgba(58,42,120,0.85)");
    g.addColorStop(0.45, "rgba(22,20,58,0.55)");
    g.addColorStop(1, "rgba(3,4,11,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, W, H);
    const tex = new THREE.CanvasTexture(s.canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.48;

  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const scene = new THREE.Scene();
  const backdrop = makeBackdropTexture();
  scene.background = backdrop;
  const env = makeStudioEnvironment(renderer, IRIDESCENT_ENV, [
    [0.24, 0.2, 300, 120, "#fff3e2", 1],
    [0.74, 0.34, 230, 190, "#7fd8ff", 0.95],
    [0.52, 0.86, 340, 130, "#ff5fa8", 0.55],
    [0.02, 0.55, 160, 220, "#9d7bff", 0.5],
  ]);
  scene.environment = env;

  const BW = 4.7;
  const BH = 2.8;
  const GX = 56;
  const GY = 40;
  const geo = new THREE.PlaneGeometry(BW, BH, GX, GY);

  const albedo = makeAlbedoTexture();
  blurHeight(height, TW, TH, 2);
  const normalMap = makeNormalTexture(height, TW, TH, 2.4);
  const roughnessMap = makeRoughnessTexture();
  const thicknessMap = makeThicknessTexture();
  thicknessMap.wrapS = THREE.RepeatWrapping;
  [albedo, normalMap, roughnessMap, thicknessMap].forEach((t) => {
    t.anisotropy = maxAniso;
  });

  const mat = new THREE.MeshPhysicalMaterial({
    map: albedo,
    normalMap,
    normalScale: new THREE.Vector2(0.24, 0.24),
    roughnessMap,
    roughness: 1.0,
    metalness: 0.45,
    side: THREE.DoubleSide,
    envMapIntensity: 2.6,
    iridescence: 1.0,
    iridescenceIOR: 2.2,
    iridescenceThicknessRange: [300, 820],
    iridescenceThicknessMap: thicknessMap,
    sheen: 0.3,
    sheenColor: new THREE.Color("#a9d9ff"),
    sheenRoughness: 0.32,
  });
  scene.add(new THREE.Mesh(geo, mat));

  scene.add(new THREE.AmbientLight(0x3b3676, 0.55));
  const key = new THREE.DirectionalLight(0xffeede, 2.1);
  key.position.set(-3.1, 3.2, 3.4);
  scene.add(key);
  const rimCool = new THREE.DirectionalLight(0x3fbcff, 2.9);
  rimCool.position.set(3.6, 0.6, 2.2);
  scene.add(rimCool);
  const rimWarm = new THREE.DirectionalLight(0xff3d8e, 2.4);
  rimWarm.position.set(0.4, -2.6, 1.6);
  scene.add(rimWarm);
  const fill = new THREE.DirectionalLight(0x9d7bff, 1.6);
  fill.position.set(-3.2, -1.0, 2.6);
  scene.add(fill);

  const railZ = (ix: number, t: number) => {
    const cx = ix / GX;
    return (
      Math.sin(cx * Math.PI * 3.0 + t * 0.22) * 0.15 +
      Math.sin(cx * Math.PI * 5.0 - t * 0.15) * 0.05
    );
  };

  const sheet = createSheet(geo, BW, BH, {
    GX,
    GY,
    GRAV: -2.15,
    DAMP: 0.989,
    iterations: 4,
    pin: (_ix, iy) => iy === 0,
    wind: (ix, iy, t) => {
      const cx = ix / GX;
      const cy = iy / GY;
      const travel = t * 1.15 - cy * 3.4;
      const gust = 0.52 + 0.34 * Math.sin(t * 0.44) + 0.16 * Math.sin(t * 1.31 + 1.1);
      const amp = 2.15 * cy;
      const fz =
        (Math.sin(travel + cx * 2.6) + 0.46 * Math.sin(travel * 1.55 + cx * 5.1)) * amp * gust;
      const fx = Math.sin(t * 0.6 + cy * 1.9) * 0.9 * cy * (cx - 0.5);
      return [fx, -0.3 * cy, fz];
    },
    hold: (cur, prev, rest, t) => {
      for (let ix = 0; ix <= GX; ix++) {
        const i = ix;
        const z = railZ(ix, t);
        cur[i * 3] = prev[i * 3] = rest[i * 3];
        cur[i * 3 + 1] = prev[i * 3 + 1] = rest[i * 3 + 1];
        cur[i * 3 + 2] = prev[i * 3 + 2] = z;
      }
    },
  });

  // Bloom: half-float scene target, quarter-res bright pass, two blurs, composite.
  const rtScene = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
  const rtA = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
  const rtB = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
  [rtScene, rtA, rtB].forEach((rt) => {
    rt.texture.minFilter = THREE.LinearFilter;
    rt.texture.magFilter = THREE.LinearFilter;
    rt.texture.generateMipmaps = false;
  });

  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quadScene = new THREE.Scene();
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  quadScene.add(quad);

  const VERT =
    "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }";

  const brightMat = new THREE.ShaderMaterial({
    uniforms: { tDiffuse: { value: null }, threshold: { value: 0.72 } },
    vertexShader: VERT,
    fragmentShader: [
      "uniform sampler2D tDiffuse; uniform float threshold; varying vec2 vUv;",
      "void main(){",
      "  vec3 c = texture2D(tDiffuse, vUv).rgb;",
      "  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));",
      "  float k = max(l - threshold, 0.0) / max(l, 1e-4);",
      "  gl_FragColor = vec4(c * k, 1.0);",
      "}",
    ].join("\n"),
  });

  const blurMat = new THREE.ShaderMaterial({
    uniforms: { tDiffuse: { value: null }, direction: { value: new THREE.Vector2(1, 0) } },
    vertexShader: VERT,
    fragmentShader: [
      "uniform sampler2D tDiffuse; uniform vec2 direction; varying vec2 vUv;",
      "void main(){",
      "  vec3 sum = texture2D(tDiffuse, vUv).rgb * 0.2270270270;",
      "  sum += texture2D(tDiffuse, vUv + direction * 1.3846153846).rgb * 0.3162162162;",
      "  sum += texture2D(tDiffuse, vUv - direction * 1.3846153846).rgb * 0.3162162162;",
      "  sum += texture2D(tDiffuse, vUv + direction * 3.2307692308).rgb * 0.0702702703;",
      "  sum += texture2D(tDiffuse, vUv - direction * 3.2307692308).rgb * 0.0702702703;",
      "  gl_FragColor = vec4(sum, 1.0);",
      "}",
    ].join("\n"),
  });

  const compositeMat = new THREE.ShaderMaterial({
    uniforms: { tDiffuse: { value: null }, tBloom: { value: null }, strength: { value: 0.62 } },
    vertexShader: VERT,
    fragmentShader: [
      "uniform sampler2D tDiffuse; uniform sampler2D tBloom; uniform float strength; varying vec2 vUv;",
      "void main(){",
      "  vec3 base = texture2D(tDiffuse, vUv).rgb;",
      "  vec3 glow = texture2D(tBloom, vUv).rgb;",
      "  gl_FragColor = vec4(base + glow * strength, 1.0);",
      "  #include <tonemapping_fragment>",
      "  #include <colorspace_fragment>",
      "}",
    ].join("\n"),
  });

  function blit(material: THREE.ShaderMaterial, target: THREE.WebGLRenderTarget | null) {
    quad.material = material;
    renderer.setRenderTarget(target);
    renderer.render(quadScene, quadCam);
  }

  let camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);

  return {
    warm: 150,
    still: 150,
    step: sheet.step,
    commit: sheet.commit,
    draw: (t) => {
      thicknessMap.offset.x = (t * 0.028) % 1;
      const base = camera.position.z;
      camera.position.x = Math.sin(t * 0.13) * 0.3;
      camera.position.y = 0.02 + Math.sin(t * 0.17 + 1.4) * 0.12;
      camera.position.z = base;
      camera.lookAt(0, -0.04, 0);

      renderer.setRenderTarget(rtScene);
      renderer.clear();
      renderer.render(scene, camera);

      brightMat.uniforms.tDiffuse.value = rtScene.texture;
      blit(brightMat, rtA);
      blurMat.uniforms.tDiffuse.value = rtA.texture;
      blurMat.uniforms.direction.value.set(1 / rtA.width, 0);
      blit(blurMat, rtB);
      blurMat.uniforms.tDiffuse.value = rtB.texture;
      blurMat.uniforms.direction.value.set(0, 1 / rtA.height);
      blit(blurMat, rtA);

      compositeMat.uniforms.tDiffuse.value = rtScene.texture;
      compositeMat.uniforms.tBloom.value = rtA.texture;
      renderer.setRenderTarget(null);
      blit(compositeMat, null);
    },
    fit: (cw, ch) => {
      renderer.setSize(cw, ch, false);
      const dpr = renderer.getPixelRatio();
      const pw = Math.max(2, Math.floor(cw * dpr));
      const ph = Math.max(2, Math.floor(ch * dpr));
      rtScene.setSize(pw, ph);
      rtA.setSize(Math.max(2, pw >> 2), Math.max(2, ph >> 2));
      rtB.setSize(Math.max(2, pw >> 2), Math.max(2, ph >> 2));
      const aspect = cw / ch;
      camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 100);
      const vFit = BH / 2 / Math.tan((40 * Math.PI) / 360);
      const hFit = BW / 2 / Math.tan((40 * Math.PI) / 360) / aspect;
      camera.position.set(0, 0.02, Math.max(vFit, hFit) * 0.98 + 0.24);
      camera.lookAt(0, -0.04, 0);
    },
    dispose: () => {
      disposeScene(scene);
      quad.geometry.dispose();
      [brightMat, blurMat, compositeMat].forEach((m) => m.dispose());
      [rtScene, rtA, rtB].forEach((rt) => rt.dispose());
      [albedo, normalMap, roughnessMap, thicknessMap, backdrop, env].forEach((t) => t.dispose());
      renderer.dispose();
    },
  };
}

/* ---------------------------------------------------------- atelier flag */
function buildAtelier(canvas: HTMLCanvasElement): Runtime {
  const TW = 1600;
  const TH = 1030;
  const HOIST = 122;
  const FLY_HEM = 48;
  const EDGE_HEM = 36;
  const SEAM_Y = [TH / 3, (TH * 2) / 3];
  const SEAM_H = 24;

  const alpha = (ctx: CanvasRenderingContext2D) => ctx.getImageData(0, 0, TW, TH).data;

  function makeStructureMask() {
    const s = surface(TW, TH);
    const x = s.ctx;
    x.fillStyle = "#000";
    x.fillRect(0, 0, TW, TH);
    x.fillStyle = "#fff";
    x.fillRect(0, 0, HOIST, TH);
    x.fillRect(TW - FLY_HEM, 0, FLY_HEM, TH);
    x.fillRect(0, 0, TW, EDGE_HEM);
    x.fillRect(0, TH - EDGE_HEM, TW, EDGE_HEM);
    SEAM_Y.forEach((y) => x.fillRect(HOIST, y - SEAM_H / 2, TW - HOIST - FLY_HEM, SEAM_H));
    return alpha(x);
  }

  function makeStitchMask() {
    const s = surface(TW, TH);
    const x = s.ctx;
    x.fillStyle = "#000";
    x.fillRect(0, 0, TW, TH);
    x.strokeStyle = "#fff";
    x.lineWidth = 4;
    x.setLineDash([15, 11]);
    x.lineCap = "butt";
    const run = (x0: number, y0: number, x1: number, y1: number) => {
      x.beginPath();
      x.moveTo(x0, y0);
      x.lineTo(x1, y1);
      x.stroke();
    };
    run(16, 0, 16, TH);
    run(HOIST - 16, 0, HOIST - 16, TH);
    run(TW - FLY_HEM + 16, 0, TW - FLY_HEM + 16, TH);
    run(HOIST, EDGE_HEM - 13, TW - FLY_HEM, EDGE_HEM - 13);
    run(HOIST, TH - EDGE_HEM + 13, TW - FLY_HEM, TH - EDGE_HEM + 13);
    SEAM_Y.forEach((y) => {
      run(HOIST, y - SEAM_H / 2 + 5, TW - FLY_HEM, y - SEAM_H / 2 + 5);
      run(HOIST, y + SEAM_H / 2 - 5, TW - FLY_HEM, y + SEAM_H / 2 - 5);
    });
    x.setLineDash([11, 9]);
    x.lineWidth = 3.5;
    x.strokeRect(TW - 470, TH - 214, 300, 104);
    x.setLineDash([]);
    return alpha(x);
  }

  function makeInkMask() {
    const s = surface(TW, TH);
    const x = s.ctx;
    x.fillStyle = "#000";
    x.fillRect(0, 0, TW, TH);
    x.fillStyle = "#fff";
    x.textAlign = "center";
    x.textBaseline = "middle";
    const cx = HOIST + (TW - HOIST - FLY_HEM) / 2;
    x.font = '700 30px "Helvetica Neue", Arial, sans-serif';
    x.fillText("A T E L I E R   ·   N O .   4 2", cx, TH * 0.235);
    x.font = 'bold 152px Georgia, "Times New Roman", serif';
    x.fillText("WOVEN", cx, TH * 0.395);
    x.fillText("CLOTH", cx, TH * 0.555);
    x.fillRect(cx - 250, TH * 0.645, 500, 4);
    x.font = '600 28px "Helvetica Neue", Arial, sans-serif';
    x.fillText("100% LINEN  ·  WARP 40s  ·  WEFT 40s  ·  CUT AND SEWN TO ORDER", cx, TH * 0.705);
    x.font = 'bold 40px Georgia, "Times New Roman", serif';
    x.fillText("W C", TW - 320, TH - 184);
    x.font = '600 19px "Helvetica Neue", Arial, sans-serif';
    x.fillText("THREE PANEL · FLAT FELLED", TW - 320, TH - 144);
    return alpha(x);
  }

  const structure = makeStructureMask();
  const stitch = makeStitchMask();
  const ink = makeInkMask();

  function weaveHeight(x: number, y: number) {
    const p = 7;
    const cx = Math.floor(x / p);
    const cy = Math.floor(y / p);
    const u = (x % p) / p;
    const v = (y % p) / p;
    const warpUp = (cx + cy) % 2 === 0;
    const h = warpUp ? Math.sin(u * Math.PI) : Math.sin(v * Math.PI);
    return h + Math.sin(cx * 12.9898) * Math.sin(cy * 4.1414 + 1.9) * 0.22;
  }

  const height = new Float32Array(TW * TH);
  for (let y = 0; y < TH; y++) {
    for (let x = 0; x < TW; x++) {
      const i = y * TW + x;
      const st = structure[i * 4] / 255;
      const th = stitch[i * 4] / 255;
      height[i] = weaveHeight(x, y) + st * 1.5 + th * 3.4 + (ink[i * 4] / 255) * 0.22;
    }
  }

  function makeAlbedoTexture() {
    const s = surface(TW, TH);
    const x = s.ctx;
    const lots = ["#ded2b8", "#d8ccb1", "#e2d6bd"];
    for (let k = 0; k < 3; k++) {
      x.fillStyle = lots[k];
      x.fillRect(0, (TH / 3) * k, TW, TH / 3 + 1);
    }
    const img = x.getImageData(0, 0, TW, TH);
    const d = img.data;
    const INK = [33, 48, 77];
    const TAPE = [26, 37, 72];
    const THREAD = [242, 234, 218];
    for (let i = 0; i < TW * TH; i++) {
      const px = i % TW;
      const st = structure[i * 4] / 255;
      const th = stitch[i * 4] / 255;
      const ik = ink[i * 4] / 255;
      const o = i * 4;
      const shade = 0.86 + height[i] * 0.14;
      let r = d[o] * shade;
      let g = d[o + 1] * shade;
      let b = d[o + 2] * shade;
      if (px < HOIST) {
        r += (TAPE[0] - r) * 0.94;
        g += (TAPE[1] - g) * 0.94;
        b += (TAPE[2] - b) * 0.94;
      } else if (st > 0) {
        r *= 1 - st * 0.17;
        g *= 1 - st * 0.17;
        b *= 1 - st * 0.15;
      }
      if (ik > 0 && px >= HOIST) {
        r += (INK[0] - r) * ik;
        g += (INK[1] - g) * ik;
        b += (INK[2] - b) * ik;
      }
      if (th > 0) {
        r += (THREAD[0] - r) * th * 0.92;
        g += (THREAD[1] - g) * th * 0.92;
        b += (THREAD[2] - b) * th * 0.92;
      }
      d[o] = r;
      d[o + 1] = g;
      d[o + 2] = b;
    }
    x.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(s.canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function makeRoughnessTexture() {
    const s = surface(TW, TH);
    const x = s.ctx;
    const img = x.createImageData(TW, TH);
    const d = img.data;
    for (let i = 0; i < TW * TH; i++) {
      const th = stitch[i * 4] / 255;
      const ik = ink[i * 4] / 255;
      let r = 0.86 - height[i] * 0.05 - th * 0.42 - ik * 0.12;
      r = Math.max(0.18, Math.min(0.98, r));
      const o = i * 4;
      d[o] = d[o + 1] = d[o + 2] = r * 255;
      d[o + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    return new THREE.CanvasTexture(s.canvas);
  }

  function makeBackdropTexture() {
    const W = 512;
    const H = 320;
    const s = surface(W, H);
    const x = s.ctx;
    x.fillStyle = "#100e0b";
    x.fillRect(0, 0, W, H);
    const g = x.createRadialGradient(W * 0.44, H * 0.36, 0, W * 0.44, H * 0.36, W * 0.6);
    g.addColorStop(0, "rgba(96,84,66,0.95)");
    g.addColorStop(0.5, "rgba(44,38,30,0.6)");
    g.addColorStop(1, "rgba(13,11,9,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, W, H);
    const tex = new THREE.CanvasTexture(s.canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.16;

  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const scene = new THREE.Scene();
  const backdrop = makeBackdropTexture();
  scene.background = backdrop;
  const env = makeStudioEnvironment(renderer, ATELIER_ENV, [
    [0.3, 0.14, 340, 130, "#fffaf0", 1],
    [0.78, 0.4, 220, 200, "#c8d8ea", 0.55],
    [0.06, 0.62, 200, 240, "#e8d3ac", 0.5],
  ]);
  scene.environment = env;

  const BW = 5.0;
  const BH = 2.9;
  const GX = 52;
  const GY = 34;
  const geo = new THREE.PlaneGeometry(BW, BH, GX, GY);

  const albedo = makeAlbedoTexture();
  blurHeight(height, TW, TH, 1);
  const normalMap = makeNormalTexture(height, TW, TH, 2.6);
  const roughnessMap = makeRoughnessTexture();
  [albedo, normalMap, roughnessMap].forEach((t) => {
    t.anisotropy = maxAniso;
  });

  const mat = new THREE.MeshPhysicalMaterial({
    map: albedo,
    normalMap,
    normalScale: new THREE.Vector2(0.55, 0.55),
    roughnessMap,
    roughness: 1.0,
    metalness: 0.0,
    side: THREE.DoubleSide,
    envMapIntensity: 1.15,
    sheen: 0.6,
    sheenColor: new THREE.Color("#f3e6cd"),
    sheenRoughness: 0.62,
  });

  const rig = new THREE.Group();
  rig.add(new THREE.Mesh(geo, mat));
  scene.add(rig);

  const brass = new THREE.MeshStandardMaterial({
    color: 0xb98f47,
    metalness: 1.0,
    roughness: 0.32,
  });
  const steel = new THREE.MeshStandardMaterial({
    color: 0x8d8f95,
    metalness: 1.0,
    roughness: 0.28,
  });

  const HOIST_X = -BW / 2;
  const grommets = [0.09, 0.5, 0.91].map((v) => {
    const g = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.021, 12, 28), brass);
    g.position.set(HOIST_X + 0.05, BH / 2 - v * BH, 0);
    rig.add(g);
    return g;
  });

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.042, BH * 1.5, 18), steel);
  mast.position.set(HOIST_X - 0.16, -BH * 0.12, -0.04);
  rig.add(mast);
  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.072, 20, 14), brass);
  finial.position.set(HOIST_X - 0.16, -BH * 0.12 + BH * 0.75 + 0.05, -0.04);
  rig.add(finial);

  grommets.forEach((g) => {
    const clip = new THREE.Mesh(new THREE.TorusGeometry(0.048, 0.011, 10, 22), steel);
    clip.position.set(HOIST_X - 0.11, g.position.y, -0.02);
    clip.rotation.y = Math.PI / 2.4;
    rig.add(clip);
  });

  scene.add(new THREE.HemisphereLight(0xcadcf2, 0x4a3d2c, 0.75));
  const key = new THREE.DirectionalLight(0xfff4e0, 2.5);
  key.position.set(2.6, 3.4, 3.0);
  scene.add(key);
  const bounce = new THREE.DirectionalLight(0xe6cfa4, 0.85);
  bounce.position.set(-3.4, -1.6, 2.0);
  scene.add(bounce);
  const back = new THREE.DirectionalLight(0xfff0d8, 1.5);
  back.position.set(-1.6, 1.4, -3.2);
  scene.add(back);

  const sheet = createSheet(geo, BW, BH, {
    GX,
    GY,
    GRAV: -0.22,
    DAMP: 0.986,
    iterations: 4,
    pin: (ix) => ix === 0,
    wind: (ix, iy, t) => {
      const cx = ix / GX;
      const cy = iy / GY;
      const reach = cx * (0.35 + 0.65 * cx);
      const gust = 0.78 + 0.26 * Math.sin(t * 0.53) + 0.14 * Math.sin(t * 1.47 + 0.9);
      const travel = t * 4.2 - cx * 6.6;
      const fz = (Math.sin(travel) + 0.38 * Math.sin(travel * 1.9 + cy * 2.6)) * 3.4 * reach * gust;
      const fy = Math.sin(travel * 0.8 + 1.2) * 0.85 * reach;
      const fx = 2.6 * reach * gust;
      return [fx, fy, fz];
    },
    hold: (cur, prev, rest) => {
      for (let iy = 0; iy <= GY; iy++) {
        const i = iy * (GX + 1);
        for (let k = 0; k < 3; k++) {
          cur[i * 3 + k] = rest[i * 3 + k];
          prev[i * 3 + k] = rest[i * 3 + k];
        }
      }
    },
  });

  let camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);

  return {
    warm: 160,
    still: 160,
    step: sheet.step,
    commit: sheet.commit,
    draw: (t) => {
      rig.rotation.y = -0.16 + Math.sin(t * 0.11) * 0.045;
      rig.rotation.z = Math.sin(t * 0.08 + 0.7) * 0.012;
      camera.position.y = 0.06 + Math.sin(t * 0.15) * 0.06;
      camera.lookAt(0.1, 0.0, 0);
      renderer.render(scene, camera);
    },
    fit: (w, h) => {
      renderer.setSize(w, h, false);
      const aspect = w / h;
      camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 100);
      const vFit = (BH * 1.12) / 2 / Math.tan((40 * Math.PI) / 360);
      const hFit = (BW + 1.0) / 2 / Math.tan((40 * Math.PI) / 360) / aspect;
      camera.position.set(0.1, 0.06, Math.max(vFit, hFit) * 1.13 + 0.3);
      camera.lookAt(0.1, 0.0, 0);
    },
    dispose: () => {
      disposeScene(scene);
      [albedo, normalMap, roughnessMap, backdrop, env].forEach((t) => t.dispose());
      renderer.dispose();
    },
  };
}

/* ----------------------------------------------------------- washi noren */
function buildWashi(canvas: HTMLCanvasElement): Runtime {
  const TW = 1500;
  const TH = 980;
  const PANELS = 3;
  const BAND = 0.15;
  const SLIT_U = [1 / 3, 2 / 3];

  function rng(seed: number) {
    let s = seed >>> 0;
    return () => {
      s ^= s << 13;
      s >>>= 0;
      s ^= s >> 17;
      s ^= s << 5;
      s >>>= 0;
      return s / 4294967296;
    };
  }

  const deckleRand = rng(20260826);
  const deckleLow = new Float32Array(TW);
  {
    const control: number[] = [];
    for (let i = 0; i <= 24; i++) control.push(deckleRand());
    for (let x = 0; x < TW; x++) {
      const f = (x / TW) * 24;
      const i = Math.floor(f);
      const t = f - i;
      const smooth = t * t * (3 - 2 * t);
      const a = control[i];
      const b = control[Math.min(24, i + 1)];
      const base = a + (b - a) * smooth;
      const fine = Math.sin(x * 0.19) * 0.16 + Math.sin(x * 0.061 + 1.7) * 0.24;
      deckleLow[x] = TH - 14 - (base * 26 + fine * 12);
    }
  }

  function makeAlphaMask() {
    const s = surface(TW, TH);
    const x = s.ctx;
    x.fillStyle = "#fff";
    x.fillRect(0, 0, TW, TH);
    x.fillStyle = "#000";
    const slitW = 22;
    const bandPx = TH * BAND;
    SLIT_U.forEach((u) => x.fillRect(u * TW - slitW / 2, bandPx, slitW, TH - bandPx));
    x.beginPath();
    x.moveTo(0, TH);
    for (let px = 0; px < TW; px++) x.lineTo(px, deckleLow[px]);
    x.lineTo(TW, TH);
    x.closePath();
    x.fill();
    const side = rng(771);
    for (let e = 0; e < 2; e++) {
      x.beginPath();
      x.moveTo(e ? TW : 0, 0);
      for (let py = 0; py <= TH; py += 6) {
        const w = 6 + side() * 9;
        x.lineTo(e ? TW - w : w, py);
      }
      x.lineTo(e ? TW : 0, TH);
      x.closePath();
      x.fill();
    }
    return s;
  }

  function drawWeaveCrest(x: CanvasRenderingContext2D, cx: number, cy: number, R: number) {
    const cells = 6;
    const step = (R * 1.86) / cells;
    const origin = -R * 0.93;
    x.save();
    x.beginPath();
    x.arc(cx, cy, R * 0.86, 0, Math.PI * 2);
    x.clip();
    x.fillStyle = "#f3ece0";
    for (let a = 0; a < cells; a++) {
      for (let b = 0; b < cells; b++) {
        if ((a + b) % 2) continue;
        x.fillRect(cx + origin + a * step, cy + origin + b * step, step + 0.5, step + 0.5);
      }
    }
    x.restore();
    x.strokeStyle = "#f3ece0";
    x.lineWidth = R * 0.1;
    x.beginPath();
    x.arc(cx, cy, R * 0.96, 0, Math.PI * 2);
    x.stroke();
  }

  function verticalWord(
    x: CanvasRenderingContext2D,
    word: string,
    cx: number,
    top: number,
    size: number,
    step: number,
  ) {
    x.font = "bold " + size + 'px Georgia, "Times New Roman", serif';
    x.textAlign = "center";
    x.textBaseline = "middle";
    for (let i = 0; i < word.length; i++) x.fillText(word[i], cx, top + i * step);
  }

  function makeClothCanvas() {
    const s = surface(TW, TH);
    const x = s.ctx;
    const g = x.createLinearGradient(0, 0, 0, TH);
    g.addColorStop(0, "#284a6c");
    g.addColorStop(0.42, "#203d5e");
    g.addColorStop(1, "#17304e");
    x.fillStyle = g;
    x.fillRect(0, 0, TW, TH);

    const cloud = rng(4471);
    for (let i = 0; i < 26; i++) {
      const cx = cloud() * TW;
      const cy = cloud() * TH;
      const r = 120 + cloud() * 320;
      const light = cloud() > 0.5;
      const rg = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      rg.addColorStop(0, light ? "rgba(96,132,168,0.13)" : "rgba(9,22,40,0.16)");
      rg.addColorStop(1, "rgba(0,0,0,0)");
      x.fillStyle = rg;
      x.fillRect(cx - r, cy - r, r * 2, r * 2);
    }

    x.strokeStyle = "rgba(180,205,228,0.045)";
    x.lineWidth = 1;
    for (let px = 0; px < TW; px += 4) {
      x.beginPath();
      x.moveTo(px + 0.5, 0);
      x.lineTo(px + 0.5, TH);
      x.stroke();
    }
    x.strokeStyle = "rgba(196,218,238,0.10)";
    x.lineWidth = 2;
    for (let py = 26; py < TH; py += 38) {
      x.beginPath();
      x.moveTo(0, py + 0.5);
      x.lineTo(TW, py + 0.5);
      x.stroke();
    }

    const fib = rng(90210);
    for (let i = 0; i < 2200; i++) {
      const fx = fib() * TW;
      const fy = fib() * TH;
      const len = 30 + fib() * 150;
      const ang = (fib() - 0.5) * 0.9 + (fib() > 0.82 ? Math.PI / 2 : 0);
      const bow = (fib() - 0.5) * 26;
      const pale = fib();
      x.strokeStyle =
        pale > 0.3
          ? "rgba(214,232,247," + (0.022 + fib() * 0.048) + ")"
          : "rgba(10,20,36," + (0.04 + fib() * 0.07) + ")";
      x.lineWidth = 0.7 + fib() * 1.9;
      x.beginPath();
      x.moveTo(fx, fy);
      x.quadraticCurveTo(
        fx + Math.cos(ang) * len * 0.5 + bow,
        fy + Math.sin(ang) * len * 0.5 - bow,
        fx + Math.cos(ang) * len,
        fy + Math.sin(ang) * len,
      );
      x.stroke();
    }

    const panelW = TW / PANELS;
    x.strokeStyle = "rgba(243,236,224,0.72)";
    for (let k = 0; k < PANELS; k++) {
      const x0 = k * panelW + 34;
      const w = panelW - 68;
      x.lineWidth = 5;
      x.strokeRect(x0, TH * BAND + 34, w, TH - TH * BAND - 118);
      x.lineWidth = 2;
      x.strokeRect(x0 + 13, TH * BAND + 47, w - 26, TH - TH * BAND - 144);
    }

    x.fillStyle = "rgba(8,18,34,0.30)";
    x.fillRect(0, 0, TW, TH * BAND);
    const sh = x.createLinearGradient(0, TH * BAND, 0, TH * BAND + 54);
    sh.addColorStop(0, "rgba(6,14,28,0.42)");
    sh.addColorStop(1, "rgba(6,14,28,0)");
    x.fillStyle = sh;
    x.fillRect(0, TH * BAND, TW, 54);
    x.strokeStyle = "rgba(243,236,224,0.5)";
    x.lineWidth = 2.5;
    x.beginPath();
    x.moveTo(0, TH * BAND);
    x.lineTo(TW, TH * BAND);
    x.stroke();

    x.fillStyle = "#f3ece0";
    verticalWord(x, "WOVEN", panelW * 0.5, TH * 0.34, 96, 116);
    drawWeaveCrest(x, panelW * 1.5, TH * 0.53, 158);
    verticalWord(x, "CLOTH", panelW * 2.5, TH * 0.34, 96, 116);

    const S = 96;
    const sx = panelW * 1.5 - S / 2;
    const sy = TH * 0.828;
    x.fillStyle = "#a8342a";
    x.fillRect(sx, sy, S, S);
    x.strokeStyle = "#f3ece0";
    x.lineWidth = 4;
    x.strokeRect(sx + 11, sy + 11, S - 22, S - 22);
    x.fillStyle = "#f3ece0";
    for (let k = 0; k < 3; k++) x.fillRect(sx + 23 + k * 18, sy + 23, 8, S - 46);
    x.fillRect(sx + 23, sy + 38, S - 46, 8);
    x.fillRect(sx + 23, sy + 60, S - 46, 8);
    return s;
  }

  function makeWoodTexture() {
    const W = 512;
    const H = 96;
    const s = surface(W, H);
    const x = s.ctx;
    const g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#a1764a");
    g.addColorStop(0.45, "#7d5533");
    g.addColorStop(1, "#563820");
    x.fillStyle = g;
    x.fillRect(0, 0, W, H);
    const grain = rng(3312);
    for (let i = 0; i < 160; i++) {
      const y = grain() * H;
      x.strokeStyle = "rgba(28,17,8," + (0.05 + grain() * 0.16) + ")";
      x.lineWidth = 0.6 + grain() * 1.8;
      x.beginPath();
      x.moveTo(0, y);
      for (let px = 0; px <= W; px += 32) x.lineTo(px, y + Math.sin(px * 0.02 + i) * 2.4);
      x.stroke();
    }
    const tex = new THREE.CanvasTexture(s.canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.repeat.set(3, 1);
    return tex;
  }

  function makeShojiTexture() {
    const W = 768;
    const H = 512;
    const s = surface(W, H);
    const x = s.ctx;
    x.fillStyle = "#1a1109";
    x.fillRect(0, 0, W, H);
    const glow = x.createRadialGradient(W * 0.5, H * 0.44, 0, W * 0.5, H * 0.44, W * 0.52);
    glow.addColorStop(0, "#ffdda4");
    glow.addColorStop(0.4, "#a97c42");
    glow.addColorStop(0.76, "#341d0c");
    glow.addColorStop(1, "#150d06");
    x.fillStyle = glow;
    x.fillRect(0, 0, W, H);
    if ("filter" in x) x.filter = "blur(7px)";
    x.strokeStyle = "rgba(46,28,13,0.20)";
    x.lineWidth = 3;
    for (let px = 54; px < W; px += 128) {
      x.beginPath();
      x.moveTo(px, 0);
      x.lineTo(px, H);
      x.stroke();
    }
    for (let py = 46; py < H; py += 118) {
      x.beginPath();
      x.moveTo(0, py);
      x.lineTo(W, py);
      x.stroke();
    }
    if ("filter" in x) x.filter = "none";
    const tex = new THREE.CanvasTexture(s.canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.22;

  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0c0906);

  const shojiTex = makeShojiTexture();
  const shoji = new THREE.Mesh(
    new THREE.PlaneGeometry(13, 8.4),
    new THREE.MeshBasicMaterial({ map: shojiTex }),
  );
  shoji.position.set(0, 0, -2.4);
  scene.add(shoji);

  const BW = 4.4;
  const BH = 2.9;
  const GX = 60;
  const GY = 40;
  const geo = new THREE.PlaneGeometry(BW, BH, GX, GY);

  const albedo = new THREE.CanvasTexture(makeClothCanvas().canvas);
  albedo.colorSpace = THREE.SRGBColorSpace;
  const alphaMap = new THREE.CanvasTexture(makeAlphaMask().canvas);
  [albedo, alphaMap].forEach((t) => {
    t.anisotropy = maxAniso;
  });

  const mat = new THREE.MeshPhysicalMaterial({
    map: albedo,
    alphaMap,
    alphaTest: 0.5,
    transparent: false,
    side: THREE.DoubleSide,
    roughness: 0.92,
    metalness: 0.0,
    transmission: 0.82,
    thickness: 0.1,
    ior: 1.36,
    attenuationColor: new THREE.Color("#9dc0dd"),
    attenuationDistance: 3.0,
    sheen: 0.9,
    sheenColor: new THREE.Color("#d8e6f2"),
    sheenRoughness: 0.85,
  });
  scene.add(new THREE.Mesh(geo, mat));

  const woodTex = makeWoodTexture();
  const wood = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.66, metalness: 0.0 });
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, BW + 0.9, 20), wood);
  rod.rotation.z = Math.PI / 2;
  rod.position.set(0, BH / 2 + 0.045, 0.02);
  scene.add(rod);
  [-1, 1].forEach((side) => {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.082, 18, 12), wood);
    cap.position.set((side * (BW + 0.9)) / 2, BH / 2 + 0.045, 0.02);
    scene.add(cap);
    const cord = new THREE.Mesh(
      new THREE.CylinderGeometry(0.011, 0.011, 3.4, 8),
      new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: 0.9 }),
    );
    cord.position.set((side * (BW + 0.72)) / 2, BH / 2 + 1.75, 0.02);
    scene.add(cord);
  });

  scene.add(new THREE.AmbientLight(0x4a3a28, 0.8));
  const lantern = new THREE.DirectionalLight(0xffd9a0, 3.6);
  lantern.position.set(-0.4, 0.9, -3.2);
  scene.add(lantern);
  const key = new THREE.DirectionalLight(0xffe9cc, 2.1);
  key.position.set(-2.6, 2.4, 2.6);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x94b6d8, 0.5);
  fill.position.set(3.0, -1.0, 2.0);
  scene.add(fill);

  const BAND_ROWS = Math.round(GY * BAND);
  const SLIT_IX = SLIT_U.map((u) => Math.round(u * GX));
  const panelOf = (ix: number) => (ix < SLIT_IX[0] ? 0 : ix < SLIT_IX[1] ? 1 : 2);
  const restH = BW / GX;
  const restV = BH / GY;

  const sheet = createSheet(geo, BW, BH, {
    GX,
    GY,
    GRAV: -1.65,
    DAMP: 0.986,
    iterations: 3,
    pin: (_ix, iy) => iy === 0,
    linked: (ix, iy) => !(iy > BAND_ROWS && SLIT_IX.indexOf(ix + 1) !== -1),
    restD: Math.sqrt(restH * restH + restV * restV),
    wind: (ix, iy, t) => {
      const cx = ix / GX;
      const cy = iy / GY;
      const ph = panelOf(ix) * 2.1;
      const gust = 0.4 + 0.28 * Math.sin(t * 0.37 + ph * 0.6) + 0.15 * Math.sin(t * 0.93 + ph);
      const travel = t * 1.2 - cy * 2.2 + ph;
      const amp = 1.5 * cy;
      const fz = (Math.sin(travel) + 0.35 * Math.sin(travel * 1.8 + cx * 3.4)) * amp * gust;
      const fx = Math.sin(t * 0.44 + ph) * 0.2 * cy;
      return [fx, -0.18 * cy, fz];
    },
    hold: holdTopRow(GX),
  });

  let camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);

  return {
    warm: 180,
    still: 180,
    step: sheet.step,
    commit: sheet.commit,
    draw: (t) => {
      camera.position.x = Math.sin(t * 0.1) * 0.2;
      camera.position.y = 0.06 + Math.sin(t * 0.14 + 1.1) * 0.07;
      camera.lookAt(0, -0.02, 0);
      renderer.render(scene, camera);
    },
    fit: (w, h) => {
      renderer.setSize(w, h, false);
      const aspect = w / h;
      camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 100);
      const vFit = (BH * 1.12) / 2 / Math.tan((38 * Math.PI) / 360);
      const hFit = (BW + 1.2) / 2 / Math.tan((38 * Math.PI) / 360) / aspect;
      camera.position.set(0, 0.06, Math.max(vFit, hFit) * 1.02 + 0.3);
      camera.lookAt(0, -0.02, 0);
    },
    dispose: () => {
      disposeScene(scene);
      [shojiTex, albedo, alphaMap, woodTex].forEach((t) => t.dispose());
      renderer.dispose();
    },
  };
}

const BUILDERS: Record<WovenClothVariant, (canvas: HTMLCanvasElement) => Runtime> = {
  "woven-cloth": buildWovenCloth,
  iridescent: buildIridescent,
  atelier: buildAtelier,
  washi: buildWashi,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function WovenCloth({
  variant = "woven-cloth",
  hue = 0,
  saturation = 1,
  brightness = 1,
  backgroundColor,
  className,
}: WovenClothProps) {
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const runtime = BUILDERS[variant](canvas);
    let t = 0;
    let raf = 0;
    let running = false;
    let visible = true;

    const resize = () => {
      const w = Math.max(1, host.clientWidth);
      const h = Math.max(1, host.clientHeight);
      runtime.fit(w, h);
      if (prefersReducedMotion || !running) runtime.draw(t);
    };

    const loop = () => {
      if (!running) return;
      t += DT;
      runtime.step(t);
      runtime.commit();
      runtime.draw(t);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (running || prefersReducedMotion || !visible || document.hidden) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const warm = prefersReducedMotion ? runtime.still : runtime.warm;
    for (let s = 0; s < warm; s++) runtime.step(s * DT);
    t = warm * DT;
    runtime.commit();
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(host);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(host);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);
    start();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      runtime.dispose();
    };
  }, [variant, prefersReducedMotion]);

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
      className={cn("absolute inset-0 overflow-hidden", className)}
      style={{ background: backgroundColor ?? BACKGROUNDS[variant], filter }}
    >
      <canvas key={variant} ref={canvasRef} className="absolute inset-0 block h-full w-full" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: VIGNETTES[variant] }}
      />
    </div>
  );
}
