"use client";

import React, { useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { cn } from "@/lib/utils";

export interface FloatingDockItem {
  title: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
}

export interface FloatingDockProps {
  items: FloatingDockItem[];
  className?: string;
  direction?: "top" | "bottom";
}

export function FloatingDock({ items, className, direction = "bottom" }: FloatingDockProps) {
  const mouseX = useMotionValue(Infinity);
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      // Reduced motion: keep icons at rest size instead of magnifying toward the pointer.
      onMouseMove={(e) => !prefersReducedMotion && mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        "relative mx-auto flex h-16 items-end gap-4 overflow-hidden rounded-3xl border border-border bg-background/90 px-4 pb-3 shadow-xl backdrop-blur-md",
        "before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle,_#37322F_1px,_transparent_1px)] before:bg-[length:8px_8px] before:opacity-[0.03]",
        className,
      )}
    >
      {items.map((item, idx) => (
        <DockIcon
          key={idx}
          mouseX={mouseX}
          title={item.title}
          icon={item.icon}
          href={item.href}
          onClick={item.onClick}
          direction={direction}
          reducedMotion={!!prefersReducedMotion}
        />
      ))}
    </motion.div>
  );
}

interface DockIconProps {
  mouseX: any;
  title: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  direction: "top" | "bottom";
  reducedMotion: boolean;
}

function DockIcon({ mouseX, title, icon, href, onClick, direction, reducedMotion }: DockIconProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  // Calculate icon scaling relative to distance from pointer
  const sizeTransform = useTransform(distance, [-120, 0, 120], [40, 60, 40]);
  const iconSizeTransform = useTransform(distance, [-120, 0, 120], [18, 30, 18]);

  const size = useSpring(sizeTransform, {
    mass: 0.1,
    stiffness: 200,
    damping: 15,
  });

  const iconSize = useSpring(iconSizeTransform, {
    mass: 0.1,
    stiffness: 200,
    damping: 15,
  });

  const Content = (
    <motion.div
      ref={ref}
      style={{ width: size, height: size }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileTap={reducedMotion ? undefined : { scale: 0.9 }}
      className={cn(
        "relative flex items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-background",
        "group cursor-pointer",
      )}
      onClick={onClick}
    >
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={
              reducedMotion
                ? { opacity: 0, y: direction === "bottom" ? -36 : 36, scale: 1 }
                : { opacity: 0, y: direction === "bottom" ? -10 : 10, scale: 0.95 }
            }
            animate={{ opacity: 1, y: direction === "bottom" ? -36 : 36, scale: 1 }}
            exit={
              reducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: direction === "bottom" ? -10 : 10, scale: 0.95 }
            }
            transition={
              reducedMotion ? { duration: 0.15 } : { type: "spring", stiffness: 300, damping: 20 }
            }
            className={cn(
              "absolute z-50 whitespace-nowrap rounded-md border border-border bg-background px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-foreground shadow-sm",
              direction === "bottom" ? "-top-2" : "-bottom-2",
            )}
          >
            {title}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        style={{ width: iconSize, height: iconSize }}
        className="flex items-center justify-center"
      >
        {React.isValidElement(icon)
          ? React.cloneElement(icon as React.ReactElement, { className: "w-full h-full" })
          : icon}
      </motion.div>
    </motion.div>
  );

  if (href) {
    return (
      <a href={href} className="inline-block">
        {Content}
      </a>
    );
  }

  return Content;
}
