"use client";
// Full-height menu rows; hovering one slides in a looping marquee from the edge the cursor entered.

import { useState } from "react";
import type React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface MenuItemProps {
  link: string;
  text: string;
  image: string;
}

export interface FlowingMenuProps {
  items?: MenuItemProps[];
  speed?: number;
  className?: string;
}

type Edge = "top" | "bottom";

function edgeOf(e: React.MouseEvent<HTMLElement>): Edge {
  const rect = e.currentTarget.getBoundingClientRect();
  return e.clientY - rect.top < rect.height / 2 ? "top" : "bottom";
}

function Row({ item, speed }: { item: MenuItemProps; speed: number }) {
  const reduceMotion = useReducedMotion();
  const [edge, setEdge] = useState<Edge | null>(null);
  const [exitEdge, setExitEdge] = useState<Edge>("top");
  const offset = (side: Edge) => (side === "top" ? "-101%" : "101%");
  const strip = Array.from({ length: 4 }, (_, i) => (
    <span key={i} className="flex shrink-0 items-center gap-6 pr-6">
      <span className="font-display text-3xl uppercase sm:text-4xl">{item.text}</span>
      <span
        className="h-12 w-28 shrink-0 rounded-full bg-cover bg-center"
        style={{ backgroundImage: `url(${item.image})` }}
      />
    </span>
  ));

  return (
    <a
      href={item.link}
      className="relative flex flex-1 items-center justify-center overflow-hidden border-t border-border first:border-t-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[hsl(var(--ring))]"
      onMouseEnter={(e) => setEdge(edgeOf(e))}
      onMouseLeave={(e) => {
        setExitEdge(edgeOf(e));
        setEdge(null);
      }}
      onFocus={() => setEdge("top")}
      onBlur={() => setEdge(null)}
    >
      <span className="font-display text-3xl uppercase text-foreground sm:text-4xl">
        {item.text}
      </span>
      <AnimatePresence>
        {edge && (
          <motion.span
            aria-hidden
            className="absolute inset-0 flex items-center overflow-hidden bg-foreground text-background"
            initial={reduceMotion ? { opacity: 0 } : { y: offset(edge) }}
            animate={reduceMotion ? { opacity: 1 } : { y: "0%" }}
            exit={reduceMotion ? { opacity: 0 } : { y: offset(exitEdge) }}
            transition={{ duration: reduceMotion ? 0.15 : 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.span
              className="flex w-max"
              animate={reduceMotion ? undefined : { x: ["0%", "-50%"] }}
              transition={{ duration: speed, ease: "linear", repeat: Infinity }}
            >
              {strip}
              {strip}
            </motion.span>
          </motion.span>
        )}
      </AnimatePresence>
    </a>
  );
}

export function FlowingMenu({ items = [], speed = 15, className }: FlowingMenuProps) {
  return (
    <nav className={cn("flex h-full w-full flex-col bg-background", className)}>
      {items.map((item, i) => (
        <Row key={i} item={item} speed={speed} />
      ))}
    </nav>
  );
}
