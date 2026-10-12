"use client";
// Ported from ThreeUI Community's Ripple Study (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlyphSurgeProps {
  scale?: number;
  opacity?: number;
  hue?: number;
  saturation?: number;
  brightness?: number;
  inkColor?: string;
  backgroundColor?: string;
  className?: string;
}

const CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789=?#§¶△◊×÷%@&*/<>+-$¥£~^|:;.,()[]{}";
const N = 19;
const LIFE = 1250; // ms

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Reads a theme token (bare HSL channels) or passes a CSS colour through, as "r,g,b". */
function toRgb(el: HTMLElement, color: string) {
  el.style.color = color;
  const m = getComputedStyle(el).color.match(/[\d.]+/g) ?? ["0", "0", "0"];
  return m.slice(0, 3).join(",");
}

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

export function GlyphSurge({
  scale = 1,
  opacity = 1,
  hue = 0,
  saturation = 1,
  brightness = 1,
  inkColor,
  backgroundColor,
  className,
}: GlyphSurgeProps) {
  const prefersReducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const surface = backgroundColor ?? "hsl(var(--background))";

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const ac = new AbortController();
    const s = { w: 0, h: 0, dpr: 1 };
    const ink = { base: "0,0,0", peak: "0,0,0", font: "monospace" };
    const probe = document.createElement("span");
    probe.style.display = "none";
    cv.parentElement!.appendChild(probe);
    const readTheme = () => {
      ink.base = toRgb(probe, inkColor ?? "hsl(var(--foreground))");
      ink.peak = toRgb(probe, "hsl(var(--primary))");
      ink.font = getComputedStyle(cv).fontFamily;
    };
    readTheme();
    const mo = new MutationObserver(() => {
      readTheme();
      draw(performance.now());
    });
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "style"],
    });

    const resize = () => {
      const r = { width: cv.clientWidth, height: cv.clientHeight };
      if (!r.width || !r.height) return false;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.round(r.width * dpr);
      const h = Math.round(r.height * dpr);
      if (w === cv.width && h === cv.height && s.w === r.width) return false;
      cv.width = w;
      cv.height = h;
      s.w = r.width;
      s.h = r.height;
      s.dpr = dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return true;
    };

    const plate: string[] = [];
    const r0 = rng(20260809);
    for (let i = 0; i < N * N; i++) plate.push(CHARS.charAt(Math.floor(r0() * CHARS.length)));

    const rings: { x: number; y: number; t: number }[] = [];

    const draw = (now: number) => {
      ctx.clearRect(0, 0, s.w, s.h);

      const size = Math.min(s.w, s.h);
      const cell = size * 0.042;
      const fs = cell * 0.9;
      const x0 = s.w / 2 - (cell * (N - 1)) / 2;
      const y0 = s.h / 2 - (cell * (N - 1)) / 2;

      while (rings.length && now - rings[0].t > LIFE) rings.shift();

      const speed = size * 1.2; // px / s
      const band = cell * 2.45;

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = fs.toFixed(2) + "px " + ink.font;
      ctx.lineJoin = "round";

      for (let gy = 0; gy < N; gy++) {
        const py = y0 + gy * cell;
        for (let gx = 0; gx < N; gx++) {
          const px = x0 + gx * cell;
          let v = 0;
          for (let k = 0; k < rings.length; k++) {
            const R = rings[k];
            const age = (now - R.t) / 1000;
            if (age < 0) continue;
            const rad = speed * age;
            const dx = px - R.x;
            const dy = py - R.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            let q = (d - rad) / band;
            if (q > 2.4 || q < -3.8) continue;
            if (q < 0) q *= 0.62; // the wave drags a tail behind its front
            const env = Math.max(0, 1 - age / (LIFE / 1000));
            v += Math.exp(-q * q) * Math.pow(env, 1.15);
          }
          if (v > 1) v = 1;

          const ch = plate[gy * N + gx];
          // quiet plate; the passing wave lifts glyphs into the primary ink and swells them
          ctx.fillStyle = "rgba(" + ink.base + "," + (0.28 + v * 0.3).toFixed(3) + ")";
          ctx.fillText(ch, px, py);
          if (v > 0.03) {
            const col = "rgba(" + ink.peak + "," + v.toFixed(3) + ")";
            ctx.fillStyle = col;
            ctx.strokeStyle = col;
            ctx.lineWidth = fs * v * 0.12;
            ctx.fillText(ch, px, py);
            ctx.strokeText(ch, px, py);
          }
        }
      }
    };

    let raf = 0;
    let onScreen = true;
    const frame = (now: number) => {
      draw(now);
      raf = requestAnimationFrame(frame);
    };
    const update = () => {
      const run = onScreen && !document.hidden && !prefersReducedMotion;
      if (run && !raf) raf = requestAnimationFrame(frame);
      else if (!run && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    cv.addEventListener(
      "pointerdown",
      (e) => {
        const r = cv.getBoundingClientRect();
        const k = cv.clientWidth / (r.width || 1);
        rings.push({
          x: (e.clientX - r.left) * k,
          y: (e.clientY - r.top) * k,
          t: performance.now(),
        });
        if (rings.length > 8) rings.shift();
      },
      { signal: ac.signal },
    );

    const onResize = () => {
      if (resize()) rings.length = 0;
      draw(performance.now());
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
    // open with one surge from the centre so the field introduces itself
    if (!prefersReducedMotion) rings.push({ x: s.w / 2, y: s.h / 2, t: performance.now() + 300 });
    update();

    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
      probe.remove();
      ro.disconnect();
      io.disconnect();
      ac.abort();
    };
  }, [inkColor, prefersReducedMotion]);

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
      <canvas
        ref={canvasRef}
        aria-label="Glyph field: click to send a surge through the type"
        className="absolute inset-0 block h-full w-full cursor-crosshair touch-none font-mono"
        style={{
          transform: boundedScale === 1 ? undefined : `scale(${boundedScale})`,
        }}
      />
    </div>
  );
}
