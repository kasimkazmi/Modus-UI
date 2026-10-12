"use client";
// Scrubbable number chip: drag sideways to change, stretch past the limits, click to type.

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { animate, AnimatePresence, motion, useMotionValue, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "h-7 gap-2 px-2 text-[10px]",
  md: "h-8 gap-3 px-2.5 text-[11px]",
  lg: "h-10 gap-3 px-3 text-xs",
};

const decimals = (n: number) => (String(n).split(".")[1] ?? "").length;
const show = (n: number) => String(Number(n.toFixed(6)));

export interface DragNumberProps {
  label?: string;
  suffix?: string;
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  size?: keyof typeof SIZES;
  sensitivity?: number;
  rubberReach?: number;
  returnDuration?: number;
  coarseMultiplier?: number;
  fineMultiplier?: number;
  showDelta?: boolean;
  showDirty?: boolean;
  showFill?: boolean;
  accent?: string;
  chipColor?: string;
  disabled?: boolean;
  onChange?: (value: number) => void;
  onCommit?: (value: number) => void;
  className?: string;
}

export function DragNumber({
  label = "Weight",
  suffix = "pt",
  value,
  defaultValue = 42,
  min = 0,
  max = 100,
  step = 1,
  size = "md",
  sensitivity = 2,
  rubberReach = 8,
  returnDuration = 300,
  coarseMultiplier = 10,
  fineMultiplier = 0.1,
  showDelta = true,
  showDirty = true,
  showFill = true,
  accent = "hsl(var(--primary))",
  chipColor = "hsl(var(--muted))",
  disabled = false,
  onChange,
  onCommit,
  className,
}: DragNumberProps) {
  const reduce = useReducedMotion();
  const [inner, setInner] = useState(defaultValue);
  const [draft, setDraft] = useState<string | null>(null);
  const [delta, setDelta] = useState<number | null>(null);
  const current = value ?? inner;
  const stretch = useMotionValue(0);
  const drag = useRef<{ x: number; start: number; moved: boolean } | null>(null);
  const places = decimals(step) + decimals(fineMultiplier);

  const set = (n: number) => {
    const next = Number(Math.min(max, Math.max(min, n)).toFixed(places));
    if (value === undefined) setInner(next);
    if (next !== current) onChange?.(next);
    return next;
  };

  const unit = (e: { shiftKey: boolean; altKey: boolean }) =>
    step * (e.shiftKey ? coarseMultiplier : e.altKey ? fineMultiplier : 1);

  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled || draft !== null) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, start: current, moved: false };
  };

  const move = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const px = e.clientX - d.x;
    if (Math.abs(px) > 3) d.moved = true;
    if (!d.moved) return;
    const u = unit(e);
    const raw = d.start + Math.round(px / sensitivity) * u;
    const next = set(Math.round(raw / u) * u);
    setDelta(next - d.start);
    // Past a limit the chip stretches, easing toward rubberReach pixels.
    const over = raw < min ? raw - min : raw > max ? raw - max : 0;
    stretch.set(rubberReach * Math.tanh(((over / u) * sensitivity) / (rubberReach * 4)));
  };

  const up = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    animate(
      stretch,
      0,
      reduce ? { duration: 0 } : { type: "spring", duration: returnDuration / 1000, bounce: 0.3 },
    );
    setDelta(null);
    if (d.moved) onCommit?.(current);
    else setDraft(show(current));
  };

  const finish = (keep: boolean) => {
    if (keep && draft !== null && draft.trim() !== "" && !Number.isNaN(Number(draft)))
      onCommit?.(set(Number(draft)));
    setDraft(null);
  };

  const key = (e: KeyboardEvent) => {
    const dir =
      e.key === "ArrowRight" || e.key === "ArrowUp"
        ? 1
        : e.key === "ArrowLeft" || e.key === "ArrowDown"
          ? -1
          : 0;
    if (e.key === "Enter") return setDraft(show(current));
    if (!dir) return;
    e.preventDefault();
    onCommit?.(set(current + dir * unit(e)));
  };

  const pct = ((current - min) / (max - min || 1)) * 100;

  return (
    <motion.div
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={current}
      aria-disabled={disabled || undefined}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onKeyDown={draft === null ? key : undefined}
      style={{ x: stretch, background: chipColor }}
      className={cn(
        "relative inline-flex w-36 cursor-ew-resize touch-none select-none items-center overflow-hidden rounded-md font-mono uppercase tracking-[0.14em] outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]",
        SIZES[size],
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      {showFill && (
        <motion.span
          aria-hidden
          className="absolute inset-y-0 left-0 opacity-20"
          style={{ background: accent }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: reduce ? 0 : 0.12 }}
        />
      )}
      <span className="relative flex items-center gap-1.5 text-[hsl(var(--muted-foreground))]">
        {label}
        {showDirty && current !== defaultValue && (
          <span className="size-1 rounded-full" style={{ background: accent }} />
        )}
      </span>
      <span className="relative ml-auto flex items-baseline gap-1 normal-case tracking-normal">
        <AnimatePresence>
          {showDelta && delta !== null && delta !== 0 && (
            <motion.span
              className="text-[9px] tabular-nums"
              style={{ color: accent }}
              initial={{ opacity: 0, y: reduce ? 0 : 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {delta > 0 ? "+" : ""}
              {show(delta)}
            </motion.span>
          )}
        </AnimatePresence>
        {draft !== null ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => finish(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") finish(true);
              if (e.key === "Escape") finish(false);
            }}
            inputMode="decimal"
            aria-label={`${label} value`}
            className="w-12 bg-transparent text-right tabular-nums text-[hsl(var(--foreground))] outline-none"
          />
        ) : (
          <span className="tabular-nums text-[hsl(var(--foreground))]">{show(current)}</span>
        )}
        <span className="text-[hsl(var(--muted-foreground))]">{suffix}</span>
      </span>
    </motion.div>
  );
}
