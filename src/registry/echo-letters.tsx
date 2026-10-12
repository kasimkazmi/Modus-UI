"use client";
// Ported from ThreeUI Community's Audio Wordmark (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface EchoLettersProps {
  /** Wordmark text. */
  text?: string;
  /** Equaliser bar colour; defaults to the theme primary. */
  accentColor?: string;
  /** Wordmark, glyph and plate colour; defaults to the theme foreground. */
  color?: string;
  /** Scene background; defaults to the theme background. */
  backgroundColor?: string;
  /** Loop length in seconds. */
  duration?: number;
  className?: string;
}

const W = 1080;
const H = 1350;

function sat(x: number) {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function easeOut(t: number) {
  t = sat(t);
  return 1 - Math.pow(1 - t, 3);
}

/** Reads a bare-HSL theme token (e.g. `--primary`) as a CSS colour. */
function token(name: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v ? `hsl(${v})` : "currentColor";
}

const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

function Icon({ kind, background }: { kind: "e" | "p" | "g" | "one"; background: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" className="block" aria-hidden="true">
      {kind === "e" && (
        <path
          d="M3 3.2h18.5a1.6 1.6 0 0 1 0 3.2H6.4v4.2h13.2a1.6 1.6 0 0 1 0 3.2H6.4v4.2h15.1a1.6 1.6 0 0 1 0 3.2H3.2A1.6 1.6 0 0 1 1.6 19V4.8A1.6 1.6 0 0 1 3.2 3.2Z"
          fill="currentColor"
        />
      )}
      {kind === "p" && (
        <>
          <circle cx="12" cy="12" r="10.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <text
            x="12"
            y="16.2"
            textAnchor="middle"
            fontSize="12"
            fontWeight="700"
            fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif"
            fill="currentColor"
          >
            P
          </text>
        </>
      )}
      {kind === "g" && (
        <>
          <circle cx="12" cy="12" r="10.2" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <ellipse
            cx="12"
            cy="12"
            rx="4.2"
            ry="10.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
          />
          <path
            d="M2 12h20M4.2 7.2h15.6M4.2 16.8h15.6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          />
        </>
      )}
      {kind === "one" && (
        <>
          <circle cx="12" cy="12" r="10.4" fill="currentColor" />
          <text
            x="12"
            y="16.4"
            textAnchor="middle"
            fontSize="12"
            fontWeight="800"
            fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif"
            fill={background}
          >
            1
          </text>
        </>
      )}
    </svg>
  );
}

export function EchoLetters({
  text = "Modus UI",
  accentColor,
  color,
  backgroundColor,
  duration = 4.7,
  className,
}: EchoLettersProps) {
  const prefersReducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<HTMLElement>(null);
  const wordRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    const scene = sceneRef.current;
    const sr1 = wordRef.current;
    const ctx = canvas?.getContext("2d");
    if (!root || !stage || !canvas || !scene || !sr1 || !ctx) return;

    let accent = "";
    let plate = "";
    const readColors = () => {
      accent = accentColor ?? token("--primary");
      plate = color ?? token("--foreground");
    };
    readColors();

    const DUR = duration;
    const HOLD = 4.7;
    const FADE = 0.3;

    const fit = () => {
      const { width, height } = root.getBoundingClientRect();
      const s = Math.min(width / W, height / H);
      stage.style.transform = `translate(-50%,-50%) scale(${s})`;
    };
    const ro = new ResizeObserver(fit);
    ro.observe(root);
    fit();

    const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
      r = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };

    const drawBars = (
      cx: number,
      cy: number,
      r: number,
      t: number,
      inverse: boolean,
      fill: string,
    ) => {
      const n = inverse ? 16 : 22;
      const pitch = (r * 2) / n;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = fill;
      if (inverse) {
        ctx.fill();
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = "black";
      }
      for (let i = 0; i < n; i++) {
        const x = -r + (i + 0.5) * pitch;
        const maxH = Math.sqrt(Math.max(0, r * r - x * x)) * 2;
        if (maxH < 6) continue;
        const pulse = 0.78 + 0.22 * Math.sin(t * 6.4 + i * 0.62) * Math.sin(t * 2.4 + i * 0.17);
        const bw = (inverse ? pitch * 0.38 : pitch * 0.62) * (inverse ? 1 : pulse);
        roundRect(cx + x - bw / 2, cy - maxH / 2, Math.max(2, bw), maxH, Math.min(bw, maxH) * 0.45);
        ctx.fill();
      }
      ctx.restore();
      ctx.globalCompositeOperation = "source-over";
    };

    const drawViz = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      // Two discs on a diagonal: a plate with bars cut through it, then live primary bars.
      drawBars(540 + 120, 675 - 150, 190, t + 1.7, true, plate);
      drawBars(540 - 120, 675 + 150, 190, t, false, accent);
      ctx.strokeStyle = plate;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 8]);
      ctx.beginPath();
      ctx.arc(540 - 120, 675 + 150, 222, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    };

    const apply = (t: number) => {
      t = ((t % DUR) + DUR) % DUR;
      const slot = HOLD + FADE;
      const local = t % slot;
      const fadeOut = sat((local - HOLD) / FADE);
      const fadeIn = local < FADE ? sat(local / FADE) : 1;
      scene.style.opacity = String(fadeIn * (1 - fadeOut));
      drawViz(t);
      const p = easeOut(sat(local / 0.7));
      sr1.style.opacity = String(p);
      sr1.style.letterSpacing = lerp(0.18, -0.045, p) + "em";
    };

    let tNow = 0;
    const themeObserver = new MutationObserver(() => {
      readColors();
      apply(prefersReducedMotion ? 16.2 : tNow);
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "data-palette"],
    });

    if (prefersReducedMotion) {
      apply(16.2);
      return () => {
        ro.disconnect();
        themeObserver.disconnect();
      };
    }

    let last = -1;
    let raf = 0;
    let visible = true;
    const frame = (now: number) => {
      if (last >= 0) tNow = (tNow + (now - last) / 1000) % DUR;
      last = now;
      apply(tNow);
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
    apply(0);
    start();
    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [prefersReducedMotion, duration, accentColor, color]);

  return (
    <div
      ref={rootRef}
      className={cn("relative h-full w-full overflow-hidden bg-background", className)}
      style={backgroundColor ? { background: backgroundColor } : undefined}
    >
      <div
        ref={stageRef}
        className="absolute left-1/2 top-1/2 overflow-hidden"
        style={{
          width: W,
          height: H,
          transform: "translate(-50%,-50%)",
          transformOrigin: "center",
          color: color ?? "hsl(var(--foreground))",
          fontFamily: "var(--font-heading), ui-serif, Georgia, serif",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        <section ref={sceneRef} className="absolute inset-0" style={{ opacity: 0 }}>
          <canvas ref={canvasRef} width={W} height={H} className="absolute inset-0" />
          <div className="absolute inset-0 z-[2] flex items-center justify-center">
            <div
              ref={wordRef}
              className="flex items-center whitespace-nowrap"
              style={{
                fontWeight: 500,
                fontStyle: "italic",
                fontSize: 68,
                letterSpacing: "-.045em",
                lineHeight: 1,
                gap: 14,
              }}
            >
              <span
                className="flex items-baseline rounded-full bg-background/85 px-8 py-4 backdrop-blur-md"
                style={{ gap: 12 }}
              >
                {text}
              </span>
              <span
                className="ml-1 flex items-center rounded-full bg-background/85 px-4 py-4 backdrop-blur-md"
                style={{ gap: 10 }}
              >
                <Icon kind="e" background="hsl(var(--background))" />
                <Icon kind="p" background="hsl(var(--background))" />
                <Icon kind="g" background="hsl(var(--background))" />
                <Icon kind="one" background="hsl(var(--background))" />
              </span>
            </div>
          </div>
        </section>
        <div
          className="pointer-events-none absolute inset-0 z-[8]"
          style={{ opacity: 0.06, mixBlendMode: "overlay", backgroundImage: GRAIN }}
        />
      </div>
    </div>
  );
}
