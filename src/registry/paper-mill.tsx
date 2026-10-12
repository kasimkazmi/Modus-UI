"use client";
// A reorderable stack of cards; drop one on the slot (or press Delete) and it is fed through into falling strips.

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, Reorder, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type MillItem = { id: string | number };

interface Shred<T> {
  item: T;
  top: number;
  height: number;
  key: number;
}

interface PaperMillProps<T extends MillItem> {
  items?: T[];
  renderItem?: (item: T) => ReactNode;
  onShred?: (item: T) => void;
  onReorder?: (items: T[]) => void;
  width?: number;
  height?: number;
  inset?: number;
  gap?: number;
  slitHeight?: number;
  /** Space under the slot the strips fall through. */
  fallHeight?: number;
  /** Feed rate through the slot, in px per second. */
  feedSpeed?: number;
  /** How far (px) the slot snatches a card the moment it lands. */
  bite?: number;
  /** Feed on its own after the bite; off waits for a click on the bitten card. */
  autoFeed?: boolean;
  stripWidth?: number;
  /** How much the strips twist as they fall. */
  curl?: number;
  /** Shred the bottom card on its own shortly after mount; with `loop`, keep going. */
  autoAnimate?: boolean;
  /** Refill from `items` when the stack runs out during auto-animation. */
  loop?: boolean;
  /** Refill from `items` when you empty the stack yourself. */
  loopAfterDelete?: boolean;
  dragTilt?: number;
  lift?: number;
  slitColor?: string;
  color?: string;
  disabled?: boolean;
  className?: string;
}

const defaultRender = (item: MillItem) => (
  <div className="rounded-md border border-border bg-card px-4 py-3 font-serif text-foreground">
    Item {String(item.id)}
  </div>
);

export function PaperMill<T extends MillItem>({
  items = [],
  renderItem = defaultRender,
  onShred,
  onReorder,
  width = 340,
  height = 460,
  inset = 14,
  gap = 10,
  slitHeight = 4,
  fallHeight = 140,
  feedSpeed = 180,
  bite = 18,
  autoFeed = true,
  stripWidth = 10,
  curl = 1,
  autoAnimate = false,
  loop = false,
  loopAfterDelete = false,
  dragTilt = 6,
  lift = 1.02,
  slitColor = "hsl(var(--foreground))",
  color = "hsl(var(--foreground))",
  disabled = false,
  className,
}: PaperMillProps<T>) {
  const reduce = useReducedMotion();
  const [stack, setStack] = useState(items);
  const [shreds, setShreds] = useState<(Shred<T> & { fed: boolean })[]>([]);
  const box = useRef<HTMLDivElement>(null);
  const nodes = useRef(new Map<T["id"], HTMLElement>());
  const serial = useRef(0);
  const slitY = height - fallHeight;
  const cardWidth = width - inset * 2;

  useEffect(() => setStack(items), [items]);

  const shred = (item: T, auto = false) => {
    const node = nodes.current.get(item.id);
    const frame = box.current?.getBoundingClientRect();
    const rect = node?.getBoundingClientRect();
    const top = rect && frame ? rect.top - frame.top : slitY - 60;
    const next = stack.filter((s) => s.id !== item.id);
    setStack(next.length === 0 && (auto ? loop : loopAfterDelete) ? items : next);
    setShreds((s) => [
      ...s,
      { item, top, height: rect?.height ?? 60, key: serial.current++, fed: autoFeed },
    ]);
    onShred?.(item);
  };

  const showed = useRef(false);
  useEffect(() => {
    if (!autoAnimate || disabled || (showed.current && !loop)) return;
    const id = setTimeout(() => {
      if (!stack.length) return;
      showed.current = true;
      shred(stack[stack.length - 1], true);
    }, 1800);
    return () => clearTimeout(id);
    // re-arms after every change to the stack
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAnimate, disabled, loop, stack]);

  return (
    <div ref={box} className={cn("relative select-none", className)} style={{ width, height }}>
      <Reorder.Group
        axis="y"
        values={stack}
        onReorder={(next) => {
          setStack(next);
          onReorder?.(next);
        }}
        className="absolute m-0 flex list-none flex-col p-0"
        style={{ left: inset, right: inset, top: inset, gap, maxHeight: slitY - inset * 2 }}
      >
        {stack.map((item) => (
          <Reorder.Item
            key={item.id}
            value={item}
            ref={(el: HTMLLIElement | null) => {
              if (el) nodes.current.set(item.id, el);
              else nodes.current.delete(item.id);
            }}
            drag={!disabled}
            tabIndex={0}
            aria-label="Card. Press Delete to shred."
            onKeyDown={(e) => {
              if (!disabled && (e.key === "Delete" || e.key === "Backspace")) shred(item);
            }}
            onDragEnd={(_, info) => {
              const frame = box.current?.getBoundingClientRect();
              if (frame && info.point.y - window.scrollY > frame.top + slitY - 30) shred(item);
            }}
            whileDrag={reduce ? { scale: lift } : { scale: lift, rotate: dragTilt }}
            className="relative z-10 cursor-grab list-none rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
          >
            {renderItem(item)}
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {/* The slot */}
      <div
        aria-hidden
        className="absolute rounded-full"
        style={{
          left: inset / 2,
          right: inset / 2,
          top: slitY,
          height: slitHeight,
          background: slitColor,
        }}
      />

      <AnimatePresence>
        {shreds.map((s) => {
          const feedTime = reduce ? 0 : s.height / feedSpeed;
          const strips = Math.max(1, Math.floor(cardWidth / stripWidth));
          return (
            <motion.div
              key={s.key}
              className="pointer-events-none absolute inset-0"
              exit={{ opacity: 0 }}
            >
              {/* Card above the slot, slid down and clipped at the slit. */}
              <div className="absolute inset-x-0 top-0 overflow-hidden" style={{ height: slitY }}>
                <motion.div
                  className="pointer-events-auto absolute"
                  style={{ left: inset, width: cardWidth }}
                  initial={{ top: s.top }}
                  animate={{ top: s.fed ? slitY : slitY - s.height + bite }}
                  transition={{
                    top: s.fed
                      ? { duration: feedTime + 0.25, ease: [0.4, 0, 0.6, 1] }
                      : { duration: 0.25 },
                  }}
                  onClick={() =>
                    setShreds((all) => all.map((o) => (o.key === s.key ? { ...o, fed: true } : o)))
                  }
                  onAnimationComplete={() => {
                    if (s.fed)
                      setTimeout(() => setShreds((all) => all.filter((o) => o.key !== s.key)), 900);
                  }}
                >
                  {renderItem(s.item)}
                </motion.div>
              </div>
              {/* Strips spilling out under the slot. */}
              {s.fed && (
                <div
                  className="absolute flex overflow-hidden"
                  style={{
                    left: inset,
                    width: cardWidth,
                    top: slitY + slitHeight,
                    height: fallHeight,
                  }}
                >
                  {Array.from({ length: strips }, (_, i) => (
                    <motion.span
                      key={i}
                      className="block shrink-0 origin-top"
                      style={{
                        width: stripWidth - 1,
                        marginRight: 1,
                        height: s.height * 0.8,
                        background: color,
                      }}
                      initial={{ y: -s.height * 0.8, opacity: 0.85 }}
                      animate={{
                        // Pushed out at feed speed, then dropped.
                        y: [-s.height * 0.8, 0, fallHeight],
                        opacity: [0.85, 0.85, 0],
                        rotate: reduce ? 0 : [0, 0, curl * (((i * 37) % 11) - 5)],
                      }}
                      transition={{
                        duration: feedTime + 0.8,
                        times: [0, feedTime / (feedTime + 0.8), 1],
                        delay: 0.25 + ((i * 13) % 7) * 0.02,
                        ease: ["linear", "easeIn"],
                      }}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
