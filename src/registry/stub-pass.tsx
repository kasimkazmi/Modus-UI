"use client";
// A perforated card whose stub can be pulled and torn off; the card tilts toward the pointer.

import { useMemo, useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { cn } from "@/lib/utils";

interface StubPassProps {
  children?: React.ReactNode;
  stub?: React.ReactNode;
  image?: string;
  imageAlt?: string;
  scrim?: boolean;
  imageRadius?: number;
  orientation?: "horizontal" | "vertical";
  torn?: boolean;
  defaultTorn?: boolean;
  onTear?: () => void;
  width?: number;
  height?: number;
  stubSize?: number;
  radius?: number;
  holes?: number;
  holeSize?: number;
  /** Seam end notch radius, as a multiple of the hole radius. */
  notch?: number;
  /** Jaggedness of the torn edges, in pixels. */
  roughness?: number;
  /** Angle the stub flies off at once torn, in degrees. */
  tearAngle?: number;
  /** Pull distance, in pixels, before the stub tears. */
  stretch?: number;
  resistance?: number;
  rotate?: number;
  tilt?: boolean;
  tiltMax?: number;
  tiltReach?: number;
  parallax?: number;
  perspective?: number;
  background?: string;
  color?: string;
  border?: boolean;
  borderColor?: string;
  borderWidth?: number;
  stubBackground?: string;
  recenter?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

const clamp = (v: number) => Math.max(-1, Math.min(1, v));

/** Mask punching half-holes along one edge plus a larger notch at each end of it. */
function seamMask(
  edge: "left" | "right" | "top" | "bottom",
  length: number,
  holes: number,
  r: number,
  notchR: number,
) {
  const across = edge === "left" || edge === "right";
  const pitch = length / holes;
  const at = `${edge === "left" ? "0%" : edge === "right" ? "100%" : "50%"} ${edge === "top" ? "0%" : edge === "bottom" ? "100%" : "50%"}`;
  const hole = `radial-gradient(circle at ${at}, transparent ${r}px, black ${r + 0.5}px)`;
  const ends = ["0%", "100%"].map((p) => {
    const pos = across
      ? `${edge === "left" ? "0%" : "100%"} ${p}`
      : `${p} ${edge === "top" ? "0%" : "100%"}`;
    return `radial-gradient(circle at ${pos}, transparent ${notchR}px, black ${notchR + 0.5}px)`;
  });
  return {
    maskImage: [hole, ...ends].join(","),
    maskSize: `${across ? `100% ${pitch}px` : `${pitch}px 100%`}, 100% 100%, 100% 100%`,
    maskRepeat: `${across ? "repeat-y" : "repeat-x"}, no-repeat, no-repeat`,
    maskComposite: "intersect",
    WebkitMaskComposite: "source-in",
  } as React.CSSProperties;
}

/** A jagged polygon edge for torn pieces. */
function jagged(edge: "left" | "right" | "top" | "bottom", amp: number, seed: number) {
  if (!amp) return undefined;
  const pts: string[] = [];
  const n = 24;
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * 100;
    const d = Math.abs(Math.sin((i + 1) * seed * 12.9898) * amp);
    pts.push(
      edge === "right"
        ? `calc(100% - ${d}px) ${t}%`
        : edge === "left"
          ? `${d}px ${100 - t}%`
          : edge === "bottom"
            ? `${100 - t}% calc(100% - ${d}px)`
            : `${t}% ${d}px`,
    );
  }
  const frame = {
    right: ["0% 100%", "0% 0%"],
    left: ["100% 0%", "100% 100%"],
    bottom: ["0% 0%", "100% 0%"],
    top: ["100% 100%", "0% 100%"],
  }[edge];
  return `polygon(${[frame[1], ...pts, frame[0]].join(",")})`;
}

export function StubPass({
  children = null,
  stub = null,
  image = "",
  imageAlt = "",
  scrim = true,
  imageRadius = 8,
  orientation = "horizontal",
  torn,
  defaultTorn = false,
  onTear,
  width = 460,
  height = 250,
  stubSize = 150,
  radius = 16,
  holes = 12,
  holeSize = 6,
  notch = 3,
  roughness = 0,
  tearAngle = 30,
  stretch = 30,
  resistance = 0.45,
  rotate = 4,
  tilt = true,
  tiltMax = 9,
  tiltReach = 260,
  parallax = 6,
  perspective = 1000,
  background = "hsl(var(--card))",
  color = "hsl(var(--foreground))",
  border = true,
  borderColor = "",
  borderWidth = 1,
  stubBackground = "hsl(var(--primary))",
  recenter = true,
  disabled = false,
  ariaLabel = "Tear off the stub",
  className,
}: StubPassProps) {
  const reduced = useReducedMotion();
  const [innerTorn, setInnerTorn] = useState(defaultTorn);
  const isTorn = torn ?? innerTorn;
  const across = orientation === "horizontal";
  const seamLength = across ? height : width;
  const r = holeSize / 2;

  const rx = useSpring(0, { stiffness: 160, damping: 18 });
  const ry = useSpring(0, { stiffness: 160, damping: 18 });
  const shiftX = useTransform(ry, (v) => (tiltMax ? (v / tiltMax) * parallax : 0));
  const shiftY = useTransform(rx, (v) => (tiltMax ? (-v / tiltMax) * parallax : 0));
  const pull = useMotionValue(0);
  const stubRotate = useTransform(pull, (p) =>
    stretch ? (Math.min(p, stretch) / stretch) * rotate : 0,
  );
  const pullX = useTransform(pull, (p) => (across ? p : 0));
  const pullY = useTransform(pull, (p) => (across ? 0 : p));
  const start = useRef<number | null>(null);

  const tear = () => {
    if (isTorn || disabled) return;
    if (torn === undefined) setInnerTorn(true);
    onTear?.();
  };

  const edge = {
    border: border ? `${borderWidth}px solid ${borderColor || "hsl(var(--border))"}` : undefined,
  };
  const bodyMask = useMemo(
    () => seamMask(across ? "right" : "bottom", seamLength, holes, r, r * notch),
    [across, seamLength, holes, r, notch],
  );
  const stubMask = useMemo(
    () => seamMask(across ? "left" : "top", seamLength, holes, r, r * notch),
    [across, seamLength, holes, r, notch],
  );
  const flyRad = (tearAngle * Math.PI) / 180;
  const fly = 1.5 * stubSize;
  const centerShift = isTorn && recenter ? stubSize / 2 : 0;

  return (
    <div
      className={cn("relative", className)}
      style={{ width, height, perspective, color }}
      onPointerMove={(e) => {
        if (!tilt || reduced) return;
        const b = e.currentTarget.getBoundingClientRect();
        ry.set(clamp((e.clientX - b.left - b.width / 2) / tiltReach) * tiltMax);
        rx.set(-clamp((e.clientY - b.top - b.height / 2) / tiltReach) * tiltMax);
      }}
      onPointerLeave={() => {
        rx.set(0);
        ry.set(0);
      }}
    >
      <motion.div
        className={cn("relative flex h-full w-full", !across && "flex-col")}
        style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        animate={across ? { x: centerShift } : { y: centerShift }}
        transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 24 }}
      >
        <div
          className="relative min-h-0 min-w-0 flex-1 overflow-hidden"
          style={{
            background,
            ...edge,
            ...(across ? { borderRightWidth: 0 } : { borderBottomWidth: 0 }),
            borderRadius: across ? `${radius}px 0 0 ${radius}px` : `${radius}px ${radius}px 0 0`,
            ...(isTorn
              ? { clipPath: jagged(across ? "right" : "bottom", roughness, 1) }
              : bodyMask),
          }}
        >
          {image && (
            <div className="absolute inset-2 overflow-hidden" style={{ borderRadius: imageRadius }}>
              <img src={image} alt={imageAlt} className="h-full w-full object-cover" />
              {scrim && (
                <div
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(to top, hsl(var(--card) / 0.85), transparent 70%)",
                  }}
                />
              )}
            </div>
          )}
          <motion.div className="relative h-full" style={{ x: shiftX, y: shiftY }}>
            {children}
          </motion.div>
        </div>

        <motion.div
          role="button"
          tabIndex={disabled || isTorn ? -1 : 0}
          aria-label={ariaLabel}
          aria-disabled={disabled || isTorn}
          aria-pressed={isTorn}
          className={cn(
            "relative shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]",
            !disabled && !isTorn && (across ? "cursor-ew-resize" : "cursor-ns-resize"),
          )}
          style={{
            [across ? "width" : "height"]: stubSize,
            x: pullX,
            y: pullY,
            rotate: stubRotate,
            originX: across ? 0 : 0.5,
            originY: across ? 1 : 0,
            touchAction: "none",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              tear();
            }
          }}
          onPointerDown={(e) => {
            if (disabled || isTorn) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            start.current = across ? e.clientX : e.clientY;
          }}
          onPointerMove={(e) => {
            if (start.current === null) return;
            const raw = Math.max(0, (across ? e.clientX : e.clientY) - start.current);
            pull.set(raw * (1 - resistance));
            if (raw > stretch / (1 - resistance)) {
              start.current = null;
              tear();
            }
          }}
          onPointerUp={() => {
            start.current = null;
            if (!isTorn) animate(pull, 0, { type: "spring", stiffness: 500, damping: 20 });
          }}
        >
          <motion.div
            className="h-full w-full"
            style={{
              background: stubBackground,
              borderRadius: across ? `0 ${radius}px ${radius}px 0` : `0 0 ${radius}px ${radius}px`,
              ...(isTorn ? { clipPath: jagged(across ? "left" : "top", roughness, 2) } : stubMask),
            }}
            initial={false}
            animate={
              isTorn
                ? {
                    x: across ? fly * Math.cos(flyRad) : fly * Math.sin(flyRad),
                    y: across ? fly * Math.sin(flyRad) : fly * Math.cos(flyRad),
                    rotate: tearAngle / 2,
                    opacity: 0,
                  }
                : { x: 0, y: 0, rotate: 0, opacity: 1 }
            }
            transition={reduced ? { duration: 0 } : { duration: 0.6, ease: [0.3, 0, 0.4, 1] }}
          >
            {stub}
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
