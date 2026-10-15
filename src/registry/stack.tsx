"use client";
// A fanned deck of cards; drag or tap the top card to send it to the back.

import * as React from "react";
import { motion, useReducedMotion, type PanInfo } from "framer-motion";
import { cn } from "@/lib/utils";

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  cards: React.ReactNode[];
  randomRotation?: boolean;
  sensitivity?: number;
  animationConfig?: { stiffness: number; damping: number };
  sendToBackOnClick?: boolean;
  autoplay?: boolean;
  autoplayDelay?: number;
  pauseOnHover?: boolean;
  mobileClickOnly?: boolean;
  mobileBreakpoint?: number;
}

export function Stack({
  cards,
  randomRotation = false,
  sensitivity = 200,
  animationConfig = { stiffness: 260, damping: 20 },
  sendToBackOnClick = false,
  autoplay = false,
  autoplayDelay = 3000,
  pauseOnHover = false,
  mobileClickOnly = false,
  mobileBreakpoint = 768,
  className,
  ...props
}: StackProps) {
  const reduceMotion = useReducedMotion();
  // order[0] is the top card (the last one passed); values are indices into `cards`.
  const [order, setOrder] = React.useState(() => cards.map((_, i) => cards.length - 1 - i));
  const [tilts, setTilts] = React.useState<number[]>([]);
  const [hovered, setHovered] = React.useState(false);
  const [mobile, setMobile] = React.useState(false);
  // A drag also ends in a tap; this keeps it from counting as a click.
  const dragged = React.useRef(false);

  React.useEffect(() => {
    setOrder(cards.map((_, i) => cards.length - 1 - i));
    // Random tilts are rolled after mount so server and client markup match.
    setTilts(cards.map(() => (randomRotation ? Math.random() * 10 - 5 : 0)));
  }, [cards.length, randomRotation]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    const query = window.matchMedia(`(max-width: ${mobileBreakpoint - 1}px)`);
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [mobileBreakpoint]);

  const cycle = React.useCallback(() => setOrder(([top, ...rest]) => [...rest, top]), []);

  React.useEffect(() => {
    if (!autoplay || (pauseOnHover && hovered) || cards.length < 2) return;
    const id = window.setInterval(cycle, autoplayDelay);
    return () => window.clearInterval(id);
  }, [autoplay, autoplayDelay, pauseOnHover, hovered, cycle, cards.length]);

  const clickOnly = mobileClickOnly && mobile;
  const canClick = sendToBackOnClick || clickOnly;
  const transition = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, ...animationConfig };

  const release = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) > sensitivity || Math.abs(info.offset.y) > sensitivity) cycle();
  };

  return (
    <div
      className={cn("relative h-full w-full", className)}
      style={{ perspective: 600 }}
      {...props}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      {order.map((cardIndex, depth) => {
        const top = depth === 0;
        return (
          <motion.div
            key={cardIndex}
            className={cn(
              "absolute inset-0 select-none",
              top && "cursor-grab active:cursor-grabbing",
            )}
            style={{ zIndex: order.length - depth, transformOrigin: "50% 90%" }}
            initial={false}
            animate={{
              rotate: (tilts[cardIndex] ?? 0) + depth * 4,
              scale: 1 - depth * 0.05,
              x: 0,
              y: 0,
            }}
            transition={transition}
            drag={top && !clickOnly}
            dragSnapToOrigin
            dragElastic={0.6}
            onDragStart={() => (dragged.current = true)}
            onDragEnd={release}
            onTapStart={() => (dragged.current = false)}
            onTap={top && canClick ? () => !dragged.current && cycle() : undefined}
          >
            {cards[cardIndex]}
          </motion.div>
        );
      })}
    </div>
  );
}
