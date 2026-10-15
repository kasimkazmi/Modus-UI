"use client";
// Card whose border lights up in a cone aimed at the cursor as it nears an edge.
import { useEffect, useRef, type PointerEvent, type ReactNode } from "react";
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { cn } from "@/lib/utils";

interface BorderGlowProps {
  children?: ReactNode;
  className?: string;
  edgeSensitivity?: number;
  glowColor?: string;
  backgroundColor?: string;
  borderRadius?: number;
  glowRadius?: number;
  glowIntensity?: number;
  coneSpread?: number;
  animated?: boolean;
  colors?: string[];
  fillOpacity?: number;
}

const RING_MASK = {
  WebkitMask: "linear-gradient(black 0 0) content-box, linear-gradient(black 0 0)",
  WebkitMaskComposite: "xor",
  maskComposite: "exclude",
} as const;

export function BorderGlow({
  children,
  className,
  edgeSensitivity = 30,
  glowColor = "266 100 65",
  backgroundColor = "hsl(var(--card))",
  borderRadius = 28,
  glowRadius = 40,
  glowIntensity = 1,
  coneSpread = 25,
  animated = false,
  colors = ["hsl(var(--primary))", "hsl(var(--primary))", "hsl(var(--primary))"],
  fillOpacity = 0.5,
}: BorderGlowProps) {
  const reduce = useReducedMotion();
  const card = useRef<HTMLDivElement>(null);
  const angle = useMotionValue(0);
  const strength = useMotionValue(0);
  const x = useMotionValue(50);
  const y = useMotionValue(50);

  const [h, s, l] = glowColor.split(/\s+/);
  const glow = `hsl(${h} ${s}% ${l}%`;
  const ringColors = [...colors, colors[0]].join(", ");

  const cone = useMotionTemplate`conic-gradient(from ${useTransform(angle, (a) => a - coneSpread)}deg, transparent 0deg, black ${coneSpread}deg, transparent ${coneSpread * 2}deg)`;
  const fill = useMotionTemplate`radial-gradient(${glowRadius * 4}px circle at ${x}% ${y}%, ${glow} / ${fillOpacity * 0.25}), transparent 70%)`;
  const ringOpacity = useTransform(strength, (v) => v * glowIntensity);

  useEffect(() => {
    if (!animated || reduce) return;
    strength.set(1);
    const sweep = animate(angle, [0, 360], { duration: 1.6, ease: "easeInOut" });
    const fade = animate(strength, 0, { delay: 1.2, duration: 0.6 });
    return () => {
      sweep.stop();
      fade.stop();
    };
  }, [animated, reduce, angle, strength]);

  const onPointerMove = (e: PointerEvent) => {
    const r = card.current!.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    const edge = Math.min(px, py, r.width - px, r.height - py);
    angle.set((Math.atan2(px - r.width / 2, r.height / 2 - py) * 180) / Math.PI);
    x.set((px / r.width) * 100);
    y.set((py / r.height) * 100);
    strength.set(Math.max(0, Math.min(1, 1 - edge / edgeSensitivity)));
  };

  const layer = { borderRadius, maskImage: cone, WebkitMaskImage: cone } as const;

  return (
    <div
      ref={card}
      onPointerMove={onPointerMove}
      onPointerLeave={() => animate(strength, 0, { duration: reduce ? 0 : 0.4 })}
      className={cn("relative isolate border border-[hsl(var(--border))]", className)}
      style={{ borderRadius, background: backgroundColor }}
    >
      {/* Soft halo outside the border, padded so the shadow is not clipped by the mask. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -z-10"
        style={{ inset: -glowRadius, maskImage: cone, WebkitMaskImage: cone, opacity: ringOpacity }}
      >
        <div
          className="absolute"
          style={{
            inset: glowRadius,
            borderRadius,
            boxShadow: `0 0 ${glowRadius}px ${glowRadius / 4}px ${glow} / 0.7)`,
          }}
        />
      </motion.div>
      {/* Gradient ring on the border itself. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-px"
        style={{ ...layer, opacity: ringOpacity }}
      >
        <div
          className="absolute inset-0 p-[1.5px]"
          style={{ borderRadius, ...RING_MASK, background: `conic-gradient(${ringColors})` }}
        />
      </motion.div>
      {/* Inner wash following the cursor. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ borderRadius, background: fill, opacity: strength }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
