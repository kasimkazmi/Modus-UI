"use client";

import { cn } from "@/lib/utils";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { animate, useMotionValue, useMotionValueEvent, useReducedMotion } from "framer-motion";
import { Tick02Icon } from "@hugeicons/core-free-icons";

const VISUAL_DURATION = 0.2;
const RULE_END = 0.84;
const SWELL = 0.35;
const TICK_PATH = String(Tick02Icon[0][1].d);
const ORIGIN = {
  left: "left center",
  center: "center",
  right: "right center",
  none: "left center",
};

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const zetaOf = (bounce) =>
  bounce <= 0 ? 1 : -Math.log(bounce) / Math.sqrt(Math.PI ** 2 + Math.log(bounce) ** 2);

const readings = (t, doneOpacity, strikeLag) => {
  const held = clamp01(t);
  return {
    fill: `scale(${Math.max(t, 0)})`,
    box: `scale(${1 + SWELL * Math.max(0, t - 1)})`,
    tick: 1 - held,
    word: 1 - (1 - doneOpacity) * held,
    rule: `scaleX(${clamp01((held - strikeLag) / (RULE_END - strikeLag))})`,
  };
};

interface SpringCheckProps {
  label?: string;
  checked?: any;
  defaultChecked?: boolean;
  onChange?: any;
  disabled?: boolean;
  color?: string;
  fillColor?: string;
  checkColor?: string;
  boxSize?: number;
  boxRadius?: number;
  fontSize?: number;
  bounce?: number;
  strikeLag?: number;
  doneOpacity?: number;
  strike?: string;
  ariaLabel?: any;
  className?: string;
  className?: string;
}

export function SpringCheck({
  label = "Ship the build",
  checked,
  defaultChecked = false,
  onChange,
  disabled = false,
  color = "hsl(var(--primary))",
  fillColor = "hsl(var(--primary))",
  checkColor = "hsl(var(--primary))",
  boxSize = 28,
  boxRadius = 9,
  fontSize = 18,
  bounce = 0.2,
  strikeLag = 0.12,
  doneOpacity = 0.42,
  strike = "left",
  ariaLabel,
  className = "",
}: SpringCheckProps) {
  const controlled = checked !== undefined;
  const [inner, setInner] = useState(defaultChecked);
  const on = controlled ? checked : inner;
  const reduce = useReducedMotion();

  const t = useMotionValue(on ? 1 : 0);
  const viaPointer = useRef(false);
  const instant = useRef(false);
  const rowRef = useRef(null);
  const boxRef = useRef(null);
  const fillRef = useRef(null);
  const tickRef = useRef(null);
  const wordRef = useRef(null);
  const ruleRef = useRef(null);
  const cfg = useRef({ doneOpacity, strikeLag });
  cfg.current = { doneOpacity, strikeLag };

  const write = (value) => {
    const r = readings(value, cfg.current.doneOpacity, cfg.current.strikeLag);
    if (fillRef.current) fillRef.current.style.transform = r.fill;
    if (boxRef.current) boxRef.current.style.transform = r.box;
    if (tickRef.current) tickRef.current.style.strokeDashoffset = r.tick;
    if (wordRef.current) wordRef.current.style.opacity = r.word;
    if (ruleRef.current) ruleRef.current.style.transform = r.rule;
  };
  useMotionValueEvent(t, "change", write);
  useLayoutEffect(() => {
    write(t.get());
  });

  useEffect(() => {
    const target = on ? 1 : 0;
    if (reduce || instant.current) {
      instant.current = false;
      t.jump(target);
      return undefined;
    }
    if (t.get() === target && t.getVelocity() === 0) return undefined;
    const controls = animate(t, target, {
      type: "spring",
      visualDuration: VISUAL_DURATION,
      bounce: 1 - zetaOf(bounce),
    });
    return () => controls.stop();
  }, [on, reduce, bounce, t]);

  const handlePointerDown = (e) => {
    if (e.button !== 0 || disabled) return;
    viaPointer.current = true;
    if (!reduce && rowRef.current) rowRef.current.dataset.pressed = "";
  };
  const handlePointerUp = () => {
    if (rowRef.current) delete rowRef.current.dataset.pressed;
  };
  const handlePointerCancel = () => {
    viaPointer.current = false;
    handlePointerUp();
  };
  const toggle = () => {
    if (disabled) return;
    instant.current = !viaPointer.current;
    viaPointer.current = false;
    const next = !on;
    if (!controlled) setInner(next);
    onChange?.(next);
  };

  const r = readings(t.get(), doneOpacity, strikeLag);
  const ring = boxSize >= 24 ? 2 : 1.5;
  const gap = Math.min(16, Math.max(8, Math.round(boxSize * 0.43)));
  const ruleHeight = Math.max(1.5, Math.round(fontSize / 6) / 2);

  return (
    <button
      ref={rowRef}
      type="button"
      role="checkbox"
      aria-checked={on}
      aria-label={ariaLabel}
      disabled={disabled}
      className={`group relative inline-flex min-h-[var(--sc-row)] cursor-pointer touch-manipulation select-none items-center gap-[var(--sc-gap)] border-0 bg-transparent p-0 text-left text-[length:var(--sc-font)] font-medium leading-[1.2] tracking-[-0.01em] outline-none [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none] [color:var(--sc-ink)] disabled:cursor-not-allowed disabled:opacity-50${className ? ` ${className}` : ""}`}
      style={{
        "--sc-ink": color,
        "--sc-fill": fillColor,
        "--sc-check": checkColor,
        "--sc-box": `${boxSize}px`,
        "--sc-radius": `${boxRadius}px`,
        "--sc-font": `${fontSize}px`,
        "--sc-ring": `${ring}px`,
        "--sc-gap": `${gap}px`,
        "--sc-row": `${Math.max(44, boxSize + 16)}px`,
        "--sc-rule": `${ruleHeight}px`,
        "--sc-origin": ORIGIN[strike] || ORIGIN.left,
        "--sc-ease-out": "cubic-bezier(0.23, 1, 0.32, 1)",
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerCancel}
      onClick={toggle}
    >
      <span className="h-[var(--sc-box)] w-[var(--sc-box)] flex-none rounded-[var(--sc-radius)] [transition:transform_160ms_var(--sc-ease-out)] group-focus-visible:outline-offset-[3px] group-focus-visible:[outline:2px_solid_color-mix(in_srgb,var(--sc-ink)_45%,transparent)] group-data-[pressed]:[transform:scale(0.95)] motion-reduce:transition-none">
        <span
          ref={boxRef}
          className="relative grid h-full w-full origin-center place-items-center overflow-hidden rounded-[inherit]"
          style={{ transform: r.box }}
        >
          <span
            className="absolute inset-0 rounded-[inherit] opacity-[0.28] [box-shadow:inset_0_0_0_var(--sc-ring)_var(--sc-ink)] [transition:opacity_120ms_ease] [@media(hover:hover)_and_(pointer:fine)]:group-enabled:group-hover:opacity-50"
            aria-hidden="true"
          />
          <span
            ref={fillRef}
            className="absolute inset-0 origin-center rounded-[inherit] [background:var(--sc-fill)]"
            style={{ transform: r.fill }}
          />
          <svg
            className="relative h-[68%] w-[68%] overflow-visible fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2.6] [stroke:var(--sc-check)]"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              ref={tickRef}
              d={TICK_PATH}
              pathLength={1}
              strokeDasharray={1}
              style={{ strokeDashoffset: r.tick }}
            />
          </svg>
        </span>
      </span>
      <span className="relative inline-block">
        <span ref={wordRef} className="inline-block" style={{ opacity: r.word }}>
          {label}
        </span>
        {strike !== "none" ? (
          <span
            ref={ruleRef}
            className="pointer-events-none absolute inset-x-0 top-[46%] h-[var(--sc-rule)] rounded-[2px] bg-current [transform-origin:var(--sc-origin)]"
            aria-hidden="true"
            style={{ transform: r.rule }}
          />
        ) : null}
      </span>
    </button>
  );
}
