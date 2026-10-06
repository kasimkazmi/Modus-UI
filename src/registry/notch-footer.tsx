"use client";

import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface NotchFooterProps {
  /** The main title text rendered inside the banner */
  title?: string;
  /** Text for the outline button at the bottom */
  buttonText?: string;
  /** Action triggered when the outline button is clicked */
  onButtonClick?: () => void;
  /** Optional href for the CTA button */
  buttonHref?: string;
  /** Logo or branding element placed inside the notch pocket */
  logo?: React.ReactNode;
  /** Custom background class for the banner container (e.g., gradients) */
  bgColorClass?: string;
  /** Custom text color class for the title */
  titleColorClass?: string;
  /** Custom color classes for the CTA button */
  buttonColorClass?: string;
  /** Custom background color class for the dots */
  dotColorClass?: string;
  /** Background color for the notch pocket overlay (must match parent page background) */
  notchFillColor?: string;
  /** Custom class name for the wrapper */
  className?: string;
}

export function NotchFooter({
  title = "Stop guessing about your digital experience with Modus",
  buttonText = "Get started for free",
  onButtonClick,
  buttonHref,
  logo,
  bgColorClass = "bg-[#37322F]", // Modus UI's premium warm dark brand color
  titleColorClass = "!text-[#FAF9F7]", // Protect from .prose overrides
  buttonColorClass = "border-white/20 hover:border-white bg-white/10 hover:bg-white !text-white hover:!text-[#37322F]", // Protect from .prose overrides
  dotColorClass = "bg-white/30",
  notchFillColor = "#F7F5F3", // Modus UI's premium warm light background
  className,
}: NotchFooterProps) {
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  // Reduced motion: hover parallax is disabled; the footer stays static.
  const hovered = isHovered && !prefersReducedMotion;

  return (
    <motion.footer
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative flex w-full flex-col items-center justify-center overflow-hidden rounded-3xl px-8 py-16 text-center shadow-xl md:px-16",
        bgColorClass,
        className,
      )}
    >
      {/* 0. Border Outline Layer (Spatially layered at z-5, constructs the bottom, left, and right border frames) */}
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl border-b border-l border-r border-[#E0DEDB]/10"
        style={{ zIndex: 5 }}
      />
      {/* Left Top Border Segment (Stops exactly at the start of the notch curves) */}
      <div
        className="pointer-events-none absolute left-0 top-0 h-[1px] bg-[#E0DEDB]/10"
        style={{ zIndex: 5, width: "calc(50% - 120px)" }}
      />
      {/* Right Top Border Segment (Starts exactly at the end of the notch curves) */}
      <div
        className="pointer-events-none absolute right-0 top-0 h-[1px] bg-[#E0DEDB]/10"
        style={{ zIndex: 5, width: "calc(50% - 120px)" }}
      />

      {/* 1. Fluid Liquid Notch Pocket (Layered at z-10 to mask the top border line perfectly) */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[48px] w-[240px] -translate-x-1/2 select-none"
        style={{ zIndex: 10 }}
      >
        <svg
          viewBox="0 0 240 48"
          width="240"
          height="48"
          className="h-full w-full"
          preserveAspectRatio="none"
        >
          <path
            d="M 0 0 C 20 0, 20 48, 40 48 L 200 48 C 220 48, 220 0, 240 0 Z"
            fill={notchFillColor}
          />
        </svg>
      </div>

      {/* 2. Logo container floating inside the Notch (Spatially isolated static wrapper to avoid Framer Motion transform overrides) */}
      <div
        className="absolute left-1/2 top-0 flex h-[38px] -translate-x-1/2 items-center justify-center"
        style={{ zIndex: 20 }}
      >
        <motion.div
          animate={{
            y: hovered ? 4 : 0,
            scale: hovered ? 1.05 : 1,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className="flex items-center justify-center"
        >
          {logo || (
            <div className="flex select-none items-center gap-1.5 rounded-full border border-[#E0DEDB]/40 bg-white/95 px-3 py-1 shadow-sm">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-pulse text-[#37322F] motion-reduce:animate-none"
              >
                <path d="M4 20V8a4 4 0 0 1 8 0v12" />
                <path d="M12 20V8a4 4 0 0 1 8 0v12" />
              </svg>
              <span className="font-serif text-[10px] font-bold uppercase tracking-wider text-[#37322F]">
                Modus
              </span>
            </div>
          )}
        </motion.div>
      </div>

      {/* 3. Left Dotted Grid Decoration */}
      <div className="absolute bottom-6 left-6 hidden opacity-75 sm:block">
        <motion.div
          animate={{
            x: hovered ? 3 : 0,
            y: hovered ? -3 : 0,
          }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-3 gap-2"
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className={cn("h-1 w-1 rounded-full", dotColorClass)} />
          ))}
        </motion.div>
      </div>

      {/* 4. Right Dotted Grid Decoration */}
      <div className="absolute right-6 top-6 hidden opacity-75 sm:block">
        <motion.div
          animate={{
            x: hovered ? -3 : 0,
            y: hovered ? 3 : 0,
          }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-3 gap-2"
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className={cn("h-1 w-1 rounded-full", dotColorClass)} />
          ))}
        </motion.div>
      </div>

      {/* 5. Center Title */}
      <motion.h3
        initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={cn(
          "relative z-10 mb-8 mt-6 max-w-[700px] font-sans text-xl font-bold leading-tight tracking-tight md:text-3xl lg:text-4xl",
          titleColorClass,
        )}
      >
        {title}
      </motion.h3>

      {/* 6. Outline CTA Button */}
      <div className="relative z-10">
        {buttonHref ? (
          <a href={buttonHref} target="_blank" rel="noopener noreferrer" className="inline-block">
            <CTAButton text={buttonText} isHovered={hovered} buttonColorClass={buttonColorClass} />
          </a>
        ) : (
          <button onClick={onButtonClick} type="button">
            <CTAButton text={buttonText} isHovered={hovered} buttonColorClass={buttonColorClass} />
          </button>
        )}
      </div>
    </motion.footer>
  );
}

/* Internal CTA Button Component with physics scales */
function CTAButton({
  text,
  isHovered,
  buttonColorClass,
}: {
  text: string;
  isHovered: boolean;
  buttonColorClass: string;
}) {
  return (
    <motion.div
      animate={{
        scale: isHovered ? 1.03 : 1,
      }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
      className={cn(
        "cursor-pointer select-none rounded-full border px-6 py-2.5 text-xs font-semibold uppercase tracking-wider shadow-md transition-colors duration-300 motion-reduce:transition-none",
        buttonColorClass,
      )}
    >
      {text}
    </motion.div>
  );
}
