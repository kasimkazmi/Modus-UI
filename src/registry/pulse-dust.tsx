"use client";
// Ported from ThreeUI Community's Signal Particles (MIT, © 2026 Meng To).

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PulseDustProps {
  speed?: number;
  size?: number;
  length?: number;
  opacity?: number;
  hue?: number;
  saturation?: number;
  brightness?: number;
  /** Colour of the regular grains. Defaults to the theme foreground. */
  dotColor?: string;
  /** Colours of the rare accent grains. Default to the theme primary and muted foreground. */
  highlightColors?: [string, string];
  /** Defaults to the theme background. */
  backgroundColor?: string;
  className?: string;
}

type Rgb = [number, number, number];
const TOKENS = [
  "background",
  "foreground",
  "primary",
  "muted-foreground",
  "border",
  "card",
] as const;
type Theme = Record<(typeof TOKENS)[number], Rgb>;

/** Any CSS colour as 0–1 sRGB channels, resolved by the browser. */
function toRgb(color: string): Rgb {
  const probe = document.createElement("i");
  probe.style.display = "none";
  probe.style.color = color;
  document.body.appendChild(probe);
  const [r = 0, g = 0, b = 0] = (getComputedStyle(probe).color.match(/[\d.]+/g) ?? []).map(Number);
  probe.remove();
  return [r / 255, g / 255, b / 255];
}

/** The Modus theme tokens, re-read whenever the mode or palette on <html> changes. */
function useTheme() {
  const [theme, setTheme] = useState<Theme | null>(null);
  useEffect(() => {
    const root = document.documentElement;
    const read = () => {
      const style = getComputedStyle(root);
      setTheme(
        Object.fromEntries(
          TOKENS.map((t) => [t, toRgb(`hsl(${style.getPropertyValue(`--${t}`).trim()})`)]),
        ) as Theme,
      );
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "data-palette", "style"],
    });
    return () => observer.disconnect();
  }, []);
  return theme;
}

const mix = (a: Rgb, b: Rgb, t: number): Rgb => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
const css = (c: Rgb, alpha = 1) => `rgb(${c.map((v) => Math.round(v * 255)).join(" ")} / ${alpha})`;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function PulseDust({
  speed = 0.8,
  size = 1.15,
  length = 0.75,
  opacity = 1,
  hue = 0,
  saturation = 1,
  brightness = 1,
  dotColor,
  highlightColors,
  backgroundColor,
  className,
}: PulseDustProps) {
  const prefersReducedMotion = useReducedMotion();
  const theme = useTheme();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useRef({ dot: "", accents: ["", ""] });
  const options = useRef({ speed, size, length });
  options.current = { speed, size, length };

  useEffect(() => {
    if (!theme) return;
    const accent = highlightColors?.map(toRgb) ?? [
      theme.primary,
      mix(theme.primary, theme["muted-foreground"], 0.55),
    ];
    colors.current = {
      dot: (dotColor ? toRgb(dotColor) : theme.foreground)
        .map((v) => Math.round(v * 255))
        .join(" "),
      accents: accent.map((c) => css(c)),
    };
  }, [theme, dotColor, highlightColors]);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!host || !canvas || !ctx || !theme) return;

    let width = 0;
    let height = 0;
    let time = 0;
    let frame = 0;
    let visible = true;

    const draw = () => {
      const o = options.current;
      const { dot, accents } = colors.current;
      const spacing = Math.max(6, Math.round(16 / Math.max(0.35, clamp(o.length, 0.35, 2.5))));
      const grain = 2.4 * clamp(o.size, 0.05, 200);

      ctx.clearRect(0, 0, width, height);
      const cols = Math.floor(width / spacing);
      const rows = Math.floor(height / spacing);
      const offsetX = (width - cols * spacing) / 2;
      const offsetY = (height - rows * spacing) / 2;

      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          const nx = i * 0.1;
          const ny = j * 0.1;
          const wave1 = Math.sin(nx + time * 0.5) * Math.cos(ny - time * 0.3);
          const wave2 = Math.sin(nx * 0.5 - ny * 0.5 + time * 0.8);
          const value = wave1 + wave2;
          if (value <= 0.1) continue;
          // Square grains that swell with the wave instead of fixed round dots.
          const s = grain * clamp((value - 0.1) * 0.7, 0.25, 1);
          const x = offsetX + i * spacing - s / 2;
          const y = offsetY + j * spacing - s / 2;
          const pick = Math.sin(i * 12.34) * Math.cos(j * 56.78);
          if (pick > 0.94) ctx.fillStyle = accents[0];
          else if (pick < -0.94) ctx.fillStyle = accents[1];
          else ctx.fillStyle = `rgb(${dot} / ${Math.min(0.7, (value - 0.1) * 0.8)})`;
          ctx.fillRect(x, y, s, s);
        }
      }
    };

    const tick = () => {
      draw();
      time += 0.02 * clamp(options.current.speed, 0, 3);
      frame = visible && !document.hidden ? requestAnimationFrame(tick) : 0;
    };
    const start = () => {
      if (!prefersReducedMotion && visible && !document.hidden && !frame)
        frame = requestAnimationFrame(tick);
    };
    const resize = () => {
      width = canvas.width = host.offsetWidth;
      height = canvas.height = host.offsetHeight;
      draw();
    };

    const resizeObserver = new ResizeObserver(resize);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      if (visible) start();
      else if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    });
    const onVisibility = () => !document.hidden && start();
    document.addEventListener("visibilitychange", onVisibility);
    resizeObserver.observe(host);
    intersection.observe(host);
    resize();
    start();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [prefersReducedMotion, theme]);

  const filter =
    hue === 0 && saturation === 1 && brightness === 1
      ? undefined
      : `hue-rotate(${clamp(hue, -180, 180)}deg) saturate(${clamp(saturation, 0, 2)}) brightness(${clamp(brightness, 0.35, 1.65)})`;

  return (
    <div
      ref={hostRef}
      className={cn("absolute inset-0 overflow-hidden", className)}
      style={{ background: backgroundColor ?? "hsl(var(--background))", filter }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 block h-full w-full"
        style={{ opacity: clamp(opacity, 0.05, 1) }}
      />
    </div>
  );
}
