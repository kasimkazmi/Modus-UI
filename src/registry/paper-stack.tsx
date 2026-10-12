"use client";
// A paper sleeve whose note slips fan out above it when opened.

import { useState, type PointerEvent } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

type PaperItem = string | { label: string; value?: string };

const DEFAULT_ITEMS: PaperItem[] = [
  "Set the serif larger",
  "Loosen the leading",
  "Proof the colophon",
  "Approve the cover",
];

export interface PaperStackProps {
  items?: PaperItem[];
  label?: string;
  sublabel?: string;
  trigger?: "hover" | "click";
  defaultOpen?: boolean;
  closeOnSelect?: boolean;
  physics?: boolean;
  drift?: number;
  onSelect?: (value: string, index: number) => void;
  onOpenChange?: (open: boolean) => void;
  folderColor?: string;
  frontColor?: string;
  paperColor?: string;
  itemColor?: string;
  itemTextColor?: string;
  labelColor?: string;
  width?: number;
  height?: number;
  radius?: number;
  spread?: number;
  lift?: number;
  tilt?: number;
  flapAngle?: number;
  restAngle?: number;
  openDuration?: number;
  stagger?: number;
  bounce?: number;
  className?: string;
}

export function PaperStack({
  items = DEFAULT_ITEMS,
  label = "Margin notes",
  sublabel = "",
  trigger = "hover",
  defaultOpen = false,
  closeOnSelect = true,
  physics = true,
  drift = 0.5,
  onSelect,
  onOpenChange,
  folderColor = "hsl(var(--muted))",
  frontColor = "hsl(var(--card))",
  paperColor = "hsl(var(--background))",
  itemColor = "hsl(var(--foreground))",
  itemTextColor = "hsl(var(--background))",
  labelColor = "hsl(var(--foreground))",
  width = 200,
  height = 148,
  radius = 14,
  spread = 180,
  lift = 26,
  tilt = 8,
  flapAngle = 34,
  restAngle = 16,
  openDuration = 520,
  stagger = 45,
  bounce = 0.3,
  className,
}: PaperStackProps) {
  const reduce = useReducedMotion();
  const [open, setOpenState] = useState(defaultOpen);
  const setOpen = (next: boolean) => {
    if (next === open) return;
    setOpenState(next);
    onOpenChange?.(next);
  };

  // Pointer offset from the centre, -1..1, drives the sway.
  const pointer = useMotionValue(0);
  const sway = useSpring(pointer, { stiffness: 120, damping: 14 });
  const swayDeg = useTransform(sway, (v) => v * tilt * 0.6);
  const swayX = useTransform(sway, (v) => v * 8);

  const track = (e: PointerEvent<HTMLDivElement>) => {
    if (!physics || reduce) return;
    const box = e.currentTarget.getBoundingClientRect();
    pointer.set(((e.clientX - box.left) / box.width) * 2 - 1);
  };

  const n = items.length;
  const spring = (i: number) =>
    reduce
      ? { duration: 0 }
      : {
          type: "spring" as const,
          duration: openDuration / 1000,
          bounce,
          delay: open ? (i * stagger) / 1000 : 0,
        };

  return (
    <div
      className={cn("relative select-none", className)}
      style={{ width, height, perspective: 800 }}
      onPointerEnter={() => trigger === "hover" && setOpen(true)}
      onPointerLeave={() => {
        pointer.set(0);
        if (trigger === "hover") setOpen(false);
      }}
      onPointerMove={track}
    >
      {/* Back panel with a tab. */}
      <div
        className="absolute inset-0"
        style={{ background: folderColor, borderRadius: radius, borderTopLeftRadius: 4 }}
      />
      <div
        className="absolute -top-3 left-0 h-5 w-2/5"
        style={{ background: folderColor, borderRadius: `${radius}px ${radius}px 0 0` }}
      />

      {/* Slips. Closed: tucked inside. Open: fanned out above. */}
      {items.map((item, i) => {
        const text = typeof item === "string" ? item : item.label;
        const value = typeof item === "string" ? item : (item.value ?? item.label);
        const t = n > 1 ? i / (n - 1) - 0.5 : 0;
        const bob = drift && open && !reduce ? [0, -3 * drift, 0] : 0;
        return (
          <motion.div
            key={text}
            className="absolute left-1/2 top-2"
            style={{ x: swayX, rotate: swayDeg, zIndex: 1 }}
            initial={false}
            animate={{ y: bob }}
            transition={{ duration: 2.4 + i * 0.3, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.button
              type="button"
              drag={open}
              dragSnapToOrigin
              dragElastic={0.4}
              whileDrag={{ scale: 1.06, zIndex: 10 }}
              tabIndex={open ? 0 : -1}
              aria-hidden={!open}
              onClick={() => {
                onSelect?.(value, i);
                if (closeOnSelect) setOpen(false);
              }}
              initial={false}
              animate={
                open
                  ? {
                      x: `calc(-50% + ${t * spread}px)`,
                      y: -lift - height * 0.55 - Math.abs(t) * 12 - (i % 2) * 30,
                      rotate: t * tilt * 2,
                      background: itemColor,
                      color: itemTextColor,
                    }
                  : {
                      x: `calc(-50% + ${t * 18}px)`,
                      y: i * 3,
                      rotate: t * 3,
                      background: paperColor,
                      color: paperColor,
                    }
              }
              transition={spring(i)}
              className="cursor-grab whitespace-nowrap rounded-[4px] px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] active:cursor-grabbing"
            >
              {text}
            </motion.button>
          </motion.div>
        );
      })}

      {/* Front flap hinged on its bottom edge. */}
      <motion.button
        type="button"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen(trigger === "hover" || !open)}
        className="absolute inset-x-0 bottom-0 flex h-[78%] flex-col items-start justify-end p-4 text-left shadow-[0_-1px_0_hsl(var(--border))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
        style={{
          background: frontColor,
          borderRadius: radius,
          transformOrigin: "50% 100%",
          zIndex: 2,
          color: labelColor,
        }}
        initial={false}
        animate={{ rotateX: -(open ? flapAngle : restAngle) }}
        transition={
          reduce ? { duration: 0 } : { type: "spring", duration: openDuration / 1000, bounce }
        }
      >
        <span className="font-serif text-lg leading-tight">{label}</span>
        {sublabel && (
          <span className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.16em] opacity-60">
            {sublabel}
          </span>
        )}
      </motion.button>
    </div>
  );
}
