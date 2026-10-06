"use client";

import {
  motion,
  useReducedMotion,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { cn } from "@/lib/utils";

interface LiquidTabItem {
  label: string;
  value: string;
}

interface LiquidTabsProps {
  items: LiquidTabItem[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  squish?: number;
  className?: string;
}

export function LiquidTabs({
  items,
  defaultValue,
  value,
  onValueChange,
  squish = 0.22,
  className = "",
}: LiquidTabsProps) {
  const prefersReducedMotion = useReducedMotion();
  const listRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const measured = useRef(false);

  const [uncontrolled, setUncontrolled] = useState(
    defaultValue ?? items[0]?.value ?? "",
  );
  const selected = value ?? uncontrolled;
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.value === selected),
  );

  const spring = { stiffness: 420, damping: 34, mass: 0.9 };
  const x = useSpring(0, spring);
  const width = useSpring(0, spring);

  const velocity = useVelocity(x);
  const stretch = useTransform(
    velocity,
    [-2600, 0, 2600],
    [1 + squish, 1, 1 + squish],
    { clamp: true },
  );
  const scaleX = useSpring(stretch, { stiffness: 500, damping: 30 });
  const scaleY = useTransform(scaleX, (current) => 1 / current);

  const sync = useCallback(() => {
    const tab = tabRefs.current[activeIndex];
    const list = listRef.current;
    if (!tab || !list) return;

    const left = tab.offsetLeft;
    const tabWidth = tab.offsetWidth;

    if (!measured.current || prefersReducedMotion) {
      measured.current = true;
      x.jump(left);
      width.jump(tabWidth);
      return;
    }

    x.set(left);
    width.set(tabWidth);
  }, [activeIndex, prefersReducedMotion, x, width]);

  useLayoutEffect(sync, [sync]);

  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(sync);
    observer.observe(list);
    return () => observer.disconnect();
  }, [sync]);

  const select = (next: string) => {
    if (value === undefined) setUncontrolled(next);
    onValueChange?.(next);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, number> = {
      ArrowRight: 1,
      ArrowLeft: -1,
      Home: -activeIndex,
      End: items.length - 1 - activeIndex,
    };
    const step = moves[event.key];
    if (step === undefined) return;

    event.preventDefault();
    const next = (activeIndex + step + items.length) % items.length;
    const target = items[next];
    if (!target) return;

    select(target.value);
    tabRefs.current[next]?.focus();
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-orientation="horizontal"
      onKeyDown={handleKeyDown}
      className={cn(
        "relative isolate inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 p-1",
        className,
      )}
    >
      <motion.span
        aria-hidden="true"
        style={{ x, width, scaleX, scaleY }}
        className="absolute inset-y-1 left-0 -z-10 rounded-full bg-background shadow-sm ring-1 ring-border/70"
      />

      {items.map((item, index) => {
        const isActive = index === activeIndex;

        return (
          <button
            key={item.value}
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => select(item.value)}
            className={cn(
              "relative rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
