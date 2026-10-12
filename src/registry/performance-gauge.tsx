"use client";
// Ported from ThreeUI Community's Performance Gauges (MIT, © 2026 Meng To).

import * as React from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export type PerformanceGaugeVariant = "tachometer" | "speedometer" | "boost" | "power";

export interface PerformanceGaugeProps {
  variant?: PerformanceGaugeVariant;
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
  numeral: (v: number) => string;
  numeralStyle: React.CSSProperties;
  tickColor: (v: number) => string;
  zones: Zone[];
  progress?: string;
  wash?: string;
  progressFrom?: number;
  idle: number;
  value: number;
  peak?: number;
  soc?: number;
  readout?: (v: number) => string;
  sub?: Scale & { value: number };
};

const SPECS: Record<PerformanceGaugeVariant, Spec> = {
  tachometer: {
    start: -135,
    sweep: 270,
    min: 0,
    max: 7,
    majorStep: 1,
    minorPerMajor: 5,
    numeral: (v) => String(v),
    numeralStyle: {
      fontSize: "7.39cqw",
      fontWeight: 300,
      color: "rgba(0,0,0,.78)",
    },
    tickColor: (v) => (v >= 5.5 ? "#7F1D1D" : "rgba(0,0,0,.7)"),
    zones: [
      { from: 0, to: 5.5, color: "rgba(0,0,0,.22)" },
      { from: 5.5, to: 7, color: "rgba(185,28,28,.95)" },
    ],
    idle: 0,
    value: 5.2,
    sub: {
      start: -110,
      sweep: 220,
      min: 40,
      max: 130,
      majorStep: 30,
      minorPerMajor: 3,
      value: 92,
    },
  },
  speedometer: {
    start: -135,
    sweep: 270,
    min: 0,
    max: 160,
    majorStep: 20,
    minorPerMajor: 4,
    numeral: (v) => String(v),
    numeralStyle: {
      fontSize: "5.31cqw",
      fontWeight: 300,
      color: "rgba(255,255,255,.72)",
    },
    tickColor: (v) => (v >= 140 ? "rgba(248,113,113,.95)" : "rgba(255,255,255,.6)"),
    zones: [
      { from: 0, to: 140, color: "rgba(255,255,255,.09)" },
      { from: 140, to: 160, color: "rgba(220,38,38,.6)" },
    ],
    progress: "#E26226",
    wash: "#E26226",
    idle: 0,
    value: 118,
    peak: 143,
    readout: (v) => String(Math.round(v)),
  },
  boost: {
    start: -135,
    sweep: 270,
    min: -1,
    max: 1.5,
    majorStep: 0.5,
    minorPerMajor: 5,
    numeral: (v) => v.toFixed(1),
    numeralStyle: {
      fontSize: "4.85cqw",
      fontWeight: 300,
      color: "rgba(255,255,255,.7)",
    },
    tickColor: (v) =>
      v >= 1.2
        ? "rgba(248,113,113,.95)"
        : v < 0
          ? "rgba(148,163,184,.65)"
          : "rgba(103,232,249,.85)",
    zones: [
      { from: -1, to: 0, color: "rgba(148,163,184,.55)" },
      { from: 0, to: 1.2, color: "rgba(34,211,238,.6)" },
      { from: 1.2, to: 1.5, color: "rgba(220,38,38,.9)" },
    ],
    idle: -0.85,
    value: 0.92,
    readout: (v) => (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(2),
  },
  power: {
    start: -135,
    sweep: 270,
    min: -30,
    max: 120,
    majorStep: 30,
    minorPerMajor: 3,
    numeral: (v) => (v === -30 ? "CHG" : String(v)),
    numeralStyle: {
      fontSize: "4.85cqw",
      fontWeight: 300,
      color: "rgba(255,255,255,.68)",
    },
    tickColor: (v) => (v < 0 ? "rgba(52,211,153,.85)" : "rgba(216,180,254,.75)"),
    zones: [
      { from: -30, to: 0, color: "rgba(16,185,129,.7)" },
      { from: 0, to: 120, color: "rgba(168,85,247,.3)" },
    ],
    progress: "#C084FC",
    progressFrom: 0,
    idle: -22,
    value: 78,
    soc: 72,
    readout: (v) => String(Math.round(v)),
  },
};

const SCREW_ANGLES: Record<PerformanceGaugeVariant, number[]> = {
  tachometer: [26, -15, 42, 7],
  speedometer: [-33, 18, 5, -48],
  boost: [12, -40, 29, -6],
  power: [47, 3, -21, 35],
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
  "radial-gradient(closest-side, transparent 88%, #000 89%, #000 95.5%, transparent 96.5%)";
const maskStyle = (mask: string): React.CSSProperties => ({
  WebkitMaskImage: mask,
  maskImage: mask,
});

const CSS = `
.pg-root{--tex-grain:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23g)'/%3E%3C/svg%3E");--tex-metal:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='m'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.008 1.5' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23m)'/%3E%3C/svg%3E");--tex-dust:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='d'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.014' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='linear' slope='0.6'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23d)'/%3E%3C/svg%3E");container-type:inline-size;position:relative;aspect-ratio:1/1;color:#fff;font-family:ui-sans-serif,system-ui,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji";transition:all .8s cubic-bezier(.2,.8,.2,1)}
.pg-root *,.pg-root *::before,.pg-root *::after{box-sizing:border-box}
.pg-plate{position:absolute;inset:0;border-radius:11.5cqw;background:radial-gradient(120% 100% at 30% 0%,#121215 0%,#09090A 55%,#060607 100%);border:1px solid rgba(255,255,255,.03);box-shadow:0px 1px 1px -.5px rgba(0,0,0,.5),0px 3px 3px -1.5px rgba(0,0,0,.4),0px 6px 6px -3px rgba(0,0,0,.35),0px 12px 12px -6px rgba(0,0,0,.3),0px 24px 24px -12px rgba(0,0,0,.25);transition:border-color .5s}
.pg-plate::before{content:"";position:absolute;inset:0;border-radius:inherit;background-image:var(--tex-grain),var(--tex-dust);background-size:34cqw 34cqw,170% 170%;background-blend-mode:soft-light,normal;mix-blend-mode:screen;opacity:.07;pointer-events:none}
.pg-root:hover .pg-plate{border-color:rgba(255,255,255,.08)}
.pg-shell{position:absolute;inset:13cqw;border-radius:50%;padding:2.2%;background:var(--tex-metal),conic-gradient(from 210deg,#3a3a3d 0deg,#17171a 60deg,#2c2c30 130deg,#0d0d0f 200deg,#313135 280deg,#131316 340deg,#3a3a3d 360deg);background-size:100% 100%,auto;background-blend-mode:overlay,normal;box-shadow:0 18px 40px -12px rgba(0,0,0,.9),0 2px 0 rgba(255,255,255,.05),inset 0 2px 6px rgba(255,255,255,.10),inset 0 -6px 14px rgba(0,0,0,.65)}
.pg-bezel{position:relative;width:100%;height:100%;border-radius:50%;padding:3.4%;background:radial-gradient(closest-side,#0b0b0d 76%,#212125 92%,#08080a 100%);box-shadow:inset 0 1px 1px rgba(255,255,255,.10),inset 0 -3px 8px rgba(0,0,0,.8)}
.pg-bezel::before{content:"";position:absolute;inset:0;border-radius:50%;background:repeating-conic-gradient(from 0deg,rgba(255,255,255,.16) 0deg .5deg,rgba(0,0,0,0) .5deg 2.2deg);-webkit-mask-image:radial-gradient(closest-side,transparent 92%,#000 93.5%,#000 99%,transparent 100%);mask-image:radial-gradient(closest-side,transparent 92%,#000 93.5%,#000 99%,transparent 100%);opacity:.45;pointer-events:none}
.pg-bezel::after{content:"";position:absolute;inset:0;border-radius:50%;background-image:var(--tex-metal);background-size:100% 100%;-webkit-mask-image:radial-gradient(closest-side,transparent 95%,#000 96.5%,#000 100%);mask-image:radial-gradient(closest-side,transparent 95%,#000 96.5%,#000 100%);mix-blend-mode:overlay;opacity:.55;pointer-events:none}
.pg-screw{position:absolute;width:5cqw;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 34% 26%,rgba(255,255,255,.55) 0%,rgba(255,255,255,.08) 26%,rgba(255,255,255,0) 46%),radial-gradient(closest-side,rgba(0,0,0,0) 58%,rgba(0,0,0,.45) 84%,rgba(0,0,0,.7) 100%),conic-gradient(from calc(var(--a,0deg) - 52deg),#9a9ba1 0deg,#43444a 34deg,#c3c4ca 74deg,#4d4e55 118deg,#a7a8ae 168deg,#37383d 214deg,#b2b3b9 262deg,#45464c 312deg,#9a9ba1 360deg);box-shadow:0 0 0 .16cqw rgba(0,0,0,.6),0 .12cqw 0 .16cqw rgba(255,255,255,.05),0 .3cqw .6cqw rgba(0,0,0,.75),inset 0 -.16cqw .32cqw rgba(0,0,0,.6),inset 0 .12cqw .24cqw rgba(255,255,255,.4)}
.pg-screw::before{content:"";position:absolute;inset:22%;transform:rotate(var(--a,0deg));background:linear-gradient(#050506,#1e1e23) center/100% 20% no-repeat,linear-gradient(#050506,#1e1e23) center/20% 100% no-repeat,linear-gradient(rgba(255,255,255,.62),rgba(255,255,255,.62)) center calc(50% + .11cqw)/100% 20% no-repeat,linear-gradient(rgba(255,255,255,.62),rgba(255,255,255,.62)) calc(50% + .11cqw) center/20% 100% no-repeat}
.pg-screw::after{content:"";position:absolute;inset:0;border-radius:50%;background-image:var(--tex-metal);background-size:100% 100%;mix-blend-mode:overlay;opacity:.45}
.pg-face{container-type:inline-size;position:relative;width:100%;height:100%;border-radius:50%;overflow:hidden;box-shadow:inset 0 5px 16px rgba(0,0,0,.5),inset 0 -2px 9px rgba(0,0,0,.4)}
.pg-layer{position:absolute;inset:0;pointer-events:none}
.pg-spoke{position:absolute;inset:0}
.pg-tick{position:absolute;left:50%;transform:translateX(-50%);border-radius:1px}
.pg-tick.minor{top:9%;width:.9%;height:2.8%;opacity:.5}
.pg-tick.major{top:8%;width:1.8%;height:6.4%}
.pg-numeral{position:absolute;left:50%;top:17.5%;line-height:1;white-space:nowrap;font-variant-numeric:tabular-nums}
.pg-needle{position:absolute;inset:0;transform:rotate(var(--angle,0deg));transition:transform var(--needle-duration,1200ms) var(--needle-ease,cubic-bezier(.2,.9,.25,1));will-change:transform}
.pg-flutter{position:absolute;inset:0}
.pg-blade{position:absolute;left:50%;top:11.5%;bottom:50%;width:3.2%;transform:translateX(-50%);clip-path:polygon(41% 0,59% 0,100% 97%,100% 100%,0 100%,0 97%);filter:drop-shadow(0 3px 6px rgba(0,0,0,.55))}
.pg-blade::after{content:"";position:absolute;inset:7% 40% 20% 40%;border-radius:999px;background:linear-gradient(rgba(255,255,255,.34),rgba(255,255,255,0))}
.pg-tail{position:absolute;left:50%;top:50%;width:2%;height:9.5%;transform:translateX(-50%);border-radius:0 0 999px 999px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.5))}
.pg-hub{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle at 34% 30%,#5c5c63,#1b1b1f 60%,#050506);box-shadow:0 3px 8px rgba(0,0,0,.75),inset 0 1px 2px rgba(255,255,255,.35);display:grid;place-items:center}
.pg-glass{position:absolute;inset:0;border-radius:50%;background:radial-gradient(120% 78% at 22% 6%,rgba(255,255,255,.20) 0%,rgba(255,255,255,.05) 32%,rgba(255,255,255,0) 56%),linear-gradient(148deg,rgba(255,255,255,.12) 0%,rgba(255,255,255,0) 40%);mix-blend-mode:screen;pointer-events:none}
.pg-glass::after{content:"";position:absolute;inset:0;border-radius:50%;box-shadow:inset 0 0 20px rgba(0,0,0,.5),inset 0 1px 1px rgba(255,255,255,.2)}
.pg-glass-dust{position:absolute;inset:0;border-radius:50%;background-image:var(--tex-dust),var(--tex-grain);background-size:130% 130%,30.03cqw 30.03cqw;mix-blend-mode:soft-light;opacity:.3;pointer-events:none}
.pg-face-grain{position:absolute;inset:0;background-image:var(--tex-grain);background-size:25.4cqw 25.4cqw;mix-blend-mode:overlay;opacity:.13;pointer-events:none}
.pg-stack{position:absolute;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center}
.pg-cap{font-size:2.89cqw;letter-spacing:.42em;text-indent:.42em;line-height:1}
.pg-cap-sm{font-size:2.43cqw;letter-spacing:.3em;text-indent:.3em;line-height:1}
.pg-readout{font-size:8.55cqw;font-weight:300;line-height:1;font-variant-numeric:tabular-nums}
@keyframes pg-flutter{0%,100%{transform:rotate(-.4deg)}50%{transform:rotate(.4deg)}}
.pg-flutter[data-live]{animation:pg-flutter 2.6s ease-in-out infinite}
@keyframes pg-pulse{0%,100%{opacity:.35}50%{opacity:1}}
.pg-pulse{animation:pg-pulse 1.4s ease-in-out infinite}
.pg-still .pg-needle,.pg-still .pg-spoke,.pg-still .pg-soc{transition:none!important}
.pg-still .pg-flutter,.pg-still .pg-pulse{animation:none!important}
`;

const MONO =
  'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace';

function Icon({ name, color }: { name: string; color: string }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      style={{ color, display: "block" }}
      aria-hidden
    >
      {name === "shield" && (
        <>
          <path
            {...common}
            d="M3 10.417c0-3.198 0-4.797.378-5.335c.377-.537 1.880-1.052 4.887-2.081l.573-.196C10.405 2.268 11.188 2 12 2s1.595.268 3.162.805l.573.196c3.007 1.029 4.51 1.544 4.887 2.081C21 5.62 21 7.22 21 10.417v1.574c0 5.638-4.239 8.375-6.899 9.536C13.380 21.842 13.020 22 12 22s-1.380-.158-2.101-.473C7.239 20.365 3 17.630 3 11.991z"
          />
          <path
            {...common}
            d="M10.861 9.363C11.368 8.454 11.621 8 12 8s.632.454 1.139 1.363l.131.235c.144.259.216.388.328.473s.252.117.532.18l.254.058c.984.222 1.476.334 1.593.71s-.218.769-.889 1.553l-.174.203c-.19.223-.286.334-.329.472s-.028.287 0 .584l.026.27c.102 1.047.152 1.570-.154 1.803s-.767.020-1.688-.404l-.239-.11c-.261-.12-.392-.18-.531-.18s-.270.06-.531.18l-.239.11c-.92.424-1.381.636-1.688.404s-.256-.756-.154-1.802l.026-.271c.029-.297.043-.446 0-.584s-.138-.249-.329-.472l-.174-.203c-.67-.784-1.006-1.177-.889-1.553s.609-.488 1.593-.71l.254-.058c.280-.063.420-.095.532-.18s.184-.214.328-.473z"
          />
        </>
      )}
      {name === "wind" && (
        <path
          {...common}
          d="M2 9h12.5a3 3 0 1 0-3-3M2 15h15.5a3 3 0 1 1-3 3M2 12h18.5a2.5 2.5 0 1 0-2.5-2.5"
        />
      )}
      {name === "bolt" && (
        <path
          {...common}
          d="M4.03 12.418L10.733 3.06c.54-.754 1.731-.375 1.731.551v6.024c0 .556.453 1.007 1.010 1.007h4.505c.82 0 1.298.923.823 1.588l-6.704 9.358c-.54.754-1.731.375-1.731-.551v-6.024c0-.556-.453-1.007-1.010-1.007H4.853c-.82 0-1.298-.923-.823-1.588"
        />
      )}
    </svg>
  );
}

export function PerformanceGauge({
  variant = "tachometer",
  hue = 0,
  saturation = 1,
  brightness = 1,
  className,
}: PerformanceGaugeProps) {
  const prefersReducedMotion = useReducedMotion();
  const spec = SPECS[variant] ?? SPECS.tachometer;
  const rootRef = React.useRef<HTMLDivElement>(null);

  const [revealed, setRevealed] = React.useState(false);
  const [reading, setReading] = React.useState({
    value: spec.idle,
    duration: 1200,
  });
  const [readout, setReadout] = React.useState(spec.readout ? spec.readout(spec.idle) : "");
  const [peak, setPeak] = React.useState<number | null>(null);
  const [subValue, setSubValue] = React.useState(spec.sub?.min ?? 0);
  const [soc, setSoc] = React.useState(0);
  const [live, setLive] = React.useState(false);

  // reveal once in view, then start the instrument 500ms later (as the original)
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
    setReadout(spec.readout ? spec.readout(spec.idle) : "");
    setPeak(null);
    setSubValue(spec.sub?.min ?? 0);
    setSoc(0);
    setLive(false);
    if (!revealed) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    let raf = 0;
    let interval: ReturnType<typeof setInterval> | undefined;

    const countTo = (from: number, to: number, duration: number) => {
      if (!spec.readout) return;
      cancelAnimationFrame(raf);
      if (prefersReducedMotion || duration === 0) {
        setReadout(spec.readout(to));
        return;
      }
      const started = performance.now();
      const step = (now: number) => {
        const progress = Math.min(1, (now - started) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        setReadout(spec.readout!(from + (to - from) * eased));
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

  const ticks = (s: Scale, color: (v: number) => string, scale = false) => {
    const step = s.majorStep / s.minorPerMajor;
    const count = Math.round((s.max - s.min) / step);
    return Array.from({ length: count + 1 }, (_, index) => {
      const value = s.min + index * step;
      const isMajor = index % s.minorPerMajor === 0;
      return (
        <div
          key={index}
          className="pg-spoke"
          style={{ transform: `rotate(${angleFor(s, value)}deg)` }}
        >
          <i
            className={cn("pg-tick", isMajor ? "major" : "minor")}
            style={{
              background: color(value),
              ...(scale && {
                top: isMajor ? "9%" : "10.5%",
                height: isMajor ? "10%" : "5%",
                width: isMajor ? "3.6%" : "2.2%",
              }),
            }}
          />
        </div>
      );
    });
  };

  const numerals = () => {
    const count = Math.round((spec.max - spec.min) / spec.majorStep);
    return Array.from({ length: count + 1 }, (_, index) => {
      const value = Math.round((spec.min + index * spec.majorStep) * 1000) / 1000;
      const angle = angleFor(spec, value);
      return (
        <div key={index} className="pg-spoke" style={{ transform: `rotate(${angle}deg)` }}>
          <span
            className="pg-numeral"
            style={{
              ...spec.numeralStyle,
              transform: `translateX(-50%) rotate(${-angle}deg)`,
            }}
          >
            {spec.numeral(value)}
          </span>
        </div>
      );
    });
  };

  const progressArc = (color?: string) => {
    if (!color) return undefined;
    const from = spec.progressFrom != null ? spec.progressFrom : spec.min;
    if (reading.value === spec.idle && !revealed) return undefined;
    return arcGradient(spec, [{ from, to: Math.max(from, reading.value), color }]);
  };

  const needle = (ease: string, blade: React.CSSProperties, tail: string) => (
    <div
      className="pg-needle"
      style={
        {
          "--needle-ease": ease,
          "--needle-duration": `${reading.duration}ms`,
          "--angle": `${angleFor(spec, reading.value)}deg`,
        } as React.CSSProperties
      }
    >
      <div className="pg-flutter" data-live={live ? "" : undefined}>
        <i className="pg-blade" style={blade} />
        <i className="pg-tail" style={{ background: tail }} />
      </div>
    </div>
  );

  const hubDot = (width: string, dot: string, size: string, glow: string) => (
    <div className="pg-hub" style={{ width }}>
      <span
        style={{
          display: "block",
          width: size,
          aspectRatio: "1",
          borderRadius: "9999px",
          background: dot,
          boxShadow: `0 0 6px ${glow}`,
        }}
      />
    </div>
  );

  const zoneBand = (
    <div
      className="pg-layer"
      style={{
        ...maskStyle(BAND_MASK),
        background: arcGradient(spec, spec.zones),
      }}
    />
  );
  const finish = (
    <>
      <div className="pg-face-grain" />
      <div className="pg-glass" />
      <div className="pg-glass-dust" />
    </>
  );

  let face: React.ReactNode;
  let faceBackground: string;

  if (variant === "speedometer") {
    faceBackground =
      "radial-gradient(closest-side at 50% 28%, #1d1d21 0%, #141416 50%, #0a0a0b 100%)";
    face = (
      <>
        <div
          className="pg-layer"
          style={{
            ...maskStyle(
              "radial-gradient(closest-side, transparent 66%, #000 80%, #000 86%, transparent 89%)",
            ),
            opacity: 0.11,
            background: progressArc(spec.wash),
          }}
        />
        {zoneBand}
        <div
          className="pg-layer"
          style={{
            ...maskStyle(BAND_MASK),
            background: progressArc(spec.progress),
          }}
        />
        <div className="pg-layer">{ticks(spec, spec.tickColor)}</div>
        <div className="pg-layer">{numerals()}</div>
        <div
          className="pg-spoke"
          style={{
            transition: "transform 900ms cubic-bezier(.2,.9,.25,1)",
            transform: peak != null ? `rotate(${angleFor(spec, peak)}deg)` : undefined,
          }}
        >
          <i
            style={{
              position: "absolute",
              left: "50%",
              top: "7.4%",
              transform: "translateX(-50%)",
              width: "1.3%",
              height: "4%",
              background: "rgba(255,255,255,.85)",
              borderRadius: 1,
              boxShadow: "0 0 7px rgba(255,255,255,.7)",
            }}
          />
        </div>
        <div className="pg-stack" style={{ top: "29%", fontSize: "6.24cqw" }}>
          <Icon name="shield" color="rgba(255,255,255,.25)" />
          <span
            className="pg-cap-sm"
            style={{ color: "rgba(255,255,255,.3)", marginTop: "1.39cqw" }}
          >
            km/h
          </span>
        </div>
        <div className="pg-stack" style={{ top: "58%" }}>
          <span
            className="pg-readout"
            style={{
              color: "#E26226",
              textShadow: "0 0 12px rgba(226,98,38,.45)",
            }}
          >
            {readout}
          </span>
        </div>
        <div className="pg-stack" style={{ top: "77%" }}>
          <div
            style={{
              background: "rgba(0,0,0,.85)",
              border: "1px solid rgba(255,255,255,.1)",
              borderRadius: 4,
              boxShadow: "inset 0 1px 3px rgba(0,0,0,.9)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "0.92cqw 1.85cqw",
            }}
          >
            <div
              style={{
                color: "#E26226",
                fontFamily: MONO,
                display: "flex",
                alignItems: "center",
                fontSize: "3.93cqw",
                letterSpacing: ".14em",
                gap: "0.58cqw",
              }}
            >
              <span>3</span>
              <span>1</span>
              <span>5</span>
              <span>9</span>
              <span
                style={{
                  background: "#E26226",
                  color: "#000",
                  borderRadius: 2,
                  padding: "0 0.81cqw",
                }}
              >
                5
              </span>
            </div>
            <span
              style={{
                color: "rgba(255,255,255,.3)",
                textTransform: "uppercase",
                fontSize: "2.08cqw",
                letterSpacing: ".28em",
                marginTop: "0.81cqw",
              }}
            >
              km total
            </span>
          </div>
        </div>
        {needle(
          "cubic-bezier(.16,1.28,.4,1)",
          {
            background: "linear-gradient(#6EE7A0,#22C55E 50%,#15803D)",
            filter: "drop-shadow(0 0 7px rgba(74,222,128,.6))",
          },
          "linear-gradient(#166534,#052E16)",
        )}
        {hubDot("8.5%", "rgba(74,222,128,.85)", "38%", "rgba(74,222,128,.75)")}
        {finish}
      </>
    );
  } else if (variant === "boost") {
    faceBackground =
      "radial-gradient(closest-side at 50% 26%, #17324F 0%, #0F172A 48%, #030816 100%)";
    face = (
      <>
        <div
          className="pg-layer"
          style={{
            background:
              "repeating-conic-gradient(from 0deg, rgba(56,189,248,.06) 0deg 1.4deg, rgba(0,0,0,0) 1.4deg 2.8deg)",
            ...maskStyle("radial-gradient(closest-side, #000 0%, #000 56%, transparent 64%)"),
          }}
        />
        {zoneBand}
        <div className="pg-layer">{ticks(spec, spec.tickColor)}</div>
        <div className="pg-layer">{numerals()}</div>
        <div className="pg-stack" style={{ top: "30%" }}>
          <span style={{ fontSize: "6.47cqw" }}>
            <Icon name="wind" color="rgba(34,211,238,.8)" />
          </span>
          <span className="pg-cap" style={{ color: "rgba(255,255,255,.45)", marginTop: "1.62cqw" }}>
            BOOST
          </span>
        </div>
        <div className="pg-stack" style={{ top: "57%" }}>
          <span
            className="pg-readout"
            style={{
              color: "#67e8f9",
              textShadow: "0 0 12px rgba(34,211,238,.5)",
            }}
          >
            {readout}
          </span>
          <span className="pg-cap" style={{ color: "rgba(6,182,212,.7)", marginTop: "1.85cqw" }}>
            BAR
          </span>
        </div>
        <div className="pg-stack" style={{ top: "79%" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              color: "rgba(255,255,255,.35)",
              gap: "1.62cqw",
              fontSize: "2.19cqw",
              letterSpacing: ".26em",
            }}
          >
            {reading.value >= 1.2 && (
              <span
                className="pg-pulse"
                style={{
                  borderRadius: 9999,
                  background: "#ef4444",
                  width: "1.85cqw",
                  height: "1.85cqw",
                }}
              />
            )}
            <span>WASTEGATE 1.20</span>
          </div>
        </div>
        {needle(
          "cubic-bezier(.16,1.32,.4,1)",
          {
            background: "linear-gradient(#4DD9F0,#0EB8D7 50%,#0E7490)",
            filter: "drop-shadow(0 0 8px rgba(34,211,238,.65))",
          },
          "linear-gradient(#155E75,#083344)",
        )}
        {hubDot("9%", "rgba(34,211,238,.85)", "38%", "rgba(34,211,238,.85)")}
        {finish}
      </>
    );
  } else if (variant === "power") {
    faceBackground =
      "radial-gradient(closest-side at 50% 28%, #191624 0%, #111016 50%, #08070B 100%)";
    face = (
      <>
        {zoneBand}
        <div
          className="pg-layer"
          style={{
            ...maskStyle(BAND_MASK),
            background: progressArc(spec.progress),
          }}
        />
        <div className="pg-layer">{ticks(spec, spec.tickColor)}</div>
        <div className="pg-layer">{numerals()}</div>
        <div className="pg-stack" style={{ top: "29%" }}>
          <span style={{ fontSize: "6.47cqw" }}>
            <Icon name="bolt" color="rgba(192,132,252,.9)" />
          </span>
          <span className="pg-cap" style={{ color: "rgba(255,255,255,.45)", marginTop: "1.62cqw" }}>
            POWER
          </span>
        </div>
        <div className="pg-stack" style={{ top: "57%" }}>
          <span
            className="pg-readout"
            style={{
              color: "#e9d5ff",
              textShadow: "0 0 12px rgba(192,132,252,.45)",
            }}
          >
            {readout}
          </span>
          <span className="pg-cap" style={{ color: "rgba(192,132,252,.7)", marginTop: "1.85cqw" }}>
            KW
          </span>
        </div>
        <div className="pg-stack" style={{ top: "76%" }}>
          <div
            style={{
              borderRadius: 9999,
              background: "rgba(255,255,255,.1)",
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,.1)",
              width: "23.1cqw",
              height: "1.96cqw",
            }}
          >
            <div
              className="pg-soc"
              style={{
                height: "100%",
                borderRadius: 9999,
                backgroundImage: "linear-gradient(to right, #34d399, #6ee7b7)",
                transition: "width 1400ms cubic-bezier(0,0,.2,1)",
                width: `${soc}%`,
              }}
            />
          </div>
          <span
            style={{
              color: "rgba(255,255,255,.35)",
              fontSize: "2.19cqw",
              letterSpacing: ".28em",
              marginTop: "1.39cqw",
            }}
          >
            SOC 72%
          </span>
        </div>
        {needle(
          "cubic-bezier(.16,1.28,.4,1)",
          {
            background: "linear-gradient(#C88CFA,#9333EA 50%,#6B21A8)",
            filter: "drop-shadow(0 0 8px rgba(168,85,247,.6))",
          },
          "linear-gradient(#581C87,#2E1065)",
        )}
        {hubDot("9%", "rgba(192,132,252,.85)", "38%", "rgba(168,85,247,.85)")}
        {finish}
      </>
    );
  } else {
    const sub = spec.sub!;
    faceBackground =
      "radial-gradient(closest-side at 50% 32%, #F58135 0%, #E76A2A 44%, #D0541B 74%, #B94512 100%)";
    face = (
      <>
        <div
          className="pg-layer"
          style={{
            background:
              "repeating-conic-gradient(from 0deg, rgba(255,255,255,.055) 0deg 1.2deg, rgba(0,0,0,.05) 1.2deg 2.4deg)",
            ...maskStyle("radial-gradient(closest-side, #000 0%, #000 58%, transparent 66%)"),
            opacity: 0.6,
          }}
        />
        {zoneBand}
        <div className="pg-layer">{ticks(spec, spec.tickColor)}</div>
        <div className="pg-layer">{numerals()}</div>
        <div className="pg-stack" style={{ top: "31%" }}>
          <span className="pg-cap-sm" style={{ color: "rgba(0,0,0,.55)", fontWeight: 500 }}>
            r/min
          </span>
          <span className="pg-cap-sm" style={{ color: "rgba(0,0,0,.4)", marginTop: "0.81cqw" }}>
            ×1000
          </span>
        </div>
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "69%",
            transform: "translate(-50%,-50%)",
            width: "24%",
            aspectRatio: "1",
            borderRadius: 9999,
            overflow: "hidden",
            border: "1px solid rgba(0,0,0,.45)",
            boxShadow: "inset 0 3px 8px rgba(0,0,0,.55)",
            background: "radial-gradient(closest-side at 50% 30%, #8C3A11, #6E2A08)",
          }}
        >
          <div className="pg-layer">
            {ticks(
              sub,
              (v) => (v >= 115 ? "rgba(248,113,113,.95)" : "rgba(255,255,255,.55)"),
              true,
            )}
          </div>
          <span
            style={{
              position: "absolute",
              left: "50%",
              bottom: "15%",
              transform: "translateX(-50%)",
              color: "rgba(255,255,255,.55)",
              whiteSpace: "nowrap",
              fontSize: "1.96cqw",
              letterSpacing: ".2em",
              textIndent: ".2em",
            }}
          >
            TEMP °C
          </span>
          <div
            className="pg-needle"
            style={
              {
                "--needle-duration": "1700ms",
                "--angle": `${angleFor(sub, subValue)}deg`,
              } as React.CSSProperties
            }
          >
            <i
              className="pg-blade"
              style={{
                top: "19%",
                width: "5.5%",
                background: "linear-gradient(#FCA5A5,#B91C1C)",
              }}
            />
          </div>
          <div className="pg-hub" style={{ width: "15%" }} />
        </div>
        {needle(
          "cubic-bezier(.16,1.28,.4,1)",
          { background: "linear-gradient(#F87171,#DC2626 50%,#991B1B)" },
          "linear-gradient(#7F1D1D,#450A0A)",
        )}
        {hubDot("9%", "#DC2626", "40%", "rgba(220,38,38,.85)")}
        {finish}
      </>
    );
  }

  const filter =
    hue === 0 && saturation === 1 && brightness === 1
      ? undefined
      : `hue-rotate(${hue}deg) saturate(${saturation}) brightness(${brightness})`;

  return (
    <div
      ref={rootRef}
      className={cn("pg-root w-full", prefersReducedMotion && "pg-still", className)}
      style={{
        opacity: revealed ? 1 : 0,
        transform: revealed ? "translateY(0)" : "translateY(20px)",
        filter: revealed ? filter : ["blur(4px)", filter].filter(Boolean).join(" "),
        transition: prefersReducedMotion ? "none" : undefined,
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="pg-plate">
        {SCREW_ANGLES[variant].map((a, i) => (
          <span
            key={i}
            className="pg-screw"
            style={
              {
                "--a": `${a}deg`,
                [i < 2 ? "top" : "bottom"]: "6.4cqw",
                [i % 2 === 0 ? "left" : "right"]: "6.4cqw",
              } as React.CSSProperties
            }
          />
        ))}
        <div className="pg-shell">
          <div className="pg-bezel">
            <div className="pg-face" style={{ background: faceBackground }}>
              {face}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
