"use client";
// Drops that chase the pointer at different speeds and melt into one pool through a goo filter.
import { useState, useEffect, useId, useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type MotionValue,
} from "framer-motion";

type BlobType = "circle" | "square" | "almond";

interface GloopTrailProps {
  blobType?: BlobType;
  fillColor?: string;
}

const DROPS = 4;
const RADII: Record<BlobType, string> = { circle: "50%", square: "22%", almond: "50% 0" };

function Drop({
  x,
  y,
  index,
  blobType,
  fillColor,
  still,
}: {
  x: MotionValue<number>;
  y: MotionValue<number>;
  index: number;
  blobType: BlobType;
  fillColor: string;
  still: boolean;
}) {
  const spring = { stiffness: 520 - index * 110, damping: 28 + index * 4, mass: 0.6 };
  const sx = useSpring(x, spring);
  const sy = useSpring(y, spring);
  const size = 64 - index * 10;
  return (
    <motion.div
      className="absolute left-0 top-0"
      style={{
        x: still ? x : sx,
        y: still ? y : sy,
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        rotate: blobType === "almond" ? 45 : 0,
        borderRadius: RADII[blobType],
        background: `color-mix(in hsl, ${fillColor}, hsl(var(--muted-foreground)) ${index * 22}%)`,
      }}
    />
  );
}

export function GloopTrail({
  blobType = "circle",
  fillColor = "hsl(var(--primary))",
}: GloopTrailProps) {
  const prefersReduced = useReducedMotion();
  // Follow the setting only after hydration, so the first render matches the server's.
  const [reduce, setReduce] = useState(false);
  useEffect(() => setReduce(Boolean(prefersReduced)), [prefersReduced]);
  const filterId = `gloop-${useId().replace(/:/g, "")}`;
  const layer = useRef<HTMLDivElement>(null);
  const x = useMotionValue(-200);
  const y = useMotionValue(-200);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const box = layer.current?.getBoundingClientRect();
      if (!box) return;
      x.set(e.clientX - box.left);
      y.set(e.clientY - box.top);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [x, y]);

  return (
    <div ref={layer} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg className="absolute h-0 w-0">
        <filter id={filterId}>
          <feGaussianBlur stdDeviation="10" />
          <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10" />
        </filter>
      </svg>
      <div className="absolute inset-0" style={{ filter: `url(#${filterId})` }}>
        {Array.from({ length: reduce ? 1 : DROPS }, (_, i) => (
          <Drop
            key={i}
            x={x}
            y={y}
            index={i}
            blobType={blobType}
            fillColor={fillColor}
            still={!!reduce}
          />
        ))}
      </div>
    </div>
  );
}
