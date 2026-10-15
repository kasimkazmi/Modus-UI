"use client";
// Image card that tilts toward the pointer, with a caption that trails the cursor.

import * as React from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

export interface TiltedCardProps {
  imageSrc: string;
  altText?: string;
  captionText?: string;
  containerHeight?: string | number;
  containerWidth?: string | number;
  imageHeight?: string | number;
  imageWidth?: string | number;
  scaleOnHover?: number;
  rotateAmplitude?: number;
  showMobileWarning?: boolean;
  showTooltip?: boolean;
  overlayContent?: React.ReactNode;
  displayOverlayContent?: boolean;
  className?: string;
}

const spring = { stiffness: 120, damping: 18, mass: 1 };

export function TiltedCard({
  imageSrc,
  altText = "Tilted card image",
  captionText = "",
  containerHeight = "300px",
  containerWidth = "100%",
  imageHeight = "300px",
  imageWidth = "300px",
  scaleOnHover = 1.1,
  rotateAmplitude = 14,
  showMobileWarning = false,
  showTooltip = true,
  overlayContent = null,
  displayOverlayContent = false,
  className,
}: TiltedCardProps) {
  const reduceMotion = useReducedMotion();
  const tiltX = useSpring(0, spring);
  const tiltY = useSpring(0, spring);
  const scale = useSpring(1, spring);
  const captionX = useMotionValue(0);
  const captionY = useMotionValue(0);
  const captionOpacity = useSpring(0, spring);
  const captionTurn = useSpring(0, { stiffness: 300, damping: 30 });
  const lastY = React.useRef(0);

  const onPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    if (!reduceMotion) {
      tiltX.set((0.5 - py / rect.height) * 2 * rotateAmplitude);
      tiltY.set((px / rect.width - 0.5) * 2 * rotateAmplitude);
      captionTurn.set(-(py - lastY.current) * 0.6);
    }
    captionX.set(px);
    captionY.set(py);
    lastY.current = py;
  };

  const onPointerEnter = () => {
    if (!reduceMotion) scale.set(scaleOnHover);
    captionOpacity.set(1);
  };

  const onPointerLeave = () => {
    tiltX.set(0);
    tiltY.set(0);
    scale.set(1);
    captionOpacity.set(0);
    captionTurn.set(0);
  };

  return (
    <figure
      className={cn("relative m-0 flex items-center justify-center [perspective:800px]", className)}
      style={{ width: containerWidth, height: containerHeight }}
      onPointerMove={onPointerMove}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      {showMobileWarning && (
        <p className="absolute top-4 text-center text-sm text-muted-foreground sm:hidden">
          This effect works best with a mouse or trackpad.
        </p>
      )}
      <motion.div
        className="relative [transform-style:preserve-3d]"
        style={{ width: imageWidth, height: imageHeight, rotateX: tiltX, rotateY: tiltY, scale }}
      >
        <img
          src={imageSrc}
          alt={altText}
          draggable={false}
          className="absolute inset-0 h-full w-full rounded-xl object-cover shadow-lg"
        />
        {displayOverlayContent && overlayContent && (
          <div className="absolute inset-0 z-10">{overlayContent}</div>
        )}
      </motion.div>
      {showTooltip && captionText && (
        <motion.figcaption
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 z-20 hidden whitespace-nowrap rounded-md bg-popover px-2.5 py-1 text-xs text-popover-foreground shadow-md sm:block"
          style={{
            x: captionX,
            y: captionY,
            opacity: captionOpacity,
            rotate: captionTurn,
            translateX: 12,
            translateY: 12,
          }}
        >
          {captionText}
        </motion.figcaption>
      )}
    </figure>
  );
}
