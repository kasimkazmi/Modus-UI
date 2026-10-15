"use client";
// Scrollable list whose rows rise into view, with keyboard selection.
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedListProps {
  items?: ReactNode[] | string[];
  onItemSelect?: (item: any, index: number) => void;
  className?: string;
  itemClassName?: string;
  showGradients?: boolean;
  enableArrowNavigation?: boolean;
  displayScrollbar?: boolean;
  initialSelectedIndex?: number;
}

const SAMPLE = Array.from({ length: 12 }, (_, i) => `Item ${i + 1}`);

export function AnimatedList({
  items = SAMPLE,
  onItemSelect,
  className,
  itemClassName,
  showGradients = true,
  enableArrowNavigation = true,
  displayScrollbar = true,
  initialSelectedIndex = -1,
}: AnimatedListProps) {
  const reduce = useReducedMotion();
  const scroller = useRef<HTMLDivElement>(null);
  const rows = useRef<(HTMLLIElement | null)[]>([]);
  const [active, setActive] = useState(initialSelectedIndex);
  const [edges, setEdges] = useState({ top: false, bottom: false });

  const measure = () => {
    const el = scroller.current;
    if (!el) return;
    setEdges({
      top: el.scrollTop > 4,
      bottom: el.scrollTop + el.clientHeight < el.scrollHeight - 4,
    });
  };

  useEffect(measure, [items]);

  useEffect(() => {
    rows.current[active]?.scrollIntoView({
      block: "nearest",
      behavior: reduce ? "auto" : "smooth",
    });
  }, [active, reduce]);

  const select = (index: number) => {
    setActive(index);
    onItemSelect?.(items[index], index);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (!enableArrowNavigation) return;
    const step =
      e.key === "ArrowDown" || (e.key === "Tab" && !e.shiftKey)
        ? 1
        : e.key === "ArrowUp" || (e.key === "Tab" && e.shiftKey)
          ? -1
          : 0;
    if (step) {
      const next = active + step;
      // Let Tab leave the list at either end.
      if (next < 0 || next >= items.length) {
        if (e.key !== "Tab") e.preventDefault();
        return;
      }
      e.preventDefault();
      setActive(next);
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      select(active);
    }
  };

  return (
    <div className={cn("relative w-full max-w-md", className)}>
      <div
        ref={scroller}
        onScroll={measure}
        onKeyDown={onKeyDown}
        tabIndex={0}
        role="listbox"
        aria-activedescendant={active >= 0 ? `al-${active}` : undefined}
        className={cn(
          "max-h-[400px] overflow-y-auto rounded-xl p-1 outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]",
          !displayScrollbar && "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        <ul className="flex list-none flex-col gap-3 p-0">
          {items.map((item, i) => (
            <motion.li
              key={i}
              id={`al-${i}`}
              role="option"
              aria-selected={i === active}
              ref={(node) => {
                rows.current[i] = node;
              }}
              initial={reduce ? false : { opacity: 0, y: 16, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ root: scroller, amount: 0.4 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              onMouseEnter={() => setActive(i)}
              onClick={() => select(i)}
              className={cn(
                "cursor-pointer rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-[hsl(var(--card-foreground))] transition-colors",
                i === active && "border-[hsl(var(--ring))] bg-[hsl(var(--accent))]",
                itemClassName,
              )}
            >
              {item}
            </motion.li>
          ))}
        </ul>
      </div>
      {showGradients && (
        <>
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-[hsl(var(--background))] to-transparent transition-opacity",
              edges.top ? "opacity-100" : "opacity-0",
            )}
          />
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[hsl(var(--background))] to-transparent transition-opacity",
              edges.bottom ? "opacity-100" : "opacity-0",
            )}
          />
        </>
      )}
    </div>
  );
}
