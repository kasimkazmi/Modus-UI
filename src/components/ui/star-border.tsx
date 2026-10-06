"use client";

import { motion } from "framer-motion";
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
  backgroundColor = "var(--background)",
  textColor = "var(--foreground)",
  borderColor = "var(--border)",
  children,
  ...rest
}: StarBorderProps) {
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
        className="absolute w-[300%] h-[50%] opacity-70 bottom-[-11px] right-[-250%] rounded-full z-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
        }}
        animate={{ translateX: ["0%", "-100%"], opacity: [1, 0] }}
        transition={{
          duration: speed,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "linear",
        }}
      />
      {/* Top glowing beam */}
      <motion.div
        className="absolute w-[300%] h-[50%] opacity-70 top-[-10px] left-[-250%] rounded-full z-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
        }}
        animate={{ translateX: ["0%", "100%"], opacity: [1, 0] }}
        transition={{
          duration: speed,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "linear",
        }}
      />
      
      {/* Inner Button Content */}
      <div
        className="relative z-10 border text-center text-sm font-medium py-2.5 px-6 rounded-full w-full h-full"
        style={{ background: backgroundColor, color: textColor, borderColor }}
      >
        {children}
      </div>
    </Component>
  );
}
