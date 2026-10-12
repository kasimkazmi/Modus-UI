"use client";
// Rotary knob: drag vertically or flick it; a tracer tail chases the head while it moves.

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import {
  animate,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useVelocity,
} from "framer-motion";
import { cn } from "@/lib/utils";

const SEGMENTS = 14;

interface OrbitKnobProps {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  label?: string;
  accent?: string;
  ink?: string;
  size?: number;
  /** Degrees of arc the knob travels from min to max. */
  sweep?: number;
  thickness?: number;
  /** Value units per 100px of vertical drag. */
  speed?: number;
  /** Spring bounce when clicking a point on the track. */
  tapBounce?: number;
  /** Spring bounce when a flick lands. */
  flickBounce?: number;
  /** How far a flick carries past the release point (0 = none). */
  momentum?: number;
  /** Longest tail, in degrees. */
  cometReach?: number;
  cometWidth?: number;
  disabled?: boolean;
  onChange?: (value: number) => void;
  onChangeEnd?: (value: number) => void;
  className?: string;
}

export function OrbitKnob({
  value,
  defaultValue = 38,
  min = 0,
  max = 100,
  step = 1,
  unit = "%",
  label = "Gain",
  accent = "hsl(var(--primary))",
  ink = "hsl(var(--foreground))",
  size = 250,
  sweep = 270,
  thickness = 3,
  speed = 25,
  tapBounce = 0.2,
  flickBounce = 0.1,
  momentum = 1,
  cometReach = 180,
  cometWidth = 12,
  disabled = false,
  onChange,
  onChangeEnd,
  className,
}: OrbitKnobProps) {
  const reduce = useReducedMotion();
  const pos = useMotionValue(value ?? defaultValue);
  const velocity = useVelocity(pos);
  const [shown, setShown] = useState(pos.get());
  const [tail, setTail] = useState(0);
  const drag = useRef<{ y: number; from: number; moved: boolean } | null>(null);

  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const snap = (v: number) => clamp(Math.round((v - min) / step) * step + min);
  const degPerUnit = sweep / (max - min);

  useEffect(() => {
    if (value !== undefined && !drag.current && !pos.isAnimating()) pos.set(value);
  }, [value, pos]);

  useMotionValueEvent(pos, "change", (v) => {
    setShown(v);
    const next = snap(v);
    if (next !== snap(shown)) onChange?.(next);
  });
  useMotionValueEvent(velocity, "change", (v) =>
    setTail(reduce ? 0 : Math.min(cometReach, Math.abs(v) * degPerUnit * 0.12)),
  );

  const settle = (target: number, bounce: number) =>
    animate(pos, snap(target), {
      type: "spring",
      bounce,
      duration: reduce ? 0 : 0.6,
      onComplete: () => {
        setTail(0);
        onChangeEnd?.(snap(target));
      },
    });

  const r = size / 2 - cometWidth;
  const c = size / 2;
  const start = 90 + (360 - sweep) / 2; // svg degrees, clockwise from +x
  const point = (deg: number, radius = r) => {
    const a = (deg * Math.PI) / 180;
    return [c + radius * Math.cos(a), c + radius * Math.sin(a)];
  };
  const arc = (from: number, to: number) => {
    const [x1, y1] = point(from);
    const [x2, y2] = point(to);
    return `M${x1} ${y1}A${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2} ${y2}`;
  };
  const head = start + (shown - min) * degPerUnit;
  const dir = Math.sign(velocity.get()) || 1;
  const [hx, hy] = point(head);

  const onDown = (e: PointerEvent<SVGSVGElement>) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pos.stop();
    drag.current = { y: e.clientY, from: pos.get(), moved: false };
  };
  const onMove = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dy = d.y - e.clientY;
    if (Math.abs(dy) > 3) d.moved = true;
    if (d.moved) pos.set(clamp(d.from + (dy / 100) * speed));
  };
  const onUp = (e: PointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (d.moved) return settle(pos.get() + velocity.get() * 0.15 * momentum, flickBounce);
    // A tap jumps to the touched point on the track.
    const box = e.currentTarget.getBoundingClientRect();
    const deg = (Math.atan2(e.clientY - box.top - c, e.clientX - box.left - c) * 180) / Math.PI;
    const along = (((deg - start) % 360) + 360) % 360;
    if (along <= sweep) settle(min + along / degPerUnit, tapBounce);
  };
  const onKey = (e: KeyboardEvent) => {
    const big = (max - min) / 10;
    const delta = {
      ArrowUp: step,
      ArrowRight: step,
      ArrowDown: -step,
      ArrowLeft: -step,
      PageUp: big,
      PageDown: -big,
      Home: -Infinity,
      End: Infinity,
    }[e.key];
    if (delta === undefined || disabled) return;
    e.preventDefault();
    settle(clamp(snap(pos.get()) + delta), tapBounce);
  };

  const current = snap(shown);

  return (
    <div
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={current}
      aria-valuetext={`${current}${unit}`}
      aria-disabled={disabled || undefined}
      onKeyDown={onKey}
      className={cn(
        "relative inline-grid select-none place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring",
        disabled && "opacity-50",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className={cn(
          "absolute inset-0 touch-none",
          disabled ? "cursor-not-allowed" : "cursor-ns-resize",
        )}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        fill="none"
        strokeLinecap="round"
      >
        <path
          d={arc(start, start + sweep)}
          stroke={ink}
          strokeOpacity={0.18}
          strokeWidth={thickness}
        />
        <path d={arc(start, Math.max(start + 0.01, head))} stroke={ink} strokeWidth={thickness} />
        {tail > 1 &&
          Array.from({ length: SEGMENTS }, (_, i) => {
            const a = head - (dir * (tail * i)) / SEGMENTS;
            const b = head - (dir * (tail * (i + 1))) / SEGMENTS;
            const [x1, y1] = point(a);
            const [x2, y2] = point(b);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={accent}
                strokeOpacity={1 - i / SEGMENTS}
                strokeWidth={cometWidth * (1 - i / SEGMENTS) + 1}
              />
            );
          })}
        <circle cx={hx} cy={hy} r={thickness + 3} fill={tail > 1 ? accent : ink} />
      </svg>
      <div className="pointer-events-none flex flex-col items-center" style={{ color: ink }}>
        <span className="font-serif tabular-nums leading-none" style={{ fontSize: size * 0.16 }}>
          {current}
          <span className="ml-0.5 align-top text-[0.4em] opacity-50">{unit}</span>
        </span>
        <span className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] opacity-60">
          {label}
        </span>
      </div>
    </div>
  );
}
