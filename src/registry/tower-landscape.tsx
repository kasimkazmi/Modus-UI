"use client";
// Ported from ThreeUI Community's Japanese Tower (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { cn } from "@/lib/utils";

export type TowerVariant = "japan" | "china" | "vietnam" | "thailand" | "cambodia" | "turkey";
export type TowerTextureName =
  | "ishigaki"
  | "shikkui"
  | "kawara"
  | "timber"
  | "pine"
  | "redwall"
  | "greenglaze"
  | "orangetile"
  | "goldleaf"
  | "ground"
  | "sandstone"
  | "laterite"
  | "ashlar"
  | "leadroof"
  | "iznik";

const TOWER_LABELS: Record<TowerVariant, string> = {
  japan: "Japanese tenshu",
  china: "Chinese pagoda",
  vietnam: "Vietnamese tháp",
  thailand: "Thai prang",
  cambodia: "Khmer prasat",
  turkey: "Ottoman mosque",
};

interface TowerLandscapeProps {
  /** Which country's tower assembles above the landscape. */
  variant?: TowerVariant;
  /** Image urls for the surface textures; any left out are drawn procedurally. */
  textures?: Partial<Record<TowerTextureName, string>>;
  className?: string;
}

const PROC_CACHE = new Map();

/* The original scene script, kept as authored and mounted into one host. */
function mountScene(host?: any, cvs?: any, flashEl?: any, washEl?: any, opts?: any) {
  const LANDSCAPE = opts.mode === "landscape";
  const STILL = !!opts.still;
  const TEXTURE_URLS = opts.textures || null;
  const timers: any = [];
  let destroyed = false;
  /* r149 lit in legacy units and took colours as written; three now converts
     colours to linear and lights physically, so the scene opts back out for
     exactly as long as its own code runs */
  const LEGACY_LIGHT = Math.PI;
  function legacy(fn?: any) {
    const prev = THREE.ColorManagement.enabled;
    THREE.ColorManagement.enabled = false;
    try {
      return fn();
    } finally {
      THREE.ColorManagement.enabled = prev;
    }
  }
  function paintWash(css?: any) {
    host.style.backgroundColor = css.paper;
    if (washEl)
      washEl.style.background =
        "radial-gradient(118% 80% at 50% 40%," +
        css.w0 +
        " 0%," +
        css.w0 +
        " 26%," +
        css.w1 +
        " 58%," +
        css.w2 +
        " 84%," +
        css.paper +
        " 100%)";
  }

  return legacy(() => {
    /* ------------------------------------------------------------------ *
     * 1b.  procedural stand-ins for the photographic texture set — seamless
     *      canvases in the measured mean colour and pattern of each surface,
     *      used whenever no texture url is supplied for that name
     * ------------------------------------------------------------------ */
    function tileNoise(seed?: any, P?: any) {
      const rnd = mulberry32(seed),
        a = new Float32Array(P * P);
      for (let i = 0; i < P * P; i++) a[i] = rnd();
      const at = (x?: any, y?: any) => a[(((y % P) + P) % P) * P + (((x % P) + P) % P)];
      const sm = (t?: any) => t * t * (3 - 2 * t);
      return (x?: any, y?: any) => {
        const xi = Math.floor(x),
          yi = Math.floor(y),
          xf = sm(x - xi),
          yf = sm(y - yi);
        const p = at(xi, yi),
          q = at(xi + 1, yi),
          r = at(xi, yi + 1),
          s = at(xi + 1, yi + 1);
        return (p + (q - p) * xf) * (1 - yf) + (r + (s - r) * xf) * yf;
      };
    }
    /* u,v in 0..1, periodic at every octave */
    function tileFbm(seed?: any, base?: any, oct?: any, sx?: any, sy?: any) {
      const ns: any = [];
      for (let o = 0; o < oct; o++) ns.push(tileNoise(seed + o * 101, base << o));
      sx = sx || 1;
      sy = sy || 1;
      return (u?: any, v?: any) => {
        let s = 0,
          a = 0.5,
          tot = 0;
        for (let o = 0; o < oct; o++) {
          s += a * ns[o](u * (base << o) * sx, v * (base << o) * sy);
          tot += a;
          a *= 0.5;
        }
        return s / tot;
      };
    }
    const TEX_SPEC: any = {
      ishigaki: { c: 0x7a6b54, k: 0.3, base: 8, kind: "stones" },
      shikkui: { c: 0xd7ccb3, k: 0.07, base: 4 },
      kawara: { c: 0x4d4943, k: 0.1, base: 16 },
      timber: { c: 0x513c2e, k: 0.22, base: 8, kind: "grainV" },
      pine: { c: 0xe6b76c, k: 0.16, base: 4, kind: "grainH" },
      redwall: { c: 0xb4372b, k: 0.12, base: 4, kind: "blotch" },
      greenglaze: { c: 0x105824, k: 0.14, base: 16 },
      orangetile: { c: 0xb23d08, k: 0.16, base: 8, kind: "scales" },
      goldleaf: { c: 0xc1881e, k: 0.26, base: 4, kind: "blotch" },
      ground: { c: 0x89734f, k: 0.18, base: 32 },
      sandstone: { c: 0x948664, k: 0.38, base: 4, kind: "blotch" },
      laterite: { c: 0x763f2b, k: 0.24, base: 32, kind: "pores" },
      ashlar: { c: 0xbfb4a0, k: 0.08, base: 8, kind: "blocks" },
      leadroof: { c: 0x878b91, k: 0.08, base: 4, kind: "seams" },
      iznik: { c: 0xe8e6dc, k: 0.04, base: 4, kind: "iznik" },
    };
    function proceduralTexture(name?: any) {
      const sp = TEX_SPEC[name] || { c: 0x999999, k: 0.1, base: 8 };
      if (PROC_CACHE.has(name)) return PROC_CACHE.get(name);
      const S = sp.kind && sp.kind !== "blotch" && sp.kind !== "pores" ? 512 : 256,
        c = cv(S, S),
        g = c.getContext("2d"),
        img = g.createImageData(S, S),
        d = img.data;
      const seed = [...name].reduce((h?: any, ch?: any) => (h * 31 + ch.charCodeAt(0)) | 0, 7);
      const R = (sp.c >> 16) & 255,
        G = (sp.c >> 8) & 255,
        B = sp.c & 255;
      const f = tileFbm(seed, sp.base, 4),
        f2 = tileFbm(seed + 7, sp.base * 2, 3);
      /* voronoi seeds for the stone wall */
      let pts: any = null;
      if (sp.kind === "stones") {
        const rnd = mulberry32(seed);
        pts = [];
        for (let j = 0; j < 7; j++)
          for (let i = 0; i < 7; i++)
            pts.push([
              (i + 0.15 + rnd() * 0.7) / 7,
              (j + 0.15 + rnd() * 0.7) / 7,
              0.78 + rnd() * 0.44,
            ]);
      }
      for (let y = 0; y < S; y++)
        for (let x = 0; x < S; x++) {
          const u = x / S,
            v = y / S,
            i = (y * S + x) * 4;
          let l = 1 + (f(u, v) - 0.5) * 2 * sp.k + (f2(u, v) - 0.5) * sp.k * 0.6;
          if (sp.kind === "blotch") l += Math.max(0, f2(u * 0.5, v * 0.5) - 0.55) * sp.k * 1.6;
          if (sp.kind === "grainV") {
            l *= 0.86 + 0.28 * (0.5 + 0.5 * Math.sin((u + f(u, v) * 0.06) * Math.PI * 2 * 38));
          }
          if (sp.kind === "grainH") {
            const w = v + f(u, v) * 0.1;
            l *= 0.9 + 0.18 * Math.pow(0.5 + 0.5 * Math.sin(w * Math.PI * 2 * 14), 3);
          }
          if (sp.kind === "pores" && f2(u, v) > 0.74) l *= 0.45;
          if (sp.kind === "stones") {
            let d1 = 9,
              d2 = 9,
              tone = 1;
            const ci = Math.floor(u * 7),
              cj = Math.floor(v * 7);
            for (let dj = -1; dj <= 1; dj++)
              for (let di = -1; di <= 1; di++) {
                const ii = ci + di,
                  jj = cj + dj,
                  wi = (ii + 7) % 7,
                  wj = (jj + 7) % 7,
                  p = pts[wj * 7 + wi];
                const dx = u - (p[0] + (ii - wi) / 7),
                  dy = v - (p[1] + (jj - wj) / 7),
                  dd = Math.hypot(dx, dy);
                if (dd < d1) {
                  d2 = d1;
                  d1 = dd;
                  tone = p[2];
                } else if (dd < d2) d2 = dd;
              }
            const edge = Math.min(1, ((d2 - d1) * S) / 9);
            l *= tone * (0.42 + 0.58 * edge);
          }
          d[i] = Math.max(0, Math.min(255, R * l));
          d[i + 1] = Math.max(0, Math.min(255, G * l));
          d[i + 2] = Math.max(0, Math.min(255, B * l));
          d[i + 3] = 255;
        }
      g.putImageData(img, 0, 0);
      if (sp.kind === "blocks") {
        g.strokeStyle = "rgba(150,138,118,.85)";
        g.lineWidth = 3;
        const rows = 8,
          bw = S / 4;
        for (let r = 0; r < rows; r++) {
          const y = (r * S) / rows;
          g.beginPath();
          g.moveTo(0, y);
          g.lineTo(S, y);
          g.stroke();
          for (let k = 0; k <= 4; k++) {
            const x = k * bw + (r % 2 ? bw / 2 : 0);
            g.beginPath();
            g.moveTo(x % S, y);
            g.lineTo(x % S, y + S / rows);
            g.stroke();
          }
        }
      }
      if (sp.kind === "seams") {
        g.strokeStyle = "rgba(70,74,80,.55)";
        g.lineWidth = 4;
        for (let k = 0; k < 3; k++) {
          const x = ((k + 0.5) * S) / 3;
          g.beginPath();
          g.moveTo(x, 0);
          g.lineTo(x, S);
          g.stroke();
        }
        g.strokeStyle = "rgba(205,210,216,.45)";
        g.lineWidth = 2;
        for (let k = 0; k < 3; k++) {
          const x = ((k + 0.5) * S) / 3 + 4;
          g.beginPath();
          g.moveTo(x, 0);
          g.lineTo(x, S);
          g.stroke();
        }
      }
      if (sp.kind === "scales") {
        const n = 8,
          w = S / n,
          h = S / 12;
        for (let r = -1; r <= 12; r++)
          for (let k = -1; k <= n; k++) {
            const x = k * w + (r % 2 ? w / 2 : 0) + w / 2,
              y = r * h;
            g.beginPath();
            g.arc(x, y, w / 2, 0, Math.PI);
            g.fillStyle = `rgba(${r % 3 ? 205 : 190},${r % 3 ? 74 : 66},12,.55)`;
            g.fill();
            g.strokeStyle = "rgba(120,36,4,.85)";
            g.lineWidth = 2.5;
            g.stroke();
          }
      }
      if (sp.kind === "iznik") {
        const cells = 4,
          w = S / cells;
        for (let j = 0; j < cells; j++)
          for (let k = 0; k < cells; k++) {
            const cx = (k + 0.5) * w + (j % 2 ? w / 2 : 0),
              cy = (j + 0.5) * w;
            for (const ox of [-S, 0, S]) {
              const X = cx + ox;
              for (let p = 0; p < 8; p++) {
                const a = (p / 8) * Math.PI * 2;
                g.beginPath();
                g.ellipse(
                  X + Math.cos(a) * w * 0.22,
                  cy + Math.sin(a) * w * 0.22,
                  w * 0.13,
                  w * 0.06,
                  a,
                  0,
                  Math.PI * 2,
                );
                g.fillStyle = p % 2 ? "#2f9fb8" : "#1f3f9f";
                g.fill();
              }
              g.beginPath();
              g.arc(X, cy, w * 0.09, 0, Math.PI * 2);
              g.fillStyle = "#1d2f86";
              g.fill();
              g.beginPath();
              g.arc(X, cy, w * 0.04, 0, Math.PI * 2);
              g.fillStyle = "#c8463a";
              g.fill();
              g.strokeStyle = "rgba(40,70,170,.7)";
              g.lineWidth = 3;
              g.beginPath();
              g.moveTo(X - w * 0.5, cy + w * 0.5);
              g.quadraticCurveTo(X, cy + w * 0.2, X + w * 0.5, cy + w * 0.5);
              g.stroke();
            }
          }
      }
      PROC_CACHE.set(name, c);
      return c;
    }

    const T: any = THREE;

    /* ------------------------------------------------------------------ *
     * 0.  deterministic noise
     * ------------------------------------------------------------------ */
    function mulberry32(a?: any) {
      return function () {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    function makeNoise(seed?: any) {
      const rnd = mulberry32(seed),
        p = new Float32Array(65536);
      for (let i = 0; i < 65536; i++) p[i] = rnd();
      const at = (x?: any, y?: any) => p[((y & 255) << 8) + (x & 255)];
      const sm = (t?: any) => t * t * (3 - 2 * t);
      return function (x?: any, y?: any) {
        const xi = Math.floor(x),
          yi = Math.floor(y),
          xf = sm(x - xi),
          yf = sm(y - yi);
        const a = at(xi, yi),
          b = at(xi + 1, yi),
          c = at(xi, yi + 1),
          d = at(xi + 1, yi + 1);
        return (a + (b - a) * xf) * (1 - yf) + (c + (d - c) * xf) * yf;
      };
    }
    function fbm(n?: any, x?: any, y?: any, oct?: any, gain?: any) {
      let s = 0,
        a = 0.5,
        f = 1,
        tot = 0;
      for (let i = 0; i < oct; i++) {
        s += a * n(x * f, y * f);
        tot += a;
        a *= gain || 0.5;
        f *= 2;
      }
      return s / tot;
    }

    /* ------------------------------------------------------------------ *
     * 1.  canvas textures — everything in earth pigment
     * ------------------------------------------------------------------ */
    function cv(w?: any, h?: any): any {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h || w;
      return c;
    }
    function toTex(c?: any, rx?: any, ry?: any) {
      const t = new T.CanvasTexture(c);
      t.wrapS = t.wrapT = T.RepeatWrapping;
      t.repeat.set(rx || 1, ry || 1);
      t.anisotropy = 8;
      if (t.encoding !== undefined && T.sRGBEncoding !== undefined) t.encoding = T.sRGBEncoding;
      if ("colorSpace" in t && T.SRGBColorSpace !== undefined) t.colorSpace = T.SRGBColorSpace;
      return t;
    }
    function toLin(c?: any, rx?: any, ry?: any) {
      const t = new T.CanvasTexture(c);
      t.wrapS = t.wrapT = T.RepeatWrapping;
      t.repeat.set(rx || 1, ry || 1);
      t.anisotropy = 4;
      return t;
    }

    /* GPT Image 2 texture set — made seamless and compressed at build time */
    const _img: any = {},
      _wait: any = {};
    function loadImg(name?: any, cb?: any) {
      /* the bare landscape never raises a tower, so it never needs its surfaces */
      if (LANDSCAPE) return;
      if (_img[name]) return cb(_img[name]);
      (_wait[name] = _wait[name] || []).push(cb);
      if (_wait[name].length > 1) return;
      const done = (im?: any) => {
        if (destroyed) return;
        _img[name] = im;
        (_wait[name] || []).forEach((f?: any) => f(im));
        _wait[name] = [];
      };
      const url = TEXTURE_URLS && TEXTURE_URLS[name];
      if (!url) {
        done(proceduralTexture(name));
        return;
      }
      const im = new Image();
      im.crossOrigin = "anonymous";
      im.onload = () => done(im);
      im.onerror = () => done(proceduralTexture(name));
      im.src = url;
    }
    function srgb(t?: any) {
      if (t.encoding !== undefined && T.sRGBEncoding !== undefined) t.encoding = T.sRGBEncoding;
      if ("colorSpace" in t && T.SRGBColorSpace !== undefined) t.colorSpace = T.SRGBColorSpace;
      return t;
    }
    function drawTo(img?: any, size?: any) {
      const c = cv(size, size);
      c.getContext("2d").drawImage(img, 0, 0, size, size);
      return c;
    }
    /* height field from luminance, for bumpMap */
    function bumpCanvas(img?: any, strength?: any) {
      const S = Math.min(512, img.width),
        c = drawTo(img, S),
        g = c.getContext("2d");
      const d = g.getImageData(0, 0, S, S),
        a = d.data;
      let mean = 0;
      for (let i = 0; i < a.length; i += 4) mean += a[i] * 0.3 + a[i + 1] * 0.59 + a[i + 2] * 0.11;
      mean /= a.length / 4;
      for (let i = 0; i < a.length; i += 4) {
        const v = a[i] * 0.3 + a[i + 1] * 0.59 + a[i + 2] * 0.11;
        const m = Math.max(0, Math.min(255, 128 + (v - mean) * strength));
        a[i] = a[i + 1] = a[i + 2] = m;
        a[i + 3] = 255;
      }
      g.putImageData(d, 0, 0);
      return c;
    }
    /* rougher where the surface reads darker and more porous */
    function roughCanvas(img?: any, lo?: any, hi?: any) {
      const S = Math.min(256, img.width),
        c = drawTo(img, S),
        g = c.getContext("2d");
      const d = g.getImageData(0, 0, S, S),
        a = d.data;
      for (let i = 0; i < a.length; i += 4) {
        const v = (a[i] * 0.3 + a[i + 1] * 0.59 + a[i + 2] * 0.11) / 255;
        const r = Math.max(0, Math.min(255, 255 * (hi - (hi - lo) * v)));
        a[i] = a[i + 1] = a[i + 2] = r;
        a[i + 3] = 255;
      }
      g.putImageData(d, 0, 0);
      return c;
    }

    /* 鯱 — antique bronze */
    function texBronze(seed?: any) {
      const S = 256,
        c = cv(S),
        g = c.getContext("2d"),
        n = makeNoise(seed);
      const img = g.createImageData(S, S),
        d = img.data;
      for (let y = 0; y < S; y++)
        for (let x = 0; x < S; x++) {
          const i = (y * S + x) * 4;
          const v = fbm(n, x / 40, y / 40, 3, 0.55),
            f = fbm(n, x / 8, y / 8, 2, 0.5);
          const l = 0.74 + v * 0.44 + f * 0.2;
          d[i] = Math.min(255, 168 * l);
          d[i + 1] = Math.min(255, 130 * l);
          d[i + 2] = Math.min(255, 74 * l);
          d[i + 3] = 255;
        }
      g.putImageData(img, 0, 0);
      return c;
    }

    function bumpFrom(canvas?: any, strength?: any) {
      const w = canvas.width,
        h = canvas.height;
      const src = canvas.getContext("2d").getImageData(0, 0, w, h).data;
      const c2 = cv(w, h),
        g2 = c2.getContext("2d"),
        out = g2.createImageData(w, h),
        o = out.data;
      for (let i = 0; i < src.length; i += 4) {
        const v = src[i] * 0.3 + src[i + 1] * 0.59 + src[i + 2] * 0.11;
        const m = 128 + (v - 128) * (strength || 1);
        o[i] = o[i + 1] = o[i + 2] = Math.max(0, Math.min(255, m));
        o[i + 3] = 255;
      }
      g2.putImageData(out, 0, 0);
      return c2;
    }

    /* ------------------------------------------------------------------ *
     * 2.  geometry builder — square on plan, presented corner-on
     * ------------------------------------------------------------------ */
    const NS = 4;
    const STEP = (Math.PI * 2) / NS;
    const AP = Math.cos(Math.PI / NS); /* apothem / circumradius */
    const SW = 2 * Math.sin(Math.PI / NS); /* face width / circumradius */
    const faceRot = (k?: any) => Math.PI / 2 - (k + 0.5) * STEP;
    const cornRot = (k?: any) => Math.PI / 2 - k * STEP;
    const cornPt = (k?: any, R?: any) => [Math.cos(k * STEP) * R, Math.sin(k * STEP) * R];

    function Bld(this: any) {
      this.p = [];
      this.n = [];
      this.u = [];
      this.i = [];
    }
    Bld.prototype.vert = function (
      this: any,
      x?: any,
      y?: any,
      z?: any,
      nx?: any,
      ny?: any,
      nz?: any,
      u?: any,
      v?: any,
    ) {
      this.p.push(x, y, z);
      this.n.push(nx, ny, nz);
      this.u.push(u, v);
      return this.p.length / 3 - 1;
    };
    Bld.prototype.quad = function (this: any, a?: any, b?: any, c?: any, d?: any) {
      this.i.push(a, b, c, a, c, d);
    };
    Bld.prototype.face = function (this: any, P?: any, uv?: any) {
      const ax = P[1][0] - P[0][0],
        ay = P[1][1] - P[0][1],
        az = P[1][2] - P[0][2];
      const bx = P[2][0] - P[0][0],
        by = P[2][1] - P[0][1],
        bz = P[2][2] - P[0][2];
      let nx = ay * bz - az * by,
        ny = az * bx - ax * bz,
        nz = ax * by - ay * bx;
      const Ln = Math.hypot(nx, ny, nz);
      if (Ln < 1e-9) {
        nx = 0;
        ny = 1;
        nz = 0;
      } else {
        nx /= Ln;
        ny /= Ln;
        nz /= Ln;
      }
      const t = uv || [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ];
      const a = this.vert(P[0][0], P[0][1], P[0][2], nx, ny, nz, t[0][0], t[0][1]);
      const b = this.vert(P[1][0], P[1][1], P[1][2], nx, ny, nz, t[1][0], t[1][1]);
      const c = this.vert(P[2][0], P[2][1], P[2][2], nx, ny, nz, t[2][0], t[2][1]);
      const d = this.vert(P[3][0], P[3][1], P[3][2], nx, ny, nz, t[3][0], t[3][1]);
      this.quad(a, b, c, d);
    };
    Bld.prototype.geo = function (this: any) {
      const g = new T.BufferGeometry();
      g.setAttribute("position", new T.Float32BufferAttribute(this.p, 3));
      g.setAttribute("normal", new T.Float32BufferAttribute(this.n, 3));
      g.setAttribute("uv", new T.Float32BufferAttribute(this.u, 2));
      g.setIndex(this.i);
      return g;
    };

    /* box, rotated first about its own Z then about Y */
    Bld.prototype.box = function (
      this: any,
      cx?: any,
      cy?: any,
      cz?: any,
      sx?: any,
      sy?: any,
      sz?: any,
      ry?: any,
      uvs?: any,
      rz?: any,
    ) {
      const hx = sx / 2,
        hy = sy / 2,
        hz = sz / 2,
        S = uvs || 1;
      const cz2 = Math.cos(rz || 0),
        sz2 = Math.sin(rz || 0);
      const co = Math.cos(ry || 0),
        si = Math.sin(ry || 0);
      const V: any = [
        [-hx, -hy, -hz],
        [hx, -hy, -hz],
        [hx, hy, -hz],
        [-hx, hy, -hz],
        [-hx, -hy, hz],
        [hx, -hy, hz],
        [hx, hy, hz],
        [-hx, hy, hz],
      ];
      const W = V.map((v?: any) => {
        const x = v[0] * cz2 - v[1] * sz2,
          y = v[0] * sz2 + v[1] * cz2,
          z = v[2];
        return [cx + x * co + z * si, cy + y, cz - x * si + z * co];
      });
      const uv = (w?: any, h?: any) => [
        [0, 0],
        [w * S, 0],
        [w * S, h * S],
        [0, h * S],
      ];
      this.face([W[4], W[5], W[6], W[7]], uv(sx, sy));
      this.face([W[1], W[0], W[3], W[2]], uv(sx, sy));
      this.face([W[5], W[1], W[2], W[6]], uv(sz, sy));
      this.face([W[0], W[4], W[7], W[3]], uv(sz, sy));
      this.face([W[7], W[6], W[2], W[3]], uv(sx, sz));
      this.face([W[0], W[1], W[5], W[4]], uv(sx, sz));
    };

    /* octagonal prism / frustum by circumradius */
    Bld.prototype.prism = function (
      this: any,
      y0?: any,
      y1?: any,
      R0?: any,
      R1?: any,
      uvS?: any,
      capTop?: any,
      capBot?: any,
      vOff?: any,
    ) {
      const S = uvS || 1,
        v0 = (vOff || 0) * S;
      for (let k = 0; k < NS; k++) {
        const a = cornPt(k, R0),
          b = cornPt(k + 1, R0),
          c = cornPt(k + 1, R1),
          d = cornPt(k, R1);
        const P: any = [
          [b[0], y0, b[1]],
          [a[0], y0, a[1]],
          [d[0], y1, d[1]],
          [c[0], y1, c[1]],
        ];
        const w = Math.hypot(P[1][0] - P[0][0], P[1][2] - P[0][2]),
          h = Math.abs(y1 - y0);
        this.face(P, [
          [0, v0],
          [w * S, v0],
          [w * S, v0 + h * S],
          [0, v0 + h * S],
        ]);
      }
      if (capTop)
        for (let k = 1; k < NS - 1; k++) {
          const a = cornPt(0, R1),
            b = cornPt(k, R1),
            c = cornPt(k + 1, R1);
          this.face(
            [
              [a[0], y1, a[1]],
              [b[0], y1, b[1]],
              [c[0], y1, c[1]],
              [c[0], y1, c[1]],
            ],
            [
              [0, 0],
              [b[0] * S, b[1] * S],
              [c[0] * S, c[1] * S],
              [c[0] * S, c[1] * S],
            ],
          );
        }
      if (capBot)
        for (let k = 1; k < NS - 1; k++) {
          const a = cornPt(0, R0),
            b = cornPt(k + 1, R0),
            c = cornPt(k, R0);
          this.face(
            [
              [a[0], y0, a[1]],
              [b[0], y0, b[1]],
              [c[0], y0, c[1]],
              [c[0], y0, c[1]],
            ],
            [
              [0, 0],
              [b[0] * S, b[1] * S],
              [c[0] * S, c[1] * S],
              [c[0] * S, c[1] * S],
            ],
          );
        }
    };

    /* n-gon prism for styles that are not square on plan */
    const cPtN = (k?: any, R?: any, n?: any) => [
      Math.cos((k * Math.PI * 2) / n) * R,
      Math.sin((k * Math.PI * 2) / n) * R,
    ];
    Bld.prototype.prismN = function (
      this: any,
      y0?: any,
      y1?: any,
      R0?: any,
      R1?: any,
      n?: any,
      uvS?: any,
      capTop?: any,
      capBot?: any,
    ) {
      const S = uvS || 1;
      for (let k = 0; k < n; k++) {
        const a = cPtN(k, R0, n),
          b = cPtN(k + 1, R0, n),
          c = cPtN(k + 1, R1, n),
          d = cPtN(k, R1, n);
        const P: any = [
          [b[0], y0, b[1]],
          [a[0], y0, a[1]],
          [d[0], y1, d[1]],
          [c[0], y1, c[1]],
        ];
        const w = Math.hypot(P[1][0] - P[0][0], P[1][2] - P[0][2]),
          h = Math.abs(y1 - y0);
        this.face(P, [
          [0, 0],
          [w * S, 0],
          [w * S, h * S],
          [0, h * S],
        ]);
      }
      if (capTop)
        for (let k = 1; k < n - 1; k++) {
          const a = cPtN(0, R1, n),
            b = cPtN(k, R1, n),
            c = cPtN(k + 1, R1, n);
          this.face(
            [
              [a[0], y1, a[1]],
              [b[0], y1, b[1]],
              [c[0], y1, c[1]],
              [c[0], y1, c[1]],
            ],
            [
              [0, 0],
              [1, 0],
              [1, 1],
              [1, 1],
            ],
          );
        }
      if (capBot)
        for (let k = 1; k < n - 1; k++) {
          const a = cPtN(0, R0, n),
            b = cPtN(k + 1, R0, n),
            c = cPtN(k, R0, n);
          this.face(
            [
              [a[0], y0, a[1]],
              [b[0], y0, b[1]],
              [c[0], y0, c[1]],
              [c[0], y0, c[1]],
            ],
            [
              [0, 0],
              [1, 0],
              [1, 1],
              [1, 1],
            ],
          );
        }
    };
    /* sweep a fixed plan outline upward, scaling it by a profile — the shikhara */
    Bld.prototype.sweepPlan = function (
      this: any,
      plan?: any,
      y0?: any,
      y1?: any,
      steps?: any,
      prof?: any,
      uvS?: any,
    ) {
      const S = uvS || 1,
        N = plan.length,
        rings: any = [];
      for (let i = 0; i <= steps; i++) {
        const t = i / steps,
          y = y0 + (y1 - y0) * t,
          k = prof(t),
          ring: any = [];
        for (let j = 0; j < N; j++) ring.push([plan[j][0] * k, y, plan[j][1] * k]);
        rings.push(ring);
      }
      for (let i = 0; i < steps; i++)
        for (let j = 0; j < N; j++) {
          const j2 = (j + 1) % N;
          this.face(
            [rings[i][j2], rings[i][j], rings[i + 1][j], rings[i + 1][j2]],
            [
              [0, (i / steps) * S * 6],
              [1, (i / steps) * S * 6],
              [1, ((i + 1) / steps) * S * 6],
              [0, ((i + 1) / steps) * S * 6],
            ],
          );
        }
      return rings[steps];
    };
    /* surface of revolution — onion cupolas, amalaka discs, pots */
    Bld.prototype.lathe = function (
      this: any,
      cx?: any,
      cy?: any,
      cz?: any,
      y0?: any,
      y1?: any,
      prof?: any,
      steps?: any,
      seg?: any,
      uvS?: any,
      rib?: any,
    ) {
      const S = uvS || 1,
        rings: any = [];
      for (let i = 0; i <= steps; i++) {
        const t = i / steps,
          y = cy + y0 + (y1 - y0) * t,
          r = prof(t),
          ring: any = [];
        for (let j = 0; j < seg; j++) {
          const a = (j / seg) * Math.PI * 2;
          const rr = r * (rib ? 1 + rib * Math.cos((a * seg) / 2) : 1);
          ring.push([cx + Math.cos(a) * rr, y, cz + Math.sin(a) * rr]);
        }
        rings.push(ring);
      }
      for (let i = 0; i < steps; i++)
        for (let j = 0; j < seg; j++) {
          const j2 = (j + 1) % seg;
          this.face(
            [rings[i][j2], rings[i][j], rings[i + 1][j], rings[i + 1][j2]],
            [
              [0, (i / steps) * S * 4],
              [1, (i / steps) * S * 4],
              [1, ((i + 1) / steps) * S * 4],
              [0, ((i + 1) / steps) * S * 4],
            ],
          );
        }
    };

    /* annulus standing on a face plane (outward normal +Z before ry) */
    Bld.prototype.ring = function (
      this: any,
      cx?: any,
      cy?: any,
      cz?: any,
      rIn?: any,
      rOut?: any,
      depth?: any,
      ry?: any,
      segs?: any,
      uvS?: any,
    ) {
      const N = segs || 36,
        S = uvS || 1,
        co = Math.cos(ry || 0),
        si = Math.sin(ry || 0);
      const M = (x?: any, y?: any, z?: any) => [cx + x * co + z * si, cy + y, cz - x * si + z * co];
      for (let i = 0; i < N; i++) {
        const a0 = (i / N) * Math.PI * 2,
          a1 = ((i + 1) / N) * Math.PI * 2;
        const p = (r?: any, a?: any, z?: any) => M(Math.cos(a) * r, Math.sin(a) * r, z);
        this.face(
          [
            p(rIn, a0, depth / 2),
            p(rOut, a0, depth / 2),
            p(rOut, a1, depth / 2),
            p(rIn, a1, depth / 2),
          ],
          [
            [0, (i / N) * S * 6],
            [1, (i / N) * S * 6],
            [1, ((i + 1) / N) * S * 6],
            [0, ((i + 1) / N) * S * 6],
          ],
        );
        this.face(
          [
            p(rIn, a1, depth / 2),
            p(rIn, a1, -depth / 2),
            p(rIn, a0, -depth / 2),
            p(rIn, a0, depth / 2),
          ],
          [
            [0, (i / N) * S * 6],
            [1, (i / N) * S * 6],
            [1, ((i + 1) / N) * S * 6],
            [0, ((i + 1) / N) * S * 6],
          ],
        );
        this.face(
          [
            p(rOut, a0, depth / 2),
            p(rOut, a0, -depth / 2),
            p(rOut, a1, -depth / 2),
            p(rOut, a1, depth / 2),
          ],
          [
            [0, (i / N) * S * 6],
            [1, (i / N) * S * 6],
            [1, ((i + 1) / N) * S * 6],
            [0, ((i + 1) / N) * S * 6],
          ],
        );
      }
    };

    /* partial annulus band standing on a face plane */
    Bld.prototype.arc = function (
      this: any,
      cx?: any,
      cy?: any,
      cz?: any,
      rIn?: any,
      rOut?: any,
      depth?: any,
      ry?: any,
      a0?: any,
      a1?: any,
      segs?: any,
      uvS?: any,
    ) {
      const N = segs || 24,
        S = uvS || 1,
        co = Math.cos(ry || 0),
        si = Math.sin(ry || 0);
      const M = (x?: any, y?: any, z?: any) => [cx + x * co + z * si, cy + y, cz - x * si + z * co];
      for (let i = 0; i < N; i++) {
        const t0 = a0 + ((a1 - a0) * i) / N,
          t1 = a0 + ((a1 - a0) * (i + 1)) / N;
        const p = (r?: any, a?: any, z?: any) => M(Math.cos(a) * r, Math.sin(a) * r, z);
        const uv: any = [
          [0, (i / N) * S * 10],
          [1, (i / N) * S * 10],
          [1, ((i + 1) / N) * S * 10],
          [0, ((i + 1) / N) * S * 10],
        ];
        this.face(
          [
            p(rIn, t0, depth / 2),
            p(rOut, t0, depth / 2),
            p(rOut, t1, depth / 2),
            p(rIn, t1, depth / 2),
          ],
          uv,
        );
        this.face(
          [
            p(rIn, t1, depth / 2),
            p(rIn, t1, -depth / 2),
            p(rIn, t0, -depth / 2),
            p(rIn, t0, depth / 2),
          ],
          uv,
        );
        this.face(
          [
            p(rOut, t0, depth / 2),
            p(rOut, t0, -depth / 2),
            p(rOut, t1, -depth / 2),
            p(rOut, t1, depth / 2),
          ],
          uv,
        );
      }
    };

    /* filled polygon on a face plane */
    Bld.prototype.fan = function (this: any, pts?: any, zz?: any, ry?: any, cx?: any, cy?: any) {
      const co = Math.cos(ry || 0),
        si = Math.sin(ry || 0);
      const M = (x?: any, y?: any) => [x * co + zz * si, y, -x * si + zz * co];
      let mx = 0,
        my = 0;
      if (cx === undefined) {
        for (const q of pts) {
          mx += q[0];
          my += q[1];
        }
        mx /= pts.length;
        my /= pts.length;
      } else {
        mx = cx;
        my = cy;
      }
      const C = M(mx, my);
      for (let i = 0; i < pts.length - 1; i++) {
        const A = M(pts[i][0], pts[i][1]),
          B = M(pts[i + 1][0], pts[i + 1][1]);
        this.face(
          [C, A, B, B],
          [
            [0.5, 0.5],
            [0, 0],
            [1, 0],
            [1, 0],
          ],
        );
      }
    };

    /* swept tube */
    Bld.prototype.tube = function (this: any, pts?: any, r?: any, sides?: any, uvS?: any) {
      const N = sides || 6,
        S = uvS || 1,
        rings: any = [];
      if (pts.length < 2) return;
      for (let k = 0; k < pts.length; k++) {
        const p = pts[k];
        let t: any;
        if (k === 0) t = [pts[1][0] - p[0], pts[1][1] - p[1], pts[1][2] - p[2]];
        else if (k === pts.length - 1)
          t = [p[0] - pts[k - 1][0], p[1] - pts[k - 1][1], p[2] - pts[k - 1][2]];
        else
          t = [
            pts[k + 1][0] - pts[k - 1][0],
            pts[k + 1][1] - pts[k - 1][1],
            pts[k + 1][2] - pts[k - 1][2],
          ];
        let tl = Math.hypot(t[0], t[1], t[2]);
        if (tl < 1e-9) {
          t = [0, 1, 0];
          tl = 1;
        }
        t = [t[0] / tl, t[1] / tl, t[2] / tl];
        const up = Math.abs(t[1]) > 0.95 ? [1, 0, 0] : [0, 1, 0];
        let n1: any = [
          t[1] * up[2] - t[2] * up[1],
          t[2] * up[0] - t[0] * up[2],
          t[0] * up[1] - t[1] * up[0],
        ];
        let l1 = Math.hypot(n1[0], n1[1], n1[2]);
        if (l1 < 1e-9) {
          n1 = [1, 0, 0];
          l1 = 1;
        }
        n1 = [n1[0] / l1, n1[1] / l1, n1[2] / l1];
        const n2: any = [
          t[1] * n1[2] - t[2] * n1[1],
          t[2] * n1[0] - t[0] * n1[2],
          t[0] * n1[1] - t[1] * n1[0],
        ];
        const ring: any = [],
          rr = typeof r === "function" ? r(k / (pts.length - 1)) : r;
        for (let sI = 0; sI < N; sI++) {
          const a = (sI / N) * Math.PI * 2,
            dx = Math.cos(a),
            dy = Math.sin(a);
          const nx = n1[0] * dx + n2[0] * dy,
            ny = n1[1] * dx + n2[1] * dy,
            nz = n1[2] * dx + n2[2] * dy;
          ring.push(
            this.vert(
              p[0] + nx * rr,
              p[1] + ny * rr,
              p[2] + nz * rr,
              nx,
              ny,
              nz,
              (sI / N) * S,
              (k / (pts.length - 1)) * S * 3,
            ),
          );
        }
        rings.push(ring);
      }
      for (let k = 0; k < rings.length - 1; k++)
        for (let sI = 0; sI < N; sI++) {
          const s2 = (sI + 1) % N;
          this.quad(rings[k][sI], rings[k][s2], rings[k + 1][s2], rings[k + 1][sI]);
        }
    };

    function mergeGeos(list?: any) {
      list = list.filter((g?: any) => g && g.attributes.position.count);
      if (!list.length) return null;
      let total = 0;
      list.forEach((g?: any) => (total += g.attributes.position.count));
      const pos = new Float32Array(total * 3),
        nor = new Float32Array(total * 3),
        uvv = new Float32Array(total * 2);
      const idx: any = [];
      let off = 0,
        po = 0,
        uo = 0;
      list.forEach((g?: any) => {
        pos.set(g.attributes.position.array, po);
        nor.set(g.attributes.normal.array, po);
        uvv.set(g.attributes.uv.array, uo);
        const ia = g.index.array;
        for (let i = 0; i < ia.length; i++) idx.push(ia[i] + off);
        off += g.attributes.position.count;
        po += g.attributes.position.array.length;
        uo += g.attributes.uv.array.length;
      });
      const G = new T.BufferGeometry();
      G.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
      G.setAttribute("normal", new T.Float32BufferAttribute(nor, 3));
      G.setAttribute("uv", new T.Float32BufferAttribute(uvv, 2));
      G.setIndex(idx);
      return G;
    }

    /* ------------------------------------------------------------------ *
     * 3.  materials
     * ------------------------------------------------------------------ */
    const canBronze = texBronze(53);

    const CLIP = new T.Plane(new T.Vector3(0, -1, 0), 0);
    const MAT: any = {};
    function imgMat(name?: any, o?: any) {
      o = o || {};
      const m = new T.MeshStandardMaterial({
        color: new T.Color(o.tint !== undefined ? o.tint : 0xffffff),
        roughness: o.rough !== undefined ? o.rough : 0.88,
        metalness: o.metal || 0,
        side: o.side || T.FrontSide,
      });
      m.shadowSide = T.DoubleSide;
      const rx = o.rx || 1,
        ry = o.ry || 1;
      loadImg(name, (img?: any) => {
        const t = srgb(new T.Texture(img));
        t.wrapS = t.wrapT = T.RepeatWrapping;
        t.repeat.set(rx, ry);
        t.anisotropy = 8;
        t.needsUpdate = true;
        m.map = t;
        if (o.bump) {
          const bt = new T.CanvasTexture(bumpCanvas(img, o.bumpC || 1.0));
          bt.wrapS = bt.wrapT = T.RepeatWrapping;
          bt.repeat.set(rx, ry);
          bt.anisotropy = 4;
          m.bumpMap = bt;
          m.bumpScale = o.bump;
        }
        if (o.rmap) {
          const rt = new T.CanvasTexture(roughCanvas(img, o.rmap[0], o.rmap[1]));
          rt.wrapS = rt.wrapT = T.RepeatWrapping;
          rt.repeat.set(rx, ry);
          m.roughnessMap = rt;
        }
        m.needsUpdate = true;
      });
      return m;
    }
    function canvasMat(canvas?: any, o?: any) {
      o = o || {};
      const t = srgb(new T.CanvasTexture(canvas));
      t.wrapS = t.wrapT = T.RepeatWrapping;
      t.repeat.set(o.rx || 1, o.ry || 1);
      t.anisotropy = 8;
      const m = new T.MeshStandardMaterial({
        map: t,
        roughness: o.rough !== undefined ? o.rough : 0.88,
        metalness: o.metal || 0,
        color: new T.Color(o.tint !== undefined ? o.tint : 0xffffff),
        side: o.side || T.FrontSide,
      });
      m.shadowSide = T.DoubleSide;
      return m;
    }
    const MATBASE: any = {},
      SNOWY = new T.Color(0xf2f6fa);
    function captureMatBase() {
      [
        "tile",
        "ridge",
        "jade",
        "jadeDim",
        "claytile",
        "stone",
        "stonePale",
        "plaster",
        "plasterD",
        "soffit",
        "laterite",
        "sandstone",
        "sandDim",
        "sandCarve",
        "ashlar",
        "ashlarD",
        "lead",
        "iznik",
        "ochre",
        "ochreD",
        "vntile",
        "vntrim",
      ].forEach((k?: any) => {
        if (MAT[k]) MATBASE[k] = MAT[k].color.clone();
      });
    }
    function buildMaterials() {
      MAT.stone = imgMat("ishigaki", {
        rx: 0.52,
        ry: 0.52,
        rough: 0.97,
        bump: 0.085,
        bumpC: 1.6,
        rmap: [0.8, 1.0],
        tint: 0xf0e8dc,
      });
      MAT.plaster = imgMat("shikkui", {
        rx: 1.05,
        ry: 1.05,
        rough: 0.93,
        bump: 0.016,
        bumpC: 1.0,
        rmap: [0.84, 0.99],
        tint: 0xdccfb6,
      });
      MAT.plasterD = imgMat("shikkui", {
        rx: 1.05,
        ry: 1.05,
        rough: 0.93,
        bump: 0.016,
        bumpC: 1.0,
        tint: 0xc9baa0,
      });
      MAT.ridge = imgMat("shikkui", { rx: 2.4, ry: 2.4, rough: 0.9, bump: 0.01, tint: 0xd2c4a8 });
      MAT.tile = imgMat("kawara", {
        rx: 1.6,
        ry: 1.6,
        rough: 0.62,
        bump: 0.012,
        bumpC: 1.1,
        rmap: [0.46, 0.74],
      });
      MAT.timber = imgMat("timber", { rx: 0.9, ry: 0.9, rough: 0.76, bump: 0.02, bumpC: 1.3 });
      MAT.timberD = imgMat("timber", {
        rx: 1.2,
        ry: 1.2,
        rough: 0.8,
        bump: 0.018,
        bumpC: 1.3,
        tint: 0x9e8670,
      });
      MAT.soffit = imgMat("timber", { rx: 1.6, ry: 1.6, rough: 0.86, bump: 0.012, tint: 0x9c8064 });
      MAT.scaffold = imgMat("pine", {
        rx: 1.0,
        ry: 1.0,
        rough: 0.84,
        bump: 0.034,
        bumpC: 1.5,
        rmap: [0.62, 0.92],
      });
      MAT.core = imgMat("ishigaki", {
        rx: 0.5,
        ry: 0.5,
        rough: 0.97,
        tint: 0xb2a48c,
        side: T.DoubleSide,
      });
      MAT.redwall = imgMat("redwall", { rx: 1.2, ry: 1.2, rough: 0.92, bump: 0.012, bumpC: 0.9 });
      MAT.redDeep = imgMat("redwall", {
        rx: 1.2,
        ry: 1.2,
        rough: 0.9,
        bump: 0.012,
        tint: 0xb4705e,
      });
      MAT.jade = imgMat("greenglaze", { rx: 1.8, ry: 1.8, rough: 0.44, bump: 0.008, bumpC: 0.8 });
      MAT.jadeDim = imgMat("greenglaze", {
        rx: 1.8,
        ry: 1.8,
        rough: 0.5,
        bump: 0.008,
        tint: 0xbcd0be,
      });
      MAT.claytile = imgMat("orangetile", {
        rx: 1.4,
        ry: 1.4,
        rough: 0.52,
        bump: 0.02,
        bumpC: 1.2,
      });
      MAT.gold = imgMat("goldleaf", { rx: 1.6, ry: 1.6, rough: 0.34, metal: 0.55, bump: 0.008 });
      MAT.goldDim = imgMat("goldleaf", {
        rx: 1.6,
        ry: 1.6,
        rough: 0.42,
        metal: 0.45,
        bump: 0.008,
        tint: 0xbfa268,
      });
      MAT.bronze = canvasMat(canBronze, { rx: 2.0, ry: 2.0, rough: 0.44, metal: 0.35 });
      /* ខ្មែរ — laterite is nearly brick red in the sun, sandstone silver-ochre */
      MAT.laterite = imgMat("laterite", {
        rx: 0.62,
        ry: 0.62,
        rough: 0.98,
        bump: 0.075,
        bumpC: 1.5,
        rmap: [0.82, 1.0],
        tint: 0xb49c8c,
      });
      MAT.sandstone = imgMat("sandstone", {
        rx: 0.3,
        ry: 0.3,
        rough: 0.95,
        bump: 0.038,
        bumpC: 1.3,
        rmap: [0.78, 0.99],
        tint: 0xeee3cc,
      });
      MAT.sandDim = imgMat("sandstone", {
        rx: 0.3,
        ry: 0.3,
        rough: 0.96,
        bump: 0.034,
        bumpC: 1.3,
        tint: 0xc9bda4,
      });
      MAT.sandCarve = imgMat("sandstone", {
        rx: 1.3,
        ry: 1.3,
        rough: 0.94,
        bump: 0.03,
        bumpC: 1.3,
        tint: 0xded1b6,
      });
      /* Osmanlı — dressed limestone, lead the colour of a wet sky, İznik blue */
      MAT.ashlar = imgMat("ashlar", {
        rx: 0.72,
        ry: 0.72,
        rough: 0.93,
        bump: 0.03,
        bumpC: 1.3,
        rmap: [0.8, 0.99],
        tint: 0xf2ead9,
      });
      MAT.ashlarD = imgMat("ashlar", {
        rx: 0.72,
        ry: 0.72,
        rough: 0.94,
        bump: 0.026,
        bumpC: 1.3,
        tint: 0xd2c7b2,
      });
      MAT.lead = imgMat("leadroof", {
        rx: 1.7,
        ry: 1.7,
        rough: 0.66,
        metal: 0.18,
        bump: 0.014,
        bumpC: 1.1,
        rmap: [0.4, 0.66],
        tint: 0xbcc4cf,
      });
      MAT.iznik = imgMat("iznik", { rx: 1.05, ry: 1.05, rough: 0.3, bump: 0.006, bumpC: 0.8 });
      /* Việt — Huế lime wash over brick, with grey-green ridge tile */
      MAT.ochre = imgMat("shikkui", {
        rx: 1.0,
        ry: 1.0,
        rough: 0.94,
        bump: 0.018,
        bumpC: 1.1,
        rmap: [0.84, 0.99],
        tint: 0xd9b077,
      });
      MAT.ochreD = imgMat("shikkui", {
        rx: 1.0,
        ry: 1.0,
        rough: 0.95,
        bump: 0.016,
        bumpC: 1.1,
        tint: 0xb98f5e,
      });
      MAT.vntile = imgMat("kawara", {
        rx: 1.45,
        ry: 1.45,
        rough: 0.58,
        bump: 0.016,
        bumpC: 1.1,
        rmap: [0.46, 0.74],
        tint: 0xa8b09c,
        side: T.DoubleSide,
      });
      MAT.vntrim = imgMat("timber", {
        rx: 1.2,
        ry: 1.2,
        rough: 0.82,
        bump: 0.018,
        bumpC: 1.2,
        tint: 0x8a5f43,
      });
      MAT.dark = new T.MeshStandardMaterial({
        color: 0x1d1712,
        roughness: 0.99,
        metalness: 0,
        side: T.DoubleSide,
      });
      MAT.hollow = new T.MeshStandardMaterial({
        color: 0x171310,
        roughness: 0.99,
        metalness: 0,
        side: T.DoubleSide,
      });
      [
        "stone",
        "plaster",
        "plasterD",
        "ridge",
        "tile",
        "timber",
        "timberD",
        "soffit",
        "bronze",
        "dark",
        "hollow",
        "core",
        "redwall",
        "redDeep",
        "jade",
        "jadeDim",
        "claytile",
        "gold",
        "goldDim",
        "laterite",
        "sandstone",
        "sandDim",
        "sandCarve",
        "ashlar",
        "ashlarD",
        "lead",
        "iznik",
        "ochre",
        "ochreD",
        "vntile",
        "vntrim",
      ].forEach((k?: any) => {
        MAT[k].clippingPlanes = [CLIP];
        MAT[k].clipShadows = true;
      });
    }

    /* ------------------------------------------------------------------ *
     * 4.  levels — R is the circumradius; ground 0, shachihoko tip 14
     * ------------------------------------------------------------------ */
    const L: any = {
      ishi: { y0: 0.0, y1: 3.3, R0: 3.36, R1: 2.66, seg: 16, pow: 1.85 },
      s1: { y0: 3.16, y1: 5.06, R: 2.56 },
      roof1: { yE: 5.06, yT: 6.26, RE: 3.32, trunc: 2.0, lift: 0.15, tip: 0.11, pow: 1.3 },
      s2: { y0: 6.14, y1: 7.74, R: 2.18 },
      roof2: { yE: 7.74, yT: 8.8, RE: 2.84, trunc: 1.73, lift: 0.13, tip: 0.1, pow: 1.3 },
      s3: { y0: 8.68, y1: 10.2, R: 1.8 },
      roof3: { yE: 10.2, yT: 11.1, RE: 2.42, trunc: 1.66, lift: 0.12, tip: 0.09, pow: 1.3 },
      s4: { y0: 11.04, y1: 12.4, R: 1.46 },
      roof4: { yE: 12.4, yT: 13.46, RE: 2.22, ridge: 0.72, lift: 0.16, tip: 0.12, pow: 1.26 },
    };
    /* the 扇の勾配 — vertical at the coping, flaring at the footing */
    function ishiR(y?: any) {
      const f = Math.max(0, Math.min(1, (y - L.ishi.y0) / (L.ishi.y1 - L.ishi.y0)));
      return L.ishi.R1 + (L.ishi.R0 - L.ishi.R1) * Math.pow(1 - f, L.ishi.pow);
    }

    /* ---- hipped roof with a true ridge, Japanese profile -------------- */
    const RQ = Math.SQRT1_2;
    function ridgePt(k?: any, Lh?: any) {
      const m = ((k % 4) + 4) % 4;
      return m === 0 || m === 1 ? [RQ * Lh, RQ * Lh] : [-RQ * Lh, -RQ * Lh];
    }
    function roofPoint(o?: any, p?: any, u?: any, t?: any) {
      const tc = Math.min(1, t),
        over = Math.max(0, t - 1);
      const g = 1 - Math.pow(1 - tc, o.pow || 1.3);
      const f = (u + 1) / 2;
      const oa = cornPt(p + 1, 1),
        ob = cornPt(p, 1);
      const ox = oa[0] + (ob[0] - oa[0]) * f,
        oz = oa[1] + (ob[1] - oa[1]) * f;
      const ia = o.trunc ? cornPt(p + 1, o.trunc) : ridgePt(p + 1, o.ridge),
        ib = o.trunc ? cornPt(p, o.trunc) : ridgePt(p, o.ridge);
      const ix = ia[0] + (ib[0] - ia[0]) * f,
        iz = ia[1] + (ib[1] - ia[1]) * f;
      const corner = Math.pow(Math.abs(u), 2.0);
      const flare = 1 + (o.flare !== undefined ? o.flare : 0.028) * corner * Math.pow(tc, 3.2);
      const RE = o.RE * flare;
      const y =
        o.yT -
        (o.yT - o.yE) * g +
        o.lift * corner * Math.pow(tc, 2.6) -
        over * (o.yT - o.yE) * 0.45;
      return [ix + (ox * RE - ix) * t, y, iz + (oz * RE - iz) * t];
    }
    function buildRoof(o?: any) {
      o = o || {};
      const surf = new (Bld as any)(),
        soff = new (Bld as any)(),
        ribs = new (Bld as any)(),
        ridge = new (Bld as any)(),
        fascia = new (Bld as any)(),
        cap = new (Bld as any)();
      const NU = 20,
        NT = 13,
        TH = 0.1,
        DROP = 0.032;
      for (let p = 0; p < NS; p++) {
        const top: any = [],
          bot: any = [];
        for (let it = 0; it <= NT; it++) {
          const rT: any = [],
            rB: any = [],
            t = it / NT;
          for (let iu = 0; iu <= NU; iu++) {
            const u = -1 + (2 * iu) / NU,
              s = roofPoint(o, p, u, t);
            rT.push([s[0], s[1] - DROP, s[2]]);
            rB.push([s[0], s[1] - DROP - TH, s[2]]);
          }
          top.push(rT);
          bot.push(rB);
        }
        for (let it = 0; it < NT; it++)
          for (let iu = 0; iu < NU; iu++) {
            surf.face(
              [top[it + 1][iu], top[it + 1][iu + 1], top[it][iu + 1], top[it][iu]],
              [
                [0, (it / NT) * 2.0],
                [1, (it / NT) * 2.0],
                [1, ((it + 1) / NT) * 2.0],
                [0, ((it + 1) / NT) * 2.0],
              ],
            );
            soff.face(
              [bot[it][iu], bot[it][iu + 1], bot[it + 1][iu + 1], bot[it + 1][iu]],
              [
                [0, it / NT],
                [1, it / NT],
                [1, (it + 1) / NT],
                [0, (it + 1) / NT],
              ],
            );
          }
        for (let iu = 0; iu < NU; iu++)
          fascia.face(
            [top[NT][iu], top[NT][iu + 1], bot[NT][iu + 1], bot[NT][iu]],
            [
              [(iu / NU) * 3, 0],
              [((iu + 1) / NU) * 3, 0],
              [((iu + 1) / NU) * 3, 1],
              [(iu / NU) * 3, 1],
            ],
          );
        /* 丸瓦 — round barrel tiles running down the slope */
        const NR = Math.max(14, Math.round(o.RE * 8.0));
        for (let ir = 1; ir < NR; ir++) {
          const u = -1 + (2 * ir) / NR,
            pts: any = [];
          for (let it = 1; it <= NT + 1; it++) {
            const t = Math.min(1.04, it / NT),
              s = roofPoint(o, p, u, t);
            pts.push([s[0], s[1] - DROP + 0.01, s[2]]);
          }
          const rr = 0.024 + 0.01 * (o.RE / 3.3);
          ribs.tube(pts, rr, 6, 1);
          const e = pts[pts.length - 1],
            e2 = pts[pts.length - 2];
          const dx = e[0] - e2[0],
            dy = e[1] - e2[1],
            dz = e[2] - e2[2],
            dl = Math.hypot(dx, dy, dz) || 1;
          ribs.tube(
            [
              [e[0], e[1], e[2]],
              [e[0] + (dx / dl) * 0.045, e[1] + (dy / dl) * 0.045, e[2] + (dz / dl) * 0.045],
            ],
            rr * 1.8,
            8,
            1,
          );
        }
        /* 降棟 — plastered hip ridge along u = +1 */
        const hip: any = [];
        for (let it = 0; it <= NT + 1; it++) {
          const t = Math.min(1.05, it / NT),
            s = roofPoint(o, p, 1, t);
          hip.push([s[0], s[1] - DROP + 0.052, s[2]]);
        }
        cap.tube(hip, 0.062, 6, 1);
        const tip = hip[hip.length - 1],
          tp = hip[hip.length - 2];
        const vx = tip[0] - tp[0],
          vz = tip[2] - tp[2],
          vl = Math.hypot(vx, vz) || 1;
        const tr = o.tip !== undefined ? o.tip : 0.1;
        cap.tube(
          [
            [tip[0], tip[1], tip[2]],
            [tip[0] - (vx / vl) * 0.06, tip[1] + tr * 0.6, tip[2] - (vz / vl) * 0.06],
            [tip[0] - (vx / vl) * 0.09, tip[1] + tr, tip[2] - (vz / vl) * 0.09],
          ],
          0.046,
          6,
          1,
        );
      }
      /* a truncated roof needs its inner opening decked, or lamplight from the
         storey below shows straight through it */
      if (o.trunc) {
        const yc = o.yT - DROP,
          c: any = [];
        for (let k = 0; k < NS; k++) c.push(cornPt(k, o.trunc * 1.02));
        for (let k = 1; k < NS - 1; k++)
          surf.face(
            [
              [c[0][0], yc, c[0][1]],
              [c[k + 1][0], yc, c[k + 1][1]],
              [c[k][0], yc, c[k][1]],
              [c[k][0], yc, c[k][1]],
            ],
            [
              [0, 0],
              [1, 0],
              [1, 1],
              [1, 1],
            ],
          );
      }
      /* 大棟 — main ridge with 鬼瓦, only where the roof actually has one */
      if (!o.trunc) {
        const m0 = ridgePt(0, o.ridge),
          m2 = ridgePt(2, o.ridge),
          yR = o.yT - DROP + 0.1;
        cap.tube(
          [
            [m0[0], yR, m0[1]],
            [0, yR + 0.015, 0],
            [m2[0], yR, m2[1]],
          ],
          0.085,
          6,
          1,
        );
        for (const m of [m0, m2]) {
          ridge.box(m[0], yR + 0.075, m[1], 0.3, 0.24, 0.2, Math.atan2(m[0], m[1]), 4);
        }
      }
      return {
        surf: surf.geo(),
        soffit: soff.geo(),
        ribs: ribs.geo(),
        ridge: ridge.geo(),
        fascia: fascia.geo(),
        cap: cap.geo(),
      };
    }

    /* ---- 千鳥破風 — triangular gable dormer on a roof slope ----------- */
    function buildGable(
      o?: any,
      k?: any,
      gw?: any,
      gh?: any,
      plaster?: any,
      timber?: any,
      tile?: any,
    ) {
      const rot = faceRot(k),
        co = Math.cos(rot),
        si = Math.sin(rot);
      const M = (x?: any, y?: any, z?: any) => [x * co + z * si, y, -x * si + z * co];
      const zf = o.RE * AP * 0.96,
        yB = o.yE + 0.1,
        yA = yB + gh;
      /* tympanum */
      const pts: any = [
        [-gw, yB],
        [gw, yB],
        [0, yA],
        [-gw, yB],
      ];
      plaster.fan(pts, zf, rot, 0, yB + gh * 0.34);
      /* barge boards */
      const half = Math.hypot(gw, gh),
        ang = Math.atan2(gw, gh);
      const B = (bld?: any, x?: any, y?: any, z?: any, sx?: any, sy?: any, sz?: any, rz?: any) =>
        bld.box(x * co + z * si, y, -x * si + z * co, sx, sy, sz, rot, 4.0, rz);
      B(timber, -gw * 0.5, yB + gh * 0.5, zf + 0.035, 0.085, half * 1.06, 0.085, -ang);
      B(timber, gw * 0.5, yB + gh * 0.5, zf + 0.035, 0.085, half * 1.06, 0.085, ang);
      B(timber, 0, yA + 0.045, zf + 0.035, 0.14, 0.14, 0.1, 0);
      /* dormer roof slabs sloping back into the main roof */
      B(tile, -gw * 0.5, yB + gh * 0.5 + 0.055, zf - 0.26, 0.13, half * 1.0, 0.62, -ang);
      B(tile, gw * 0.5, yB + gh * 0.5 + 0.055, zf - 0.26, 0.13, half * 1.0, 0.62, ang);
      /* small window in the tympanum */
      B(timber, 0, yB + gh * 0.34, zf + 0.02, gw * 0.44, gh * 0.3, 0.05, 0);
    }

    /* ---- 高欄 — balcony railing -------------------------------------- */
    function buildRail(y0?: any, h?: any, R?: any, seg?: any) {
      const b = new (Bld as any)(),
        W = R * SW,
        z = R * AP;
      for (let k = 0; k < NS; k++) {
        const rot = faceRot(k),
          co = Math.cos(rot),
          si = Math.sin(rot);
        const P = (x?: any, y?: any, zz?: any, sx?: any, sy?: any, sz?: any) =>
          b.box(x * co + zz * si, y, -x * si + zz * co, sx, sy, sz, rot, 4.0);
        P(0, y0 + h * 0.96, z, W * 1.03, 0.085, 0.115);
        P(0, y0 + h * 0.52, z, W * 0.99, 0.05, 0.075);
        P(0, y0 + h * 0.08, z, W * 0.99, 0.065, 0.095);
        const n = seg || 9;
        for (let i = 0; i <= n; i++)
          P((-1 + (2 * i) / n) * W * 0.47, y0 + h * 0.5, z, 0.055, h * 0.86, 0.055);
      }
      for (let c = 0; c < NS; c++) {
        const q = cornPt(c, R);
        b.box(q[0], y0 + h * 0.52, q[1], 0.125, h * 1.06, 0.125, cornRot(c), 4.0);
      }
      return b.geo();
    }

    /* ---- 鯱 — bronze ridge finial, tail up --------------------------- */
    function buildShachi(px?: any, pz?: any, facing?: any, sc?: any, yBase?: any) {
      const b = new (Bld as any)();
      const co = Math.cos(facing),
        si = Math.sin(facing);
      const P = (x?: any, y?: any, z?: any, sx?: any, sy?: any, sz?: any, rz?: any) =>
        b.box(
          px + (x * co + z * si) * sc,
          yBase + y * sc,
          pz + (-x * si + z * co) * sc,
          sx * sc,
          sy * sc,
          sz * sc,
          facing,
          4.0,
          rz,
        );
      P(0, 0.05, 0, 0.3, 0.1, 0.26); /* seat block */
      P(0.07, 0.19, 0, 0.32, 0.24, 0.25); /* head */
      P(0.17, 0.13, 0, 0.16, 0.14, 0.16, -0.45); /* snout, biting down */
      P(0.13, 0.28, 0, 0.1, 0.1, 0.19, 0.2); /* brow */
      P(-0.01, 0.38, 0, 0.3, 0.26, 0.24, 0.1); /* shoulder */
      P(-0.1, 0.55, 0, 0.24, 0.24, 0.2, 0.3); /* arching body */
      P(-0.16, 0.71, 0, 0.17, 0.2, 0.16, 0.46);
      P(-0.05, 0.38, 0.145, 0.2, 0.055, 0.15, 0.35); /* pectoral fins */
      P(-0.05, 0.38, -0.145, 0.2, 0.055, 0.15, 0.35);
      P(-0.09, 0.56, 0.115, 0.14, 0.05, 0.11, 0.4);
      P(-0.09, 0.56, -0.115, 0.14, 0.05, 0.11, 0.4);
      for (let i = 0; i < 5; i++) {
        /* tail fan */
        const a = (-1 + (2 * i) / 4) * 0.66;
        P(
          -0.19 - Math.sin(a) * 0.1,
          0.86 + Math.cos(a) * 0.13,
          0,
          0.075,
          0.3,
          0.085,
          a * 0.85 + 0.5,
        );
      }
      return b.geo();
    }

    /* ------------------------------------------------------------------ *
     * 5.  assemble the keep
     * ------------------------------------------------------------------ */
    function buildTenshu() {
      const towerGroup = new T.Group();
      const stone = new (Bld as any)(),
        plaster = new (Bld as any)(),
        plasterD = new (Bld as any)(),
        timber = new (Bld as any)(),
        timberD = new (Bld as any)(),
        dark = new (Bld as any)(),
        hollow = new (Bld as any)();
      const tileB = new (Bld as any)();
      const gTile: any = [],
        gSoffit: any = [],
        gRidge: any = [],
        gCap: any = [],
        gRail: any = [],
        gShachi: any = [];

      /* -------- 石垣 — battered stone base -------- */
      {
        const N = L.ishi.seg,
          y0 = L.ishi.y0,
          y1 = L.ishi.y1;
        for (let i = 0; i < N; i++) {
          const ya = y0 + ((y1 - y0) * i) / N,
            yb = y0 + ((y1 - y0) * (i + 1)) / N;
          stone.prism(ya, yb, ishiR(ya), ishiR(yb), 0.62, i === N - 1, false, ya - y0);
        }
        /* coping course */
        stone.prism(y1 - 0.1, y1 + 0.05, L.ishi.R1 * 1.035, L.ishi.R1 * 1.02, 1.4, true);
        /* 算木積 — long and short quoins interlocking, flush with each wall */
        for (let i = 0; i < 11; i++) {
          const y = 0.19 + i * 0.285,
            R = ishiR(y),
            W = R * SW,
            z = R * AP - 0.135,
            hgt = 0.245;
          const lng = 0.62,
            shr = 0.3;
          for (let k = 0; k < NS; k++) {
            const rot = faceRot(k),
              co = Math.cos(rot),
              si = Math.sin(rot);
            const B = (x?: any, w?: any) =>
              stone.box(x * co + z * si, y, -x * si + z * co, w, hgt, 0.26, rot, 1.5);
            const a = i % 2 ? lng : shr,
              b = i % 2 ? shr : lng;
            B(W / 2 - a / 2, a);
            B(-(W / 2 - b / 2), b);
          }
        }
      }

      /* -------- storey helper -------- */
      /* 腰組 — the bracket tier that carries a floor down onto the roof below,
         so the storey lands on the roof instead of hovering over it */
      function koshigumi(R?: any, y0?: any, W?: any) {
        /* the roof below now dies behind the wall, so this is pure articulation:
           a shadowed recess at the floor line carrying a projecting floor plate */
        timberD.prism(y0 - 0.04, y0 + 0.2, R * 1.0, R * 1.05, 2.4);
        timber.prism(y0 + 0.18, y0 + 0.31, R * 1.13, R * 1.11, 2.6);
        for (let k = 0; k < NS; k++) {
          const rot = faceRot(k),
            co = Math.cos(rot),
            si = Math.sin(rot);
          const P = (b?: any, x?: any, y?: any, zz?: any, sx?: any, sy?: any, sz?: any) =>
            b.box(x * co + zz * si, y, -x * si + zz * co, sx, sy, sz, rot, 4.5);
          const nb = Math.max(5, Math.round(W / 0.52));
          for (let i = 0; i < nb; i++) {
            const x = (-1 + (2 * (i + 0.5)) / nb) * W * 0.46;
            P(timberD, x, y0 + 0.08, R * 1.03 * AP, 0.115, 0.26, 0.24);
            P(timber, x, y0 + 0.2, R * 1.1 * AP, 0.165, 0.105, 0.155);
          }
          P(timber, 0, y0 - 0.02, R * 1.005 * AP, W * 0.99, 0.09, 0.05);
        }
      }
      function storey(o?: any, mat?: any, opt?: any) {
        const { y0, y1, R } = o,
          W = R * SW,
          z = R * AP,
          h = y1 - y0;
        const foot = opt.foot || 0;
        mat.prism(y0 - foot, y1, R, R * 0.998, 1.05);
        hollow.prism(y0 - foot, y1, R * 0.7, R * 0.7, 1, true, true);
        if (foot > 0) koshigumi(R, y0, W);
        for (let k = 0; k < NS; k++) {
          const rot = faceRot(k),
            co = Math.cos(rot),
            si = Math.sin(rot);
          const P = (
            bld?: any,
            x?: any,
            y?: any,
            zz?: any,
            sx?: any,
            sy?: any,
            sz?: any,
            rz?: any,
          ) => bld.box(x * co + zz * si, y, -x * si + zz * co, sx, sy, sz, rot, 3.4, rz);
          /* 長押 — timber bands top and bottom */
          P(timber, 0, y0 + 0.075, z + 0.012, W * 1.005, 0.15, 0.055);
          P(timber, 0, y1 - 0.075, z + 0.012, W * 1.005, 0.15, 0.055);
          /* posts */
          const np = opt.posts || 3;
          for (let i = 0; i <= np; i++)
            P(
              timber,
              (-1 + (2 * i) / np) * W * 0.47,
              (y0 + y1) / 2,
              z + 0.008,
              0.075,
              h * 0.94,
              0.03,
            );
          /* 連子窓 — barred windows */
          const nw = opt.windows || 2;
          for (let i = 0; i < nw; i++) {
            const x = (-1 + (2 * (i + 0.5)) / nw) * W * 0.34;
            const wy = y0 + h * (opt.wy || 0.58),
              ww = opt.ww || 0.62,
              wh = opt.wh || 0.46;
            P(dark, x, wy, z - 0.015, ww, wh, 0.08);
            P(timber, x, wy + wh / 2, z + 0.02, ww + 0.1, 0.052, 0.04);
            P(timber, x, wy - wh / 2, z + 0.02, ww + 0.1, 0.052, 0.04);
            P(timber, x - ww / 2, wy, z + 0.02, 0.048, wh + 0.05, 0.04);
            P(timber, x + ww / 2, wy, z + 0.02, 0.048, wh + 0.05, 0.04);
            for (let j = 0; j < 5; j++)
              P(timber, x + (-1 + (2 * j) / 4) * ww * 0.36, wy, z + 0.01, 0.026, wh * 0.9, 0.03);
          }
          /* 狭間 — loopholes: square, triangle, circle */
          if (opt.sama !== false) {
            const sy = y0 + h * (opt.samaY || 0.24);
            for (let i = 0; i < 3; i++) {
              const x = (-1 + (2 * (i + 0.5)) / 3) * W * 0.4;
              if (i % 3 === 0) P(dark, x, sy, z - 0.01, 0.16, 0.16, 0.07);
              else if (i % 3 === 1) P(dark, x, sy, z - 0.01, 0.17, 0.15, 0.07, Math.PI / 4);
              else
                dark.ring(
                  x * co + (z - 0.01) * si,
                  sy,
                  -x * si + (z - 0.01) * co,
                  0,
                  0.095,
                  0.07,
                  rot,
                  16,
                  1,
                );
            }
          }
        }
      }

      storey(L.s1, plaster, { posts: 2, windows: 2, ww: 0.54, wh: 0.32, wy: 0.62, samaY: 0.28 });
      {
        const r = buildRoof(L.roof1);
        gTile.push(r.surf, r.ribs);
        gSoffit.push(r.soffit, r.fascia);
        gRidge.push(r.ridge);
        gCap.push(r.cap);
      }
      buildGable(L.roof1, 1, 1.0, 0.88, plaster, timberD, tileB);
      buildGable(L.roof1, 3, 1.0, 0.88, plaster, timberD, tileB);

      storey(L.s2, plaster, {
        posts: 2,
        windows: 2,
        ww: 0.48,
        wh: 0.3,
        wy: 0.6,
        samaY: 0.28,
        foot: 0.55,
      });
      {
        const r = buildRoof(L.roof2);
        gTile.push(r.surf, r.ribs);
        gSoffit.push(r.soffit, r.fascia);
        gRidge.push(r.ridge);
        gCap.push(r.cap);
      }
      buildGable(L.roof2, 0, 0.8, 0.7, plaster, timberD, tileB);
      buildGable(L.roof2, 2, 0.8, 0.7, plaster, timberD, tileB);

      storey(L.s3, plaster, {
        posts: 2,
        windows: 2,
        ww: 0.42,
        wh: 0.28,
        wy: 0.6,
        samaY: 0.3,
        foot: 0.5,
      });
      {
        const r = buildRoof(L.roof3);
        gTile.push(r.surf, r.ribs);
        gSoffit.push(r.soffit, r.fascia);
        gRidge.push(r.ridge);
        gCap.push(r.cap);
      }

      /* -------- 望楼 — top storey with balcony and 華頭窓 -------- */
      {
        const o = L.s4,
          W = o.R * SW,
          z = o.R * AP,
          h = o.y1 - o.y0;
        plaster.prism(o.y0 - 0.55, o.y1, o.R, o.R * 0.995, 1.0);
        hollow.prism(o.y0 - 0.55, o.y1, o.R * 0.62, o.R * 0.62, 1, true, true);
        /* balcony deck carried on its own bracket tier */
        koshigumi(o.R * 1.14, o.y0 - 0.08, o.R * 1.14 * SW);
        stone.prism(o.y0 - 0.1, o.y0 + 0.02, o.R * 1.3, o.R * 1.28, 1.6, true);
        gRail.push(buildRail(o.y0 + 0.02, 0.56, o.R * 1.26, 7));
        for (let k = 0; k < NS; k++) {
          const rot = faceRot(k),
            co = Math.cos(rot),
            si = Math.sin(rot);
          const P = (
            bld?: any,
            x?: any,
            y?: any,
            zz?: any,
            sx?: any,
            sy?: any,
            sz?: any,
            rz?: any,
          ) => bld.box(x * co + zz * si, y, -x * si + zz * co, sx, sy, sz, rot, 3.4, rz);
          P(timber, 0, o.y1 - 0.08, z + 0.012, W * 1.005, 0.16, 0.055);
          P(timber, 0, o.y0 + 0.08, z + 0.012, W * 1.005, 0.16, 0.055);
          for (let i = 0; i <= 3; i++)
            P(
              timber,
              (-1 + (2 * i) / 3) * W * 0.47,
              (o.y0 + o.y1) / 2,
              z + 0.01,
              0.105,
              h * 0.92,
              0.045,
            );
          /* 華頭窓 — ogee-headed windows, two per face */
          for (let w = 0; w < 2; w++) {
            const x = (-1 + (2 * (w + 0.5)) / 2) * W * 0.24,
              cy = o.y0 + h * 0.56,
              ww = 0.3,
              hh = 0.62;
            const out: any = [],
              inn: any = [];
            for (let s = 0; s <= 18; s++) {
              const tt = s / 18,
                xx = ww * Math.pow(1 - tt * tt, 0.42);
              out.push([x - xx, cy - hh * 0.42 + tt * hh]);
            }
            for (let s = 18; s >= 0; s--) {
              const tt = s / 18,
                xx = ww * Math.pow(1 - tt * tt, 0.42);
              out.push([x + xx, cy - hh * 0.42 + tt * hh]);
            }
            out.push([x + ww, cy - hh * 0.46]);
            out.push([x - ww, cy - hh * 0.46]);
            out.push(out[0]);
            dark.fan(out, z + 0.006, rot, x, cy);
            /* pale ogee surround, traced as short chords */
            for (let s = 0; s < 18; s++) {
              const t0 = s / 18,
                t1 = (s + 1) / 18;
              const x0 = ww * Math.pow(1 - t0 * t0, 0.42),
                x1 = ww * Math.pow(1 - t1 * t1, 0.42);
              const y0 = cy - hh * 0.42 + t0 * hh,
                y1 = cy - hh * 0.42 + t1 * hh;
              const len = Math.hypot(x1 - x0, y1 - y0),
                an = Math.atan2(-(x1 - x0), y1 - y0);
              P(
                plasterD,
                x - (x0 + x1) / 2 - 0.05,
                (y0 + y1) / 2,
                z + 0.026,
                0.1,
                len * 1.35,
                0.045,
                -an,
              );
              P(
                plasterD,
                x + (x0 + x1) / 2 + 0.05,
                (y0 + y1) / 2,
                z + 0.026,
                0.1,
                len * 1.35,
                0.045,
                an,
              );
            }
            P(plasterD, x, cy - hh * 0.44, z + 0.026, ww * 2.2, 0.1, 0.045);
            for (let j = 0; j < 3; j++)
              P(
                timberD,
                x + (-1 + (2 * j) / 2) * ww * 0.4,
                cy + hh * 0.02,
                z + 0.016,
                0.034,
                hh * 0.62,
                0.035,
              );
          }
        }
      }

      {
        const r = buildRoof(L.roof4);
        gTile.push(r.surf, r.ribs);
        gSoffit.push(r.soffit, r.fascia);
        gRidge.push(r.ridge);
        gCap.push(r.cap);
      }
      buildGable(L.roof4, 1, 0.6, 0.52, plaster, timberD, tileB);
      buildGable(L.roof4, 3, 0.6, 0.52, plaster, timberD, tileB);

      /* -------- 鯱 — one at each end of the main ridge -------- */
      {
        const yR = L.roof4.yT - 0.032 + 0.1;
        for (const k of [0, 2]) {
          const m = ridgePt(k, L.roof4.ridge);
          gShachi.push(buildShachi(m[0], m[1], Math.atan2(m[0], m[1]), 0.86, yR + 0.01));
        }
      }

      function add(geo?: any, mat?: any, name?: any) {
        if (!geo || !geo.attributes.position.count) return;
        const m = new T.Mesh(geo, mat);
        m.castShadow = true;
        m.receiveShadow = true;
        m.name = name;
        towerGroup.add(m);
      }
      add(dark.geo(), MAT.dark, "dark");
      add(hollow.geo(), MAT.hollow, "hollow");
      add(stone.geo(), MAT.stone, "stone");
      add(plaster.geo(), MAT.plaster, "plaster");
      add(plasterD.geo(), MAT.plasterD, "plasterD");
      add(timber.geo(), MAT.timber, "timber");
      add(timberD.geo(), MAT.timberD, "timberD");
      add(mergeGeos(gRail), MAT.timber, "rails");
      add(mergeGeos(gTile.concat([tileB.geo()])), MAT.tile, "tiles");
      add(mergeGeos(gSoffit), MAT.soffit, "soffits");
      add(mergeGeos(gCap), MAT.ridge, "ridgecaps");
      add(mergeGeos(gRidge), MAT.ridge, "onigawara");
      add(mergeGeos(gShachi), MAT.bronze, "shachihoko");
      return towerGroup;
    }

    /* ---- guardian lion ------------------------------------------------ */
    function buildLion(bx?: any, by?: any, bz?: any, facing?: any, sc?: any) {
      const b = new (Bld as any)();
      const co = Math.cos(facing),
        si = Math.sin(facing);
      const P = (x?: any, y?: any, z?: any, sx?: any, sy?: any, sz?: any, r?: any) =>
        b.box(
          bx + (x * co + z * si) * sc,
          by + y * sc,
          bz + (-x * si + z * co) * sc,
          sx * sc,
          sy * sc,
          sz * sc,
          (r || 0) + facing,
          5.0,
        );
      /* pedestal */
      P(0, 0.05, 0, 0.58, 0.1, 0.56);
      P(0, 0.13, 0, 0.5, 0.07, 0.48);
      /* haunches and back */
      P(0, 0.36, -0.11, 0.46, 0.46, 0.44);
      P(-0.2, 0.3, -0.06, 0.16, 0.34, 0.32);
      P(0.2, 0.3, -0.06, 0.16, 0.34, 0.32);
      /* chest, sitting upright */
      P(0, 0.5, 0.09, 0.4, 0.44, 0.3);
      /* forelegs */
      P(-0.15, 0.3, 0.19, 0.12, 0.42, 0.14);
      P(0.15, 0.3, 0.19, 0.12, 0.42, 0.14);
      P(-0.16, 0.14, 0.25, 0.15, 0.11, 0.2);
      P(0.16, 0.14, 0.25, 0.15, 0.11, 0.2);
      /* mane ring */
      for (let i = 0; i < 10; i++) {
        const a = (Math.PI * 2 * i) / 10;
        P(Math.cos(a) * 0.235, 0.83 + Math.sin(a) * 0.235, 0.02, 0.155, 0.155, 0.155, a * 0.5);
      }
      /* head */
      P(0, 0.83, 0.1, 0.34, 0.32, 0.3);
      P(0, 0.76, 0.24, 0.21, 0.15, 0.13);
      P(-0.075, 0.71, 0.3, 0.07, 0.06, 0.06);
      P(0.075, 0.71, 0.3, 0.07, 0.06, 0.06);
      P(-0.145, 0.96, 0.11, 0.1, 0.11, 0.1, 0.5);
      P(0.145, 0.96, 0.11, 0.1, 0.11, 0.1, -0.5);
      /* tail */
      P(0, 0.6, -0.3, 0.11, 0.42, 0.11, 0.32);
      return b.geo();
    }

    /* ------------------------------------------------------------------ *
     * 5b.  中國 — a timber-frame pagoda: five tiers of flying eaves carried
     *      on bracket sets, vermilion walls, jade-glazed tile, iron spire.
     * ------------------------------------------------------------------ */
    const LC: any = {
      plinth: { y0: 0.0, y1: 0.58, R0: 3.1, R1: 2.94 },
      tiers: [
        { y0: 0.52, y1: 2.16, R: 2.46, dh: 0.38, yE: 2.54, yT: 3.5, RE: 3.46 },
        { y0: 3.36, y1: 4.64, R: 2.12, dh: 0.34, yE: 4.98, yT: 5.88, RE: 3.08 },
        { y0: 5.74, y1: 6.9, R: 1.82, dh: 0.31, yE: 7.21, yT: 8.04, RE: 2.7 },
        { y0: 7.9, y1: 8.92, R: 1.54, dh: 0.29, yE: 9.21, yT: 9.96, RE: 2.32 },
        { y0: 9.82, y1: 10.72, R: 1.28, dh: 0.27, yE: 10.99, yT: 11.76, RE: 1.98 },
      ],
      finial: { y0: 11.6, y1: 14.0 },
    };
    function buildPagoda() {
      const grp = new T.Group();
      const red = new (Bld as any)(),
        redD = new (Bld as any)(),
        jade = new (Bld as any)(),
        jadeD = new (Bld as any)(),
        stone = new (Bld as any)(),
        stoneP = new (Bld as any)(),
        gold = new (Bld as any)(),
        dark = new (Bld as any)(),
        hollow = new (Bld as any)();
      const gTile: any = [],
        gSoffit: any = [],
        gCap: any = [],
        gRail: any = [];

      /* stone plinth with corner blocks */
      stone.prism(LC.plinth.y0, LC.plinth.y1, LC.plinth.R0, LC.plinth.R1, 1.0, true);
      for (let c = 0; c < NS; c++) {
        const q = cornPt(c, LC.plinth.R1 * 0.88);
        stone.box(q[0], LC.plinth.y1 + 0.2, q[1], 0.56, 0.46, 0.56, cornRot(c), 1.8);
      }

      /* 斗栱 — a stepped bracket band under every eave */
      function dougong(y0?: any, h?: any, R?: any, Rout?: any, n?: any) {
        redD.prism(y0, y0 + h * 0.3, R * 1.005, R * 1.02, 2.2);
        jade.prism(y0 + h * 0.28, y0 + h * 0.52, R * 1.04, R * 1.1, 3.2);
        jade.prism(y0 + h * 0.5, y0 + h, R * 1.14, Rout, 3.2);
        const W = R * SW;
        for (let k = 0; k < NS; k++) {
          const rot = faceRot(k),
            co = Math.cos(rot),
            si = Math.sin(rot);
          const P = (b?: any, x?: any, y?: any, z?: any, sx?: any, sy?: any, sz?: any) =>
            b.box(x * co + z * si, y, -x * si + z * co, sx, sy, sz, rot, 4.5);
          for (let i = 0; i < n; i++) {
            const x = (-1 + (2 * (i + 0.5)) / n) * W * 0.44;
            P(jadeD, x, y0 + h * 0.44, R * 1.06 * AP, 0.13, h * 0.34, 0.16);
            P(jade, x, y0 + h * 0.7, R * 1.12 * AP, 0.28, h * 0.16, 0.22);
            P(jadeD, x, y0 + h * 0.88, R * 1.2 * AP, 0.15, h * 0.14, 0.15);
          }
          P(redD, 0, y0 + h * 0.15, R * 1.02 * AP, W * 0.99, h * 0.24, 0.05);
        }
        for (let c = 0; c < NS; c++) {
          const rot = cornRot(c),
            co = Math.cos(rot),
            si = Math.sin(rot);
          const P = (b?: any, x?: any, y?: any, z?: any, sx?: any, sy?: any, sz?: any) =>
            b.box(x * co + z * si, y, -x * si + z * co, sx, sy, sz, rot, 4.5);
          P(jade, 0, y0 + h * 0.7, R * 1.16, 0.3, h * 0.18, 0.26);
          P(jadeD, 0, y0 + h * 0.44, R * 1.1, 0.14, h * 0.36, 0.18);
        }
      }

      LC.tiers.forEach((t?: any, ti?: any) => {
        const nxt = LC.tiers[ti + 1],
          W = t.R * SW,
          z = t.R * AP,
          h = t.y1 - t.y0;
        /* vermilion wall */
        red.prism(t.y0 - 0.45, t.y1, t.R, t.R * 0.996, 1.05);
        hollow.prism(t.y0 - 0.45, t.y1, t.R * 0.66, t.R * 0.66, 1, true, true);
        for (let k = 0; k < NS; k++) {
          const rot = faceRot(k),
            co = Math.cos(rot),
            si = Math.sin(rot);
          const P = (b?: any, x?: any, y?: any, zz?: any, sx?: any, sy?: any, sz?: any, rz?: any) =>
            b.box(x * co + zz * si, y, -x * si + zz * co, sx, sy, sz, rot, 3.4, rz);
          /* columns and head beam */
          for (let i = -2; i <= 2; i += 2)
            P(redD, i * W * 0.22, (t.y0 + t.y1) / 2, z + 0.012, 0.135, h * 0.98, 0.06);
          P(redD, 0, t.y1 - 0.09, z + 0.016, W * 1.005, 0.17, 0.07);
          P(redD, 0, t.y0 + 0.1, z + 0.016, W * 1.005, 0.15, 0.07);
          if (ti === 0) {
            /* arched doorway with jade voussoirs */
            const oW = 0.72,
              spr = 0.98,
              jt = 0.19;
            const pts: any = [[-oW, 0.55]];
            for (let q = 0; q <= 20; q++) {
              const a = (Math.PI * q) / 20;
              pts.push([-Math.cos(a) * oW, spr + Math.sin(a) * oW]);
            }
            pts.push([oW, 0.55], [-oW, 0.55]);
            dark.fan(pts, z + 0.008, rot, 0, spr * 0.75);
            P(jade, -oW, (0.55 + spr) / 2, z + 0.018, jt, spr - 0.55, 0.075);
            P(jade, oW, (0.55 + spr) / 2, z + 0.018, jt, spr - 0.55, 0.075);
            jade.arc(z * si, spr, z * co, oW - jt / 2, oW + jt / 2, 0.075, rot, 0, Math.PI, 26, 1);
          } else {
            /* a pair of red lattice casements per face */
            const cy = t.y0 + h * 0.52;
            for (let w = -1; w <= 1; w += 2) {
              const cx = w * W * 0.155,
                ww = Math.min(0.34, W * 0.13),
                ht = Math.min(0.62, h * 0.44);
              P(dark, cx, cy, z - 0.012, ww * 2, ht * 2, 0.07);
              P(redD, cx, cy + ht, z + 0.024, ww * 2 + 0.1, 0.075, 0.05);
              P(redD, cx, cy - ht, z + 0.024, ww * 2 + 0.1, 0.075, 0.05);
              P(redD, cx - ww, cy, z + 0.024, 0.065, ht * 2 + 0.06, 0.05);
              P(redD, cx + ww, cy, z + 0.024, 0.065, ht * 2 + 0.06, 0.05);
              for (let j = 0; j < 4; j++)
                P(redD, cx + (-1 + (2 * j) / 3) * ww * 0.66, cy, z + 0.014, 0.032, ht * 1.9, 0.04);
              for (let j = 0; j < 3; j++)
                P(redD, cx, cy + (-1 + (2 * j) / 2) * ht * 0.58, z + 0.014, ww * 1.9, 0.032, 0.04);
            }
          }
        }
        dougong(t.y1, t.dh, t.R, t.R * 1.3, Math.max(4, Math.round(W / 0.62)));
        const roof: any = {
          yE: t.yE,
          yT: t.yT,
          RE: t.RE,
          lift: 0.6,
          tip: 0.4,
          pow: 1.46,
          flare: 0.14,
          trunc: nxt ? nxt.R * 0.95 : 0.26,
          ridge: 0.24,
        };
        const r = buildRoof(roof);
        gTile.push(r.surf, r.ribs);
        gSoffit.push(r.soffit, r.fascia);
        gCap.push(r.cap, r.ridge);
        /* balcony round the storey above */
        if (nxt) gRail.push(buildRail(nxt.y0 - 0.1, 0.5, t.RE * 0.6, 9));
      });

      /* 相輪 — the iron spire: stacked discs on a mast, crowned with a jewel */
      {
        const f = LC.finial,
          H = f.y1 - f.y0;
        gold.prism(f.y0, f.y0 + H * 0.1, 0.62, 0.44, 3, true);
        gold.box(0, f.y0 + H * 0.52, 0, 0.16, H * 0.92, 0.16, Math.PI / 4, 3);
        for (let i = 0; i < 9; i++) {
          const t = i / 8,
            rr = 0.44 - t * 0.26;
          gold.prism(
            f.y0 + H * (0.14 + t * 0.62),
            f.y0 + H * (0.14 + t * 0.62) + H * 0.03,
            rr,
            rr * 0.94,
            3,
          );
        }
        const oy = f.y0 + H * 0.9,
          orb = 0.2,
          seg = 12;
        for (let i = 0; i < seg; i++)
          for (let j = 0; j < seg; j++) {
            const t0 = (i / seg) * Math.PI,
              t1 = ((i + 1) / seg) * Math.PI;
            const p0 = (j / seg) * Math.PI * 2,
              p1 = ((j + 1) / seg) * Math.PI * 2;
            const V = (t?: any, pq?: any) => [
              Math.sin(t) * Math.cos(pq) * orb,
              oy + Math.cos(t) * orb * 1.1,
              Math.sin(t) * Math.sin(pq) * orb,
            ];
            gold.face([V(t0, p1), V(t1, p1), V(t1, p0), V(t0, p0)]);
          }
      }
      /* guardian lions on the plinth */
      const gLion: any = [];
      for (let c = 0; c < NS; c += 2) {
        const q = cornPt(c, LC.plinth.R1 * 1.02);
        gLion.push(buildLion(q[0], LC.plinth.y1, q[1], cornRot(c), 0.74));
      }

      const add = (g?: any, m?: any, n?: any) => {
        if (g && g.attributes.position.count) {
          const me = new T.Mesh(g, m);
          me.castShadow = true;
          me.receiveShadow = true;
          me.name = n;
          grp.add(me);
        }
      };
      add(hollow.geo(), MAT.hollow, "hollow");
      add(dark.geo(), MAT.dark, "dark");
      add(red.geo(), MAT.redwall, "wall");
      add(redD.geo(), MAT.redDeep, "trim");
      add(jade.geo(), MAT.jade, "jade");
      add(jadeD.geo(), MAT.jadeDim, "jadeD");
      add(stone.geo(), MAT.stone, "stone");
      add(stoneP.geo(), MAT.stonePale, "stoneP");
      add(gold.geo(), MAT.gold, "gold");
      add(mergeGeos(gRail), MAT.redDeep, "rails");
      add(mergeGeos(gTile), MAT.jade, "tiles");
      add(mergeGeos(gSoffit), MAT.redDeep, "soffit");
      add(mergeGeos(gCap), MAT.jadeDim, "caps");
      add(mergeGeos(gLion), MAT.stone, "lions");
      return grp;
    }

    /* ------------------------------------------------------------------ *
     * 5c.  ไทย — a wat: stepped base, gilded hall, three steep tiled roofs
     *      with chofa and bai raka, rising into a prang and its spire.
     * ------------------------------------------------------------------ */
    const LT: any = {
      base: [
        { y0: 0.0, y1: 0.56, R: 3.16 },
        { y0: 0.56, y1: 1.0, R: 2.92 },
        { y0: 1.0, y1: 1.4, R: 2.72 },
      ],
      hall: { y0: 1.34, y1: 3.86, R: 2.52 },
      roofs: [
        { yE: 3.86, yT: 5.06, RE: 3.32, trunc: 2.24 },
        { yE: 4.9, yT: 5.92, RE: 2.76, trunc: 1.9 },
        { yE: 5.78, yT: 6.66, RE: 2.26, trunc: 1.6 },
      ],
      prang: { y0: 6.54, y1: 11.92, R0: 1.62, R1: 0.46 },
      spire: { y0: 11.78, y1: 14.0 },
    };
    function buildWat() {
      const grp = new T.Group();
      const white = new (Bld as any)(),
        whiteD = new (Bld as any)(),
        gold = new (Bld as any)(),
        goldD = new (Bld as any)(),
        clay = new (Bld as any)(),
        dark = new (Bld as any)(),
        hollow = new (Bld as any)(),
        stone = new (Bld as any)();
      const gTile: any = [],
        gSoffit: any = [];

      /* stepped base with gilt string courses */
      LT.base.forEach((b?: any, i?: any) => {
        white.prism(b.y0, b.y1, b.R, b.R * 0.985, 1.2, i === LT.base.length - 1);
        gold.prism(b.y1 - 0.075, b.y1 + 0.02, b.R * 1.02, b.R * 1.005, 2.6);
        goldD.prism(b.y0 + 0.02, b.y0 + 0.07, b.R * 1.005, b.R * 1.01, 2.6);
      });

      /* hall: white plaster between gilded pilasters, tall pointed openings */
      const hl = LT.hall,
        W = hl.R * SW,
        z = hl.R * AP,
        hh = hl.y1 - hl.y0;
      white.prism(hl.y0 - 0.3, hl.y1, hl.R, hl.R * 0.994, 1.1);
      hollow.prism(hl.y0 - 0.3, hl.y1, hl.R * 0.66, hl.R * 0.66, 1, true, true);
      for (let k = 0; k < NS; k++) {
        const rot = faceRot(k),
          co = Math.cos(rot),
          si = Math.sin(rot);
        const P = (b?: any, x?: any, y?: any, zz?: any, sx?: any, sy?: any, sz?: any, rz?: any) =>
          b.box(x * co + zz * si, y, -x * si + zz * co, sx, sy, sz, rot, 3.4, rz);
        for (let i = -2; i <= 2; i += 2)
          P(gold, i * W * 0.23, (hl.y0 + hl.y1) / 2, z + 0.014, 0.12, hh * 0.98, 0.055);
        P(gold, 0, hl.y1 - 0.1, z + 0.018, W * 1.005, 0.16, 0.07);
        P(goldD, 0, hl.y0 + 0.12, z + 0.018, W * 1.005, 0.13, 0.07);
        /* two ogee-headed openings per face */
        for (let w = -1; w <= 1; w += 2) {
          const cx = w * W * 0.115,
            cy = hl.y0 + hh * 0.52,
            ww = 0.24,
            ht = hh * 0.62;
          const out: any = [];
          for (let sI = 0; sI <= 16; sI++) {
            const t = sI / 16,
              xx = ww * Math.pow(1 - t * t, 0.4);
            out.push([cx - xx, cy - ht * 0.44 + t * ht]);
          }
          for (let sI = 16; sI >= 0; sI--) {
            const t = sI / 16,
              xx = ww * Math.pow(1 - t * t, 0.4);
            out.push([cx + xx, cy - ht * 0.44 + t * ht]);
          }
          out.push([cx + ww, cy - ht * 0.48], [cx - ww, cy - ht * 0.48], out[0]);
          dark.fan(out, z + 0.008, rot, cx, cy);
          for (let sI = 0; sI < 16; sI++) {
            const t0 = sI / 16,
              t1 = (sI + 1) / 16;
            const x0 = ww * Math.pow(1 - t0 * t0, 0.4),
              x1 = ww * Math.pow(1 - t1 * t1, 0.4);
            const y0 = cy - ht * 0.44 + t0 * ht,
              y1 = cy - ht * 0.44 + t1 * ht;
            const len = Math.hypot(x1 - x0, y1 - y0),
              an = Math.atan2(-(x1 - x0), y1 - y0);
            P(
              gold,
              cx - (x0 + x1) / 2 - 0.042,
              (y0 + y1) / 2,
              z + 0.026,
              0.08,
              len * 1.4,
              0.04,
              -an,
            );
            P(
              gold,
              cx + (x0 + x1) / 2 + 0.042,
              (y0 + y1) / 2,
              z + 0.026,
              0.08,
              len * 1.4,
              0.04,
              an,
            );
          }
        }
      }

      /* ช่อฟ้า — the horn that lifts off each hip, and the serrated bai raka */
      function chofa(px?: any, pz?: any, ang?: any, sc?: any, yb?: any) {
        const pts: any = [];
        for (let i = 0; i <= 9; i++) {
          const t = i / 9;
          const out = (t * 0.42 - t * t * t * 0.72) * sc,
            up = Math.pow(t, 0.86) * 1.25 * sc;
          pts.push([px + Math.cos(ang) * out, yb + up, pz + Math.sin(ang) * out]);
        }
        gold.tube(pts, (u?: any) => 0.085 * sc * (1.0 - u * 0.72), 6, 1);
      }
      LT.roofs.forEach((rf?: any, ri?: any) => {
        const o: any = {
          yE: rf.yE,
          yT: rf.yT,
          RE: rf.RE,
          trunc: rf.trunc,
          lift: 0.14,
          tip: 0.1,
          pow: 1.16,
          flare: 0.02,
          ridge: 0.2,
        };
        const r = buildRoof(o);
        gTile.push(r.surf, r.ribs);
        gSoffit.push(r.soffit, r.fascia);
        /* gilded bargeboards down every hip, with fins and a chofa at the tip */
        for (let p = 0; p < NS; p++) {
          const hip: any = [];
          for (let it = 0; it <= 13; it++) {
            const t = Math.min(1.02, it / 13),
              sp = roofPoint(o, p, 1, t);
            hip.push([sp[0] * 1.004, sp[1] + 0.075, sp[2] * 1.004]);
          }
          gold.tube(hip, 0.062, 6, 1);
          for (let i = 3; i < 12; i++) {
            const a = hip[i],
              b = hip[i + 1];
            const dx = b[0] - a[0],
              dy = b[1] - a[1],
              dz = b[2] - a[2];
            const hl2 = Math.hypot(dx, dz) || 1;
            goldD.box(
              a[0],
              a[1] + 0.1,
              a[2],
              0.055,
              0.2 + 0.02 * (12 - i),
              0.1,
              Math.atan2(dx, dz),
              4,
              -0.5,
            );
          }
          const tip = hip[hip.length - 1];
          chofa(tip[0], tip[2], Math.atan2(tip[0], tip[2]), 1.05 - ri * 0.16, tip[1]);
        }
      });

      /* ปรางค์ — the tapering tower: stacked mouldings with gilt bands */
      {
        const pr = LT.prang,
          N = 10,
          H = pr.y1 - pr.y0;
        for (let i = 0; i < N; i++) {
          const t0 = i / N,
            t1 = (i + 1) / N;
          const y0 = pr.y0 + H * t0,
            y1 = pr.y0 + H * t1;
          const bel = (u?: any) =>
            pr.R0 * (1 + 0.075 * Math.sin(Math.pow(u, 0.8) * Math.PI)) +
            (pr.R1 - pr.R0) * Math.pow(u, 1.42);
          const r0 = bel(t0),
            r1 = bel(t1);
          white.prism(y0, y1 - (H / N) * 0.18, r0, r1 * 1.01, 1.5);
          gold.prism(y1 - (H / N) * 0.22, y1, r1 * 1.06, r1 * 1.01, 2.6);
          /* corner nagas stepping up the tower */
          for (let c = 0; c < NS; c++) {
            const q = cornPt(c, r1 * 1.1);
            goldD.box(q[0], y1 - (H / N) * 0.3, q[1], 0.135, (H / N) * 0.62, 0.135, cornRot(c), 4);
            if (i % 2 === 0)
              goldD.box(
                q[0] * 1.05,
                y1 - (H / N) * 0.04,
                q[1] * 1.05,
                0.1,
                (H / N) * 0.24,
                0.1,
                cornRot(c),
                4,
                0.45,
              );
          }
        }
        hollow.prism(pr.y0, pr.y1, pr.R1 * 0.7, pr.R1 * 0.7, 1, true, true);
      }
      /* spire: slender rings to a lotus bud */
      {
        const sp = LT.spire,
          H = sp.y1 - sp.y0;
        gold.box(0, sp.y0 + H * 0.45, 0, 0.13, H * 0.9, 0.13, Math.PI / 4, 3);
        for (let i = 0; i < 11; i++) {
          const t = i / 10,
            rr = 0.42 - t * 0.33;
          gold.prism(
            sp.y0 + H * (0.02 + t * 0.66),
            sp.y0 + H * (0.02 + t * 0.66) + H * 0.028,
            rr,
            rr * 0.92,
            3,
          );
        }
        const oy = sp.y0 + H * 0.86,
          orb = 0.17,
          seg = 12;
        for (let i = 0; i < seg; i++)
          for (let j = 0; j < seg; j++) {
            const t0 = (i / seg) * Math.PI,
              t1 = ((i + 1) / seg) * Math.PI;
            const p0 = (j / seg) * Math.PI * 2,
              p1 = ((j + 1) / seg) * Math.PI * 2;
            const V = (t?: any, pq?: any) => [
              Math.sin(t) * Math.cos(pq) * orb * (0.5 + 0.5 * Math.sin(t)),
              oy + Math.cos(t) * orb * 1.9,
              Math.sin(t) * Math.sin(pq) * orb * (0.5 + 0.5 * Math.sin(t)),
            ];
            gold.face([V(t0, p1), V(t1, p1), V(t1, p0), V(t0, p0)]);
          }
      }

      const add = (g?: any, m?: any, n?: any) => {
        if (g && g.attributes.position.count) {
          const me = new T.Mesh(g, m);
          me.castShadow = true;
          me.receiveShadow = true;
          me.name = n;
          grp.add(me);
        }
      };
      add(hollow.geo(), MAT.hollow, "hollow");
      add(dark.geo(), MAT.dark, "dark");
      add(white.geo(), MAT.plaster, "wall");
      add(whiteD.geo(), MAT.plasterD, "wallD");
      add(stone.geo(), MAT.stone, "stone");
      add(gold.geo(), MAT.gold, "gold");
      add(goldD.geo(), MAT.goldDim, "goldD");
      add(mergeGeos(gTile), MAT.claytile, "tiles");
      add(mergeGeos(gSoffit), MAT.goldDim, "soffit");
      return grp;
    }

    /* ------------------------------------------------------------------ *
     * 5e.  ប្រាសាទ — a Khmer prasat: laterite terraces carrying a redented
     *      sandstone sanctuary with false doors on three sides, and five
     *      diminishing storeys repeating it under a lotus finial.
     * ------------------------------------------------------------------ */
    const LK: any = {
      terr: [
        { y0: 0.0, y1: 0.62, R: 3.52 },
        { y0: 0.62, y1: 1.14, R: 3.22 },
        { y0: 1.14, y1: 1.62, R: 2.96 },
      ],
      moul: { y0: 1.62, y1: 2.28, R: 2.72 },
      cella: { y0: 2.28, y1: 4.86, R: 2.5 },
      corn: { y0: 4.86, y1: 5.38 },
      tower: { y0: 5.38, y1: 11.4, tiers: 5 },
      fin: { y0: 11.3, y1: 13.9 },
    };
    /* the redented plan: a square pushed out on each axis and stepped back
       twice before the corner, which is what gives a prasat its bristling
       silhouette without a single curve in it */
    function prasatPlan(R?: any, P?: any) {
      const oct: any = [
        [1 + P, 0],
        [1 + P, 0.3],
        [1.0, 0.3],
        [1.0, 0.45],
        [0.905, 0.45],
        [0.905, 0.575],
        [0.8, 0.575],
        [0.8, 0.665],
        [0.7, 0.7],
      ];
      const half = oct.concat(
        oct
          .slice(0, -1)
          .reverse()
          .map((q?: any) => [q[1], q[0]]),
      );
      const out: any = [];
      for (let k = 0; k < 4; k++) {
        const c = Math.cos((k * Math.PI) / 2),
          s = Math.sin((k * Math.PI) / 2);
        for (let i = k ? 1 : 0; i < half.length; i++) {
          const q = half[i];
          out.push([(q[0] * c - q[1] * s) * R, (q[0] * s + q[1] * c) * R]);
        }
      }
      out.pop(); /* the last point closes onto the first */
      return out;
    }
    function planRing(b?: any, plan?: any, y?: any, rOut?: any, rIn?: any, uvS?: any) {
      const N = plan.length,
        S = uvS || 1;
      for (let j = 0; j < N; j++) {
        const a = plan[j],
          c = plan[(j + 1) % N];
        b.face(
          [
            [a[0] * rIn, y, a[1] * rIn],
            [a[0] * rOut, y, a[1] * rOut],
            [c[0] * rOut, y, c[1] * rOut],
            [c[0] * rIn, y, c[1] * rIn],
          ],
          [
            [0, 0],
            [S, 0],
            [S, S],
            [0, S],
          ],
        );
      }
    }
    function buildPrasat() {
      const grp = new T.Group();
      const lat = new (Bld as any)(),
        sand = new (Bld as any)(),
        sandD = new (Bld as any)(),
        dark = new (Bld as any)(),
        hollow = new (Bld as any)(),
        trim = new (Bld as any)();
      const PJ = 0.15,
        PLAN = prasatPlan(1, PJ);

      /* laterite terraces, each with a shallow sandstone coping */
      LK.terr.forEach((tr?: any, i?: any) => {
        (i === 2 ? sand : lat).prism(tr.y0, tr.y1 - 0.07, tr.R, tr.R * 0.982, 1.0);
        sand.prism(tr.y1 - 0.07, tr.y1, tr.R * 1.012, tr.R * 0.972, 2.2, true);
      });

      /* the moulded plinth follows the redented plan from here up */
      sand.sweepPlan(
        PLAN,
        LK.moul.y0,
        LK.moul.y1,
        14,
        (t?: any) => {
          const b = Math.sin(t * Math.PI); /* torus between two fillets */
          return LK.moul.R * (0.955 + 0.075 * b - 0.03 * Math.cos(t * Math.PI * 3));
        },
        0.75,
      );

      /* the sanctuary body */
      const CE = LK.cella;
      sand.sweepPlan(PLAN, CE.y0, CE.y1, 2, () => CE.R, 0.75);
      hollow.prismN(CE.y0, CE.y1, CE.R * 0.6, CE.R * 0.6, 8, 1, true, true);

      /* a false door on each bay, and a real one on the bay facing the camera.
         Everything is placed against the projecting face, so it rides the plan. */
      const FD = CE.R * (1 + PJ);
      function bay(k?: any, y0?: any, h?: any, sc?: any, open?: any) {
        const rot = cornRot(k),
          co = Math.cos(rot),
          si = Math.sin(rot);
        const P = (b?: any, x?: any, y?: any, zz?: any, sx?: any, sy?: any, sz?: any, rz?: any) =>
          b.box(x * co + zz * si, y, -x * si + zz * co, sx, sy, sz, rot, 2.6, rz);
        const w = 0.46 * sc,
          ht = h * 0.66,
          cy = y0 + h * 0.42;
        /* a shadowed reveal, then the leaf sitting inside it */
        dark.box(
          Math.sin(rot) * (FD * sc - 0.05),
          cy,
          Math.cos(rot) * (FD * sc - 0.05),
          w * 2.34,
          ht * 1.1,
          0.05,
          rot,
          2.2,
        );
        (open ? dark : sandD).box(
          Math.sin(rot) * (FD * sc - 0.01),
          cy,
          Math.cos(rot) * (FD * sc - 0.01),
          w * 2,
          ht,
          0.03,
          rot,
          2.2,
        );
        if (open)
          hollow.box(
            Math.sin(rot) * (FD * sc - 0.3),
            cy,
            Math.cos(rot) * (FD * sc - 0.3),
            w * 2,
            ht,
            0.5,
            rot,
            1,
          );
        else {
          /* false door: horizontal leaf bands and a central stile */
          for (let i = 0; i < 5; i++)
            P(trim, 0, cy - ht * 0.42 + i * ht * 0.21, FD * sc + 0.02, w * 1.94, ht * 0.07, 0.03);
          P(trim, 0, cy, FD * sc + 0.024, 0.06 * sc, ht * 0.94, 0.034);
        }
        /* colonnettes either side, turned into rings */
        for (let s = -1; s <= 1; s += 2) {
          const cx = (w + 0.115 * sc) * s;
          P(sand, cx, cy, FD * sc + 0.055, 0.125 * sc, ht * 1.06, 0.125 * sc);
          for (let i = 0; i < 6; i++)
            P(
              trim,
              cx,
              cy - ht * 0.46 + i * ht * 0.185,
              FD * sc + 0.062,
              0.165 * sc,
              0.055 * sc,
              0.075 * sc,
            );
        }
        /* lintel and the pediment above it */
        P(sand, 0, cy + ht * 0.58, FD * sc + 0.048, w * 2.8, 0.2 * sc, 0.11 * sc);
        P(trim, 0, cy + ht * 0.58, FD * sc + 0.1, w * 2.7, 0.065 * sc, 0.045 * sc);
        const pw = w * 1.42,
          ph = 0.6 * sc,
          py = cy + ht * 0.6;
        const ped: any = [];
        for (let i = 0; i <= 12; i++) {
          const t = i / 12,
            xx = pw * (1 - t),
            yy = py + ph * Math.pow(t, 0.72);
          ped.push([-xx, yy]);
        }
        for (let i = 12; i >= 0; i--) {
          const t = i / 12,
            xx = pw * (1 - t),
            yy = py + ph * Math.pow(t, 0.72);
          ped.push([xx, yy]);
        }
        ped.push([pw, py], [-pw, py], ped[0]);
        sand.fan(ped, FD * sc + 0.042, rot, 0, py + ph * 0.42);
        sandD.fan(
          ped.map((q?: any) => [q[0] * 0.72, py + (q[1] - py) * 0.74]),
          FD * sc + 0.06,
          rot,
          0,
          py + ph * 0.34,
        );
        /* the flame-like antefixes that ride the pediment's rake */
        for (let s = -1; s <= 1; s += 2)
          for (let i = 1; i <= 4; i++) {
            const t = i / 5,
              xx = pw * (1 - t) * s,
              yy = py + ph * Math.pow(t, 0.72);
            P(
              trim,
              xx,
              yy + 0.07 * sc,
              FD * sc + 0.078,
              0.075 * sc,
              0.26 * sc - 0.03 * i,
              0.075 * sc,
              -s * 0.5,
            );
          }
      }
      for (let k = 0; k < NS; k++) bay(k, CE.y0 + 0.3, CE.y1 - CE.y0 - 0.55, 1, k === 1);

      /* cornice: three stepped bands, the middle one undercut */
      sand.sweepPlan(PLAN, LK.corn.y0, LK.corn.y0 + 0.17, 2, () => CE.R * 1.075, 0.9);
      sandD.sweepPlan(PLAN, LK.corn.y0 + 0.17, LK.corn.y0 + 0.3, 2, () => CE.R * 1.02, 0.9);
      sand.sweepPlan(PLAN, LK.corn.y0 + 0.3, LK.corn.y1, 2, () => CE.R * 1.045, 0.9);
      planRing(sand, PLAN, LK.corn.y1, CE.R * 1.045, CE.R * 0.868, 1.4);

      /* five storeys, each a smaller copy of the sanctuary under it */
      const TW = LK.tower,
        TH = (TW.y1 - TW.y0) / TW.tiers;
      for (let i = 0; i < TW.tiers; i++) {
        const y0 = TW.y0 + TH * i,
          sc = Math.pow(0.868, i + 1);
        const R = CE.R * sc;
        sand.sweepPlan(PLAN, y0, y0 + TH * 0.78, 2, () => R, 0.85);
        sand.sweepPlan(PLAN, y0 + TH * 0.78, y0 + TH * 0.885, 2, () => R * 1.045, 1.0);
        sandD.sweepPlan(PLAN, y0 + TH * 0.885, y0 + TH * 0.945, 2, () => R * 1.008, 1.0);
        sand.sweepPlan(PLAN, y0 + TH * 0.945, y0 + TH, 2, () => R * 1.026, 1.0);
        /* deck the step-back onto the storey above, or the tower reads as a
           stack of floating shelves with daylight between them */
        const nxt = i === TW.tiers - 1 ? 0.34 : CE.R * Math.pow(0.868, i + 2);
        planRing(sand, PLAN, y0 + TH, R * 1.026, nxt, 1.4);
        hollow.prismN(y0, y0 + TH, R * 0.55, R * 0.55, 8, 1, true, true);
        /* miniature niches repeating the doorway, and corner antefixes */
        for (let k = 0; k < NS; k++) {
          const rot = cornRot(k),
            fd = R * (1 + PJ);
          const nw = 0.2 * sc,
            nh = TH * 0.4;
          sandD.box(
            Math.sin(rot) * (fd - 0.015),
            y0 + TH * 0.38,
            Math.cos(rot) * (fd - 0.015),
            nw * 2,
            nh,
            0.03,
            rot,
            2.0,
          );
          sand.box(
            Math.sin(rot) * (fd + 0.02),
            y0 + TH * 0.36 + nh * 0.6,
            Math.cos(rot) * (fd + 0.02),
            nw * 2.5,
            0.075,
            0.06,
            rot,
            2.0,
          );
          const da = ((k + 0.5) * Math.PI) / 2,
            dr = R * 0.74;
          const qx = Math.cos(da) * dr,
            qz = Math.sin(da) * dr;
          trim.box(qx, y0 + TH * 1.06, qz, 0.17 * sc, 0.38 * sc, 0.17 * sc, Math.PI / 2 - da, 3);
          trim.box(
            qx,
            y0 + TH * 1.06 + 0.26 * sc,
            qz,
            0.1 * sc,
            0.2 * sc,
            0.1 * sc,
            Math.PI / 2 - da,
            3,
            0.4,
          );
        }
      }

      /* the lotus finial: a bud on a stack of discs */
      {
        const F = LK.fin,
          H = F.y1 - F.y0;
        for (let i = 0; i < 5; i++) {
          const t = i / 5,
            rr = 0.5 - t * 0.16;
          sand.prismN(F.y0 + H * t * 0.3, F.y0 + H * (t * 0.3 + 0.045), rr, rr * 0.9, 12, 2);
        }
        sand.lathe(
          0,
          F.y0 + H * 0.26,
          0,
          0,
          H * 0.52,
          (t?: any) => 0.4 * Math.pow(Math.sin(Math.PI * (0.18 + t * 0.74)), 0.8) * (1 - t * 0.3),
          16,
          12,
          1.2,
        );
        sand.lathe(
          0,
          F.y0 + H * 0.74,
          0,
          0,
          H * 0.3,
          (t?: any) => 0.17 * Math.pow(1 - t, 0.62),
          12,
          10,
          1.2,
        );
      }

      const add = (g?: any, m?: any, n?: any) => {
        if (g) {
          const me = new T.Mesh(g, m);
          me.castShadow = true;
          me.receiveShadow = true;
          me.name = n;
          grp.add(me);
        }
      };
      add(hollow.geo(), MAT.hollow, "hollow");
      add(dark.geo(), MAT.dark, "dark");
      add(lat.geo(), MAT.laterite, "laterite");
      add(sand.geo(), MAT.sandstone, "sand");
      add(sandD.geo(), MAT.sandDim, "sandD");
      add(trim.geo(), MAT.sandCarve, "trim");
      return grp;
    }

    /* ------------------------------------------------------------------ *
     * 5f.  CAMİ — an Ottoman mosque: an ashlar prayer hall carrying a lead
     *      dome on an octagonal transition, weight towers at the corners,
     *      and two pencil minarets that overtop the whole thing.
     * ------------------------------------------------------------------ */
    const LO: any = {
      base: [
        { y0: 0.0, y1: 0.42, R: 3.3 },
        { y0: 0.42, y1: 0.76, R: 3.02 },
      ],
      hall: { y0: 0.76, y1: 4.4, R: 2.6 },
      corn: { y0: 4.4, y1: 4.74 },
      oct: { y0: 4.74, y1: 5.42 },
      drum: { y0: 5.42, y1: 6.46, R: 1.88 },
      dome: { y0: 6.46, y1: 8.72 },
      alem: { y0: 8.72, y1: 9.46 },
      min: { R: 2.74, y0: 0.42, shaft: 0.3, ser: 8.3, cap: 11.6, tip: 13.95 },
    };
    function buildCami() {
      const grp = new T.Group();
      const ash = new (Bld as any)(),
        ashD = new (Bld as any)(),
        lead = new (Bld as any)(),
        tile = new (Bld as any)(),
        dark = new (Bld as any)(),
        hollow = new (Bld as any)(),
        gold = new (Bld as any)();

      LO.base.forEach((b?: any) => {
        ash.prism(b.y0, b.y1 - 0.06, b.R, b.R * 0.986, 0.9);
        ashD.prism(b.y1 - 0.06, b.y1, b.R * 1.01, b.R * 0.976, 2.0, true);
      });

      /* the prayer hall: ashlar with two tiers of pointed windows a side */
      const H = LO.hall,
        W = H.R * SW,
        z = H.R * AP,
        hh = H.y1 - H.y0;
      ash.prism(H.y0, H.y1, H.R, H.R * 0.996, 0.85);
      hollow.prism(H.y0, H.y1, H.R * 0.72, H.R * 0.72, 1, true, true);
      /* a pointed arch drawn as a two-centred outline, used at three sizes */
      const OGN = 14;
      function ogive(cx?: any, cy?: any, w?: any, h?: any) {
        const p: any = [];
        for (let i = 0; i <= OGN; i++) {
          const t = i / OGN;
          p.push([cx - w * Math.pow(1 - t * t, 0.42), cy - h * 0.5 + h * 0.62 + t * h * 0.38]);
        }
        for (let i = OGN; i >= 0; i--) {
          const t = i / OGN;
          p.push([cx + w * Math.pow(1 - t * t, 0.42), cy - h * 0.5 + h * 0.62 + t * h * 0.38]);
        }
        p.push([cx + w, cy - h * 0.5], [cx - w, cy - h * 0.5], p[0]);
        return p;
      }
      for (let k = 0; k < NS; k++) {
        const rot = faceRot(k),
          co = Math.cos(rot),
          si = Math.sin(rot);
        const P = (b?: any, x?: any, y?: any, zz?: any, sx?: any, sy?: any, sz?: any, rz?: any) =>
          b.box(x * co + zz * si, y, -x * si + zz * co, sx, sy, sz, rot, 2.4, rz);
        /* string course between the tiers, and a base plinth band */
        P(ashD, 0, H.y0 + hh * 0.52, z + 0.012, W * 1.002, 0.1, 0.055);
        P(ashD, 0, H.y0 + 0.16, z + 0.012, W * 1.002, 0.14, 0.06);
        /* lower tier: a doorway in the middle, a window either side */
        for (let s = -1; s <= 1; s++) {
          const cx = s * W * 0.255,
            cy = H.y0 + hh * 0.29;
          const open = s === 0;
          const w = open ? 0.3 : 0.22,
            ht = open ? hh * 0.42 : hh * 0.3;
          /* a dressed surround, the void inside it, and a moulding following
             only the arch — the two straight jambs are done as boxes */
          ashD.fan(ogive(cx, cy, w * 1.26, ht * 1.12), z + 0.006, rot, cx, cy);
          dark.fan(ogive(cx, cy, w, ht), z + 0.014, rot, cx, cy);
          const arc = ogive(cx, cy, w * 1.26, ht * 1.12);
          for (let i = 0; i < OGN * 2 + 1; i++) {
            const a = arc[i],
              b = arc[i + 1];
            const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
            if (len < 0.004) continue;
            const an = Math.atan2(-(b[0] - a[0]), b[1] - a[1]);
            P(ash, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z + 0.022, 0.06, len * 1.3, 0.038, an);
          }
          P(ash, cx, cy - ht * 0.5 + 0.06, z + 0.022, w * 2.6, 0.1, 0.045);
        }
        /* upper tier: three smaller windows, with a tile panel between them */
        for (let s = -1; s <= 1; s++) {
          const cx = s * W * 0.235,
            cy = H.y0 + hh * 0.74;
          ashD.fan(ogive(cx, cy, 0.185, hh * 0.265), z + 0.006, rot, cx, cy);
          dark.fan(ogive(cx, cy, 0.15, hh * 0.225), z + 0.016, rot, cx, cy);
        }
        for (let s = -1; s <= 1; s += 2)
          P(tile, s * W * 0.372, H.y0 + hh * 0.735, z + 0.016, 0.26, 0.62, 0.028);
      }
      /* weight towers over the corners, each with a small lead cone */
      for (let k = 0; k < NS; k++) {
        const q = cornPt(k, H.R * 0.97);
        ash.box(q[0], H.y0 + hh * 0.5 + 0.58, q[1], 0.36, hh + 1.16, 0.36, cornRot(k), 1.6);
        ashD.box(q[0], H.y1 + 0.64, q[1], 0.44, 0.09, 0.44, cornRot(k), 2.4);
        lead.lathe(
          q[0],
          H.y1 + 0.69,
          q[1],
          0,
          0.54,
          (t?: any) => 0.22 * Math.pow(1 - t, 0.66),
          8,
          10,
          1.4,
        );
      }

      /* cornice, then the square gives way to an octagon and then the drum */
      ash.prism(LO.corn.y0, LO.corn.y0 + 0.2, H.R * 1.045, H.R * 1.045, 1.6);
      ashD.prism(LO.corn.y0 + 0.2, LO.corn.y1, H.R * 1.01, H.R * 0.9, 1.6);
      ash.prismN(LO.oct.y0, LO.oct.y1, H.R * 0.9, LO.drum.R * 1.1, 8, 1.2);
      ash.prismN(LO.drum.y0, LO.drum.y1, LO.drum.R * 1.06, LO.drum.R, 16, 1.4);
      hollow.prismN(LO.oct.y0, LO.dome.y0, LO.drum.R * 0.86, LO.drum.R * 0.84, 12, 1, true, true);
      /* windows round the drum */
      for (let i = 0; i < 16; i++) {
        const a = ((i + 0.5) / 16) * Math.PI * 2,
          r = LO.drum.R * 1.015;
        dark.box(
          Math.cos(a) * r,
          LO.drum.y0 + 0.52,
          Math.sin(a) * r,
          0.17,
          0.46,
          0.05,
          Math.PI / 2 - a,
          2,
        );
      }
      ashD.prismN(LO.drum.y1, LO.drum.y1 + 0.13, LO.drum.R * 1.09, LO.drum.R * 1.03, 16, 2);

      /* the dome — lead over a full profile, stilted a little at the springing */
      const DH = LO.dome.y1 - LO.dome.y0;
      lead.lathe(
        0,
        LO.dome.y0,
        0,
        0,
        DH,
        (t?: any) => LO.drum.R * 1.02 * Math.pow(Math.max(0, 1 - t * t), 0.42),
        22,
        32,
        1.1,
      );
      /* the inner shell follows the same curve a little inside it */
      hollow.lathe(
        0,
        LO.dome.y0,
        0,
        0,
        DH * 0.97,
        (t?: any) => LO.drum.R * 0.9 * Math.pow(Math.max(0, 1 - t * t), 0.42),
        16,
        18,
        1.1,
      );
      /* alem: a rod, a knop and a crescent */
      gold.box(0, LO.alem.y0 + 0.3, 0, 0.055, 0.62, 0.055, 0, 2);
      gold.lathe(
        0,
        LO.alem.y0 + 0.06,
        0,
        0,
        0.2,
        (t?: any) => 0.1 * Math.sin(Math.PI * (0.12 + t * 0.78)),
        8,
        10,
        1.2,
      );
      gold.arc(0, LO.alem.y1 - 0.1, 0, 0.15, 0.2, 0.045, 0, -2.05, 2.05, 18, 1.2);

      /* two minarets, set on the side corners so they frame the dome */
      [0, 2].forEach((k?: any) => {
        const q = cornPt(k, LO.min.R),
          M = LO.min,
          r = M.shaft;
        const px = q[0],
          pz = q[1],
          rr = cornRot(k);
        /* kaide — the square pedestal, then the transition to the shaft */
        ash.box(px, M.y0 + 0.92, pz, r * 3.0, 1.84, r * 3.0, rr, 1.4);
        ashD.box(px, M.y0 + 1.86, pz, r * 3.1, 0.1, r * 3.1, rr, 2.2);
        for (let i = 0; i < 5; i++) {
          const t = i / 5,
            t2 = (i + 1) / 5;
          ash.box(
            px,
            M.y0 + 1.92 + t * 0.86 + 0.086,
            pz,
            (r * (3.0 - 1.35 * t2)) / 1.0,
            0.176,
            r * (3.0 - 1.35 * t2),
            rr,
            1.6,
          );
        }
        /* the shaft, a twelve-sided pencil */
        const sy = M.y0 + 2.86;
        const shaft = (y0?: any, y1?: any, r0?: any, r1?: any) => {
          const seg = 8;
          for (let i = 0; i < seg; i++) {
            const a = i / seg,
              b = (i + 1) / seg;
            ash.prismN(
              y0 + (y1 - y0) * a,
              y0 + (y1 - y0) * b,
              r0 + (r1 - r0) * a,
              r0 + (r1 - r0) * b,
              12,
              1.5,
            );
          }
        };
        /* prismN is centred on the origin, so the shaft is built at the origin
           and carried out to the corner by hand */
        const push = (b?: any, fn?: any) => {
          const n0 = b.p.length;
          fn();
          for (let i = n0; i < b.p.length; i += 3) {
            b.p[i] += px;
            b.p[i + 2] += pz;
          }
        };
        push(ash, () => {
          shaft(sy, M.ser - 0.3, r, r * 0.9);
          /* şerefe — corbels stepping out to the balcony */
          for (let i = 0; i < 4; i++)
            ash.prismN(
              M.ser - 0.3 + i * 0.075,
              M.ser - 0.3 + (i + 1) * 0.075,
              r * (0.9 + (0.3 * i) / 4),
              r * (0.9 + (0.3 * (i + 1)) / 4),
              12,
              2.2,
            );
          ash.prismN(M.ser, M.ser + 0.055, r * 1.28, r * 1.28, 12, 2.2, true);
          shaft(M.ser + 0.3, M.cap, r * 0.8, r * 0.66);
        });
        push(ashD, () => {
          /* the balcony rail, and the band under the cap */
          ashD.prismN(M.ser + 0.055, M.ser + 0.3, r * 1.26, r * 1.24, 12, 2.4);
          ashD.prismN(M.cap - 0.09, M.cap, r * 0.74, r * 0.7, 12, 2.4);
        });
        push(dark, () => {
          /* the doorway out onto the balcony */
          dark.prismN(M.ser + 0.06, M.ser + 0.28, r * 0.815, r * 0.815, 12, 1);
        });
        push(lead, () => {
          lead.lathe(
            0,
            M.cap,
            0,
            0,
            M.tip - M.cap - 0.34,
            (t?: any) => r * 0.7 * Math.pow(1 - t, 0.8),
            10,
            12,
            1.5,
          );
        });
        push(gold, () => {
          gold.box(0, M.tip - 0.2, 0, 0.045, 0.34, 0.045, 0, 2);
          gold.arc(0, M.tip - 0.02, 0, 0.085, 0.115, 0.03, 0, -2.05, 2.05, 14, 1.2);
        });
        push(hollow, () => {
          hollow.prismN(M.y0, M.cap, r * 0.52, r * 0.42, 8, 1, true, true);
        });
      });

      const add = (g?: any, m?: any, n?: any) => {
        if (g) {
          const me = new T.Mesh(g, m);
          me.castShadow = true;
          me.receiveShadow = true;
          me.name = n;
          grp.add(me);
        }
      };
      add(hollow.geo(), MAT.hollow, "hollow");
      add(dark.geo(), MAT.dark, "dark");
      add(ash.geo(), MAT.ashlar, "ashlar");
      add(ashD.geo(), MAT.ashlarD, "ashlarD");
      add(lead.geo(), MAT.lead, "lead");
      add(tile.geo(), MAT.iznik, "iznik");
      add(gold.geo(), MAT.gold, "gold");
      return grp;
    }

    /* ------------------------------------------------------------------ *
     * 5g.  THÁP — a Vietnamese temple tower after the Huế pagodas: seven
     *      octagonal storeys in ochre lime wash, each ringed by a tiled eave
     *      whose corners lift, under a slender bronze finial.
     * ------------------------------------------------------------------ */
    const LV: any = {
      terr: [
        { y0: 0.0, y1: 0.54, R: 3.42 },
        { y0: 0.54, y1: 1.02, R: 3.1 },
      ],
      plinth: { y0: 1.02, y1: 1.66, R: 2.74 },
      body: { y0: 1.66, y1: 11.3, tiers: 7, R: 2.42 },
      fin: { y0: 11.2, y1: 14.02 },
    };
    /* an eave ring on an octagon: the outer edge drops away from the wall and
       then lifts again at each corner, which is the whole character of the roof */
    function eaveRing(b?: any, y?: any, rIn?: any, rOut?: any, drop?: any, lip?: any, uvS?: any) {
      const n = 8,
        S = 6,
        US = uvS || 1;
      for (let k = 0; k < n; k++) {
        const A = cPtN(k, 1, n),
          B = cPtN(k + 1, 1, n);
        const at = (u?: any, r?: any) => [
          (A[0] + (B[0] - A[0]) * u) * r,
          (A[1] + (B[1] - A[1]) * u) * r,
        ];
        const yo = (u?: any) => {
          const d = 2 * u - 1;
          return y - drop + lip * d * d * d * d;
        };
        for (let s = 0; s < S; s++) {
          const u0 = s / S,
            u1 = (s + 1) / S;
          const i0 = at(u0, rIn),
            i1 = at(u1, rIn),
            o0 = at(u0, rOut),
            o1 = at(u1, rOut);
          b.face(
            [
              [i1[0], y, i1[1]],
              [i0[0], y, i0[1]],
              [o0[0], yo(u0), o0[1]],
              [o1[0], yo(u1), o1[1]],
            ],
            [
              [u1 * US * 3, 0],
              [u0 * US * 3, 0],
              [u0 * US * 3, US],
              [u1 * US * 3, US],
            ],
          );
          /* the fascia under the outer edge, so the roof has a thickness */
          b.face(
            [
              [o0[0], yo(u0), o0[1]],
              [o0[0], yo(u0) - 0.07, o0[1]],
              [o1[0], yo(u1) - 0.07, o1[1]],
              [o1[0], yo(u1), o1[1]],
            ],
            [
              [u0 * US * 3, 0],
              [u0 * US * 3, 0.3],
              [u1 * US * 3, 0.3],
              [u1 * US * 3, 0],
            ],
          );
        }
      }
    }
    function buildThap() {
      const grp = new T.Group();
      const stone = new (Bld as any)(),
        ochre = new (Bld as any)(),
        ochreD = new (Bld as any)(),
        tile = new (Bld as any)(),
        trim = new (Bld as any)(),
        dark = new (Bld as any)(),
        hollow = new (Bld as any)(),
        gold = new (Bld as any)();

      LV.terr.forEach((tr?: any) => {
        stone.prism(tr.y0, tr.y1 - 0.06, tr.R, tr.R * 0.984, 0.9);
        ochreD.prism(tr.y1 - 0.06, tr.y1, tr.R * 1.012, tr.R * 0.974, 2.2, true);
      });
      /* an octagonal plinth carries the square terraces up into the tower */
      ochre.prismN(LV.plinth.y0, LV.plinth.y1 - 0.12, LV.plinth.R, LV.plinth.R * 0.97, 8, 1.0);
      ochreD.prismN(
        LV.plinth.y1 - 0.12,
        LV.plinth.y1,
        LV.plinth.R * 1.03,
        LV.plinth.R * 0.99,
        8,
        2.2,
      );

      const B = LV.body,
        TH = (B.y1 - B.y0) / B.tiers;
      for (let i = 0; i < B.tiers; i++) {
        const y0 = B.y0 + TH * i,
          sc = Math.pow(0.905, i),
          R = B.R * sc,
          h = TH * (1 - i * 0.018);
        /* body, with a lightly battered wall */
        ochre.prismN(y0, y0 + h * 0.8, R, R * 0.975, 8, 0.95);
        /* cornice bands under the eave */
        ochreD.prismN(y0 + h * 0.8, y0 + h * 0.86, R * 1.035, R * 1.025, 8, 2.0);
        trim.prismN(y0 + h * 0.86, y0 + h * 0.895, R * 1.06, R * 1.05, 8, 2.4);
        /* the eave itself, then the parapet the next storey sits on */
        eaveRing(tile, y0 + h * 0.905, R * 1.05, R * 1.3 + 0.1, 0.26, 0.3, 1.6);
        ochreD.prismN(y0 + h * 0.93, y0 + h, R * 0.985, R * 0.965, 8, 2.0);
        hollow.prismN(y0, y0 + h, R * 0.6, R * 0.58, 8, 1, true, true);
        /* arched openings on the four faces that read from the front, and
           blind panels on the four between them */
        for (let k = 0; k < 8; k++) {
          const a = ((k + 0.5) / 8) * Math.PI * 2; /* face centre of the octagon */
          const ap = Math.cos(Math.PI / 8),
            rr = R * ap;
          const rot = Math.PI / 2 - a;
          const cx = Math.cos(a) * rr,
            cz = Math.sin(a) * rr;
          const cy = y0 + h * 0.4,
            ww = R * 0.3,
            hh2 = h * 0.5;
          if (k % 2 === 0) {
            const p: any = [],
              N = 12;
            for (let s2 = 0; s2 <= N; s2++) {
              const t = s2 / N;
              p.push([-ww * Math.sqrt(Math.max(0, 1 - t * t)), cy - hh2 * 0.34 + t * hh2 * 0.42]);
            }
            for (let s2 = N; s2 >= 0; s2--) {
              const t = s2 / N;
              p.push([ww * Math.sqrt(Math.max(0, 1 - t * t)), cy - hh2 * 0.34 + t * hh2 * 0.42]);
            }
            p.push([ww, cy - hh2 * 0.42], [-ww, cy - hh2 * 0.42], p[0]);
            /* a pale surround stands proud of the wall, the void sits inside it */
            const sur = p.map((q?: any) => [q[0] * 1.26, cy + (q[1] - cy) * 1.2]);
            ochreD.fan(sur, rr + 0.014, rot, 0, cy);
            trim.box(cx * 1.01, cy + hh2 * 0.34, cz * 1.01, ww * 2.7, 0.055, 0.05, rot, 2.4);
            dark.fan(p, rr + 0.03, rot, 0, cy);
            hollow.box(cx * 0.86, cy, cz * 0.86, ww * 2, hh2, 0.5, rot, 1);
          } else {
            ochreD.box(
              cx * 1.004,
              cy + h * 0.04,
              cz * 1.004,
              ww * 1.9,
              hh2 * 0.95,
              0.035,
              rot,
              2.0,
            );
            trim.box(cx * 1.01, cy + h * 0.04, cz * 1.01, ww * 2.1, 0.055, 0.05, rot, 2.4);
            trim.box(
              cx * 1.01,
              cy + h * 0.04 - hh2 * 0.48,
              cz * 1.01,
              ww * 2.1,
              0.055,
              0.05,
              rot,
              2.4,
            );
          }
        }
      }

      /* finial: a stack of rings rising to a gourd and a flame */
      {
        const F = LV.fin,
          Hf = F.y1 - F.y0;
        ochreD.prismN(F.y0, F.y0 + 0.2, 0.62, 0.5, 8, 2.0, true);
        gold.box(0, F.y0 + Hf * 0.44, 0, 0.075, Hf * 0.86, 0.075, Math.PI / 8, 2.6);
        for (let i = 0; i < 9; i++) {
          const t = i / 9,
            rr = 0.4 - t * 0.27;
          gold.lathe(0, F.y0 + 0.24 + t * Hf * 0.56, 0, 0, Hf * 0.03, () => rr, 2, 12, 1.4);
        }
        gold.lathe(
          0,
          F.y0 + Hf * 0.7,
          0,
          0,
          Hf * 0.17,
          (t?: any) => 0.21 * Math.pow(Math.sin(Math.PI * (0.16 + t * 0.8)), 0.72),
          12,
          12,
          1.2,
        );
        gold.lathe(
          0,
          F.y0 + Hf * 0.86,
          0,
          0,
          Hf * 0.14,
          (t?: any) => 0.115 * Math.pow(1 - t, 0.55),
          10,
          10,
          1.2,
        );
      }

      const add = (g?: any, m?: any, n?: any) => {
        if (g) {
          const me = new T.Mesh(g, m);
          me.castShadow = true;
          me.receiveShadow = true;
          me.name = n;
          grp.add(me);
        }
      };
      add(hollow.geo(), MAT.hollow, "hollow");
      add(dark.geo(), MAT.dark, "dark");
      add(stone.geo(), MAT.stone, "stone");
      add(ochre.geo(), MAT.ochre, "ochre");
      add(ochreD.geo(), MAT.ochreD, "ochreD");
      add(tile.geo(), MAT.vntile, "vntile");
      add(trim.geo(), MAT.vntrim, "vntrim");
      add(gold.geo(), MAT.bronze, "finial");
      return grp;
    }

    /* ------------------------------------------------------------------ *
     * 5d.  style registry
     * ------------------------------------------------------------------ */
    const STYLES: any = [
      {
        id: "JAPAN",
        aud: { music: "music_jp", build: "build_jp", bell: "bell_jp", bg: 0.85, bv: 0.95 },
        build: buildTenshu,
        t1: "普請",
        sub: "TENSHU GROWTH STUDY",
        t2: "天守",
        t3: "生長",
        gloss: "（Tsuku&nbsp;·&nbsp;築）",
        caps: [
          [L.ishi.y0, L.ishi.y1, null],
          [L.s1.y0, L.s1.y1, L.s1.R],
          [L.s2.y0, L.s2.y1, L.s2.R],
          [L.s3.y0, L.s3.y1, L.s3.R],
          [L.s4.y0, L.s4.y1, L.s4.R],
        ],
        scaf: [
          { top: 3.44, base: 0.1, w: 7.1, d: 3.95, bays: 8 },
          { top: 6.34, base: 3.1, w: 6.1, d: 3.55, bays: 7 },
          { top: 8.9, base: 6.0, w: 5.2, d: 3.05, bays: 6 },
          { top: 11.26, base: 8.55, w: 4.45, d: 2.6, bays: 6 },
          { top: 13.66, base: 10.9, w: 3.8, d: 2.25, bays: 5 },
        ],
        stages: [
          ["準備", "READY", 0.0],
          ["石垣普請", "STONEWORK", 3.36],
          ["柱梁組立", "TIMBER", 6.24],
          ["白壁塗籠", "PLASTER", 8.8],
          ["望楼上棟", "TURRET", 11.16],
          ["瓦葺仕舞", "ROOFING", 14.3],
          ["完成", "COMPLETE", 14.3],
        ],
      },
      {
        id: "CHINA",
        aud: { music: "music_cn", build: "build_cn", bell: "bell_cn", bg: 1.3, bv: 0.95 },
        build: buildPagoda,
        t1: "營造",
        sub: "PAGODA GROWTH STUDY",
        t2: "寶塔",
        t3: "生長",
        gloss: "（Zào&nbsp;·&nbsp;造）",
        caps: [
          [0, 0.58, 3.1],
          [0.52, 2.2, 2.46],
          [3.34, 4.7, 2.14],
          [5.74, 6.96, 1.84],
          [7.9, 8.98, 1.56],
          [9.82, 10.78, 1.3],
        ],
        scaf: [
          { top: 3.2, base: 0.1, w: 7.0, d: 3.9, bays: 8 },
          { top: 5.6, base: 2.9, w: 6.3, d: 3.55, bays: 7 },
          { top: 7.8, base: 5.3, w: 5.5, d: 3.1, bays: 6 },
          { top: 9.8, base: 7.5, w: 4.7, d: 2.65, bays: 6 },
          { top: 13.2, base: 9.5, w: 4.0, d: 2.3, bays: 5 },
        ],
        stages: [
          ["准备", "READY", 0.0],
          ["夯土砌基", "PLINTH", 2.3],
          ["立柱架梁", "TIMBER", 5.1],
          ["斗栱層疊", "BRACKETS", 7.4],
          ["塗朱飾彩", "LACQUER", 9.4],
          ["覆瓦裝剎", "ROOFING", 14.3],
          ["完成", "COMPLETE", 14.3],
        ],
      },
      {
        id: "VIETNAM",
        aud: { music: "music_vn", build: "build_vn", bell: "bell_vn", bg: 0.82, bv: 0.92 },
        build: buildThap,
        t1: "興工",
        sub: "THÁP GROWTH STUDY",
        t2: "佛塔",
        t3: "生長",
        gloss: "（Hưng&nbsp;·&nbsp;興）",
        caps: [
          [LV.terr[0].y0, LV.terr[0].y1, 3.38],
          [LV.terr[1].y0, LV.terr[1].y1, 3.06],
          [LV.plinth.y0, LV.plinth.y1, 2.68, 8],
          [LV.body.y0, 5.0, 2.28, 8],
          [5.0, 8.2, 1.85, 8],
          [8.2, LV.body.y1, 1.5, 8],
          [LV.fin.y0, LV.fin.y1, 0.56, 12],
        ],
        scaf: [
          { top: 1.66, base: 0.1, w: 7.2, d: 4.0, bays: 8 },
          { top: 4.2, base: 1.1, w: 5.5, d: 3.15, bays: 7 },
          { top: 7.0, base: 3.9, w: 4.6, d: 2.6, bays: 6 },
          { top: 9.8, base: 6.7, w: 3.9, d: 2.2, bays: 6 },
          { top: 13.6, base: 9.5, w: 3.1, d: 1.8, bays: 5 },
        ],
        stages: [
          ["CHUẨN BỊ", "READY", 0.0],
          ["NỀN MÓNG", "FOUNDATION", 1.66],
          ["THÂN THÁP", "TOWER BODY", 4.2],
          ["MÁI NGÓI", "TILED EAVES", 7.0],
          ["TẦNG TRÊN", "UPPER TIERS", 9.8],
          ["ĐỈNH THÁP", "FINIAL", 14.3],
          ["HOÀN THÀNH", "COMPLETE", 14.3],
        ],
      },
      {
        id: "THAI",
        aud: { music: "music_th", build: "build_th", bell: "bell_th", bg: 0.62, bv: 0.8 },
        build: buildWat,
        t1: "วัด",
        sub: "PRANG GROWTH STUDY",
        t2: "พระ",
        t3: "ปรางค์",
        gloss: "（Sāng&nbsp;·&nbsp;สร้าง）",
        caps: [
          [0, 1.4, 3.16],
          [1.34, 3.86, 2.52],
          [6.54, 11.92, 1.62],
        ],
        scaf: [
          { top: 1.95, base: 0.1, w: 7.0, d: 3.9, bays: 8 },
          { top: 4.2, base: 1.55, w: 5.9, d: 3.35, bays: 7 },
          { top: 6.95, base: 3.75, w: 5.05, d: 2.85, bays: 6 },
          { top: 11.35, base: 6.4, w: 3.95, d: 2.25, bays: 5 },
          { top: 13.75, base: 11.0, w: 2.8, d: 1.75, bays: 4 },
        ],
        stages: [
          ["เตรียม", "READY", 0.0],
          ["ฐานราก", "PLINTH", 1.45],
          ["เสาและคาน", "TIMBER", 3.95],
          ["หลังคา", "ROOF", 6.85],
          ["ปรางค์", "PRANG", 11.95],
          ["ยอดฉัตร", "SPIRE", 14.3],
          ["เสร็จ", "COMPLETE", 14.3],
        ],
      },
      {
        id: "CAMBODIA",
        aud: { music: "music_kh", build: "build_kh", bell: "bell_kh", bg: 0.8, bv: 0.9 },
        build: buildPrasat,
        t1: "កសាង",
        sub: "PRASAT GROWTH STUDY",
        t2: "ប្រាសាទ",
        t3: "លូតលាស់",
        gloss: "（Sang&nbsp;·&nbsp;សាង）",
        caps: [
          [LK.terr[0].y0, LK.terr[0].y1, 3.48],
          [LK.terr[1].y0, LK.terr[1].y1, 3.18],
          [LK.terr[2].y0, LK.terr[2].y1, 2.92],
          [LK.moul.y0, LK.moul.y1, 2.56],
          [LK.cella.y0, LK.corn.y1, 2.42],
          [LK.tower.y0, LK.tower.y1, 1.95],
          [LK.fin.y0, LK.fin.y1, 0.46, 12],
        ],
        scaf: [
          { top: 2.28, base: 0.1, w: 7.4, d: 4.1, bays: 8 },
          { top: 4.86, base: 2.0, w: 6.2, d: 3.5, bays: 7 },
          { top: 7.2, base: 4.6, w: 5.2, d: 2.95, bays: 6 },
          { top: 9.6, base: 6.9, w: 4.3, d: 2.45, bays: 6 },
          { top: 13.4, base: 9.3, w: 3.4, d: 2.0, bays: 5 },
        ],
        stages: [
          ["រៀបចំ", "READY", 0.0],
          ["ថ្មបាយក្រៀម", "LATERITE", 2.28],
          ["ថ្មភក់", "SANDSTONE", 4.86],
          ["ប្រាសាទ", "SANCTUARY", 7.2],
          ["ថ្នាក់", "TIERS", 9.6],
          ["កំពូលឈូក", "FINIAL", 14.3],
          ["បញ្ចប់", "COMPLETE", 14.3],
        ],
      },
      {
        id: "TURKEY",
        aud: { music: "music_tr", build: "build_tr", bell: "bell_tr", bg: 0.78, bv: 0.85 },
        build: buildCami,
        t1: "İNŞA",
        sub: "CAMİ GROWTH STUDY",
        t2: "CAMİ",
        t3: "YAPISI",
        gloss: "（İnşa&nbsp;·&nbsp;Yapı）",
        caps: [
          [0, LO.base[0].y1, 3.26],
          [LO.base[1].y0, LO.base[1].y1, 2.98],
          [LO.hall.y0, LO.corn.y1, 2.56],
          [LO.oct.y0, LO.oct.y1, 2.02, 8],
          [LO.drum.y0, LO.drum.y1, 1.86, 16],
          [LO.dome.y0, 7.4, 1.72, 16],
          [7.4, 8.2, 1.28, 16],
          [8.2, LO.dome.y1, 0.7, 16],
          [LO.alem.y0, LO.alem.y1, 0.12, 8],
        ],
        scaf: [
          { top: 0.76, base: 0.1, w: 7.0, d: 3.9, bays: 8 },
          { top: 4.4, base: 0.5, w: 6.3, d: 3.55, bays: 7 },
          { top: 6.46, base: 4.1, w: 4.7, d: 2.65, bays: 6 },
          { top: 9.46, base: 6.1, w: 3.7, d: 2.15, bays: 5 },
          { top: 13.5, base: 8.2, w: 6.6, d: 1.7, bays: 7 },
        ],
        stages: [
          ["HAZIRLIK", "READY", 0.0],
          ["TEMEL", "FOUNDATION", 0.76],
          ["DUVAR", "WALLS", 4.4],
          ["KUBBE", "DOME", 6.46],
          ["ÇİNİ", "TILEWORK", 9.46],
          ["MİNARE", "MINARET", 14.3],
          ["TAMAM", "COMPLETE", 14.3],
        ],
      },
    ];

    /* ------------------------------------------------------------------ *
     * 6.  scaffolding
     * ------------------------------------------------------------------ */
    /* BoxGeometry gives every face a 0..1 UV, so a 3-unit pole and a 0.15-unit
       one show the same stretched patch. Rescale by world size, and run the
       longer dimension along v so the grain follows the length of the timber. */
    function worldUV(geo?: any, sx?: any, sy?: any, sz?: any, dens?: any, ou?: any, ov?: any) {
      const uv = geo.attributes.uv;
      const dims: any = [
        [sz, sy],
        [sz, sy],
        [sx, sz],
        [sx, sz],
        [sx, sy],
        [sx, sy],
      ];
      for (let f = 0; f < 6; f++) {
        const du = dims[f][0],
          dv = dims[f][1],
          swap = dv > du;
        for (let i = 0; i < 4; i++) {
          const k = f * 4 + i;
          let u = uv.getX(k),
            v = uv.getY(k);
          if (swap) {
            const t = u;
            u = v;
            v = t;
          }
          uv.setXY(k, u * (swap ? dv : du) * dens + ou, v * (swap ? du : dv) * dens + ov);
        }
      }
      uv.needsUpdate = true;
    }
    function buildScaffoldGroup(yTop?: any, yBase?: any, width?: any, depth?: any, bays?: any) {
      const grp = new T.Group(),
        th = 0.145,
        H = yTop - yBase;
      const nRail = Math.max(2, Math.min(5, Math.round(H / 0.78)));
      const mk = (
        x?: any,
        y?: any,
        z?: any,
        sx?: any,
        sy?: any,
        sz?: any,
        rz?: any,
        rotY?: any,
        kind?: any,
      ) => {
        const geo = new T.BoxGeometry(sx, sy, sz);
        worldUV(geo, sx, sy, sz, 1.15, Math.random() * 4, Math.random() * 4);
        const m = new T.Mesh(geo, MAT.scaffold);
        const co = Math.cos(rotY),
          si = Math.sin(rotY);
        m.position.set(x * co + z * si, y, -x * si + z * co);
        m.rotation.set(0, rotY, rz || 0);
        m.castShadow = true;
        m.userData.kind = kind;
        grp.add(m);
        return m;
      };
      function frame(halfW?: any, zOff?: any, rotY?: any, nb?: any, brace?: any) {
        for (let i = 0; i <= nb; i++)
          mk((-1 + (2 * i) / nb) * halfW, yBase + H / 2, zOff, th, H, th, 0, rotY, "v");
        for (let r = 1; r <= nRail; r++)
          mk(
            0,
            yBase + H * (r / nRail) - H * 0.09,
            zOff,
            halfW * 2.1,
            th * 0.9,
            th * 0.9,
            0,
            rotY,
            "h",
          );
        if (brace) {
          const bw = (halfW * 2) / nb,
            cl = Math.hypot(bw * 1.05, H * 0.62),
            ang = Math.atan2(bw * 1.05, H * 0.62);
          mk(0, yBase + H * 0.44, zOff, th * 0.78, cl, th * 0.78, ang, rotY, "v");
          mk(0, yBase + H * 0.44, zOff, th * 0.78, cl, th * 0.78, -ang, rotY, "v");
          for (const sx of [-1, 1])
            mk(
              sx * (halfW + 0.22),
              yBase + H * 0.44,
              zOff,
              th * 0.78,
              H * 0.96,
              th * 0.78,
              -sx * 0.24,
              rotY,
              "v",
            );
        }
      }
      const sideBays = Math.max(3, Math.round((bays * depth) / (width * 0.5)));
      frame(width * 0.5, depth, 0, bays, true);
      frame(width * 0.5, -depth, 0, bays, true);
      frame(depth, width * 0.5, Math.PI / 2, sideBays, false);
      frame(depth, -width * 0.5, Math.PI / 2, sideBays, false);
      return grp;
    }

    /* ------------------------------------------------------------------ *
     * 7.  scene
     * ------------------------------------------------------------------ */
    const renderer = new T.WebGLRenderer({
      canvas: cvs,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0x000000, 0);
    renderer.localClippingEnabled = true;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    if ("outputColorSpace" in renderer && T.SRGBColorSpace !== undefined)
      renderer.outputColorSpace = T.SRGBColorSpace;
    else if (renderer.outputEncoding !== undefined && T.sRGBEncoding !== undefined)
      renderer.outputEncoding = T.sRGBEncoding;

    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(11, 1, 15, 2200);

    buildMaterials();
    captureMatBase();
    let modelGroup: any = null,
      styleIdx = 0;

    /* ------------------------------------------------------------------ *
     * 7a.  world — sky dome, star field, distant ridges, ground
     * ------------------------------------------------------------------ */
    scene.fog = new T.Fog(0x141c30, 100, 340);

    const skyCan = cv(8, 512);
    const SKY_STOPS: any = [0, 0.28, 0.46, 0.6, 0.74, 1.0];
    function paintSky(cols?: any) {
      const g = skyCan.getContext("2d");
      const grd = g.createLinearGradient(0, 0, 0, 512);
      cols.forEach((c?: any, i?: any) =>
        grd.addColorStop(SKY_STOPS[i], "#" + ("000000" + c.getHexString()).slice(-6)),
      );
      g.fillStyle = grd;
      g.fillRect(0, 0, 8, 512);
      if (skyMat.map) skyMat.map.needsUpdate = true;
    }
    const skyMat = new T.MeshBasicMaterial({ side: T.BackSide, fog: false, depthWrite: false });
    skyMat.map = srgb(new T.CanvasTexture(skyCan));
    const sky = new T.Mesh(new T.SphereGeometry(900, 32, 24), skyMat);
    sky.renderOrder = -20;
    scene.add(sky);

    /* star field — three size classes so brightness varies, additive on the dome */
    function starSprite() {
      const S = 64,
        c = cv(S, S),
        g = c.getContext("2d");
      const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
      gr.addColorStop(0, "rgba(255,255,255,1)");
      gr.addColorStop(0.25, "rgba(255,255,255,.85)");
      gr.addColorStop(0.55, "rgba(255,255,255,.18)");
      gr.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = gr;
      g.fillRect(0, 0, S, S);
      return c;
    }
    const starTex = new T.CanvasTexture(starSprite());
    const starLayers: any = [];
    (function buildStars() {
      let seed = 20260809;
      const rnd = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
      };
      const DPR = Math.min(window.devicePixelRatio || 1, 2);
      const CLASSES: any = [
        [30000, 1.8 * DPR],
        [7500, 2.9 * DPR],
        [1700, 5.0 * DPR],
      ];
      CLASSES.forEach(([N, px]: any, ci?: any) => {
        const pos = new Float32Array(N * 3),
          col = new Float32Array(N * 3);
        for (let i = 0; i < N; i++) {
          let u: any,
            th = rnd() * Math.PI * 2;
          /* confine to the elevation band the camera can actually reach */
          if (i % 4 === 0) {
            /* loose galactic band */
            u = Math.sin(th * 0.5 + 0.9) * 0.34 + 0.26 + (rnd() - 0.5) * 0.2;
          } else {
            u = -0.09 + rnd() * 0.91;
          }
          u = Math.max(-0.09, Math.min(0.86, u));
          const R = 760,
            s = Math.sqrt(Math.max(0, 1 - u * u));
          pos[i * 3] = Math.cos(th) * s * R;
          pos[i * 3 + 1] = u * R;
          pos[i * 3 + 2] = Math.sin(th) * s * R;
          const w = rnd();
          const c = w > 0.88 ? [1, 0.87, 0.7] : w < 0.13 ? [0.74, 0.84, 1] : [0.97, 0.97, 0.93];
          const b = 0.46 + Math.pow(rnd(), 1.7) * 0.54;
          col[i * 3] = c[0] * b;
          col[i * 3 + 1] = c[1] * b;
          col[i * 3 + 2] = c[2] * b;
        }
        const g = new T.BufferGeometry();
        g.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
        g.setAttribute("color", new T.Float32BufferAttribute(col, 3));
        const m = new T.PointsMaterial({
          size: px,
          map: starTex,
          vertexColors: true,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          fog: false,
          sizeAttenuation: false,
          blending: T.AdditiveBlending,
        });
        const pts = new T.Points(g, m);
        pts.renderOrder = -15;
        pts.frustumCulled = false;
        scene.add(pts);
        starLayers.push(m);
      });
    })();

    /* ------------------------------------------------------------------ *
     *  landscape — adapted from the Terrane hero: a simplex heightfield
     *  coloured by slope and moisture, instanced field stones, and GPU grass.
     * ------------------------------------------------------------------ */
    const NZ = (() => {
      const g3: any = [
        [1, 1],
        [-1, 1],
        [1, -1],
        [-1, -1],
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ];
      const perm = new Uint8Array(512),
        pp = new Uint8Array(256);
      let sd = 1337;
      for (let i = 0; i < 256; i++) pp[i] = i;
      for (let i = 255; i > 0; i--) {
        sd = (sd * 1664525 + 1013904223) & 0xffffffff;
        const j = (sd >>> 16) % (i + 1),
          t = pp[i];
        pp[i] = pp[j];
        pp[j] = t;
      }
      for (let i = 0; i < 512; i++) perm[i] = pp[i & 255];
      const F2 = 0.5 * (Math.sqrt(3) - 1),
        G2 = (3 - Math.sqrt(3)) / 6;
      function sn(xin?: any, yin?: any) {
        const sk = (xin + yin) * F2,
          i = Math.floor(xin + sk),
          j = Math.floor(yin + sk);
        const t = (i + j) * G2,
          x0 = xin - (i - t),
          y0 = yin - (j - t);
        let i1: any, j1: any;
        if (x0 > y0) {
          i1 = 1;
          j1 = 0;
        } else {
          i1 = 0;
          j1 = 1;
        }
        const x1 = x0 - i1 + G2,
          y1 = y0 - j1 + G2,
          x2 = x0 - 1 + 2 * G2,
          y2 = y0 - 1 + 2 * G2;
        const ii = i & 255,
          jj = j & 255;
        let n0 = 0,
          n1 = 0,
          n2 = 0,
          t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 > 0) {
          const g = g3[perm[ii + perm[jj]] & 7];
          t0 *= t0;
          n0 = t0 * t0 * (g[0] * x0 + g[1] * y0);
        }
        let t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 > 0) {
          const g = g3[perm[ii + i1 + perm[jj + j1]] & 7];
          t1 *= t1;
          n1 = t1 * t1 * (g[0] * x1 + g[1] * y1);
        }
        let t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 > 0) {
          const g = g3[perm[ii + 1 + perm[jj + 1]] & 7];
          t2 *= t2;
          n2 = t2 * t2 * (g[0] * x2 + g[1] * y2);
        }
        return 70 * (n0 + n1 + n2);
      }
      function fbm(x?: any, y?: any, o?: any) {
        let s = 0,
          a = 0.5,
          f = 1;
        for (let i = 0; i < o; i++) {
          s += sn(x * f, y * f) * a;
          a *= 0.5;
          f *= 2.02;
        }
        return s;
      }
      function ridged(x?: any, y?: any, o?: any) {
        let s = 0,
          a = 0.5,
          f = 1,
          pv = 1;
        for (let i = 0; i < o; i++) {
          let n = 1 - Math.abs(sn(x * f, y * f));
          n *= n;
          n *= pv;
          pv = n;
          s += n * a;
          a *= 0.5;
          f *= 2.03;
        }
        return s;
      }
      return { sn, fbm, ridged };
    })();
    const sm01 = (t?: any) => {
      t = Math.max(0, Math.min(1, t));
      return t * t * (3 - 2 * t);
    };

    /* height is analytic so the scatter can sample it exactly, with no lookup grid.
       Flat out to the bailey wall, then a swell, then hills that grow with distance */
    const FLAT_R = 104,
      HILL_R = 224;
    function landH(x?: any, z?: any) {
      const r = Math.hypot(x, z),
        s = 0.0042;
      const mid = NZ.fbm(x * s * 3.2 + 4, z * s * 3.2 + 9, 4);
      const fine = NZ.fbm(x * s * 11 + 21, z * s * 11 + 3, 3);
      const soft = sm01((r - 20) / 78) * 2.4 * (mid * 0.62 + fine * 0.38);
      const k = sm01((r - FLAT_R) / (HILL_R - FLAT_R));
      const grow = 0.3 + Math.min(1, r / 620) * 2.35;
      const big = NZ.ridged(x * s + 11, z * s + 7, 5);
      const hill = (big * 20 + mid * 4.6 + fine * 1.2 - 5.6) * k * grow;
      return soft + hill;
    }
    function landN(x?: any, z?: any, e?: any) {
      e = e || 1.2;
      const hx = landH(x + e, z) - landH(x - e, z),
        hz = landH(x, z + e) - landH(x, z - e);
      return [-hx / (2 * e), 1, -hz / (2 * e)];
    }
    const landSlope = (x?: any, z?: any) => {
      const n = landN(x, z);
      const l = Math.hypot(n[0], n[1], n[2]);
      return Math.acos(n[1] / l);
    };

    /* ------------------------------------------------------------------ *
     * 7c.  weather — rain and snow volumes that ride with the camera
     * ------------------------------------------------------------------ */
    function streakSprite() {
      const c = cv(64, 128),
        g = c.getContext("2d");
      const gr = g.createLinearGradient(0, 0, 0, 128);
      gr.addColorStop(0, "rgba(255,255,255,0)");
      gr.addColorStop(0.28, "rgba(255,255,255,.90)");
      gr.addColorStop(0.74, "rgba(255,255,255,.90)");
      gr.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = gr;
      g.fillRect(31, 0, 2.6, 128);
      return c;
    }
    function flakeSprite() {
      const c = cv(64, 64),
        g = c.getContext("2d");
      const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, "rgba(255,255,255,1)");
      gr.addColorStop(0.42, "rgba(255,255,255,.72)");
      gr.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = gr;
      g.fillRect(0, 0, 64, 64);
      return c;
    }
    const WX_W = 17,
      WX_D = 50,
      WX_TOP = 40;
    function makeField(n?: any, tex?: any, size?: any, opacity?: any) {
      const pos = new Float32Array(n * 3),
        dat = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 2 * WX_W;
        pos[i * 3 + 1] = Math.random() * WX_TOP;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 2 * WX_D;
        dat[i * 3] = Math.random();
        dat[i * 3 + 1] = Math.random() * 6.283;
        dat[i * 3 + 2] = 0.6 + Math.random() * 0.8;
      }
      const g = new T.BufferGeometry();
      /* Float32BufferAttribute copies its input, so keep the attribute's own
         array — writing to the source array would never reach the GPU */
      const attr = new T.Float32BufferAttribute(pos, 3);
      attr.setUsage(T.DynamicDrawUsage);
      g.setAttribute("position", attr);
      const m = new T.PointsMaterial({
        map: new T.CanvasTexture(tex),
        size: size,
        transparent: true,
        opacity: opacity,
        depthWrite: false,
        sizeAttenuation: true,
        color: 0xffffff,
      });
      const pts = new T.Points(g, m);
      pts.frustumCulled = false;
      pts.visible = false;
      pts.renderOrder = 6;
      scene.add(pts);
      return { pts, geo: g, pos: attr.array, dat, n };
    }
    /* both pools are sized for their worst case — a full storm and a full
       blizzard — and thinned with a draw range the rest of the time */
    const RAIN = makeField(4400, streakSprite(), 1.9, 0.5);
    const SNOW = makeField(5200, flakeSprite(), 0.4, 0.88);
    let wxTime = 0,
      wxRain = 0,
      rainFall = 1;
    /* blizzard: snow does not fall at one rate forever, it comes in weather.
       One slow cycle of calm, build, blow and ease, offset so a fresh page does
       not open in the middle of a whiteout. */
    let blizK = 0,
      blizT = 0;
    const BLIZ: any = [12, 6, 15, 8]; /* calm, build, blow, ease — seconds */
    const BLIZ_CYC = BLIZ[0] + BLIZ[1] + BLIZ[2] + BLIZ[3];
    const smoothstep = (x?: any) => {
      x = Math.max(0, Math.min(1, x));
      return x * x * (3 - 2 * x);
    };
    function blizzardAt(tt?: any) {
      let u = tt % BLIZ_CYC;
      if (u < 0) u += BLIZ_CYC;
      if (u < BLIZ[0]) return 0;
      u -= BLIZ[0];
      if (u < BLIZ[1]) return smoothstep(u / BLIZ[1]);
      u -= BLIZ[1];
      if (u < BLIZ[2]) return 1;
      return 1 - smoothstep((u - BLIZ[2]) / BLIZ[3]);
    }
    /* snow that has already landed, 0..1 — it banks up while snow falls and
       melts back off once the weather turns */
    let snowPack = 0;
    /* the lens is ~10 deg, so the volume has to sit inside the frustum or the
       drops all fall out of shot — anchor it ahead of the camera and face it */
    function wxAnchor(o?: any) {
      const fx = -Math.sin(curAz),
        fz = -Math.cos(curAz);
      o.position.set(camera.position.x + fx * 46, 0, camera.position.z + fz * 46);
      o.rotation.y = curAz;
    }
    let _lastLook = 0;
    function stepWeather(dt?: any) {
      wxTime += dt;
      const snowing = wxFrom ? wxN("snow") : 0;
      /* the blizzard clock only runs while there is snow to blow about */
      if (snowing > 0.02) {
        blizT += dt;
        blizK = blizzardAt(blizT);
      }
      /* leaving the snow rewinds the clock to the start of the calm, so arriving
         in snow always means still air first and the blizzard blowing up later */
      else {
        blizK = Math.max(0, blizK - dt * 0.6);
        blizT = 0;
      }
      const packT = snowing > 0.5 ? 1 : 0;
      snowPack += (packT - snowPack) * (packT > snowPack ? dt / 24 : dt / 13);
      /* re-lighting is not free, so only redo it when the slow values have
         actually moved — a few times a second rather than every frame */
      const look = blizK * (snowing > 0.02 ? 1 : 0) + snowPack;
      if (Math.abs(look - _lastLook) > 0.006) {
        _lastLook = look;
        refreshLook();
      }
      stepBolt(dt);
      if (RAIN.pts.visible) {
        wxAnchor(RAIN.pts);
        const p = RAIN.pos,
          d = RAIN.dat,
          v = rainFall;
        /* a storm drives the rain over harder, not just faster */
        const slant = 2.4 * v * v;
        for (let i = 0; i < RAIN.n; i++) {
          p[i * 3 + 1] -= (34 + d[i * 3] * 26) * v * dt;
          p[i * 3] -= slant * dt;
          if (p[i * 3 + 1] < -2) {
            p[i * 3 + 1] = WX_TOP;
            p[i * 3] = (Math.random() - 0.5) * 2 * WX_W;
            p[i * 3 + 2] = (Math.random() - 0.5) * 2 * WX_D;
          }
        }
        RAIN.pts.geometry.attributes.position.needsUpdate = true;
      }
      if (SNOW.pts.visible) {
        wxAnchor(SNOW.pts);
        const p = SNOW.pos,
          d = SNOW.dat;
        /* in a blizzard the flakes stop drifting and start travelling */
        const fall = 1 + 1.9 * blizK,
          drift = 1.1 + 7.2 * blizK,
          gust = 1 + 2.4 * blizK;
        for (let i = 0; i < SNOW.n; i++) {
          p[i * 3 + 1] -= (1.5 + d[i * 3] * 2.2) * fall * dt;
          p[i * 3] +=
            (Math.sin(wxTime * 0.7 + d[i * 3 + 1]) * drift - 6.4 * blizK * d[i * 3 + 2]) * dt;
          p[i * 3 + 2] += Math.cos(wxTime * 0.5 + d[i * 3 + 1]) * 0.8 * gust * dt;
          if (p[i * 3 + 1] < -2 || p[i * 3] < -WX_W * 1.6) {
            p[i * 3 + 1] = WX_TOP;
            p[i * 3] = (Math.random() - 0.5) * 2 * WX_W;
            p[i * 3 + 2] = (Math.random() - 0.5) * 2 * WX_D;
          }
        }
        SNOW.pts.geometry.attributes.position.needsUpdate = true;
      }
    }

    /* ---- lightning: a light that is not in the theme, so it can flash over
       whatever the sky happens to be doing without disturbing it ---------- */
    const bolt = new T.DirectionalLight(0xe8eeff, 0);
    bolt.position.set(-46, 72, -30);
    bolt.target.position.set(0, 6, 0);
    scene.add(bolt);
    scene.add(bolt.target);
    let boltK = 0,
      boltNext = 5.5,
      boltAge = 0,
      pulses: any = [];
    function strike() {
      /* one strike is several flashes: the leader, then the return strokes */
      const near = Math.random();
      const s = 0.42 + near * 0.58;
      pulses = [{ t: 0, a: s }];
      const n = 1 + ((Math.random() * 2.6) | 0);
      let tt = 0;
      for (let i = 0; i < n; i++) {
        tt += 0.05 + Math.random() * 0.14;
        pulses.push({ t: tt, a: s * (0.3 + Math.random() * 0.65) });
      }
      boltAge = 0;
      const az = Math.random() * 6.283;
      bolt.position.set(Math.sin(az) * 74, 58 + Math.random() * 34, Math.cos(az) * 74);
      /* and the thunder arrives late, quieter the further off the strike was */
      const delay = 0.32 + (1 - near) * 2.7;
      timers.push(
        setTimeout(() => {
          if (destroyed || !wxFrom || wxN("bolt") < 0.4) return;
        }, delay * 1000),
      );
    }
    function stepBolt(dt?: any) {
      const en = wxFrom ? wxN("bolt") : 0;
      if (en > 0.55) {
        boltNext -= dt;
        if (boltNext <= 0) {
          strike();
          boltNext = 3.4 + Math.random() * 7.8;
        }
      } else if (!pulses.length) {
        boltNext = 2.2 + Math.random() * 4;
      }
      if (pulses.length) {
        boltAge += dt;
        let v = 0;
        for (let i = 0; i < pulses.length; i++) {
          const p = pulses[i];
          if (boltAge >= p.t) v += p.a * Math.exp(-(boltAge - p.t) / 0.085);
        }
        boltK = Math.min(1.4, v);
        if (boltAge > 2.4) {
          pulses.length = 0;
          boltK = 0;
        }
      } else if (boltK > 0.0005) boltK *= Math.max(0, 1 - dt * 7);
      else boltK = 0;
      const k = boltK * en;
      bolt.intensity = k * 3.2 * LEGACY_LIGHT;
      skyMat.color.setScalar(1 + k * 0.8);
      if (flashEl) flashEl.style.opacity = k > 0.002 ? (k * 0.15).toFixed(3) : "0";
    }

    /* ---- terrain mesh: a polar grid so resolution follows the long lens ---- */
    const AN = 900,
      RN = 52,
      R0 = 2.0,
      R1 = 700;
    const terrainMesh = (() => {
      const pos = new Float32Array(AN * RN * 3),
        col = new Float32Array(AN * RN * 3),
        nor = new Float32Array(AN * RN * 3),
        idx: any = [];
      const cGrass = new T.Color(0x5f6d3e),
        cScrub = new T.Color(0x4e5c36),
        cDry = new T.Color(0x938b5c),
        cSoil = new T.Color(0x8b7a5b),
        cSand = new T.Color(0xb0a483),
        cRock = new T.Color(0x6f6a5e),
        cRockD = new T.Color(0x453f38);
      const t1 = new T.Color(),
        t2 = new T.Color();
      const rAt = (k?: any) => R0 * Math.pow(R1 / R0, k / (RN - 1));
      for (let ri = 0; ri < RN; ri++) {
        const r = rAt(ri);
        for (let ai = 0; ai < AN; ai++) {
          const th = (ai / AN) * Math.PI * 2,
            x = Math.cos(th) * r,
            z = Math.sin(th) * r;
          const h = landH(x, z),
            i = ri * AN + ai;
          pos[i * 3] = x;
          pos[i * 3 + 1] = h;
          pos[i * 3 + 2] = z;
          const n = landN(x, z, Math.max(1.0, r * 0.03));
          const l = Math.hypot(n[0], n[1], n[2]);
          nor[i * 3] = n[0] / l;
          nor[i * 3 + 1] = n[1] / l;
          nor[i * 3 + 2] = n[2] / l;
          /* slope drives rock, height drives dryness, the flat ground stays sward */
          const sl = Math.acos(n[1] / l);
          const rocky = sm01((sl - 0.3) / 0.42);
          const dry = sm01((h - 6) / 26);
          const band = Math.sin(h * 0.9) * 0.5 + 0.5;
          const patch = NZ.fbm(x * 0.021 + 3, z * 0.021 + 8, 3) * 0.5 + 0.5;
          t1.copy(cGrass).lerp(cScrub, patch);
          t1.lerp(cDry, Math.max(0, NZ.fbm(x * 0.055, z * 0.055, 2)) * 0.34);
          t1.lerp(cDry, dry * 0.62);
          t1.lerp(cSand, sm01((h - 22) / 24) * 0.6);
          t1.lerp(cSoil, sm01((0.16 - sl) / 0.16) * 0.16);
          t2.copy(cRock).lerp(cRockD, band);
          t1.lerp(t2, rocky * 0.86);
          const shade = 0.88 + 0.12 * band;
          col[i * 3] = t1.r * shade;
          col[i * 3 + 1] = t1.g * shade;
          col[i * 3 + 2] = t1.b * shade;
        }
      }
      for (let ri = 0; ri < RN - 1; ri++)
        for (let ai = 0; ai < AN; ai++) {
          const a0 = ri * AN + ai,
            a1 = ri * AN + ((ai + 1) % AN),
            b0 = a0 + AN,
            b1 = a1 + AN;
          idx.push(a0, b1, b0, a0, a1, b1);
        }
      const g = new T.BufferGeometry();
      g.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
      g.setAttribute("normal", new T.Float32BufferAttribute(nor, 3));
      g.setAttribute("color", new T.Float32BufferAttribute(col, 3));
      g.setIndex(idx);
      const m = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.97, metalness: 0 });
      const mesh = new T.Mesh(g, m);
      mesh.receiveShadow = true;
      scene.add(mesh);
      return mesh;
    })();
    const terrainMat = terrainMesh.material;

    /* ---- field stones ---- */
    const stoneMesh = (() => {
      const geo = new T.IcosahedronGeometry(0.5, 1);
      geo.scale(1, 0.62, 1);
      geo.translate(0, 0.3, 0);
      const mat = new T.MeshStandardMaterial({ roughness: 0.94, metalness: 0, color: 0xffffff });
      const N = 2400,
        im = new T.InstancedMesh(geo, mat, N);
      im.castShadow = true;
      im.receiveShadow = true;
      const m4 = new T.Matrix4(),
        qq = new T.Quaternion(),
        vp = new T.Vector3(),
        vs = new T.Vector3(),
        ax = new T.Vector3(0, 1, 0),
        cc = new T.Color();
      let n = 0,
        guard = 0;
      while (n < N && guard < N * 24) {
        guard++;
        const th = Math.random() * Math.PI * 2;
        const r = 6 + Math.pow(Math.random(), 0.55) * 210;
        const x = Math.cos(th) * r,
          z = Math.sin(th) * r;
        if (landSlope(x, z) > 0.52) continue;
        if (Math.random() > 0.26 + sm01((r - 60) / 190) * 0.5) continue;
        const sc = 0.13 + Math.pow(Math.random(), 1.9) * 0.52;
        vp.set(x, landH(x, z) - 0.06, z);
        qq.setFromAxisAngle(ax, Math.random() * 6.283);
        vs.set(
          sc * (1 + Math.random() * 0.6),
          sc * (0.6 + Math.random() * 0.6),
          sc * (1 + Math.random() * 0.6),
        );
        m4.compose(vp, qq, vs);
        im.setMatrixAt(n, m4);
        cc.setHSL(
          0.09 + Math.random() * 0.07,
          0.07 + Math.random() * 0.11,
          0.34 + Math.random() * 0.2,
        );
        im.setColorAt(n, cc);
        n++;
      }
      im.count = n;
      im.instanceMatrix.needsUpdate = true;
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
      scene.add(im);
      return im;
    })();

    /* ---- standing water and splash rings, for the rain preset ---- */
    const puddleMesh = (() => {
      const g = new T.CircleGeometry(1, 18);
      g.rotateX(-Math.PI / 2);
      const m = new T.MeshStandardMaterial({
        color: 0x2b2f2c,
        roughness: 0.1,
        metalness: 0.34,
        transparent: true,
        opacity: 0,
      });
      const N = 90,
        im = new T.InstancedMesh(g, m, N),
        m4 = new T.Matrix4(),
        vp = new T.Vector3(),
        qq = new T.Quaternion(),
        vs = new T.Vector3();
      let n = 0,
        guard = 0;
      while (n < N && guard < N * 20) {
        guard++;
        const th = Math.random() * Math.PI * 2,
          r = 7 + Math.pow(Math.random(), 0.7) * 74;
        const x = Math.cos(th) * r,
          z = Math.sin(th) * r;
        if (landSlope(x, z) > 0.12) continue;
        const sc = 0.7 + Math.pow(Math.random(), 1.6) * 2.6;
        vp.set(x, landH(x, z) + 0.035, z);
        vs.set(sc * (1 + Math.random() * 0.5), 1, sc * (0.7 + Math.random() * 0.6));
        qq.setFromAxisAngle(new T.Vector3(0, 1, 0), Math.random() * 6.283);
        m4.compose(vp, qq, vs);
        im.setMatrixAt(n, m4);
        n++;
      }
      im.count = n;
      im.instanceMatrix.needsUpdate = true;
      im.visible = false;
      im.receiveShadow = true;
      scene.add(im);
      return im;
    })();
    const SPLASH = (() => {
      const S = 64,
        c = cv(S, S),
        g = c.getContext("2d");
      g.clearRect(0, 0, S, S);
      g.strokeStyle = "rgba(255,255,255,0.95)";
      g.lineWidth = 5;
      g.beginPath();
      g.arc(S / 2, S / 2, S * 0.34, 0, 6.283);
      g.stroke();
      g.strokeStyle = "rgba(255,255,255,0.35)";
      g.lineWidth = 9;
      g.beginPath();
      g.arc(S / 2, S / 2, S * 0.34, 0, 6.283);
      g.stroke();
      const geo = new T.PlaneGeometry(1, 1);
      geo.rotateX(-Math.PI / 2);
      const mat = new T.MeshBasicMaterial({
        map: new T.CanvasTexture(c),
        transparent: true,
        depthWrite: false,
        blending: T.AdditiveBlending,
        color: 0xffffff,
      });
      const N = 150,
        im = new T.InstancedMesh(geo, mat, N);
      im.frustumCulled = false;
      im.visible = false;
      scene.add(im);
      const age = new Float32Array(N),
        life = new Float32Array(N),
        px = new Float32Array(N),
        pz = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        age[i] = Math.random();
        life[i] = 0.42 + Math.random() * 0.34;
      }
      return { im, age, life, px, pz, N, m4: new T.Matrix4(), c: new T.Color() };
    })();
    function stepSplash(dt?: any, amount?: any) {
      if (!SPLASH.im.visible) return;
      const S = SPLASH,
        fx = -Math.sin(curAz),
        fz = -Math.cos(curAz);
      const ax = camera.position.x + fx * 40,
        az2 = camera.position.z + fz * 40;
      for (let i = 0; i < S.N; i++) {
        S.age[i] += dt;
        if (S.age[i] >= S.life[i]) {
          S.age[i] = 0;
          S.life[i] = 0.42 + Math.random() * 0.34;
          const lx = (Math.random() - 0.5) * 44,
            lz = (Math.random() - 0.5) * 90;
          S.px[i] = ax + lx * Math.cos(curAz) + lz * Math.sin(curAz);
          S.pz[i] = az2 - lx * Math.sin(curAz) + lz * Math.cos(curAz);
        }
        const t = S.age[i] / S.life[i],
          sc = 0.16 + t * 1.15;
        S.m4.makeScale(sc, 1, sc);
        S.m4.setPosition(S.px[i], landH(S.px[i], S.pz[i]) + 0.06, S.pz[i]);
        S.im.setMatrixAt(i, S.m4);
        const f = Math.pow(1 - t, 1.9) * amount * 0.42;
        S.c.setRGB(f, f * 1.02, f * 1.05);
        S.im.setColorAt(i, S.c);
      }
      S.im.instanceMatrix.needsUpdate = true;
      if (S.im.instanceColor) S.im.instanceColor.needsUpdate = true;
    }

    /* ---- grass: instanced ribbons shaped entirely in the vertex shader ---- */
    const grassUni: any = {
      uTime: { value: 0 },
      uWind: { value: new T.Vector2(0.84, 0.54) },
      uWindAmp: { value: 0.3 },
      uThickness: { value: 0.042 },
      uRestBend: { value: 0.26 },
      /* the blade colour is mixed in the shader, so settled snow has to reach it
         there — the material colour is multiplied by it and cannot lighten it */
      uSnow: { value: 0 },
    };
    const grassMesh = (() => {
      const BSEG = 5,
        pos: any = [],
        idx: any = [];
      for (let sI = 0; sI < BSEG; sI++) {
        const t = sI / BSEG;
        pos.push(-0.5, t, 0, 0.5, t, 0);
      }
      pos.push(0, 1, 0);
      for (let sI = 0; sI < BSEG - 1; sI++) {
        const a = sI * 2;
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
      idx.push((BSEG - 1) * 2, (BSEG - 1) * 2 + 1, BSEG * 2);
      const bg = new T.BufferGeometry();
      bg.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
      bg.setIndex(idx);

      const mat = new T.MeshLambertMaterial({ color: 0xffffff, side: T.DoubleSide });
      mat.onBeforeCompile = (sh?: any) => {
        Object.assign(sh.uniforms, grassUni);
        sh.vertexShader =
          `
          uniform float uTime,uWindAmp,uThickness,uRestBend;
          uniform vec2 uWind;
          attribute vec4 aParams;
          varying float vT; varying float vTint;
        ` +
          sh.vertexShader
            .replace(
              "#include <beginnormal_vertex>",
              `
            float gT=position.y, gH=aParams.x, gPh=aParams.y, gAng=aParams.z;
            float gCa=cos(gAng), gSa=sin(gAng);
            vT=gT; vTint=aParams.w;
            vec3 gRoot=vec3(instanceMatrix[3][0],instanceMatrix[3][1],instanceMatrix[3][2]);
            float gWave=0.5+0.5*sin(gPh*1.73);
            float gRest=uRestBend*(0.58+gWave*0.42)*pow(gT,1.42)*gH;
            float gRa=gAng+sin(gPh*0.71)*0.52;
            float w1=sin(uTime*1.7+gPh+gRoot.x*0.14+gRoot.z*0.11);
            float w2=sin(uTime*0.4+gRoot.x*0.02+gRoot.z*0.017);
            vec2 gForce=uWind*uWindAmp*(0.55+0.45*w2)*(0.55+0.45*w1);
            float gShape=pow(gT,1.55)*(0.42+gH*0.62);
            vec2 gBend=gForce*gShape+vec2(cos(gRa),sin(gRa))*gRest;
            vec3 objectNormal=normalize(
              vec3(-gSa,0.0,gCa)+vec3(gCa,0.0,gSa)*position.x*2.2
              +vec3(0.0,0.62*gT,0.0)+vec3(gBend.x,0.0,gBend.y)*0.42);
          `,
            )
            .replace(
              "#include <begin_vertex>",
              `
            float gTaper=max(0.02,1.0-gT*0.92);
            vec2 gRib=vec2(position.x*gCa-position.z*gSa,
                           position.x*gSa+position.z*gCa)*uThickness*gTaper;
            vec3 transformed=vec3(gRib.x,gT*gH,gRib.y);
            transformed.xz+=gBend;
            transformed.y-=abs(gRest)*pow(gT,1.7)*(0.24+gWave*0.08);
          `,
            );
        sh.fragmentShader =
          `
          uniform float uSnow;
          varying float vT; varying float vTint;
        ` +
          sh.fragmentShader.replace(
            "#include <color_fragment>",
            `
          #include <color_fragment>
          vec3 gBase=vec3(0.042,0.062,0.030)*(0.74+vTint*0.54);
          vec3 gTip =vec3(0.225,0.290,0.132)*(0.76+vTint*0.56);
          /* snow lies on the tips first and works down, so the base keeps a
             little of the grass showing through even when it is deep */
          gBase=mix(gBase,vec3(0.60,0.65,0.72),uSnow*0.86);
          gTip =mix(gTip ,vec3(0.90,0.94,1.00),uSnow);
          diffuseColor.rgb*=mix(gBase,gTip,pow(vT,0.82))*1.18;
        `,
          );
      };
      mat.customProgramCacheKey = () => "tenshu-grass";

      const N = 104000,
        im = new T.InstancedMesh(bg, mat, N);
      im.frustumCulled = false;
      im.receiveShadow = true;
      const aP = new Float32Array(N * 4),
        m4 = new T.Matrix4();
      let n = 0,
        guard = 0;
      while (n < N && guard < N * 12) {
        guard++;
        const th = Math.random() * Math.PI * 2;
        const r = 3 + Math.pow(Math.random(), 0.55) * 112;
        const x = Math.cos(th) * r,
          z = Math.sin(th) * r;
        if (landSlope(x, z) > 0.6) continue;
        const edge = 1 - sm01((r - 34) / 74);
        if (Math.random() > 0.1 + edge * 0.86) continue;
        m4.makeTranslation(x, landH(x, z) - 0.02, z);
        im.setMatrixAt(n, m4);
        aP[n * 4] = (0.085 + Math.pow(Math.random(), 1.5) * 0.2) * (0.42 + edge * 0.58);
        aP[n * 4 + 1] = Math.random() * 6.283;
        aP[n * 4 + 2] = Math.random() * 6.283;
        aP[n * 4 + 3] = Math.random();
        n++;
      }
      im.count = n;
      im.instanceMatrix.needsUpdate = true;
      bg.setAttribute("aParams", new T.InstancedBufferAttribute(aP, 4));
      scene.add(im);
      return im;
    })();

    function contactShadowTex() {
      const S = 256,
        c = cv(S),
        g = c.getContext("2d");
      const grd = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
      grd.addColorStop(0, "rgba(64,52,34,0.40)");
      grd.addColorStop(0.34, "rgba(64,52,34,0.28)");
      grd.addColorStop(0.62, "rgba(64,52,34,0.09)");
      grd.addColorStop(1, "rgba(64,52,34,0)");
      g.fillStyle = grd;
      g.fillRect(0, 0, S, S);
      return c;
    }
    const shadowTex = new T.CanvasTexture(contactShadowTex());
    const ground = new T.Mesh(
      new T.PlaneGeometry(11.0, 7.0),
      new T.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, 0.012, 0);
    scene.add(ground);

    const capMesh = new T.Mesh(new T.CircleGeometry(1, 4), MAT.core.clone());
    capMesh.material.clippingPlanes = null;
    capMesh.rotation.x = -Math.PI / 2;
    capMesh.rotation.z = 0;
    capMesh.receiveShadow = true;
    scene.add(capMesh);
    let capSegs = 4;

    let scafGroups: any = [];
    function disposeGroup(g?: any) {
      g.traverse((o?: any) => {
        if (o.isMesh) o.geometry.dispose();
      });
      scene.remove(g);
    }
    function buildScaffolds(spec?: any) {
      scafGroups.forEach(disposeGroup);
      scafGroups = spec.map((sp?: any) => {
        const g = buildScaffoldGroup(sp.top, sp.base, sp.w, sp.d, sp.bays);
        g.visible = false;
        scene.add(g);
        return g;
      });
    }

    /* lights — driven by the time-of-day preset */
    const hemi = new T.HemisphereLight(0xfdf8ec, 0xd9cbb0, 0.33);
    scene.add(hemi);
    const amb = new T.AmbientLight(0xfff2df, 0.07);
    scene.add(amb);
    const key = new T.DirectionalLight(0xfff1dc, 1.12);
    key.castShadow = true;
    key.shadow.mapSize.set(3072, 3072);
    key.shadow.camera.near = 8;
    key.shadow.camera.far = 110;
    key.shadow.bias = -0.0009;
    key.shadow.normalBias = 0.024;
    key.target.position.set(0, 4.2, 0);
    scene.add(key);
    scene.add(key.target);
    const fill = new T.DirectionalLight(0xe6e2d6, 0.17);
    fill.position.set(26, 9, 15);
    scene.add(fill);
    const rim = new T.DirectionalLight(0xfff6ea, 0.09);
    rim.position.set(4, 12, -26);
    scene.add(rim);

    /* ------------------------------------------------------------------ *
     * 7b.  time of day
     * ------------------------------------------------------------------ */
    const THEMES: any = [
      {
        id: "MORNING",
        css: {
          paper: "#ecdcbc",
          w0: "#fdf1d6",
          w1: "#f6e5c6",
          w2: "#ebd9b6",
          ink: "#2e2515",
          ink2: "#8b7c5c",
          ink3: "#3f3520",
          accent: "#a8621f",
          line: "#d6c39c",
          rule2: "#c0ac82",
          divider: "rgba(62,44,18,.30)",
          hairline: "rgba(58,40,14,.40)",
          grid: "rgba(96,74,32,.07)",
          "pl-a": "#fdf8e8",
          "pl-b": "#f0e6cc",
          "pl-br": "#ddceac",
          "pl-fg": "#3f3520",
          track: "#dcc9a2",
          fillc: "#96551b",
          btn: "#332a17",
          "btn-fg": "#f6eed8",
        },
        ring: "rgba(96,74,32,.10)",
        stars: 0,
        sky: [0x7ba4d6, 0xa9c3de, 0xd8c9a8, 0xf2d3a2, 0xffd79a, 0xe0b27c],
        fog: 0xf0d6a8,
        fogN: 60,
        fogF: 560,
        ground: 0xf0dcb8,
        grass: 0xfff0d2,
        ridge: [0x9d8f6e, 0xbcab86, 0xdcc79f],
        sun: { az: -0.8, el: 0.235, color: 0xffb245, int: 1.46 },
        hemiC: [0xffe0a2, 0xd6bc82, 0.24],
        ambC: [0xffdca0, 0.06],
        fillC: [0xf6e4bc, 0.14],
        rimC: [0xffd89a, 0.12],
        shadow: 0.42,
        blob: 0.62,
        glow: 0.0,
      },
      {
        id: "NOON",
        css: {
          paper: "#dfe3e2",
          w0: "#f6f8f8",
          w1: "#e9eeef",
          w2: "#dde3e4",
          ink: "#232a2c",
          ink2: "#7f8788",
          ink3: "#333c3e",
          accent: "#9a5a2c",
          line: "#c8cfd0",
          rule2: "#b2babb",
          divider: "rgba(28,40,48,.26)",
          hairline: "rgba(24,34,42,.36)",
          grid: "rgba(40,58,66,.055)",
          "pl-a": "#fbfcfc",
          "pl-b": "#eaeeef",
          "pl-br": "#d3d9da",
          "pl-fg": "#333c3e",
          track: "#ccd3d4",
          fillc: "#8d4f26",
          btn: "#28302f",
          "btn-fg": "#f0f4f4",
        },
        ring: "rgba(40,58,66,.09)",
        stars: 0,
        sky: [0x2f76c8, 0x5f9cdb, 0x95c0e6, 0xbcd8ee, 0xd8e7f0, 0xcdcfc6],
        fog: 0xdde7ec,
        fogN: 60,
        fogF: 560,
        ground: 0xe6e2d6,
        grass: 0xffffff,
        ridge: [0x8a9483, 0xa6b0a2, 0xc6cfc6],
        sun: { az: -0.4, el: 0.8, color: 0xfff4e4, int: 1.06 },
        hemiC: [0xdcecff, 0xcfc6ae, 0.32],
        ambC: [0xeef4ff, 0.06],
        fillC: [0xdce8f4, 0.17],
        rimC: [0xfff6ea, 0.09],
        shadow: 0.4,
        blob: 0.7,
        glow: 0.0,
      },
      {
        id: "SUNSET",
        css: {
          paper: "#e2a468",
          w0: "#ffd7a0",
          w1: "#f3b478",
          w2: "#dd9455",
          ink: "#2c1608",
          ink2: "#8a5730",
          ink3: "#3d2010",
          accent: "#8d2f0c",
          line: "#c98e55",
          rule2: "#b87c46",
          divider: "rgba(70,28,8,.34)",
          hairline: "rgba(66,24,6,.42)",
          grid: "rgba(84,36,8,.09)",
          "pl-a": "#ffe6c4",
          "pl-b": "#f4cb9c",
          "pl-br": "#d29c62",
          "pl-fg": "#3d2010",
          track: "#cf9459",
          fillc: "#8d2f0c",
          btn: "#3a1d0b",
          "btn-fg": "#ffe8cd",
        },
        ring: "rgba(84,36,8,.12)",
        stars: 0.1,
        sky: [0x3c3a72, 0x7e4f74, 0xc96450, 0xff9a3d, 0xffc169, 0xc8722f],
        fog: 0xef9a52,
        fogN: 60,
        fogF: 560,
        ground: 0xd69c66,
        grass: 0xffdcb2,
        ridge: [0x6c4630, 0x9a6540, 0xd08a4e],
        sun: { az: 0.92, el: 0.135, color: 0xff8a34, int: 1.62 },
        hemiC: [0xffb877, 0x6a3a22, 0.3],
        ambC: [0xffb27a, 0.09],
        fillC: [0xd9a074, 0.1],
        rimC: [0xffa050, 0.2],
        shadow: 0.36,
        blob: 0.6,
        glow: 0.3,
      },
      {
        id: "NIGHT",
        css: {
          paper: "#0e1016",
          w0: "#1b2029",
          w1: "#13171f",
          w2: "#0b0d12",
          ink: "#e9e2d2",
          ink2: "#847e72",
          ink3: "#cdc6b6",
          accent: "#d08a4a",
          line: "#2a2d36",
          rule2: "#3f434e",
          divider: "rgba(233,226,210,.24)",
          hairline: "rgba(233,226,210,.20)",
          grid: "rgba(226,224,208,.045)",
          "pl-a": "#1c2028",
          "pl-b": "#14171d",
          "pl-br": "#343943",
          "pl-fg": "#e4ddcd",
          track: "#252932",
          fillc: "#c07437",
          btn: "#e9e2d2",
          "btn-fg": "#0e1016",
        },
        ring: "rgba(226,224,208,.07)",
        stars: 1.0,
        sky: [0x05070e, 0x080d18, 0x0e1728, 0x141f36, 0x1a2740, 0x0b111c],
        fog: 0x131c2e,
        fogN: 60,
        fogF: 560,
        ground: 0x353c4c,
        grass: 0x8ea0c4,
        ridge: [0x141924, 0x1c2230, 0x262d3c],
        sun: { az: 0.5, el: 0.72, color: 0x9fb6de, int: 0.5 },
        hemiC: [0x2e3a54, 0x0d0f14, 0.22],
        ambC: [0x5c6a8c, 0.05],
        fillC: [0x7286ac, 0.07],
        rimC: [0x9fb6d8, 0.06],
        shadow: 0.52,
        blob: 0.42,
        glow: 0.95,
      },
    ];
    const WEATHER: any = [
      {
        id: "CLEAR",
        fogK: 1.0,
        fogC: null,
        fogM: 0,
        sunK: 1.0,
        hemiK: 1.0,
        ambK: 1.0,
        skyC: null,
        skyM: 0,
        groundC: null,
        groundM: 0,
        starK: 1.0,
        rain: 0,
        rainN: 0,
        rainV: 1,
        snow: 0,
        snowN: 0,
        wet: 0,
        dust: 0,
        amb: null,
        ambV: 0,
        bolt: 0,
      },
      {
        id: "RAIN",
        fogK: 0.52,
        fogC: 0x6a7480,
        fogM: 0.55,
        sunK: 0.3,
        hemiK: 1.15,
        ambK: 1.55,
        skyC: 0x717c88,
        skyM: 0.52,
        groundC: 0x59594e,
        groundM: 0.52,
        starK: 0,
        rain: 1,
        rainN: 0.6,
        rainV: 1.0,
        snow: 0,
        snowN: 0,
        wet: 1,
        dust: 0,
        amb: "rain_amb",
        ambV: 0.46,
        bolt: 0,
      },
      /* the storm is the rain pushed past comfort: sun almost gone, fog pulled in
        close, the whole pool of drops in the air and falling harder */
      {
        id: "STORM",
        fogK: 0.38,
        fogC: 0x515a67,
        fogM: 0.72,
        sunK: 0.14,
        hemiK: 1.0,
        ambK: 1.3,
        skyC: 0x4b535f,
        skyM: 0.74,
        groundC: 0x43443e,
        groundM: 0.62,
        starK: 0,
        rain: 1,
        rainN: 1.0,
        rainV: 1.42,
        snow: 0,
        snowN: 0,
        wet: 1,
        dust: 0,
        amb: "storm_amb",
        ambV: 0.66,
        bolt: 1,
      },
      {
        id: "SNOW",
        fogK: 0.58,
        fogC: 0xdfe4ea,
        fogM: 0.6,
        sunK: 0.52,
        hemiK: 1.3,
        ambK: 1.45,
        skyC: 0xc9d2dc,
        skyM: 0.46,
        groundC: 0xf4f8fc,
        groundM: 0.4,
        starK: 0.3,
        rain: 0,
        rainN: 0,
        rainV: 1,
        snow: 1,
        snowN: 0.52,
        wet: 0,
        dust: 1,
        amb: "wind_snow",
        ambV: 0.44,
        bolt: 0,
      },
    ];
    let wxIdx = 0,
      wxMix = 1,
      wxFrom: any = null,
      wxTo: any = null;
    const _wc = new T.Color();
    const wxN = (k?: any) => wxFrom[k] + (wxTo[k] - wxFrom[k]) * wxMix;
    function wxBlend(target?: any, kf?: any, kc?: any) {
      const a = wxFrom[kc] === null ? 0 : wxFrom[kf],
        b = wxTo[kc] === null ? 0 : wxTo[kf];
      const m = a + (b - a) * wxMix;
      if (m <= 0.001) return;
      _wc.setHex(wxTo[kc] !== null ? wxTo[kc] : wxFrom[kc]);
      target.lerp(_wc, m);
    }
    function wxApply() {
      if (!wxFrom) return;
      /* a blizzard is the snow state leaned on hard: it pulls the fog in and
         takes another bite out of the sun on top of whatever the state asked for */
      const bz = blizK * wxN("snow");
      scene.fog.near *= wxN("fogK") * (1 - 0.34 * bz);
      scene.fog.far *= wxN("fogK") * (1 - 0.52 * bz);
      key.intensity *= wxN("sunK") * (1 - 0.45 * bz);
      hemi.intensity *= wxN("hemiK");
      amb.intensity *= wxN("ambK");
      wxBlend(scene.fog.color, "fogM", "fogC");
      wxBlend(terrainMat.color, "groundM", "groundC");
      wxBlend(grassMesh.material.color, "groundM", "groundC");
      wxBlend(stoneMesh.material.color, "groundM", "groundC");
      for (let i = 0; i < 6; i++) wxBlend(CUR.sky[i], "skyM", "skyC");
      paintSky(CUR.sky);
      const stk = wxN("starK");
      starLayers.forEach((m?: any) => {
        m.opacity *= stk;
        m.visible = m.opacity > 0.005;
      });
      const rn = wxN("rain"),
        sn = wxN("snow"),
        wet = wxN("wet"),
        dust = wxN("dust");
      RAIN.pts.visible = rn > 0.01;
      RAIN.pts.material.opacity = 0.5 * rn;
      SNOW.pts.visible = sn > 0.01;
      SNOW.pts.material.opacity = 0.88 * sn;
      /* density is a draw range over one fixed pool, so a storm costs no more
         memory than drizzle — it just stops hiding most of the drops */
      RAIN.geo.setDrawRange(0, Math.round(RAIN.n * Math.min(1, wxN("rainN"))));
      SNOW.geo.setDrawRange(0, Math.round(SNOW.n * Math.min(1, wxN("snowN") + 0.62 * bz)));
      /* in a blizzard the flakes read as streaks rather than dots, so they grow
         and thicken as the wind gets up */
      SNOW.pts.material.size = 0.4 * (1 + 0.6 * bz);
      SNOW.pts.material.opacity = Math.min(1, 0.88 * sn * (1 + 0.18 * bz));
      rainFall = wxN("rainV");
      /* wet ground: darker, and glossy enough to catch the sky */
      terrainMat.roughness = 0.97 - 0.44 * wet;
      terrainMat.metalness = 0.16 * wet;
      puddleMesh.visible = wet > 0.02;
      puddleMesh.material.opacity = 0.72 * wet;
      SPLASH.im.visible = wet > 0.02;
      wxRain = rn;
      /* snow settles on tile and plaster, not on timber or gilt */
      const pk = snowPack;
      grassUni.uSnow.value = pk * sn;
      for (const k in MATBASE) {
        const roof =
          k === "tile" ||
          k === "ridge" ||
          k === "jade" ||
          k === "jadeDim" ||
          k === "claytile" ||
          k === "lead" ||
          k === "vntile" ||
          k === "sandCarve";
        MAT[k].color.copy(MATBASE[k]);
        if (dust > 0.001) MAT[k].color.lerp(SNOWY, dust * (0.4 + 0.6 * pk) * (roof ? 0.8 : 0.42));
      }
      /* and it keeps settling: the ground goes on whitening for as long as the
         snow falls, so arriving in snow and staying in it look different */
      if (pk > 0.002) {
        const g = pk * sn;
        terrainMat.color.lerp(SNOWY, g * 0.8);
        /* the blades are what still read green once the ground has gone white,
           so they take the heaviest hand */
        grassMesh.material.color.lerp(SNOWY, g * 0.55);
        grassUni.uSnow.value = g;
        stoneMesh.material.color.lerp(SNOWY, g * 0.74);
        terrainMat.roughness = Math.min(1, terrainMat.roughness + 0.06 * g);
      }
    }
    function applyWeather(i?: any, instant?: any) {
      wxIdx = ((i % WEATHER.length) + WEATHER.length) % WEATHER.length;
      wxFrom = wxMix >= 1 && wxTo ? wxTo : wxFrom || WEATHER[0];
      wxTo = WEATHER[wxIdx];
      wxMix = instant ? 1 : 0;
      if (themeFrom) applyState(themeFrom, themeTo, themeMix);
    }
    let themeIdx = 0,
      themeMix = 1,
      themeDur = 1.15;
    let themeFrom: any = null,
      themeTo: any = null;
    const CUR: any = {
      sun: new T.Color(),
      hemiS: new T.Color(),
      hemiG: new T.Color(),
      amb: new T.Color(),
      fill: new T.Color(),
      rim: new T.Color(),
      fog: new T.Color(),
      ground: new T.Color(),
      grass: new T.Color(),
      sky: [0, 0, 0, 0, 0, 0].map(() => new T.Color()),
    };
    function themeState(th?: any) {
      return {
        sunAz: th.sun.az,
        sunEl: th.sun.el,
        sunC: new T.Color(th.sun.color),
        sunI: th.sun.int,
        hemiS: new T.Color(th.hemiC[0]),
        hemiG: new T.Color(th.hemiC[1]),
        hemiI: th.hemiC[2],
        ambC: new T.Color(th.ambC[0]),
        ambI: th.ambC[1],
        fillC: new T.Color(th.fillC[0]),
        fillI: th.fillC[1],
        rimC: new T.Color(th.rimC[0]),
        rimI: th.rimC[1],
        fog: new T.Color(th.fog),
        fogN: th.fogN,
        fogF: th.fogF,
        ground: new T.Color(th.ground),
        grass: new T.Color(th.grass || 0xffffff),
        sky: th.sky.map((c?: any) => new T.Color(c)),
        shadow: th.shadow,
        blob: th.blob,
        glow: th.glow,
        stars: th.stars,
      };
    }
    const lerpN = (a?: any, b?: any, t?: any) => a + (b - a) * t;
    function applyState(A?: any, B?: any, t?: any) {
      const az = lerpN(A.sunAz, B.sunAz, t),
        el = lerpN(A.sunEl, B.sunEl, t);
      const D = 52,
        ce = Math.cos(el),
        se = Math.sin(el);
      key.position.set(D * ce * Math.sin(az), 4.2 + D * se, D * ce * Math.cos(az));
      CUR.sun.copy(A.sunC).lerp(B.sunC, t);
      key.color.copy(CUR.sun);
      key.intensity = lerpN(A.sunI, B.sunI, t);
      const ext = 13 + 30 * Math.cos(el),
        c = key.shadow.camera;
      c.left = -15;
      c.right = 15;
      c.top = ext;
      c.bottom = -ext;
      c.updateProjectionMatrix();
      hemi.color.copy(CUR.hemiS.copy(A.hemiS).lerp(B.hemiS, t));
      hemi.groundColor.copy(CUR.hemiG.copy(A.hemiG).lerp(B.hemiG, t));
      hemi.intensity = lerpN(A.hemiI, B.hemiI, t);
      amb.color.copy(CUR.amb.copy(A.ambC).lerp(B.ambC, t));
      amb.intensity = lerpN(A.ambI, B.ambI, t);
      fill.color.copy(CUR.fill.copy(A.fillC).lerp(B.fillC, t));
      fill.intensity = lerpN(A.fillI, B.fillI, t);
      rim.color.copy(CUR.rim.copy(A.rimC).lerp(B.rimC, t));
      rim.intensity = lerpN(A.rimI, B.rimI, t);
      scene.fog.color.copy(CUR.fog.copy(A.fog).lerp(B.fog, t));
      scene.fog.near = lerpN(A.fogN, B.fogN, t);
      scene.fog.far = lerpN(A.fogF, B.fogF, t);
      terrainMat.color.copy(CUR.ground.copy(A.ground).lerp(B.ground, t));
      stoneMesh.material.color.copy(CUR.ground);
      grassMesh.material.color.copy(CUR.grass.copy(A.grass).lerp(B.grass, t));
      for (let i = 0; i < 6; i++) CUR.sky[i].copy(A.sky[i]).lerp(B.sky[i], t);
      paintSky(CUR.sky);
      themeBlob = lerpN(A.blob, B.blob, t);
      const st = lerpN(A.stars, B.stars, t);
      starOn = st;
      starLayers.forEach((m?: any) => {
        m.opacity = st;
        m.visible = st > 0.005;
      });
      const gl = lerpN(A.glow, B.glow, t);
      MAT.dark.emissive.setHex(0xff9a3c);
      MAT.dark.emissiveIntensity = gl;
      MAT.bronze.emissive.setHex(0xffc46a);
      MAT.bronze.emissiveIntensity = gl * 0.28;
      wxApply();
      /* r149 lit in legacy units; three now lights physically, so scale by pi */
      key.intensity *= LEGACY_LIGHT;
      hemi.intensity *= LEGACY_LIGHT;
      amb.intensity *= LEGACY_LIGHT;
      fill.intensity *= LEGACY_LIGHT;
      rim.intensity *= LEGACY_LIGHT;
    }
    function applyTheme(i?: any, instant?: any) {
      const prev = themeTo;
      themeIdx = ((i % THEMES.length) + THEMES.length) % THEMES.length;
      const th = THEMES[themeIdx],
        root = host;
      paintWash(th.css);
      root.setAttribute("data-time", th.id.toLowerCase());
      themeTo = themeState(th);
      if (instant || !prev) {
        themeFrom = themeTo;
        themeMix = 1;
      } else {
        /* freeze the current interpolated look as the new starting point */
        themeFrom = Object.assign({}, themeFrom);
        const t = themeMix,
          A = themeFrom,
          B = prev;
        A.sunAz = lerpN(A.sunAz, B.sunAz, t);
        A.sunEl = lerpN(A.sunEl, B.sunEl, t);
        A.sunC = A.sunC.clone().lerp(B.sunC, t);
        A.sunI = lerpN(A.sunI, B.sunI, t);
        A.hemiS = A.hemiS.clone().lerp(B.hemiS, t);
        A.hemiG = A.hemiG.clone().lerp(B.hemiG, t);
        A.hemiI = lerpN(A.hemiI, B.hemiI, t);
        A.ambC = A.ambC.clone().lerp(B.ambC, t);
        A.ambI = lerpN(A.ambI, B.ambI, t);
        A.fillC = A.fillC.clone().lerp(B.fillC, t);
        A.fillI = lerpN(A.fillI, B.fillI, t);
        A.rimC = A.rimC.clone().lerp(B.rimC, t);
        A.rimI = lerpN(A.rimI, B.rimI, t);
        A.fog = A.fog.clone().lerp(B.fog, t);
        A.fogN = lerpN(A.fogN, B.fogN, t);
        A.fogF = lerpN(A.fogF, B.fogF, t);
        A.ground = A.ground.clone().lerp(B.ground, t);
        A.grass = A.grass.clone().lerp(B.grass, t);
        A.sky = A.sky.map((c?: any, i2?: any) => c.clone().lerp(B.sky[i2], t));
        A.shadow = lerpN(A.shadow, B.shadow, t);
        A.blob = lerpN(A.blob, B.blob, t);
        A.glow = lerpN(A.glow, B.glow, t);
        A.stars = lerpN(A.stars, B.stars, t);
        themeMix = 0;
      }
      themeE = themeMix;
      applyState(themeFrom, themeTo, themeMix);
    }
    function stepShadow() {}
    function stepTheme(dt?: any) {
      let live = false;
      if (themeMix < 1) {
        themeMix = Math.min(1, themeMix + dt / themeDur);
        live = true;
      }
      if (wxMix < 1) {
        wxMix = Math.min(1, wxMix + dt / 1.35);
        live = true;
      }
      if (!live) return;
      const e = themeMix < 0.5 ? 2 * themeMix * themeMix : 1 - Math.pow(-2 * themeMix + 2, 2) / 2;
      themeE = e;
      applyState(themeFrom, themeTo, e);
    }
    /* re-run the current look without advancing any transition — used when a
       slow weather value (blizzard, settled snow) has drifted enough to show */
    let themeE = 1;
    function refreshLook() {
      if (themeFrom) applyState(themeFrom, themeTo, themeE);
    }
    let themeBlob = 0.95,
      starOn = 0;

    /* ------------------------------------------------------------------ *
     * 8.  layout
     * ------------------------------------------------------------------ */
    const DES_W = 1512,
      DES_H = 856,
      BAR_T = 54,
      BAR_B = 63;
    const UNITS_TALL = LANDSCAPE ? 34 : 14.56,
      CAM_H = LANDSCAPE ? 3.4 : 7.065,
      CAM_D = 80;
    /* the widest the tower gets when it is turned corner-on, eaves included —
       on a phone the frame runs out sideways long before it runs out of height */
    const UNITS_WIDE = LANDSCAPE ? 48 : 10.4;
    let mobile = false;
    /* orbit state: drag sets the target, hover adds a little parallax on top */
    let orbAz = 0,
      orbEl = 0,
      hovAz = 0,
      hovEl = 0,
      curAz = 0,
      curEl = 0;
    let zoomT = 1,
      zoom = 1;
    /* the camera orbits at CAM_D, so elevation sets its height: CAM_H + CAM_D*sin(el).
       Floor it well above the ground swell or the terrain is seen from underneath. */
    const CAM_FLOOR = LANDSCAPE ? CAM_H : 3.4;
    const EL_MIN = LANDSCAPE
        ? Math.asin((CAM_FLOOR - CAM_H) / CAM_D)
        : Math.asin((CAM_FLOOR - 7.065) / 80),
      EL_MAX = 0.62;
    let K = 1,
      stageW = 0,
      stageH = 0,
      stageTop = 0,
      canvasW = 0,
      canvasH = 0;
    function layout() {
      const vw = Math.max(1, host.clientWidth),
        vh = Math.max(1, host.clientHeight);
      /* on a phone the CSS takes over the arrangement entirely, so --k stops
         being a scale factor and the bars have to be measured rather than
         computed from the design grid */
      mobile = vw <= 760 || vh <= 460;
      K = mobile ? 1 : Math.max(0.42, Math.min(Math.min(vw / DES_W, vh / DES_H), 2.2));
      /* the presentation hides the page chrome, so the stage is the whole frame */
      stageTop = 0;
      const botH = 0;
      stageH = Math.max(80, vh - stageTop - botH);
      stageW = vw;
      canvasW = vw;
      canvasH = vh;
      cvs.style.top = "0px";
      cvs.style.width = canvasW + "px";
      cvs.style.height = canvasH + "px";
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(canvasW, canvasH, false);
      camera.aspect = canvasW / canvasH;
      placeCamera(1);
    }

    function placeCamera(k?: any) {
      const tAz = orbAz + hovAz;
      const tEl = Math.max(EL_MIN, Math.min(EL_MAX, orbEl + hovEl));
      curAz += (tAz - curAz) * k;
      curEl += (tEl - curEl) * k;
      zoom += (zoomT - zoom) * k;
      const ce = Math.cos(curEl),
        se = Math.sin(curEl);
      camera.position.set(
        CAM_D * ce * Math.sin(curAz),
        CAM_H + CAM_D * se,
        CAM_D * ce * Math.cos(curAz),
      );
      camera.lookAt(0, CAM_H, 0);
      /* fit height into the stage band, but never let a narrow frame slice the
         eaves off — whichever constraint needs the wider lens wins */
      const vNeed = UNITS_TALL * (canvasH / Math.max(1, stageH));
      const hNeed = UNITS_WIDE / Math.max(0.2, camera.aspect);
      camera.fov = (2 * Math.atan(Math.max(vNeed, hNeed) / 2 / CAM_D / zoom) * 180) / Math.PI;
      camera.updateProjectionMatrix();
    }

    /* ------------------------------------------------------------------ *
     * 9.  timeline
     * ------------------------------------------------------------------ */
    const DUR = 4.4;
    const STAGE_T: any = [0.0, 0.21, 1.07, 1.92, 2.79, 3.64, 4.36];
    let STAGES: any = [],
      CAPS: any = [];
    const easeInOut = (x?: any) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
    const easeOut = (x?: any) => 1 - Math.pow(1 - x, 2.6);

    let t = 0,
      playing = true,
      lastStage = -1;

    function stageIndexAt(tt?: any) {
      let i = 0;
      for (let k = 0; k < STAGES.length; k++) if (tt >= STAGES[k].t) i = k;
      return i;
    }
    function buildHeightAt(tt?: any) {
      const i = stageIndexAt(tt);
      if (i === 0) return 0;
      const s = STAGES[i],
        prev = STAGES[i - 1],
        next = STAGES[i + 1];
      const span = (next ? next.t : DUR) - s.t;
      const f = span > 0 ? Math.min(1, (tt - s.t) / (span * 0.93)) : 1;
      return prev.to + (s.to - prev.to) * easeInOut(f);
    }
    /* half-diagonal of the solid mass at a given height, for the cut cap */
    function capPlan(segs?: any) {
      if (segs === capSegs) return;
      capSegs = segs;
      capMesh.geometry.dispose();
      capMesh.geometry = new T.CircleGeometry(1, segs);
    }
    function capAt(y?: any) {
      for (const c of CAPS)
        if (y >= c[0] && y <= c[1]) {
          capPlan(c[3] || 4);
          return c[2] === null ? ishiR(y) : c[2];
        }
      return 0;
    }
    function applyStyle(i?: any) {
      styleIdx = ((i % STYLES.length) + STYLES.length) % STYLES.length;
      const st = STYLES[styleIdx];
      if (modelGroup) disposeGroup(modelGroup);
      modelGroup = st.build();
      scene.add(modelGroup);
      CAPS = st.caps;
      STAGES = st.stages.map((x?: any, k?: any) => ({
        t: STAGE_T[k],
        cn: x[0],
        en: x[1],
        to: x[2],
      }));
      buildScaffolds(st.scaf);
      host.setAttribute("data-style", st.id.toLowerCase());
      lastStage = -1;
      playing = true;
      applyTime(0);
    }

    function applyTime(tt?: any) {
      t = tt;
      const h = buildHeightAt(tt);
      CLIP.constant = h;

      const a = capAt(h);
      if (a > 0.01 && h > 0.03 && h < 13.9) {
        capMesh.visible = true;
        capMesh.scale.set(a, a, 1);
        capMesh.position.y = h - 0.003;
      } else capMesh.visible = false;

      ground.material.opacity = Math.min(1, h / 1.4) * themeBlob;
      ground.visible = h > 0.02;

      const si = stageIndexAt(tt);
      for (let k = 0; k < scafGroups.length; k++) {
        const stg = STAGES[k + 1],
          g = scafGroups[k];
        const on = si === k + 1;
        g.visible = on;
        if (!on) continue;
        const nx = STAGES[k + 2] ? STAGES[k + 2].t : DUR;
        const local = (tt - stg.t) / (nx - stg.t);
        const grow = Math.min(1, local / 0.17);
        const out = local > 0.9 ? 1 - (local - 0.9) / 0.1 : 1;
        g.children.forEach((m?: any, idx?: any) => {
          const d = ((idx % 9) / 9) * 0.3;
          const gg = Math.max(0, Math.min(1, (grow - d) / (1 - d))) * Math.max(0, out);
          m.visible = gg > 0.02;
          if (!m.visible) return;
          const s2 = easeOut(gg);
          if (m.userData.kind === "v") {
            m.scale.set(1, s2, 1);
          } else {
            m.scale.set(s2, 1, 1);
          }
        });
      }

      if (si !== lastStage) {
        lastStage = si;
      }
    }

    /* ------------------------------------------------------------------ *
     * 11.  controls
     * ------------------------------------------------------------------ */
    const listeners: any = [];
    function on(el?: any, ev?: any, fn0?: any, opt?: any) {
      const fn = (e?: any) => legacy(() => fn0(e));
      el.addEventListener(ev, fn, opt);
      listeners.push(() => el.removeEventListener(ev, fn, opt));
    }
    function restart() {
      lastStage = -1;
      playing = true;
      applyTime(0);
    }

    /* drag to orbit, hover for parallax, two fingers to zoom */
    const ZMIN = 0.5,
      ZMAX = 2.0;
    let dragging = false,
      lastX = 0,
      lastY = 0;
    const ptrs = new Map();
    let pinchD = 0,
      pinchZ = 1,
      lastTap = 0;
    function setDragging(v?: any) {
      cvs.style.cursor = v ? "grabbing" : "grab";
    }
    function pinchDist() {
      const a: any = [...ptrs.values()];
      return Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
    }
    on(cvs, "pointerdown", (e?: any) => {
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      try {
        cvs.setPointerCapture(e.pointerId);
      } catch (_: any) {}
      if (ptrs.size === 2) {
        dragging = false;
        pinchD = pinchDist();
        pinchZ = zoomT;
        setDragging(false);
        return;
      }
      if (ptrs.size === 1) {
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        setDragging(true);
        /* touch has no hover, so a tap-tap has to stand in for a double click */
        if (e.pointerType !== "mouse") {
          const now = e.timeStamp || performance.now();
          if (now - lastTap < 330) {
            orbAz = 0;
            orbEl = 0;
            zoomT = 1;
          }
          lastTap = now;
        }
      }
      wake();
    });
    on(cvs, "pointermove", (e?: any) => {
      if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size >= 2) {
        const d = pinchDist();
        if (pinchD > 8) zoomT = Math.max(ZMIN, Math.min(ZMAX, pinchZ * (d / pinchD)));
        wake();
        return;
      }
      const r = cvs.getBoundingClientRect();
      if (dragging) {
        orbAz -= (e.clientX - lastX) * 0.0062;
        orbEl -= (e.clientY - lastY) * 0.0042;
        orbEl = Math.max(EL_MIN, Math.min(EL_MAX, orbEl));
        lastX = e.clientX;
        lastY = e.clientY;
      } else if (e.pointerType === "mouse") {
        hovAz = ((e.clientX - r.left) / r.width - 0.5) * 0.2;
        hovEl = -((e.clientY - r.top) / r.height - 0.5) * 0.09;
      }
      wake();
    });
    function endDrag(e?: any) {
      if (e && ptrs.has(e.pointerId)) ptrs.delete(e.pointerId);
      if (ptrs.size < 2) pinchD = 0;
      if (ptrs.size === 0) {
        dragging = false;
        setDragging(false);
      } else if (ptrs.size === 1) {
        /* one finger lifted out of a pinch — carry on orbiting from the other */
        const a = [...ptrs.values()][0];
        lastX = a.x;
        lastY = a.y;
        dragging = true;
        setDragging(true);
      }
    }
    on(cvs, "pointerup", endDrag);
    on(cvs, "pointercancel", endDrag);
    on(cvs, "pointerleave", (e?: any) => {
      if (e.pointerType === "mouse") {
        hovAz = 0;
        hovEl = 0;
        wake();
      }
    });
    on(cvs, "dblclick", () => {
      orbAz = 0;
      orbEl = 0;
      zoomT = 1;
      wake();
    });
    on(
      cvs,
      "wheel",
      (e?: any) => {
        e.preventDefault();
        const d = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
        zoomT = Math.max(ZMIN, Math.min(ZMAX, zoomT * Math.exp(-d * 0.0016)));
        wake();
      },
      { passive: false },
    );
    /* the page-level shortcuts, scoped to the focused scene */
    on(host, "keydown", (e?: any) => {
      if (e.code === "Space" && !LANDSCAPE) {
        e.preventDefault();
        playing = !playing;
      } else if (e.code === "KeyR" && !LANDSCAPE) {
        restart();
      } else if (e.code === "KeyT") {
        applyTheme(themeIdx + 1);
      } else if (e.code === "KeyS" && !LANDSCAPE) {
        applyStyle(styleIdx + 1);
      } else if (e.code === "KeyW") {
        applyWeather(wxIdx + 1);
      } else if (e.code === "KeyC") {
        orbAz = 0;
        orbEl = 0;
        zoomT = 1;
      } else return;
      wake();
    });

    /* ------------------------------------------------------------------ *
     * 12.  loop
     * ------------------------------------------------------------------ */
    const LANDSCAPE_TIME_INDEX: any = { morning: 0, sunrise: 0, noon: 1, sunset: 2, night: 3 };
    const LANDSCAPE_WEATHER_INDEX: any = { clear: 0, rain: 1, storm: 2, snow: 3 };
    if (LANDSCAPE) {
      const landscapeStyle = STYLES[0];
      CAPS = [];
      STAGES = landscapeStyle.stages.map((x?: any, k?: any) => ({
        t: STAGE_T[k],
        cn: x[0],
        en: x[1],
        to: x[2],
      }));
      scafGroups = [];
      playing = false;
      applyTime(DUR);
      ground.visible = false;
      capMesh.visible = false;
      applyWeather(LANDSCAPE_WEATHER_INDEX[opts.weather] ?? 0, true);
      applyTheme(LANDSCAPE_TIME_INDEX[opts.time] ?? 0, true);
      if (opts.weather === "snow") {
        snowPack = 0.72;
        refreshLook();
      }
    } else {
      const COUNTRY_STYLES: any = {
        japan: "JAPAN",
        china: "CHINA",
        vietnam: "VIETNAM",
        thailand: "THAI",
        cambodia: "CAMBODIA",
        turkey: "TURKEY",
      };
      const requestedStyle = COUNTRY_STYLES[opts.country] || COUNTRY_STYLES.japan;
      const requestedStyleIndex = STYLES.findIndex((style?: any) => style.id === requestedStyle);
      applyStyle(requestedStyleIndex < 0 ? 0 : requestedStyleIndex);
      applyWeather(0, true);
      applyTheme(0, true);
    }
    layout();
    applyTime(0);
    if (STILL) {
      /* reduced motion: the finished state, held */
      playing = false;
      if (!LANDSCAPE) applyTime(DUR);
    }

    let prev = performance.now(),
      raf = 0,
      visible = true,
      running = false;
    function renderOnce() {
      placeCamera(1);
      renderer.render(scene, camera);
    }
    function frame(now?: any) {
      legacy(() => frameBody(now));
    }
    function frameBody(now?: any) {
      raf = 0;
      if (destroyed || !running) return;
      const dt = Math.max(0, Math.min(0.05, (now - prev) / 1000));
      prev = now;
      if (playing) {
        let nt = t + dt;
        if (nt >= DUR) {
          nt = DUR;
          playing = false;
        }
        applyTime(nt);
      }
      stepTheme(dt);
      stepWeather(dt);
      stepSplash(dt, wxRain);
      grassUni.uTime.value = now * 0.001;
      placeCamera(1 - Math.pow(0.0012, dt));
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }
    function sync() {
      const want = !destroyed && !STILL && visible && !document.hidden;
      if (want && !running) {
        running = true;
        prev = performance.now();
        raf = requestAnimationFrame(frame);
      } else if (!want && running) {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      }
    }
    /* with motion reduced the scene still answers the pointer, one frame at a time */
    function wake() {
      if (STILL && !destroyed) renderOnce();
    }
    const io = new IntersectionObserver((es?: any) => {
      visible = es[0].isIntersecting;
      sync();
    });
    io.observe(host);
    const ro = new ResizeObserver(() => {
      layout();
      if (STILL) renderOnce();
    });
    ro.observe(host);
    on(document, "visibilitychange", sync);
    renderOnce();
    sync();

    return function dispose() {
      destroyed = true;
      running = false;
      if (raf) cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      listeners.forEach((f?: any) => f());
      io.disconnect();
      ro.disconnect();
      scene.traverse((o?: any) => {
        if (o.geometry) o.geometry.dispose();
        const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
        ms.forEach((m?: any) => {
          for (const k in m) {
            const v = m[k];
            if (v && v.isTexture) v.dispose();
          }
          m.dispose();
        });
      });
      for (const k in MAT) {
        const m = MAT[k];
        for (const p in m) {
          const v = m[p];
          if (v && v.isTexture) v.dispose();
        }
        m.dispose();
      }
      renderer.dispose();
    };
  });
}

export function TowerLandscape({ variant = "japan", textures, className }: TowerLandscapeProps) {
  const prefersReducedMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const washRef = useRef<HTMLDivElement>(null);
  const textureKey = JSON.stringify(textures ?? {});

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    return mountScene(host, canvas, flashRef.current, washRef.current, {
      mode: "tower",
      country: variant,
      textures: JSON.parse(textureKey),
      still: !!prefersReducedMotion,
    });
  }, [variant, textureKey, prefersReducedMotion]);

  return (
    <div
      ref={hostRef}
      tabIndex={0}
      role="img"
      aria-label={`${TOWER_LABELS[variant] ?? TOWER_LABELS.japan} in a procedural landscape`}
      className={cn("absolute inset-0 overflow-hidden outline-none", className)}
    >
      <div
        ref={washRef}
        className="absolute inset-0"
        style={{ transition: "background .55s ease" }}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full cursor-grab touch-none"
      />
      <div
        ref={flashRef}
        className="pointer-events-none absolute inset-0 opacity-0 mix-blend-screen"
        style={{ background: "#dce6ff" }}
      />
    </div>
  );
}
