"use client";
// Ported from ThreeUI Community's Performance Gauges (MIT, © 2026 Meng To).

import * as React from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export type PaceDialVariant = "tachometer" | "speedometer" | "boost" | "power";

export interface PaceDialProps {
  variant?: PaceDialVariant;
  hue?: number;
  saturation?: number;
  brightness?: number;
  className?: string;
}

type Zone = { from: number; to: number; color: string };
type Scale = {
  start: number;
  sweep: number;
  min: number;
  max: number;
  majorStep: number;
  minorPerMajor: number;
};
type Spec = Scale & {
  label: string;
  unit: string;
  numeral: (v: number) => string;
  hot: (v: number) => boolean;
  zones: Zone[];
  progressFrom?: number;
  idle: number;
  value: number;
  peak?: number;
  soc?: number;
  readout: (v: number) => string;
  footer: string;
  sub?: Scale & { value: number };
};

const INK = "hsl(var(--foreground))";
const MUTED = "hsl(var(--muted-foreground))";
const ACCENT = "hsl(var(--primary))";
const tone = (token: string, alpha: number) => `hsl(var(${token}) / ${alpha})`;

const SPECS: Record<PaceDialVariant, Spec> = {
  speedometer: {
    label: "Pace",
    unit: "km/h",
    start: -135,
    sweep: 270,
    min: 0,
    max: 160,
    majorStep: 20,
    minorPerMajor: 4,
    numeral: (v) => String(v),
    hot: (v) => v >= 140,
    zones: [
      { from: 0, to: 140, color: tone("--foreground", 0.12) },
      { from: 140, to: 160, color: ACCENT },
    ],
    progressFrom: 0,
    idle: 0,
    value: 118,
    peak: 143,
    readout: (v) => String(Math.round(v)),
    footer: "Odo 03159.5",
  },
  tachometer: {
    label: "Revs",
    unit: "r/min ×1000",
    start: -135,
    sweep: 270,
    min: 0,
    max: 7,
    majorStep: 1,
    minorPerMajor: 5,
    numeral: (v) => String(v),
    hot: (v) => v >= 5.5,
    zones: [
      { from: 0, to: 5.5, color: tone("--foreground", 0.12) },
      { from: 5.5, to: 7, color: ACCENT },
    ],
    idle: 0,
    value: 5.2,
    readout: (v) => v.toFixed(1),
    footer: "Temp °C",
    sub: { start: -110, sweep: 220, min: 40, max: 130, majorStep: 30, minorPerMajor: 3, value: 92 },
  },
  boost: {
    label: "Boost",
    unit: "bar",
    start: -135,
    sweep: 270,
    min: -1,
    max: 1.5,
    majorStep: 0.5,
    minorPerMajor: 5,
    numeral: (v) => v.toFixed(1),
    hot: (v) => v >= 1.2,
    zones: [
      { from: -1, to: 0, color: tone("--muted-foreground", 0.25) },
      { from: 0, to: 1.2, color: tone("--primary", 0.35) },
      { from: 1.2, to: 1.5, color: ACCENT },
    ],
    idle: -0.85,
    value: 0.92,
    readout: (v) => (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(2),
    footer: "Wastegate 1.20",
  },
  power: {
    label: "Output",
    unit: "kW",
    start: -135,
    sweep: 270,
    min: -30,
    max: 120,
    majorStep: 30,
    minorPerMajor: 3,
    numeral: (v) => (v === -30 ? "CHG" : String(v)),
    hot: (v) => v < 0,
    zones: [
      { from: -30, to: 0, color: tone("--primary", 0.55) },
      { from: 0, to: 120, color: tone("--foreground", 0.12) },
    ],
    progressFrom: 0,
    idle: -22,
    value: 78,
    soc: 72,
    readout: (v) => String(Math.round(v)),
    footer: "Charge 72%",
  },
};

const angleFor = (s: Scale, value: number) =>
  s.start + ((value - s.min) / (s.max - s.min)) * s.sweep;

const arcGradient = (s: Scale, segments: Zone[]) =>
  segments
    .map((segment) => {
      const from = angleFor(s, segment.from);
      const span = ((segment.to - segment.from) / (s.max - s.min)) * s.sweep;
      return `conic-gradient(from ${from}deg, ${segment.color} 0deg, ${segment.color} ${span}deg, transparent ${span}deg)`;
    })
    .join(", ");

const BAND_MASK =
  "radial-gradient(closest-side, transparent 90%, black 90.5%, black 93%, transparent 93.5%)";
const PROGRESS_MASK =
  "radial-gradient(closest-side, transparent 76%, black 76.5%, black 78%, transparent 78.5%)";
const maskStyle = (mask: string): React.CSSProperties => ({
  WebkitMaskImage: mask,
  maskImage: mask,
});

const CSS = `
.pd-root{container-type:inline-size;position:relative;aspect-ratio:1/1;color:${INK};transition:opacity .8s cubic-bezier(.2,.8,.2,1),transform .8s cubic-bezier(.2,.8,.2,1),filter .8s}
.pd-root *,.pd-root *::before,.pd-root *::after{box-sizing:border-box}
.pd-face{position:absolute;inset:4cqw;border-radius:50%;background:radial-gradient(closest-side,hsl(var(--card)) 0%,hsl(var(--card)) 70%,color-mix(in hsl,hsl(var(--card)),hsl(var(--foreground)) 4%) 100%);border:1px solid hsl(var(--border));box-shadow:0 0 0 1.6cqw hsl(var(--background)),0 0 0 calc(1.6cqw + 1px) hsl(var(--border)),0 30px 60px -30px hsl(var(--foreground) / .35)}
.pd-layer{position:absolute;inset:0;pointer-events:none;border-radius:50%}
.pd-spoke{position:absolute;inset:0}
.pd-tick{position:absolute;left:50%;transform:translateX(-50%)}
.pd-tick.minor{top:5.6%;width:.35%;height:2.4%}
.pd-tick.major{top:5%;width:.7%;height:5.2%}
.pd-numeral{position:absolute;left:50%;top:13.5%;line-height:1;white-space:nowrap;font-variant-numeric:tabular-nums;font-style:italic}
.pd-needle{position:absolute;inset:0;transform:rotate(var(--angle,0deg));transition:transform var(--needle-duration,1200ms) var(--needle-ease,cubic-bezier(.2,.9,.25,1));will-change:transform}
.pd-flutter{position:absolute;inset:0}
.pd-blade{position:absolute;left:50%;top:9%;bottom:50%;width:.9%;transform:translateX(-50%);border-radius:999px 999px 0 0}
.pd-tail{position:absolute;left:50%;top:50%;width:.9%;height:12%;transform:translateX(-50%)}
.pd-hub{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);border-radius:50%;aspect-ratio:1}
.pd-stack{position:absolute;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;white-space:nowrap}
.pd-cap{font-size:2.4cqw;letter-spacing:.32em;text-indent:.32em;line-height:1;text-transform:uppercase}
.pd-readout{font-size:13cqw;line-height:.9;font-variant-numeric:tabular-nums;letter-spacing:-.02em}
@keyframes pd-flutter{0%,100%{transform:rotate(-.4deg)}50%{transform:rotate(.4deg)}}
.pd-flutter[data-live]{animation:pd-flutter 2.6s ease-in-out infinite}
@keyframes pd-pulse{0%,100%{opacity:.3}50%{opacity:1}}
.pd-pulse{animation:pd-pulse 1.4s ease-in-out infinite}
.pd-still .pd-needle,.pd-still .pd-soc{transition:none!important}
.pd-still .pd-flutter,.pd-still .pd-pulse{animation:none!important}
`;

export function PaceDial({
  variant = "speedometer",
  hue = 0,
  saturation = 1,
  brightness = 1,
  className,
}: PaceDialProps) {
  const prefersReducedMotion = useReducedMotion();
  const spec = SPECS[variant] ?? SPECS.speedometer;
  const rootRef = React.useRef<HTMLDivElement>(null);

  const [revealed, setRevealed] = React.useState(false);
  const [reading, setReading] = React.useState({ value: spec.idle, duration: 1200 });
  const [readout, setReadout] = React.useState(spec.readout(spec.idle));
  const [peak, setPeak] = React.useState<number | null>(null);
  const [subValue, setSubValue] = React.useState(spec.sub?.min ?? 0);
  const [soc, setSoc] = React.useState(0);
  const [live, setLive] = React.useState(false);

  // reveal once in view, then start the instrument 500ms later
  React.useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setRevealed(true);
          io.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  React.useEffect(() => {
    setReading({ value: spec.idle, duration: 0 });
    setReadout(spec.readout(spec.idle));
    setPeak(null);
    setSubValue(spec.sub?.min ?? 0);
    setSoc(0);
    setLive(false);
    if (!revealed) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    let raf = 0;
    let interval: ReturnType<typeof setInterval> | undefined;

    const countTo = (from: number, to: number, duration: number) => {
      cancelAnimationFrame(raf);
      if (prefersReducedMotion || duration === 0) {
        setReadout(spec.readout(to));
        return;
      }
      const started = performance.now();
      const step = (now: number) => {
        const progress = Math.min(1, (now - started) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        setReadout(spec.readout(from + (to - from) * eased));
        if (progress < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    const sweepTo = (value: number, duration: number) => setReading({ value, duration });

    const run = () => {
      if (spec.soc != null) setSoc(spec.soc);
      if (spec.sub) setSubValue(spec.sub.value);

      if (prefersReducedMotion) {
        sweepTo(spec.value, 0);
        countTo(spec.value, spec.value, 0);
        if (spec.peak != null) setPeak(spec.peak);
        return;
      }

      const cycle = () => {
        setLive(false);
        // instrument self-test: full-scale sweep, fall back to rest, settle on the live reading
        sweepTo(spec.max, 1100);
        countTo(spec.idle, spec.max, 1100);
        setPeak(spec.max);
        timers.push(
          setTimeout(() => {
            sweepTo(spec.idle, 900);
            countTo(spec.max, spec.idle, 900);
            setPeak(spec.idle);
          }, 1350),
          setTimeout(() => {
            sweepTo(spec.value, 1200);
            countTo(spec.idle, spec.value, 1200);
            setPeak(spec.peak ?? null);
          }, 2500),
          setTimeout(() => setLive(true), 3900),
        );
      };
      cycle();
      interval = setInterval(cycle, 8000);
    };

    timers.push(setTimeout(run, 500));
    return () => {
      timers.forEach(clearTimeout);
      if (interval) clearInterval(interval);
      cancelAnimationFrame(raf);
    };
  }, [revealed, spec, prefersReducedMotion]);

  const ticks = (s: Scale, hot: (v: number) => boolean, small = false) => {
    const step = s.majorStep / s.minorPerMajor;
    const count = Math.round((s.max - s.min) / step);
    return Array.from({ length: count + 1 }, (_, index) => {
      const value = s.min + index * step;
      const isMajor = index % s.minorPerMajor === 0;
      return (
        <div
          key={index}
          className="pd-spoke"
          style={{ transform: `rotate(${angleFor(s, value)}deg)` }}
        >
          <i
            className={cn("pd-tick", isMajor ? "major" : "minor")}
            style={{
              background: hot(value) ? ACCENT : isMajor ? INK : MUTED,
              opacity: isMajor ? 0.9 : 0.55,
              ...(small && {
                top: "10%",
                height: isMajor ? "12%" : "6%",
                width: isMajor ? "3%" : "1.6%",
              }),
            }}
          />
        </div>
      );
    });
  };

  const numerals = Array.from(
    { length: Math.round((spec.max - spec.min) / spec.majorStep) + 1 },
    (_, index) => {
      const value = Math.round((spec.min + index * spec.majorStep) * 1000) / 1000;
      const angle = angleFor(spec, value);
      return (
        <div key={index} className="pd-spoke" style={{ transform: `rotate(${angle}deg)` }}>
          <span
            className="pd-numeral font-serif"
            style={{
              fontSize: spec.numeral(value).length > 2 ? "4.4cqw" : "5.4cqw",
              color: spec.hot(value) ? ACCENT : INK,
              transform: `translateX(-50%) rotate(${-angle}deg)`,
            }}
          >
            {spec.numeral(value)}
          </span>
        </div>
      );
    },
  );

  const from = spec.progressFrom ?? spec.min;
  const progress =
    revealed && reading.value > from
      ? arcGradient(spec, [{ from, to: reading.value, color: ACCENT }])
      : undefined;
  const hotNow = spec.hot(reading.value) && revealed;

  let detail: React.ReactNode = null;
  if (spec.sub) {
    const sub = spec.sub;
    detail = (
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "80%",
          transform: "translate(-50%,-50%)",
          width: "13%",
          aspectRatio: "1",
          borderRadius: 9999,
          border: `1px solid ${tone("--border", 1)}`,
          background: tone("--background", 1),
        }}
      >
        <div className="pd-layer">{ticks(sub, (v) => v >= 115, true)}</div>
        <div
          className="pd-needle"
          style={
            {
              "--needle-duration": "1700ms",
              "--angle": `${angleFor(sub, subValue)}deg`,
            } as React.CSSProperties
          }
        >
          <i className="pd-blade" style={{ top: "16%", width: "3%", background: ACCENT }} />
        </div>
        <div className="pd-hub" style={{ width: "14%", background: INK }} />
      </div>
    );
  } else if (spec.soc != null) {
    detail = (
      <div className="pd-stack" style={{ top: "75%" }}>
        <div
          style={{
            width: "22cqw",
            height: "1.2cqw",
            borderRadius: 9999,
            background: tone("--foreground", 0.1),
            overflow: "hidden",
          }}
        >
          <div
            className="pd-soc"
            style={{
              height: "100%",
              background: ACCENT,
              transition: "width 1400ms cubic-bezier(0,0,.2,1)",
              width: `${soc}%`,
            }}
          />
        </div>
      </div>
    );
  }

  const filter =
    hue === 0 && saturation === 1 && brightness === 1
      ? undefined
      : `hue-rotate(${hue}deg) saturate(${saturation}) brightness(${brightness})`;

  return (
    <div
      ref={rootRef}
      className={cn("pd-root w-full font-sans", prefersReducedMotion && "pd-still", className)}
      style={{
        opacity: revealed ? 1 : 0,
        transform: revealed ? "translateY(0)" : "translateY(20px)",
        filter: revealed ? filter : ["blur(4px)", filter].filter(Boolean).join(" "),
        transition: prefersReducedMotion ? "none" : undefined,
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="pd-face">
        <div
          className="pd-layer"
          style={{ ...maskStyle(BAND_MASK), background: arcGradient(spec, spec.zones) }}
        />
        <div className="pd-layer" style={{ ...maskStyle(PROGRESS_MASK), background: progress }} />
        <div className="pd-layer">{ticks(spec, spec.hot)}</div>
        <div className="pd-layer">{numerals}</div>
        {spec.peak != null && (
          <div
            className="pd-spoke"
            style={{
              transition: "transform 900ms cubic-bezier(.2,.9,.25,1)",
              transform: peak != null ? `rotate(${angleFor(spec, peak)}deg)` : undefined,
            }}
          >
            <i
              style={{
                position: "absolute",
                left: "50%",
                top: "1.8%",
                transform: "translateX(-50%)",
                borderLeft: "1.2cqw solid transparent",
                borderRight: "1.2cqw solid transparent",
                borderTop: `1.8cqw solid ${ACCENT}`,
              }}
            />
          </div>
        )}
        <div className="pd-stack font-mono" style={{ top: "29%" }}>
          <span className="pd-cap" style={{ color: MUTED }}>
            {spec.label}
          </span>
        </div>
        <div className="pd-stack" style={{ top: spec.sub ? "57%" : "54%" }}>
          <span className="pd-readout font-serif" style={{ color: INK }}>
            {readout}
          </span>
          <span className="pd-cap font-mono" style={{ color: ACCENT, marginTop: "1.6cqw" }}>
            {spec.unit}
          </span>
        </div>
        {detail}
        <div className="pd-stack font-mono" style={{ top: "86%" }}>
          <span
            className="pd-cap"
            style={{ color: MUTED, display: "flex", alignItems: "center", gap: "1.2cqw" }}
          >
            {variant === "boost" && hotNow && (
              <i
                className="pd-pulse"
                style={{
                  width: "1.4cqw",
                  height: "1.4cqw",
                  borderRadius: 9999,
                  background: ACCENT,
                }}
              />
            )}
            {spec.footer}
          </span>
        </div>
        <div
          className="pd-needle"
          style={
            {
              "--needle-ease": "cubic-bezier(.16,1.28,.4,1)",
              "--needle-duration": `${reading.duration}ms`,
              "--angle": `${angleFor(spec, reading.value)}deg`,
            } as React.CSSProperties
          }
        >
          <div className="pd-flutter" data-live={live ? "" : undefined}>
            <i className="pd-blade" style={{ background: ACCENT }} />
            <i className="pd-tail" style={{ background: INK }} />
          </div>
        </div>
        <div
          className="pd-hub"
          style={{ width: "5%", background: tone("--card", 1), border: `0.8cqw solid ${INK}` }}
        />
      </div>
    </div>
  );
}
