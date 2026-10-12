"use client";
// A two-sided sheet you turn by click, drag or key, with a pointer tilt and moving sheen.
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import { cn } from "@/lib/utils";

interface TurnLeafProps {
  front?: ReactNode;
  back?: ReactNode;
  flipped?: boolean;
  defaultFlipped?: boolean;
  onFlipChange?: (flipped: boolean) => void;
  axis?: "x" | "y";
  flipOnClick?: boolean;
  draggable?: boolean;
  dragDistance?: number;
  tilt?: boolean;
  tiltMax?: number;
  glare?: boolean;
  glareOpacity?: number;
  hoverScale?: number;
  perspective?: number;
  stiffness?: number;
  damping?: number;
  width?: number;
  height?: number;
  radius?: number;
  background?: string;
  color?: string;
  shadow?: boolean;
  shadowColor?: string;
  shadowOpacity?: number;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

export function TurnLeaf({
  front = null,
  back = null,
  flipped,
  defaultFlipped = false,
  onFlipChange,
  axis = "y",
  flipOnClick = true,
  draggable = true,
  dragDistance = 0,
  tilt = true,
  tiltMax = 8,
  glare = true,
  glareOpacity = 0.22,
  hoverScale = 1.03,
  perspective = 1100,
  stiffness = 170,
  damping = 20,
  width = 280,
  height = 380,
  radius = 10,
  background = "hsl(var(--card))",
  color = "hsl(var(--foreground))",
  shadow = true,
  shadowColor = "hsl(var(--foreground))",
  shadowOpacity = 0.3,
  disabled = false,
  ariaLabel = "Turn leaf",
  className,
}: TurnLeafProps) {
  const reduce = useReducedMotion();
  const [ownFlipped, setOwnFlipped] = useState(defaultFlipped);
  const isFlipped = flipped ?? ownFlipped;
  const turn = useMotionValue(isFlipped ? 180 : 0);
  const tiltX = useSpring(0, { stiffness: 200, damping: 20 });
  const tiltY = useSpring(0, { stiffness: 200, damping: 20 });
  const scale = useSpring(1, { stiffness: 260, damping: 22 });
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);
  const glareAlpha = useSpring(0, { stiffness: 200, damping: 30 });
  const sheen = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, hsl(var(--background) / ${glareAlpha}), transparent 60%)`;
  const drag = useRef<{ start: number; moved: number } | null>(null);
  const along = axis === "y" ? width : height;
  const commitAt = dragDistance || along / 2;

  useEffect(() => {
    if (drag.current) return;
    const controls = animate(turn, isFlipped ? 180 : 0, { type: "spring", stiffness, damping });
    return () => controls.stop();
  }, [isFlipped, stiffness, damping, turn]);

  const set = (next: boolean) => {
    if (flipped === undefined) setOwnFlipped(next);
    onFlipChange?.(next);
  };

  const pos = (e: PointerEvent) => (axis === "y" ? e.clientX : -e.clientY);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    drag.current = { start: pos(e), moved: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    const box = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - box.left) / box.width;
    const py = (e.clientY - box.top) / box.height;
    if (tilt && !reduce) {
      tiltY.set((px - 0.5) * 2 * tiltMax);
      tiltX.set((0.5 - py) * 2 * tiltMax);
    }
    glareX.set(px * 100);
    glareY.set(py * 100);
    const d = drag.current;
    if (!d || !draggable || reduce) return;
    d.moved = pos(e) - d.start;
    const base = isFlipped ? 180 : 0;
    turn.set(base + Math.max(-180, Math.min(180, (d.moved / along) * 180)));
  };

  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (Math.abs(d.moved) < 4) {
      if (flipOnClick) set(!isFlipped);
      return;
    }
    if (draggable && Math.abs(d.moved) >= commitAt) set(!isFlipped);
    else animate(turn, isFlipped ? 180 : 0, { type: "spring", stiffness, damping });
  };

  const onEnter = () => {
    if (disabled) return;
    if (!reduce) scale.set(hoverScale);
    if (glare) glareAlpha.set(glareOpacity);
  };

  const onLeave = () => {
    tiltX.set(0);
    tiltY.set(0);
    scale.set(1);
    glareAlpha.set(0);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (disabled || (e.key !== "Enter" && e.key !== " ")) return;
    e.preventDefault();
    set(!isFlipped);
  };

  const rotateKey = axis === "y" ? "rotateY" : "rotateX";
  const face = cn(
    "absolute inset-0 overflow-hidden border border-border [backface-visibility:hidden]",
  );
  const faceStyle = { borderRadius: radius, background, color };

  return (
    <div className={cn("inline-block select-none", className)} style={{ perspective }}>
      <motion.div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={ariaLabel}
        aria-pressed={isFlipped}
        aria-disabled={disabled}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerEnter={onEnter}
        onPointerLeave={onLeave}
        onKeyDown={onKeyDown}
        className={cn(
          "relative touch-none outline-none [transform-style:preserve-3d] focus-visible:ring-2 focus-visible:ring-ring",
          disabled ? "cursor-not-allowed opacity-60" : "cursor-grab active:cursor-grabbing",
        )}
        style={{
          width,
          height,
          borderRadius: radius,
          rotateX: tiltX,
          rotateY: tiltY,
          scale,
          boxShadow: shadow
            ? `0 18px 40px -16px color-mix(in hsl, ${shadowColor} ${shadowOpacity * 100}%, transparent)`
            : undefined,
        }}
      >
        {reduce ? (
          <>
            <motion.div className={face} style={faceStyle} animate={{ opacity: isFlipped ? 0 : 1 }}>
              {front}
            </motion.div>
            <motion.div className={face} style={faceStyle} animate={{ opacity: isFlipped ? 1 : 0 }}>
              {back}
            </motion.div>
          </>
        ) : (
          <motion.div
            className="absolute inset-0 [transform-style:preserve-3d]"
            style={{ [rotateKey]: turn }}
          >
            <div className={face} style={faceStyle}>
              {front}
            </div>
            <div className={face} style={{ ...faceStyle, transform: `${rotateKey}(180deg)` }}>
              {back}
            </div>
          </motion.div>
        )}
        {glare && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 mix-blend-soft-light"
            style={{ borderRadius: radius, background: sheen, transform: "translateZ(1px)" }}
          />
        )}
      </motion.div>
    </div>
  );
}
