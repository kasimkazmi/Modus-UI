"use client";
// Ported from React Bits' Jelly Radio (© David Haz).

import { cn } from "@/lib/utils";
import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  motionValue,
  useReducedMotion,
  useTransform,
  type HTMLMotionProps,
  type MotionValue,
  type Transition,
} from "framer-motion";

const DEFAULT_ITEMS = ["Draft", "Proof", "Press", "Print"];
type Size = "sm" | "md" | "lg";
const SIZES: Record<Size, [number, number, number]> = {
  sm: [28, 12, 12],
  md: [36, 13, 16],
  lg: [44, 14, 20],
};

interface BloomChoiceItem {
  value: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface ChipMotion {
  x: MotionValue<number>;
  sx: MotionValue<number>;
  sy: MotionValue<number>;
}

type ChipProps = HTMLMotionProps<"button"> & { mv: ChipMotion };

const spring = (k: number, m: number, bounce: number): Transition => ({
  type: "spring",
  stiffness: k,
  damping: 2 * Math.sqrt(k * m) * (1 - bounce),
  mass: m,
});

const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { mv, children, ...rest },
  ref,
) {
  const transform = useTransform(
    () => `translateX(${mv.x.get()}px) scale(${mv.sx.get()}, ${mv.sy.get()})`,
  );
  return (
    <motion.button ref={ref} style={{ transform }} {...rest}>
      {children}
    </motion.button>
  );
});

interface BloomChoiceProps {
  items?: Array<string | BloomChoiceItem>;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string, index: number) => void;
  chipColor?: string;
  activeColor?: string;
  textColor?: string;
  activeTextColor?: string;
  size?: Size;
  gap?: number;
  radius?: number;
  swell?: number;
  barge?: number;
  shrink?: number;
  jelly?: number;
  bounce?: number;
  stagger?: number;
  stiffness?: number;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

export function BloomChoice({
  items = DEFAULT_ITEMS,
  value,
  defaultValue,
  onChange,
  chipColor = "hsl(var(--muted))",
  activeColor = "hsl(var(--primary))",
  textColor = "hsl(var(--muted-foreground))",
  activeTextColor = "hsl(var(--primary-foreground))",
  size = "md",
  gap = 8,
  radius = 18,
  swell = 0.2,
  barge = 6,
  shrink = 0.05,
  jelly = 1,
  bounce = 0.25,
  stagger = 22,
  stiffness = 580,
  disabled = false,
  ariaLabel = "Options",
  className = "",
}: BloomChoiceProps) {
  const list: BloomChoiceItem[] = items.map((it) =>
    typeof it === "string" ? { value: it, label: it } : it,
  );
  const [inner, setInner] = useState(() => defaultValue ?? list[0]?.value);
  const current = value ?? inner;
  const at = Math.max(
    0,
    list.findIndex((it) => it.value === current),
  );
  const reduce = useReducedMotion();
  const groupRef = useRef<HTMLDivElement | null>(null);
  const chipRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const widths = useRef<number[]>([]);
  const mvs = useRef<ChipMotion[]>([]);
  const applied = useRef(at);
  const cfg = useRef({
    swell,
    barge,
    shrink,
    jelly,
    bounce,
    stagger,
    stiffness,
    reduce,
    count: list.length,
  });
  cfg.current = {
    swell,
    barge,
    shrink,
    jelly,
    bounce,
    stagger,
    stiffness,
    reduce,
    count: list.length,
  };
  const [h, font, px] = SIZES[size] ?? SIZES.md;
  const itemsKey = list.map((it) => it.value).join("|");

  const mvFor = (i: number) => {
    let mv = mvs.current[i];
    if (!mv) {
      mv = { x: motionValue(0), sx: motionValue(1), sy: motionValue(1) };
      mvs.current[i] = mv;
    }
    return mv;
  };

  const apply = (sel: number, instant: boolean) => {
    const C = cfg.current;
    const group = groupRef.current;
    const rtl = group ? getComputedStyle(group).direction === "rtl" : false;
    const push = ((widths.current[sel] ?? 0) * C.swell) / 2 + C.barge;
    for (let i = 0; i < C.count; i++) {
      const mv = mvFor(i);
      const on = i === sel;
      const far = Math.abs(i - sel);
      const dir = Math.sign(i - sel) * (rtl ? -1 : 1);
      const x = dir * push;
      const s = on ? 1 + C.swell : 1 - C.shrink;
      if (instant || C.reduce) {
        mv.x.jump(x);
        mv.sx.jump(s);
        mv.sy.jump(s);
        continue;
      }
      const k = C.stiffness * (1 - 0.12 * Math.min(far, 3));
      const inFlight = mv.x.isAnimating() || mv.sx.isAnimating() || mv.sy.isAnimating();
      const delay = inFlight ? 0 : (far * C.stagger) / 1000;
      animate(mv.x, x, { ...spring(k, 0.9, C.bounce), delay });
      const j = C.jelly;
      animate(mv.sx, s, {
        ...spring(k * (1 + 0.24 * j), 0.9 - 0.1 * j, Math.min(0.85, C.bounce + 0.3 * j)),
        delay,
      });
      animate(mv.sy, s, {
        ...spring(k * (1 - 0.14 * j), 0.9 + 0.05 * j, C.bounce),
        delay: delay + 0.05 * j,
      });
    }
  };

  const measure = () => {
    const group = groupRef.current;
    if (!group) return;
    widths.current = chipRefs.current.map((el) => el?.offsetWidth ?? 0);
    const chipH = chipRefs.current[0]?.offsetHeight ?? 0;
    const maxW = Math.max(0, ...widths.current);
    group.style.setProperty("--jr-pad-x", `${Math.ceil((maxW * swell * 1.3) / 2 + barge) + 2}px`);
    group.style.setProperty("--jr-pad-y", `${Math.ceil((chipH * swell) / 2) + 2}px`);
  };
  useLayoutEffect(() => {
    const settle = () => {
      measure();
      apply(applied.current, true);
    };
    settle();
    const observer = new ResizeObserver(settle);
    if (groupRef.current) observer.observe(groupRef.current);
    document.fonts?.ready.then(settle);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey, size, gap, swell, barge, shrink]);
  useEffect(() => {
    if (applied.current === at) return;
    applied.current = at;
    apply(at, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [at]);
  useEffect(
    () => () =>
      mvs.current.forEach((mv) => {
        mv.x.destroy();
        mv.sx.destroy();
        mv.sy.destroy();
      }),
    [],
  );

  const commit = (i: number, instant: boolean) => {
    if (disabled || i === at || !list[i] || list[i].disabled) return;
    applied.current = i;
    apply(i, instant);
    if (value === undefined) setInner(list[i].value);
    onChange?.(list[i].value, i);
  };
  const stepFrom = (i: number, dir: number) => {
    const n = list.length;
    let j = i;
    for (let tries = 0; tries < n; tries++) {
      j = (j + dir + n) % n;
      if (!list[j].disabled) return j;
    }
    return i;
  };
  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, i: number) => {
    let next: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = stepFrom(i, 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = stepFrom(i, -1);
    else if (e.key === "Home") next = stepFrom(-1, 1);
    else if (e.key === "End") next = stepFrom(list.length, -1);
    else if (e.key === " " || e.key === "Enter") next = i;
    if (next === null) return;
    e.preventDefault();
    commit(next, true);
    chipRefs.current[next]?.focus();
  };

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label={ariaLabel}
      data-disabled={disabled ? "" : undefined}
      className={`group inline-flex max-w-full select-none flex-wrap items-center justify-center gap-[var(--jr-gap)] px-[var(--jr-pad-x)] py-[var(--jr-pad-y)] [-webkit-touch-callout:none] data-[disabled]:pointer-events-none data-[disabled]:opacity-50${className ? ` ${className}` : ""}`}
      style={
        {
          "--jr-chip": chipColor,
          "--jr-active": activeColor,
          "--jr-text": textColor,
          "--jr-active-text": activeTextColor,
          "--jr-gap": `${gap}px`,
          "--jr-radius": `${radius}px`,
          "--jr-h": `${h}px`,
          "--jr-font": `${font}px`,
          "--jr-px": `${px}px`,
        } as React.CSSProperties
      }
    >
      {list.map((it, i) => (
        <Chip
          key={it.value}
          mv={mvFor(i)}
          ref={(el) => {
            chipRefs.current[i] = el;
          }}
          type="button"
          role="radio"
          aria-checked={i === at}
          tabIndex={i === at ? 0 : -1}
          disabled={disabled || !!it.disabled}
          className="group/chip relative m-0 origin-center cursor-pointer touch-manipulation border-0 bg-transparent p-0 text-inherit outline-none [-webkit-tap-highlight-color:transparent] [font:inherit] disabled:cursor-default disabled:opacity-40 data-[on=true]:cursor-default group-data-[disabled]:disabled:opacity-100"
          data-on={i === at ? "true" : "false"}
          onClick={(e) => commit(i, e.detail === 0)}
          onKeyDown={(e) => onKeyDown(e, i)}
        >
          <span className="relative inline-flex items-center justify-center gap-[0.4em] overflow-hidden whitespace-nowrap rounded-[var(--jr-radius)] bg-[var(--jr-chip)] font-mono uppercase leading-none tracking-[0.14em] [color:var(--jr-text)] [font-size:var(--jr-font)] [height:var(--jr-h)] [padding:0_var(--jr-px)] [transition:transform_160ms_cubic-bezier(0.23,1,0.32,1),background-color_200ms_ease,color_200ms_ease] before:pointer-events-none before:absolute before:inset-0 before:bg-[var(--jr-text)] before:opacity-0 before:content-[''] before:[transition:opacity_160ms_ease] group-active/chip:scale-[0.97] group-data-[on=true]/chip:bg-[var(--jr-active)] group-data-[on=true]/chip:[color:var(--jr-active-text)] motion-reduce:group-active/chip:scale-100 [@media(hover:hover)_and_(pointer:fine)]:group-hover/chip:group-enabled/chip:group-data-[on=false]/chip:before:opacity-[0.11]">
            {it.icon ? <span className="inline-flex">{it.icon}</span> : null}
            <span className="bloom-choice__label">{it.label}</span>
          </span>
        </Chip>
      ))}
    </div>
  );
}
