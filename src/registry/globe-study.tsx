"use client";
// Ported from ThreeUI Community's Globe Study (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlobeStudyProps {
  mode?: "dark" | "light";
  scale?: number;
  opacity?: number;
  hue?: number;
  saturation?: number;
  brightness?: number;
  text?: string;
  inkColor?: string;
  backgroundColor?: string;
  className?: string;
}

const FACE = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';
/* on black the eye needs far less ink, so every alpha runs through SOFT first */
const SOFT = 0.88;
/* Snapping every angle to one of 64 steps keeps the glyph raster cache warm. */
const QA = (Math.PI * 2) / 64;
function qang(a: number) {
  return Math.round(a / QA) * QA;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

interface Surface {
  w: number;
  h: number;
  dpr: number;
  /* panels are not square, so scale off the short side */
  u: number;
}

interface StudyEnv {
  cv: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  s: Surface;
  ink: (a: number) => string;
  local: (e: PointerEvent) => { x: number; y: number };
  signal: AbortSignal;
}

const LAND_B64 =
  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPcBAOD/HwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACA//+P//f/LwgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4/v/4/////wcAAAAEAPABAAAAfAAAAAAAAAAAAAAAAAAAAADg9w/4/////wEAAP4AAAAAAAAA+AAAAAAAAAAAAAAAAAAAAIAG+Of//////wAAAHwGAAAAAAAAAAMAAAAAAAAAAAAAAACABwAc/4P//////wAAADAAAAAAQAAAAD4AAAAAAAAAAAAAAAAAfMbDcQAA/v///wAAAAAAAADABwAA//8HAMAPAAAAAAAAAABgAAAAAAAA/P///wAAAAAAAABwAADg//8AAAAAAAAAAAAAAADwG457dwcA8P//HwAAAAAAAAAYAAD///9/eAAAAAAAAAAAAAD4/g0H/w8A8P//PwAAAAAAAAAOgOv/////fwD/AAAAAAA/AAAA/B84/v8A8P//LwAAAAD4AAAA4PP//////////wAAAOD///H/+D/3cPgDoP//DwAAAID/BwAAx/v/////////P4AA/P///////////////////////w8AAOcBAAgAAAAAAAAAAAAAgP///////////////////////wcAACYAAAQAAAAAAAAAAAAAgf///////////////////////wMM8AAAAAAAAAAAAAAAAAAAIID/////////e+wPwH8AgA8AAP/5z/////////////////8/ANH///////9/AIALgD8AAAAAwH/+//////////////////9/APj///////8fADwAAD8AAAAA8D/+//////////////////sPAPC/+f////8fAPwAADgAAAAA8D/+////////////////D/wBAMCfAP////8PAPwYAAAAAAAA8H/4//////////////9/DgcAAAAcAOD///8/APw/AAAAAAAQAB7w//////////////8BgAMAAAACAMD/////Afh/AAAAAAA4gBz+/////////////38A4AMAAMAAAMD/////B/z/AAAAAABwwAb+/////////////x8A8AEAAAAAAAD/////P///AwAAAADmgOH//////////////z8A4AAAAAAAAAD+////P/7/BwAAAAD28P////////////////8D4AAAAAAAAAD8////f/7/BwAAAADz+f////////////////8HIAAAAAAAAAD6////////BAAAAABw/v////////////////8EAAAAAAAAAADo//////8jHgAAAACA//////////////////8MAAAAAAAAAADQ//////8OPgAAAADw//////////////////8AAAAAAAAAAADg//////+PIAAAAADA////v////////////38EAAAAAAAAAADg////////AAAAAACA//v/zD/8/////////z8AAAAAAAAAAADg//////8bAAAAAACA//N/gD///////////x8GAAAAAAAAAADw//////8AAAAAAAD+B8c/AD/+/////////wcPAAAAAAAAAADg//////8AAAAAAAD+gx4/DH74/////////wABAAAAAAAAAADg/////x8AAAAAAAD+gbCn///8////////fQABAAAAAAAAAADg/////w8AAAAAAAD/gCDn///4//////9/MgADAAAAAAAAAADA/////w8AAAAAAAD+AADm/3/4//////8/cIABAAAAAAAAAADA/////wcAAAAAAAA44AHC///5////////4+ABAAAAAAAAAACA/////wcAAAAAAACI/wEA4P//////////4OgAAAAAAAAAAAAA/////wMAAAAAAAD4/wAA4P//////////ADYAAAAAAAAAAAAA/P///wEAAAAAAAD+/wEA8P//////////AQcAAAAAAAAAAAAA+P//fwAAAAAAAAD//w8P8P//////////AQEAAAAAAAAAAAAAyP//fwAAAAAAAAD//3//////////////AQAAAAAAAAAAAAAA0P+PYQAAAAAAAAD//////z//////////AwAAAAAAAAAAAAAAoP8HwAAAAAAAAMD/////83/+////////AQAAAAAAAAAAAAAAIP8DwAAAAAAAAOD/////5//I////////AAAAAAAAAAAAAAAAQP4DgAAAAAAAAPD/////z/+A////////AAAAAAAAAAAAAAAAAPwDAAIAAAAAAPD/////z/8ZwP////9/AQAAAAAAAAAAAAAAAPgDQAAAAAAAAPj/////j/9/gP////8fAQAAAAAAAAAAAAAAAPADEAMAAAAAAPz/////v///AP9//P8DAAAAAAAAAAAAAAAAAPADAwwAAAAAAPj/////P/9/APw//B8AAAAAAAAAAAAIAAAAAPCHA8AAAAAAAPj/////P/4/APwP+J8BAAAAAAAAAAAAAAAAAMD/A0YEAAAAAPj/////f/4fAPwH+B8AAwAAAAAAAAAAAAAAAAD/AQAAAAAAAPj/////f/wHAPgD8D8AAwAAAAAAAAAAAAAAAADgHwAAAAAAAPj///////wDAPgAwH8AAQAAAAAAAAAAAAAAAADAHwAAAAAAAPz//////30AAPAAwH8AAAAAAAAAAAAAAAAAAAAAHAAAAAAAAPj//////wsAAPAAgH4AAQAAAAAAAAAAAAAAAAAAGEAAAAAAAPj//////wMBAPAAgHwAAAAAAAAAAAAAAAAAAAAAGPAhAAAAAPD///////cBAOAAgDiABAAAAAAAAAAAAAAAAAAAIPl/AAAAAOD///////8AAGABABBAFAAAAAAAAAAAAAAAAAAAgP7/AQAAAMD///////8AAAABgAAAHAAAAAAAAAAAAAAAAAAAAPz/AQAAAID///////8AAAABAAEgCAAAAAAAAAAAAAAAAAAAAPz/HwAAAAD/8P///38AAAAAAANgAAAAAAAAAAAAAAAAAAAAAPz/fwAAAAAAoP///z8AAAAAYAd4AAAAAAAAAAAAAAAAAAAAAPz/fwAAAAAAAP///x8AAAAAwAY8AAAAAAAAAAAAAAAAAAAAAP7//wAAAAAAAP///w8AAAAAgAc+AAAAAAAAAAAAAAAAAAAAAP///wAAAAAAAP///wcAAAAAgIM/TwAAAAAAAAAAAAAAAAAAAP///wEAAAAAgP///wMAAAAAAIc/QAQAAAAAAAAAAAAAAAAAgP///w8AAAAAgP///wEAAAAAAA6fAUQAAAAAAAAAAAAAAAAAAP////8AAAAAAP///wAAAAAAAB6ewuwDAgAAAAAAAAAAAAAAgP////8DAAAAAP7//wAAAAAAABwAAvAPAgAAAAAAAAAAAAAAgP////8PAAAAAPz/fwAAAAAAABAAAMCfAQAAAAAAAAAAAAAAAP////8PAAAAAPz//wAAAAAAAOADAIA/MAAAAAAAAAAAAAAAAP7///8PAAAAAPz/fwAAAAAAAAAPAMBngAAAAAAAAAAAAAAAAP7///8PAAAAAPz//wAAAAAAAAAACABAAAAAAAAAAAAAAAAAAPz///8HAAAAAPj//wAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAPz///8DAAAAAPj//wAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAPj///8BAAAAAPz//4AAAAAAAAAAAB8GAAAAAAAAAAAAAAAAAPj///8BAAAAAPz//8EAAAAAAAAAIB8OAAAAAAAAAAAAAAAAAPD///8BAAAAAP7//+AAAAAAAAAA+B8OACAAAAAAAAAAAAAAAMD///8BAAAAAP7/f/gAAAAAAAAA/H8eAAAAAAAAAAAAAAAAAID///8AAAAAAP7/H/gAAAAAAAAA/P8fAABAAAAAAAAAAAAAAAD///8AAAAAAPz/D3AAAAAAAAAA/v8/AAAAAAAAAAAAAAAAAAD///8AAAAAAPj/D3gAAAAAAADA//9/AAgAAAAAAAAAAAAAAAD//38AAAAAAPj/DzgAAAAAAADw////AAAAAAAAAAAAAAAAAAD//x8AAAAAAPD/DzgAAAAAAAD4////AQAAAAAAAAAAAAAAAAD//wMAAAAAAPD/DzgAAAAAAAD4////AwAAAAAAAAAAAAAAAID//wEAAAAAAPD/AwAAAAAAAAD4////AwAAAAAAAAAAAAAAAID//wEAAAAAAPD/AwAAAAAAAAD4////BwAAAAAAAAAAAAAAAID//wEAAAAAAOD/AwAAAAAAAAD4////BwAAAAAAAAAAAAAAAID//wAAAAAAAOD/AQAAAAAAAADw////BwAAAAAAAAAAAAAAAID//wAAAAAAAMD/AAAAAAAAAADw////AwAAAAAAAAAAAAAAAID/fwAAAAAAAIB/AAAAAAAAAADgf/z/AwAAAAAAAAAAAAAAAID/PwAAAAAAAIA/AAAAAAAAAADgB/D/AQAAAAAAAAAAAAAAAMD/HQAAAAAAAIABAAAAAAAAAADwAND/AQAAAAAAAAAAAAAAAMD/AwAAAAAAAAAAAAAAAAAAAAAAAID/AAAIAAAAAAAAAAAAAMD/BwAAAAAAAAAAAAAAAAAAAAAAAAD/AAAQAAAAAAAAAAAAAOD/AwAAAAAAAAAAAAAAAAAAAAAAAAA+AABwAAAAAAAAAAAAAOA/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4AAAAAAAAAAAAAOA/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAOAPAAAAAAAAAAAAAAAAAAAAAAAAAABwAAAGAAAAAAAAAAAAAMAPAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAADAAAAAAAAAAAAAPAPAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMABAAAAAAAAAAAAAPADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOABAAAAAAAAAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPADAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAPABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPCBAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAcAAAAAAAAAAAAAAA+AABAAJ8//j8PAAAAAAAAAAAAAAAAAAAMAAAAAAAAAAAAAPD/fwD///////8/AAAAAAAAAAAAAAAAAIA+AAAAAAAAAAAAPP///8D/////////HwAAAAAAAAAAAAAAAIA9AAAAAAAA8Pz/////P/j//////////wMAAAAAAAAAAMAAAPB9AAAAAID/////////P/7///////////8BAAAAAAAAAOABAwB/AAAAAPD///////////////////////8AAAAAAFACPoD///9/AAAAAPD//////////////////////x8AAAAA+P////////8HAAAAAP///////////////////////wcAAAAA/v///////wMAAAAA/v///////////////////////wcAAAD8/////////w8AAA7w/////////////////////////w8AAMAB/////////wMAgB84/////////////////////////wEAAAAA/P///////3/w4AcA/////////////////////////wAAAADg//////////8/gM///////////////////////////wMAAADg/////////////f///////////////////////////z8A7wMA/v////////////////////////////////////////8/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

const MW = 288;
const MH = 144;
let landBits: Uint8Array | null = null;
function isLand(lon: number, lat: number) {
  if (!landBits) {
    const bin = atob(LAND_B64);
    landBits = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) landBits[i] = bin.charCodeAt(i);
  }
  const gx = Math.floor(((lon + 180) / 360) * MW);
  const gy = Math.floor(((90 - lat) / 180) * MH);
  if (gx < 0 || gx >= MW || gy < 0 || gy >= MH) return false;
  const b = gy * MW + gx;
  return ((landBits[b >> 3] >> (b & 7)) & 1) === 1;
}

interface GlobeNode {
  lat: number;
  lon: number;
  land: boolean;
  c: string;
}

function createGlobe({ cv, ctx, s, ink, local, signal }: StudyEnv, PHRASE: string) {
  const nodes: GlobeNode[] = [];
  /* the halftone grid is fine enough to draw a coastline; every other land cell
     also carries a letter, which is as dense as type can get and stay readable */
  const LAT_STEP = 3.05;
  let k = 0;
  let run = 0;
  let sea3 = 0;
  for (let lat = -86; lat <= 86; lat += LAT_STEP) {
    const rl = Math.cos((lat * Math.PI) / 180);
    const n = Math.max(1, Math.round(98 * rl));
    for (let i = 0; i < n; i++) {
      const lon = -180 + (360 * i) / n;
      const l = isLand(lon, lat);
      if (!l && sea3++ % 2) continue; // half the ocean carries the whole sphere
      let letter = "";
      if (l && run++ % 2 === 0) letter = PHRASE.charAt(k++ % PHRASE.length);
      nodes.push({
        lat: (lat * Math.PI) / 180,
        lon: (lon * Math.PI) / 180,
        land: l,
        c: letter,
      });
    }
  }

  let spin = 2.1;
  let vel = 0.16;
  let hover = false;
  let drag: { x: number; y: number; moved: boolean } | null = null;
  let tilt = -0.36;
  let vtilt = 0;
  const land8: (number | string)[][] = [];
  let zoom = 1;
  let zoomT = 1;
  const pins: { lat: number; lon: number; t: number }[] = [];
  let look: { x: number; y: number } | null = null;
  const sea: number[] = [];
  const soil: number[] = [];

  /* screen point -> the lat/lon it is sitting on, or null if it missed the globe */
  const view = { cx: 0, cy: 0, R: 1, cs: 1, sn: 0, ct: 1, st: 0 };
  function unproject(px: number, py: number) {
    const x1 = (px - view.cx) / view.R;
    const y2 = (view.cy - py) / view.R;
    const q = 1 - x1 * x1 - y2 * y2;
    if (q <= 0.002) return null;
    const z2 = Math.sqrt(q);
    const y0 = y2 * view.ct + z2 * view.st;
    const z1 = -y2 * view.st + z2 * view.ct;
    const x0 = x1 * view.cs + z1 * view.sn;
    const z0 = -x1 * view.sn + z1 * view.cs;
    return {
      lat: Math.asin(Math.max(-1, Math.min(1, y0))),
      lon: Math.atan2(z0, x0),
    };
  }

  const opts = { signal };
  cv.addEventListener("pointerenter", () => (hover = true), opts);
  cv.addEventListener("pointerleave", () => (hover = false), opts);
  cv.addEventListener(
    "pointerdown",
    (e) => {
      drag = { ...local(e), moved: false };
      cv.setPointerCapture(e.pointerId);
    },
    opts,
  );
  cv.addEventListener(
    "pointermove",
    (e) => {
      const p = local(e);
      look = p;
      if (!drag) return;
      vel = ((p.x - drag.x) / s.u) * 9;
      vtilt = (-(p.y - drag.y) / s.u) * 6;
      tilt = Math.max(-1.15, Math.min(1.15, tilt + vtilt * 0.016));
      drag = { ...p, moved: true };
    },
    opts,
  );
  cv.addEventListener(
    "pointerup",
    () => {
      if (drag && !drag.moved) {
        // a click that never became a drag drops a pin
        const g = unproject(drag.x, drag.y);
        if (g) {
          pins.push({ lat: g.lat, lon: g.lon, t: performance.now() });
          if (pins.length > 7) pins.shift();
        }
      }
      drag = null;
    },
    opts,
  );
  cv.addEventListener("pointercancel", () => (drag = null), opts);
  cv.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      zoomT = Math.max(0.85, Math.min(2.6, zoomT * Math.exp(-e.deltaY * 0.0016)));
    },
    { signal, passive: false },
  );

  function draw(now: number, dt: number) {
    ctx.clearRect(0, 0, s.w, s.h);

    zoom += (zoomT - zoom) * Math.min(1, dt / 180);
    if (!drag) {
      const idle = hover ? 0.045 : 0.16; // slow down under the hand so it can be aimed
      vel += (idle - vel) * Math.min(1, dt / 900); // coast back to the idle drift
      vtilt *= Math.pow(0.9, dt / 16);
      tilt += (vtilt * dt) / 1000;
      tilt += (-0.36 - tilt) * Math.min(1, dt / 4000);
    }
    spin += (vel * dt) / 1000;

    const cx = s.w / 2;
    const cy = s.h / 2 + s.u * 0.035;
    const R = s.u * 0.318 * zoom;
    const fs = s.u * 0.0275 * Math.pow(zoom, 0.72);
    const cs = Math.cos(spin);
    const sn = Math.sin(spin);
    const ct = Math.cos(tilt);
    const st = Math.sin(tilt);
    view.cx = cx;
    view.cy = cy;
    view.R = R;
    view.cs = cs;
    view.sn = sn;
    view.ct = ct;
    view.st = st;

    /* a soft pool of light under the cursor, so the type near it reads */
    let lx = -1e9;
    let ly = -1e9;
    const lr = s.u * 0.2;
    const lr2 = lr * lr;
    if (look && !drag) {
      lx = look.x;
      ly = look.y;
    }

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    /* dots first, in depth passes — setting ctx.font per glyph is what kills the frame */
    sea.length = 0;
    soil.length = 0;
    for (let i = 0; i < nodes.length; i++) {
      const nd = nodes[i];
      const cl = Math.cos(nd.lat);
      const x0 = cl * Math.cos(nd.lon);
      const y0 = Math.sin(nd.lat);
      const z0 = cl * Math.sin(nd.lon);
      const x1 = x0 * cs - z0 * sn;
      const z1 = x0 * sn + z0 * cs;
      const y2 = y0 * ct - z1 * st;
      const z2 = y0 * st + z1 * ct;
      if (z2 <= 0.02) continue; // solid earth: far side is hidden

      const px = cx + x1 * R;
      const py = cy - y2 * R; // canvas y grows downward
      const dx = px - lx;
      const dy = py - ly;
      const glow = dx * dx + dy * dy < lr2 ? 1 - Math.sqrt(dx * dx + dy * dy) / lr : 0;
      if (!nd.land) {
        sea.push(px, py, Math.min(0.999, z2 + glow * 0.55));
        continue;
      }
      if (!nd.c) {
        soil.push(px, py, Math.min(0.999, z2 + glow * 0.55));
        continue;
      }

      /* tangent to this parallel, so the type runs east */
      const tx0 = -Math.sin(nd.lon);
      const tz0 = Math.cos(nd.lon);
      const tx1 = tx0 * cs - tz0 * sn;
      const tz1 = tx0 * sn + tz0 * cs;
      const ang = qang(Math.atan2(tz1 * st, tx1));
      const b = Math.min(7, Math.max(0, (Math.min(0.999, z2 + glow * 0.6) * 7.99) | 0));
      (land8[b] || (land8[b] = [])).push(px, py, ang, nd.c, 0);
    }

    /* sea and land as a halftone, six depth passes each, batched into one path per pass */
    const dmin = Math.max(0.7, s.u * 0.0029);
    const dots = (list: number[], base: number, gain: number, grow: number) => {
      for (let lvl = 0; lvl < 6; lvl++) {
        const z = (lvl + 0.5) / 6;
        const dsz = dmin * grow * (0.55 + 0.75 * z);
        ctx.fillStyle = ink(base + gain * z);
        ctx.beginPath();
        for (let q = 0; q < list.length; q += 3) {
          const lv = list[q + 2] >= 1 ? 5 : (list[q + 2] * 6) | 0;
          if (lv !== lvl) continue;
          ctx.rect(list[q] - dsz / 2, list[q + 1] - dsz / 2, dsz, dsz);
        }
        ctx.fill();
      }
    };
    dots(sea, 0.1, 0.22, 1.0);
    dots(soil, 0.34, 0.46, 1.7);

    /* land: eight size buckets, so ctx.font is touched eight times instead of a thousand */
    for (let bi = 0; bi < 8; bi++) {
      const arr = land8[bi];
      if (!arr || !arr.length) continue;
      const zb = (bi + 0.5) / 8;
      ctx.font = "bold " + (fs * (0.42 + 0.58 * zb)).toFixed(2) + "px " + FACE;
      ctx.fillStyle = ink(0.28 + 0.72 * Math.pow(zb, 0.6));
      for (let t = 0; t < arr.length; t += 5) {
        ctx.save();
        ctx.translate(arr[t] as number, arr[t + 1] as number);
        ctx.rotate(arr[t + 2] as number);
        ctx.fillText(arr[t + 3] as string, 0, 0);
        ctx.restore();
      }
      arr.length = 0;
    }

    /* pins ride the surface they were dropped on */
    for (let pi = 0; pi < pins.length; pi++) {
      const pn = pins[pi];
      const pcl = Math.cos(pn.lat);
      const ax = pcl * Math.cos(pn.lon);
      const ay = Math.sin(pn.lat);
      const az = pcl * Math.sin(pn.lon);
      const bx1 = ax * cs - az * sn;
      const bz1 = ax * sn + az * cs;
      const by2 = ay * ct - bz1 * st;
      const bz2 = ay * st + bz1 * ct;
      if (bz2 <= 0.02) continue;
      const ppx = cx + bx1 * R;
      const ppy = cy - by2 * R;
      const age = (now - pn.t) / 1000;
      const pop = Math.min(1, age / 0.22);
      const rr2 = s.u * 0.016 * (0.4 + 0.6 * pop) * (0.55 + 0.45 * bz2);
      ctx.beginPath();
      ctx.arc(ppx, ppy, rr2, 0, Math.PI * 2);
      ctx.strokeStyle = ink(0.3 + 0.55 * bz2);
      ctx.lineWidth = Math.max(0.7, s.u * 0.0022);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(ppx, ppy, Math.max(0.7, rr2 * 0.22), 0, Math.PI * 2);
      ctx.fillStyle = ink(0.45 + 0.55 * bz2);
      ctx.fill();
      if (age < 0.9) {
        // a ring that opens once, on landing
        const w2 = 1 - age / 0.9;
        ctx.beginPath();
        ctx.arc(ppx, ppy, rr2 + (1 - w2) * s.u * 0.05, 0, Math.PI * 2);
        ctx.strokeStyle = ink(0.55 * w2 * w2);
        ctx.lineWidth = Math.max(0.6, s.u * 0.0016);
        ctx.stroke();
      }
    }
  }
  return { draw, reset: undefined as undefined | (() => void) };
}

export function GlobeStudy({
  mode = "dark",
  scale = 1,
  opacity = 1,
  hue = 0,
  saturation = 1,
  brightness = 1,
  text = "everypointonthisballisapathbacktoanotherone",
  inkColor,
  backgroundColor,
  className,
}: GlobeStudyProps) {
  const prefersReducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const light = mode === "light";
  const surface = backgroundColor ?? (light ? "#f3f5f8" : "#08090a");
  const INK = inkColor ? hexToRgb(inkColor) : light ? "38,40,48" : "226,228,233";

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const ac = new AbortController();
    const s: Surface = { w: 0, h: 0, dpr: 1, u: 0 };

    const resize = () => {
      const width = cv.clientWidth;
      const height = cv.clientHeight;
      if (!width || !height) return false;
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      const w = Math.round(width * dpr);
      const h = Math.round(height * dpr);
      if (w === cv.width && h === cv.height && s.w === width) return false;
      cv.width = w;
      cv.height = h;
      s.w = width;
      s.h = height;
      s.u = Math.min(width, height);
      s.dpr = dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return true;
    };

    const INK64: string[] = [];
    for (let q0 = 0; q0 < 64; q0++)
      INK64.push("rgba(" + INK + "," + ((q0 / 63) * SOFT).toFixed(4) + ")");
    const ink = (a: number) => INK64[a <= 0 ? 0 : a >= 1 ? 63 : (a * 63) | 0];
    const local = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      const k = cv.clientWidth / (r.width || 1);
      return { x: (e.clientX - r.left) * k, y: (e.clientY - r.top) * k };
    };

    resize();
    const study = createGlobe(
      {
        cv,
        ctx,
        s,
        ink,
        local,
        signal: ac.signal,
      },
      text,
    );

    const paint = (now: number, dt: number) => {
      if (!s.w) return;
      ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
      study.draw(now, dt);
    };

    let raf = 0;
    let onScreen = true;
    let prev = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(64, now - prev);
      prev = now;
      paint(now, dt);
      raf = requestAnimationFrame(frame);
    };
    const update = () => {
      const run = onScreen && !document.hidden && !prefersReducedMotion;
      if (run && !raf) {
        prev = performance.now();
        raf = requestAnimationFrame(frame);
      } else if (!run && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const onResize = () => {
      resize();
      study.reset?.();
      paint(performance.now(), 16);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(cv);
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry?.isIntersecting ?? true;
      update();
    });
    io.observe(cv);
    document.addEventListener("visibilitychange", update, {
      signal: ac.signal,
    });
    onResize();
    update();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      ac.abort();
    };
  }, [INK, prefersReducedMotion, text]);

  const boundedHue = clamp(hue, -180, 180);
  const boundedSaturation = clamp(saturation, 0, 2);
  const boundedBrightness = clamp(brightness, 0.4, 1.8);
  const boundedScale = clamp(scale, 0.65, 1.5);
  const filter =
    boundedHue === 0 && boundedSaturation === 1 && boundedBrightness === 1
      ? undefined
      : `hue-rotate(${boundedHue}deg) saturate(${boundedSaturation}) brightness(${boundedBrightness})`;

  return (
    <div
      className={cn("absolute inset-0 overflow-hidden", className)}
      style={{
        background: surface,
        opacity: clamp(opacity, 0.1, 1),
        filter,
      }}
    >
      <div
        className="absolute inset-0 flex items-center justify-center [container-type:size]"
        style={{
          transform: boundedScale === 1 ? undefined : `scale(${boundedScale})`,
        }}
      >
        <div
          className="relative h-[min(100cqw,100cqh)] w-[min(100cqw,100cqh)] cursor-crosshair touch-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 58% at 50% 48%, rgba(255,255,255,.038), rgba(255,255,255,0) 70%)",
          }}
        >
          <canvas
            ref={canvasRef}
            aria-label="Globe: drag to spin, scroll to zoom, click to drop a pin"
            className="absolute inset-0 block h-full w-full"
          />
        </div>
      </div>
    </div>
  );
}
