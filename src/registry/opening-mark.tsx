"use client";
// Ported from ThreeUI Community's ThreeUI Intro (MIT, © 2026 Meng To).

import { useEffect, useId, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface OpeningMarkProps {
  /** Wordmark text that assembles. */
  text?: string;
  /** Show the seal mark (in --primary) before the text. */
  showMark?: boolean;
  /** Text colour (any CSS colour). */
  color?: string;
  /** Scene background. */
  backgroundColor?: string;
  /** Font size of the wordmark on the 1280×720 composition. */
  fontSize?: number;
  /** Seconds the assemble animation runs. */
  duration?: number;
  /** Seconds the finished wordmark holds before looping. */
  holdTime?: number;
  className?: string;
}

const W = 1280;
const H = 720;
const SCENE_LENGTH = 1.72;

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a || 1e-6), 0, 1);
const smooth = (t: number) => t * t * (3 - 2 * t);
const eOut = (t: number) => 1 - Math.pow(1 - t, 3);

function rng(s: number) {
  let a = s >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function OpeningMark({
  text = "Modus UI",
  showMark = true,
  color = "hsl(var(--foreground))",
  backgroundColor = "hsl(var(--background))",
  fontSize = 150,
  duration = 1.7,
  holdTime = 1.1,
  className,
}: OpeningMarkProps) {
  const prefersReducedMotion = useReducedMotion();
  const maskId = `iw-cut-${useId().replace(/:/g, "")}`;
  const rootRef = useRef<HTMLDivElement>(null);
  const compRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const comp = compRef.current;
    const tx = textRef.current;
    if (!root || !comp || !tx) return;
    const mk = markRef.current;
    const chars = Array.from(tx.querySelectorAll<HTMLSpanElement>("[data-char]"));
    const R = rng(7719);
    const jit = chars.map(() => [R() * 2 - 1, R() * 2 - 1, R()]);

    const fit = () => {
      const { width, height } = root.getBoundingClientRect();
      comp.style.transform = `scale(${Math.min(width / W, height / H).toFixed(4)})`;
    };
    const ro = new ResizeObserver(fit);
    ro.observe(root);
    fit();

    const update = (t: number) => {
      const p = seg(t, 0, SCENE_LENGTH);
      if (mk) {
        mk.style.opacity = clamp(smooth(seg(p, 0.26, 0.5)), 0, 1).toFixed(3);
        mk.style.transform = `scale(${lerp(0.55, 1, eOut(seg(p, 0.26, 0.56))).toFixed(3)})`;
      }
      for (let i = 0; i < chars.length; i++) {
        const j = jit[i];
        const a = eOut(clamp(seg(p, 0.02, 0.5) * 1.5 - j[2] * 0.5, 0, 1));
        const c = chars[i].style;
        c.transform = `translate(${(j[0] * 62 * (1 - a)).toFixed(1)}px,${(j[1] * 34 * (1 - a)).toFixed(1)}px) scale(${lerp(1.24, 1, a).toFixed(3)})`;
        c.opacity = clamp(Math.min(1, a * 1.6), 0, 1).toFixed(3);
        const sep = (1 - a) * 11;
        c.textShadow =
          sep > 0.4
            ? `${(-sep).toFixed(1)}px 0 hsl(var(--primary) / .55),${sep.toFixed(1)}px 0 hsl(var(--muted-foreground) / .45),0 ${(sep * 0.55).toFixed(1)}px hsl(var(--border))`
            : "none";
        c.filter = sep > 0.7 ? `blur(${(sep * 0.3).toFixed(2)}px)` : "none";
      }
    };

    if (prefersReducedMotion) {
      update(duration);
      return () => ro.disconnect();
    }

    const cycle = duration + holdTime;
    let elapsed = 0;
    let last = -1;
    let raf = 0;
    let visible = true;
    const frame = (now: number) => {
      if (last >= 0) elapsed = (elapsed + (now - last) / 1000) % cycle;
      last = now;
      update(Math.min(elapsed, duration));
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (raf || !visible || document.hidden) return;
      last = -1;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(root);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);
    update(0);
    start();
    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [text, showMark, duration, holdTime, prefersReducedMotion]);

  return (
    <div
      ref={rootRef}
      role="img"
      aria-label={text}
      className={cn("relative h-full w-full overflow-hidden", className)}
      style={{ background: backgroundColor }}
    >
      <div
        ref={compRef}
        className="absolute left-1/2 top-1/2"
        style={{
          width: W,
          height: H,
          margin: `-${H / 2}px 0 0 -${W / 2}px`,
          transformOrigin: "50% 50%",
        }}
      >
        <div className="pointer-events-none absolute inset-0">
          <div
            ref={textRef}
            className="absolute inset-x-0 top-1/2 whitespace-nowrap text-center font-serif italic"
            style={{
              transform: "translateY(-50%)",
              fontWeight: 400,
              letterSpacing: "-.02em",
              lineHeight: 1,
              fontSize,
              color,
            }}
          >
            {showMark && (
              <span
                ref={markRef}
                className="inline-block text-[hsl(var(--primary))]"
                style={{ verticalAlign: "-.02em", marginRight: ".18em", opacity: 0 }}
              >
                <svg
                  viewBox="0 0 512 512"
                  aria-hidden="true"
                  className="block"
                  style={{ width: ".62em", height: ".62em" }}
                >
                  <defs>
                    <mask
                      id={maskId}
                      maskUnits="userSpaceOnUse"
                      x="0"
                      y="0"
                      width="512"
                      height="512"
                    >
                      <rect width="512" height="512" fill="black" />
                      <rect x="56" y="56" width="400" height="400" rx="72" fill="white" />
                      <rect x="200" y="200" width="112" height="112" rx="20" fill="black" />
                    </mask>
                  </defs>
                  <rect width="512" height="512" fill="currentColor" mask={`url(#${maskId})`} />
                </svg>
              </span>
            )}
            {Array.from(text).map((ch, i) => (
              <span key={i} data-char="" className="inline-block" style={{ opacity: 0 }}>
                {ch === " " ? " " : ch}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
