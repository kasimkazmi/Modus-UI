"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StarBorderProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  as?: React.ElementType;
  className?: string;
  color?: string;
  speed?: number;
  thickness?: number;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  children: React.ReactNode;
}

export function StarBorder({
  as: Component = "button",
  className = "",
  color = "rgba(255, 255, 255, 0.8)",
  speed = 6,
  thickness = 1,
  backgroundColor = "hsl(var(--background))",
  textColor = "hsl(var(--foreground))",
  borderColor = "hsl(var(--border))",
  children,
  ...rest
}: StarBorderProps) {
  const prefersReducedMotion = useReducedMotion();
  // Reduced motion: beams rest at a fixed, visible spot instead of sweeping.
  const beamTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: speed, repeat: Infinity, repeatType: "mirror" as const, ease: "linear" as const };

  return (
    <Component
      className={cn("relative inline-block overflow-hidden rounded-full", className)}
      style={{
        padding: `${thickness}px`,
        ...rest.style,
      }}
      {...rest}
    >
      {/* Bottom glowing beam */}
      <motion.div
        className="pointer-events-none absolute bottom-[-11px] right-[-250%] z-0 h-[50%] w-[300%] rounded-full opacity-70"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
        }}
        animate={
          prefersReducedMotion
            ? { translateX: "-50%", opacity: 0.7 }
            : { translateX: ["0%", "-100%"], opacity: [1, 0] }
        }
        transition={beamTransition}
      />
      {/* Top glowing beam */}
      <motion.div
        className="pointer-events-none absolute left-[-250%] top-[-10px] z-0 h-[50%] w-[300%] rounded-full opacity-70"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
        }}
        animate={
          prefersReducedMotion
            ? { translateX: "50%", opacity: 0.7 }
            : { translateX: ["0%", "100%"], opacity: [1, 0] }
        }
        transition={beamTransition}
      />

      {/* Inner Button Content */}
      <div
        className="relative z-10 h-full w-full rounded-full border px-6 py-2.5 text-center text-sm font-medium"
        style={{ background: backgroundColor, color: textColor, borderColor }}
      >
        {children}
      </div>
    </Component>
  );
}
