"use client";
// A ledger entry that slides aside on a swipe to show its actions; swipe far enough to fire the first one.

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

export interface LedgerAction {
  id: string;
  label: string;
}

const DEFAULT_ACTIONS: LedgerAction[] = [
  { id: "archive", label: "Archive" },
  { id: "flag", label: "Flag" },
];

interface GlideLedgerRowProps {
  children: ReactNode;
  actions?: LedgerAction[];
  actionColor?: string;
  drawerColor?: string;
  rowColor?: string;
  textColor?: string;
  height?: number;
  radius?: number;
  actionWidth?: number;
  /** Which way the row slides to open. */
  direction?: "left" | "right";
  snapBounce?: number;
  /** Rubber-band resistance past the drawer (0 = rigid, 1 = free). */
  resistance?: number;
  collapseMs?: number;
  /** Fraction of the row width past which a release fires the first action. */
  commitAt?: number;
  fullSwipe?: boolean;
  disabled?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onAction?: (action: LedgerAction) => void;
  onCommit?: (action: LedgerAction) => void;
  closeOnAction?: boolean;
  haptic?: boolean;
  label?: string;
  style?: CSSProperties;
  className?: string;
}

export function GlideLedgerRow({
  children,
  actions = DEFAULT_ACTIONS,
  actionColor = "hsl(var(--primary))",
  drawerColor = "hsl(var(--muted))",
  rowColor = "hsl(var(--card))",
  textColor = "hsl(var(--foreground))",
  height = 64,
  radius = 16,
  actionWidth = 80,
  direction = "left",
  snapBounce = 0.2,
  resistance = 0.55,
  collapseMs = 200,
  commitAt = 0.6,
  fullSwipe = true,
  disabled = false,
  open,
  onOpenChange,
  onAction,
  onCommit,
  closeOnAction = true,
  haptic = true,
  label = "Ledger entry",
  style,
  className,
}: GlideLedgerRowProps) {
  const reduce = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [innerOpen, setInnerOpen] = useState(false);
  const [gone, setGone] = useState(false);
  const isOpen = open ?? innerOpen;
  const sign = direction === "left" ? -1 : 1;
  const drawer = actionWidth * actions.length;
  const reveal = useTransform(x, (v) => Math.min(1, Math.abs(v) / drawer));

  const spring = reduce
    ? { duration: 0 }
    : { type: "spring" as const, bounce: snapBounce, duration: 0.4 };

  useEffect(() => {
    animate(x, isOpen ? sign * drawer : 0, spring);
    // spring is derived from props already listed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, sign, drawer]);

  const setOpen = (next: boolean) => {
    if (next === isOpen) return animate(x, next ? sign * drawer : 0, spring);
    setInnerOpen(next);
    onOpenChange?.(next);
  };

  const commit = async () => {
    const first = actions[0];
    if (!first) return;
    if (haptic) navigator.vibrate?.(12);
    await animate(x, sign * (box.current?.offsetWidth ?? 400), spring);
    onCommit?.(first);
    onAction?.(first);
    setGone(true);
  };

  const choose = (action: LedgerAction) => {
    onAction?.(action);
    if (closeOnAction) setOpen(false);
  };

  const release = (offset: number, velocity: number) => {
    const travel = Math.max(0, sign * x.get());
    const width = box.current?.offsetWidth ?? 400;
    if (fullSwipe && travel > width * commitAt) return void commit();
    const flicked = Math.abs(velocity) > 400 ? Math.sign(velocity) === sign : null;
    setOpen(flicked ?? (offset !== 0 && travel > drawer / 2));
  };

  return (
    <motion.div
      ref={box}
      aria-label={label}
      className={cn("relative w-full overflow-hidden", className)}
      style={{ borderRadius: radius, ...style }}
      initial={false}
      animate={gone ? { height: 0, opacity: 0 } : { height, opacity: 1 }}
      transition={{ duration: reduce ? 0 : collapseMs / 1000 }}
    >
      <motion.div
        className={cn(
          "absolute inset-y-0 flex",
          direction === "left" ? "right-0 flex-row-reverse" : "left-0",
        )}
        style={{ background: drawerColor, opacity: reveal }}
      >
        {actions.map((action, i) => (
          <button
            key={action.id}
            type="button"
            tabIndex={isOpen ? 0 : -1}
            onClick={() => choose(action)}
            className="h-full font-mono text-[10px] uppercase tracking-[0.14em] outline-none focus-visible:underline"
            style={{
              width: actionWidth,
              height,
              background: i === 0 ? actionColor : undefined,
              color: i === 0 ? "hsl(var(--primary-foreground))" : textColor,
            }}
          >
            {action.label}
          </button>
        ))}
      </motion.div>
      <motion.div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-expanded={isOpen}
        aria-label={`${label}: ${isOpen ? "hide" : "show"} actions`}
        drag={disabled ? false : "x"}
        dragDirectionLock
        dragConstraints={
          direction === "left" ? { left: -drawer, right: 0 } : { left: 0, right: drawer }
        }
        dragElastic={resistance}
        dragMomentum={false}
        onDragEnd={(_, info) => release(info.offset.x, info.velocity.x)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(!isOpen);
          } else if (e.key === "Escape") setOpen(false);
        }}
        className="relative flex h-full cursor-grab touch-pan-y items-center outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring active:cursor-grabbing"
        style={{ x, background: rowColor, color: textColor, borderRadius: radius }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
