"use client";
// A matted picture that drifts after the cursor and erodes harder the faster the pointer moves.
import { useEffect, useId, useRef, type ReactNode } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

interface ErosionPlateProps {
  width?: number;
  height?: number;
  image?: string;
  baseFrequency?: number;
  numOctaves?: number;
  seed?: number;
  maxDisplacement?: number;
  movementBound?: number;
  children?: ReactNode;
  className?: string;
}

export function ErosionPlate({
  width = 300,
  height = 400,
  image = "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=600&auto=format&fit=crop",
  baseFrequency = 0.022,
  numOctaves = 3,
  seed = 11,
  maxDisplacement = 260,
  movementBound = 50,
  children,
  className,
}: ErosionPlateProps) {
  const reduce = useReducedMotion();
  const filterId = `erode-${useId().replace(/:/g, "")}`;
  const plate = useRef<HTMLDivElement>(null);
  const displace = useRef<SVGFEDisplacementMapElement>(null);
  const dx = useMotionValue(0);
  const dy = useMotionValue(0);
  const x = useSpring(dx, { stiffness: 90, damping: 18 });
  const y = useSpring(dy, { stiffness: 90, damping: 18 });

  useEffect(() => {
    if (reduce) return;
    let wear = 0;
    let last: { x: number; y: number; t: number } | null = null;
    let frame = requestAnimationFrame(function decay() {
      wear *= 0.92;
      displace.current?.setAttribute("scale", wear.toFixed(1));
      frame = requestAnimationFrame(decay);
    });
    const onMove = (e: PointerEvent) => {
      const box = plate.current?.getBoundingClientRect();
      if (!box) return;
      const ox = e.clientX - (box.left + box.width / 2 - x.get());
      const oy = e.clientY - (box.top + box.height / 2 - y.get());
      // Soft leash: follows freely near the plate, then flattens out at movementBound.
      dx.set(movementBound * Math.tanh(ox / (movementBound * 6)));
      dy.set(movementBound * Math.tanh(oy / (movementBound * 6)));
      const now = performance.now();
      if (last) {
        const speed =
          Math.hypot(e.clientX - last.x, e.clientY - last.y) / Math.max(1, now - last.t);
        wear = Math.min(maxDisplacement, Math.max(wear, speed * maxDisplacement * 0.25));
      }
      last = { x: e.clientX, y: e.clientY, t: now };
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, [reduce, maxDisplacement, movementBound, dx, dy, x, y]);

  return (
    <motion.div
      ref={plate}
      className={cn(
        "relative overflow-hidden rounded-lg border border-border bg-card p-3 shadow-sm",
        className,
      )}
      style={{ width, height, x: reduce ? 0 : x, y: reduce ? 0 : y }}
    >
      <svg className="absolute h-0 w-0" aria-hidden>
        <filter id={filterId} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency={baseFrequency}
            numOctaves={numOctaves}
            seed={seed}
            result="grain"
          />
          <feDisplacementMap
            ref={displace}
            in="SourceGraphic"
            in2="grain"
            scale="0"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>
      <div className="relative h-full w-full overflow-hidden rounded-md">
        <img
          src={image}
          alt=""
          draggable={false}
          className="h-full w-full scale-110 object-cover"
          style={{ filter: `url(#${filterId})` }}
        />
        {children && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[hsl(var(--background))] via-[hsl(var(--background)/0.85)] to-transparent p-5 pt-16 text-foreground">
            {children}
          </div>
        )}
      </div>
    </motion.div>
  );
}
