"use client";
// Paper notice that slides in, burns a fuse down to dismissal and can be swiped away sideways.

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  type AnimationPlaybackControls,
} from "framer-motion";
import { cn } from "@/lib/utils";

export interface FlickNoticeProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  open?: boolean;
  onClose?: () => void;
  background?: string;
  color?: string;
  fuseColor?: string;
  width?: number;
  radius?: number;
  slideMs?: number;
  settleBounce?: number;
  swipeDistance?: number;
  duration?: number;
  fuse?: "top" | "bottom" | "none";
  pauseOnHover?: boolean;
  closeButton?: boolean;
  inline?: boolean;
  dismissible?: boolean;
  className?: string;
}

export function FlickNotice({
  title = "Draft filed to the folio",
  description = "",
  icon,
  actionLabel = "",
  onAction,
  open = true,
  onClose,
  background = "hsl(var(--card))",
  color = "hsl(var(--foreground))",
  fuseColor = "hsl(var(--primary))",
  width = 356,
  radius = 12,
  slideMs = 400,
  settleBounce = 0.2,
  swipeDistance = 40,
  duration = 4000,
  fuse = "bottom",
  pauseOnHover = true,
  closeButton = false,
  inline = false,
  dismissible = true,
  className,
}: FlickNoticeProps) {
  const reduce = useReducedMotion();
  const [gone, setGone] = useState<0 | -1 | 1 | null>(null);
  const left = useMotionValue(1);
  const burn = useRef<AnimationPlaybackControls | null>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const shown = open && gone === null;

  const close = (dir: -1 | 0 | 1) => {
    burn.current?.stop();
    setGone(dir);
    closeRef.current?.();
  };

  useEffect(() => {
    if (!open || duration <= 0) return;
    left.set(1);
    burn.current = animate(left, 0, {
      duration: duration / 1000,
      ease: "linear",
      onComplete: () => {
        setGone(0);
        closeRef.current?.();
      },
    });
    return () => burn.current?.stop();
  }, [open, duration, left]);

  const slide = reduce
    ? { duration: 0 }
    : { type: "spring" as const, duration: slideMs / 1000, bounce: settleBounce };

  return (
    <AnimatePresence custom={gone}>
      {shown && (
        <motion.div
          role="status"
          custom={gone}
          drag={dismissible ? "x" : false}
          dragSnapToOrigin
          dragElastic={0.6}
          onDragEnd={(_, info) => {
            if (Math.abs(info.offset.x) > swipeDistance) close(info.offset.x > 0 ? 1 : -1);
          }}
          onHoverStart={() => pauseOnHover && burn.current?.pause()}
          onHoverEnd={() => pauseOnHover && burn.current?.play()}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          variants={{
            out: (dir: number) =>
              reduce || !dir
                ? { opacity: 0, transition: { duration: reduce ? 0 : 0.2 } }
                : { x: dir * (width + 40), opacity: 0, transition: { duration: 0.22 } },
          }}
          exit="out"
          transition={slide}
          className={cn(
            "relative flex cursor-grab touch-pan-y items-center gap-3 overflow-hidden border border-[hsl(var(--border))] px-4 py-3 shadow-[0_8px_24px_-12px_hsl(var(--foreground)/0.25)] active:cursor-grabbing",
            !inline && "fixed bottom-6 right-6 z-50",
            className,
          )}
          style={{
            width,
            maxWidth: inline ? "100%" : "calc(100vw - 32px)",
            borderRadius: radius,
            background,
            color,
          }}
        >
          {icon && <span className="shrink-0">{icon}</span>}
          <div className="min-w-0 flex-1">
            <p className="font-serif text-[15px] leading-snug">{title}</p>
            {description && (
              <p className="mt-0.5 text-[13px] text-[hsl(var(--muted-foreground))]">
                {description}
              </p>
            )}
          </div>
          {actionLabel && (
            <button
              type="button"
              onClick={() => {
                onAction?.();
                close(0);
              }}
              className="shrink-0 rounded-md bg-[hsl(var(--primary))] px-2.5 py-1 text-xs font-medium text-[hsl(var(--primary-foreground))] outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            >
              {actionLabel}
            </button>
          )}
          {closeButton && (
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => close(0)}
              className="shrink-0 rounded p-1 text-[hsl(var(--muted-foreground))] outline-none hover:text-[hsl(var(--foreground))] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            >
              <svg
                viewBox="0 0 12 12"
                width={12}
                height={12}
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path d="M2 2l8 8M10 2l-8 8" />
              </svg>
            </button>
          )}
          {fuse !== "none" && duration > 0 && (
            <motion.span
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-x-0 h-0.5 origin-left",
                fuse === "top" ? "top-0" : "bottom-0",
              )}
              style={{ background: fuseColor, scaleX: left }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
