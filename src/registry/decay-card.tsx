"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DecayCardProps {
  width?: number;
  height?: number;
  image?: string;
  baseFrequency?: number;
  numOctaves?: number;
  seed?: number;
  maxDisplacement?: number;
  movementBound?: number;
  children?: React.ReactNode;
  className?: string;
}

export function DecayCard({
  width = 300,
  height = 400,
  image = "https://images.unsplash.com/photo-1707584102941-c11438a2e1d7?q=80&w=600&auto=format&fit=crop",
  baseFrequency = 0.015,
  numOctaves = 5,
  seed = 4,
  maxDisplacement = 400,
  movementBound = 50,
  children,
  className,
}: DecayCardProps) {
  const svgRef = useRef<HTMLDivElement>(null);
  const displacementMapRef = useRef<SVGFEDisplacementMapElement>(null);

  const cursor = useRef({
    x: typeof window !== "undefined" ? window.innerWidth / 2 : 0,
    y: typeof window !== "undefined" ? window.innerHeight / 2 : 0,
  });
  const cachedCursor = useRef({ ...cursor.current });
  // Reduced motion: the card stays still and undistorted; no cursor-follow loop.
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;
    let winsize = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    const lerp = (a: number, b: number, n: number) => (1 - n) * a + n * b;
    const map = (x: number, a: number, b: number, c: number, d: number) =>
      ((x - a) * (d - c)) / (b - a) + c;
    const distance = (x1: number, x2: number, y1: number, y2: number) =>
      Math.hypot(x1 - x2, y1 - y2);

    const handleResize = () => {
      winsize = { width: window.innerWidth, height: window.innerHeight };
    };

    const handleMouseMove = (ev: MouseEvent) => {
      cursor.current = { x: ev.clientX, y: ev.clientY };
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);

    const imgValues = {
      imgTransforms: { x: 0, y: 0, rz: 0 },
      displacementScale: 0,
    };

    let rafId: number;
    const render = () => {
      let targetX = lerp(
        imgValues.imgTransforms.x,
        map(cursor.current.x, 0, winsize.width, -120, 120),
        0.1,
      );
      let targetY = lerp(
        imgValues.imgTransforms.y,
        map(cursor.current.y, 0, winsize.height, -120, 120),
        0.1,
      );
      let targetRz = lerp(
        imgValues.imgTransforms.rz,
        map(cursor.current.x, 0, winsize.width, -10, 10),
        0.1,
      );

      if (targetX > movementBound) targetX = movementBound + (targetX - movementBound) * 0.2;
      if (targetX < -movementBound) targetX = -movementBound + (targetX + movementBound) * 0.2;
      if (targetY > movementBound) targetY = movementBound + (targetY - movementBound) * 0.2;
      if (targetY < -movementBound) targetY = -movementBound + (targetY + movementBound) * 0.2;

      imgValues.imgTransforms.x = targetX;
      imgValues.imgTransforms.y = targetY;
      imgValues.imgTransforms.rz = targetRz;

      if (svgRef.current) {
        svgRef.current.style.transform = `translate(${imgValues.imgTransforms.x}px, ${imgValues.imgTransforms.y}px) rotate(${imgValues.imgTransforms.rz}deg)`;
      }

      const cursorTravelledDistance = distance(
        cachedCursor.current.x,
        cursor.current.x,
        cachedCursor.current.y,
        cursor.current.y,
      );
      imgValues.displacementScale = lerp(
        imgValues.displacementScale,
        map(cursorTravelledDistance, 0, 200, 0, maxDisplacement),
        0.06,
      );

      if (displacementMapRef.current) {
        displacementMapRef.current.setAttribute("scale", imgValues.displacementScale.toString());
      }

      cachedCursor.current = { ...cursor.current };

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [maxDisplacement, movementBound, prefersReducedMotion]);

  return (
    <div
      ref={svgRef}
      className={cn(
        "relative z-10 w-full overflow-hidden rounded-xl shadow-xl will-change-transform",
        className,
      )}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <svg
        viewBox="-60 -75 720 900"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 block h-full w-full"
      >
        <filter id="imgFilter">
          <feTurbulence
            type="turbulence"
            baseFrequency={baseFrequency}
            numOctaves={numOctaves}
            seed={seed}
            stitchTiles="stitch"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            result="turbulence1"
          />
          <feDisplacementMap
            ref={displacementMapRef}
            in="SourceGraphic"
            in2="turbulence1"
            scale="0"
            xChannelSelector="R"
            yChannelSelector="B"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            result="displacementMap3"
          />
        </filter>
        <g>
          <image
            href={image}
            x="-60"
            y="-75"
            width="720"
            height="900"
            filter="url(#imgFilter)"
            preserveAspectRatio="xMidYMid slice"
          />
        </g>
      </svg>
      {children && (
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-start justify-end p-6 text-white drop-shadow-md">
          {children}
        </div>
      )}
    </div>
  );
}
