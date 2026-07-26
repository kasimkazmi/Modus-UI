"use client";

import React, { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
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

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        "mx-auto flex h-20 items-end gap-5 rounded-none border-2 border-[#3F3F46] bg-[#09090B]/95 px-5 pb-4 shadow-none relative overflow-hidden",
        className
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
}

function DockIcon({ mouseX, title, icon, href, onClick, direction }: DockIconProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  // Scale calculations for brutalist magnification
  const sizeTransform = useTransform(distance, [-100, 0, 100], [44, 64, 44]);
  const iconSizeTransform = useTransform(distance, [-100, 0, 100], [20, 32, 20]);

  const size = useSpring(sizeTransform, {
    mass: 0.1,
    stiffness: 220,
    damping: 14,
  });

  const iconSize = useSpring(iconSizeTransform, {
    mass: 0.1,
    stiffness: 220,
    damping: 14,
  });

  const Content = (
    <motion.div
      ref={ref}
      style={{ width: size, height: size }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileTap={{ scale: 0.9 }}
      className={cn(
        "relative flex items-center justify-center rounded-none border border-[#3F3F46] bg-black text-[#FAFAFA] shadow-none transition-colors duration-200 hover:bg-[#DFE104] hover:text-black hover:border-[#DFE104]",
        "group cursor-pointer"
      )}
      onClick={onClick}
    >
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: direction === "bottom" ? -10 : 10, scale: 0.95 }}
            animate={{ opacity: 1, y: direction === "bottom" ? -38 : 38, scale: 1 }}
            exit={{ opacity: 0, y: direction === "bottom" ? -10 : 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute z-50 rounded-none border border-black bg-[#DFE104] px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-black shadow-none whitespace-nowrap",
              direction === "bottom" ? "-top-2" : "-bottom-2"
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
