"use client";
// Inverted tooltip that stays warm: once one opens, neighbours open instantly and the slab glides across.

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/** Which hint is showing, and until when the group stays warm. */
function createWarmth() {
  let shown: string | null = null;
  let warmUntil = 0;
  const listeners = new Set<() => void>();
  return {
    get: () => shown,
    isWarm: () => performance.now() < warmUntil,
    subscribe(fn: () => void) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    show(id: string | null, warmWindow: number) {
      if (shown && !id) warmUntil = performance.now() + warmWindow;
      shown = id;
      listeners.forEach((fn) => fn());
    },
  };
}

const WarmthContext = createContext(createWarmth());

/** Shares warm state (and the glide) between the hints inside it. */
export function EmberHintGroup({ children }: { children: ReactNode }) {
  const [warmth] = useState(createWarmth);
  return (
    <WarmthContext.Provider value={warmth}>
      <LayoutGroup id={useId()}>{children}</LayoutGroup>
    </WarmthContext.Provider>
  );
}

const SIZES = {
  sm: "px-1.5 py-0.5 text-[9px]",
  md: "px-2 py-1 text-[10px]",
  lg: "px-2.5 py-1.5 text-[11px]",
};

const PLACE = {
  top: { box: "bottom-full left-1/2 -translate-x-1/2", pad: "paddingBottom", y: 4, x: 0 },
  bottom: { box: "top-full left-1/2 -translate-x-1/2", pad: "paddingTop", y: -4, x: 0 },
  left: { box: "right-full top-1/2 -translate-y-1/2", pad: "paddingRight", y: 0, x: 4 },
  right: { box: "left-full top-1/2 -translate-y-1/2", pad: "paddingLeft", y: 0, x: -4 },
} as const;

const ARROW = {
  top: "-bottom-[3px] left-1/2 -ml-[3px]",
  bottom: "-top-[3px] left-1/2 -ml-[3px]",
  left: "-right-[3px] top-1/2 -mt-[3px]",
  right: "-left-[3px] top-1/2 -mt-[3px]",
};

interface EmberHintProps {
  content: ReactNode;
  shortcut?: string;
  children: ReactNode;
  side?: keyof typeof PLACE;
  /** Cold open delay in ms. */
  delay?: number;
  /** How long (ms) after closing the next hint still opens instantly. */
  warmWindow?: number;
  surfaceColor?: string;
  inkColor?: string;
  size?: keyof typeof SIZES;
  radius?: number;
  gap?: number;
  arrow?: boolean;
  popDuration?: number;
  popScale?: number;
  popBlur?: number;
  /** Draws a hairline under the trigger that burns down while the cold delay runs. */
  showFuse?: boolean;
  /** Touch hold, in ms, that opens the hint. */
  longPress?: number;
  disabled?: boolean;
  className?: string;
}

export function EmberHint({
  content,
  shortcut,
  children,
  side = "top",
  delay,
  warmWindow,
  surfaceColor = "hsl(var(--foreground))",
  inkColor = "hsl(var(--background))",
  size = "md",
  radius = 3,
  gap = 8,
  arrow = true,
  popDuration = 160,
  popScale = 0.94,
  popBlur = 4,
  showFuse = false,
  longPress = 500,
  disabled = false,
  className,
}: EmberHintProps) {
  const warmth = useContext(WarmthContext);
  const id = useId();
  const reduce = useReducedMotion();
  const open = useSyncExternalStore(warmth.subscribe, warmth.get, () => null) === id;
  const [fusing, setFusing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const coldDelay = delay ?? 500;
  const warmMs = warmWindow ?? 400;

  const clear = () => {
    clearTimeout(timer.current);
    setFusing(false);
  };
  const show = (wait: number) => {
    if (disabled) return;
    clear();
    if (warmth.get() || warmth.isWarm()) return warmth.show(id, warmMs);
    setFusing(true);
    timer.current = setTimeout(() => {
      setFusing(false);
      warmth.show(id, warmMs);
    }, wait);
  };
  const hide = () => {
    clear();
    if (warmth.get() === id) warmth.show(null, warmMs);
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  const place = PLACE[side];
  const seconds = popDuration / 1000;

  return (
    <span
      className={cn("relative inline-flex", className)}
      onPointerEnter={(e) => e.pointerType === "mouse" && show(coldDelay)}
      onPointerLeave={hide}
      onPointerDown={(e) => e.pointerType !== "mouse" && show(longPress)}
      onPointerUp={(e) => e.pointerType !== "mouse" && clear()}
      onFocus={() => show(0)}
      onBlur={hide}
      onKeyDown={(e) => e.key === "Escape" && hide()}
    >
      {children}
      {showFuse && fusing && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute -bottom-1 left-0 h-px w-full origin-left"
          style={{ background: surfaceColor }}
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: reduce ? 0 : coldDelay / 1000, ease: "linear" }}
        />
      )}
      <AnimatePresence>
        {open && (
          <span
            role="tooltip"
            className={cn("pointer-events-none absolute z-50", place.box)}
            style={{ [place.pad]: gap }}
          >
            <motion.span
              layoutId="ember-hint"
              className={cn(
                "relative flex items-center gap-2 whitespace-nowrap font-mono uppercase tracking-[0.14em]",
                SIZES[size],
              )}
              style={{ background: surfaceColor, color: inkColor, borderRadius: radius }}
              initial={
                reduce
                  ? { opacity: 0 }
                  : {
                      opacity: 0,
                      scale: popScale,
                      x: place.x,
                      y: place.y,
                      filter: `blur(${popBlur}px)`,
                    }
              }
              animate={{ opacity: 1, scale: 1, x: 0, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, transition: { duration: seconds / 2 } }}
              transition={{ duration: reduce ? 0 : seconds, ease: [0.2, 0.8, 0.2, 1] }}
            >
              {content}
              {shortcut && <kbd className="font-mono opacity-60">{shortcut}</kbd>}
              {arrow && (
                <span
                  aria-hidden
                  className={cn("absolute h-1.5 w-1.5 rotate-45", ARROW[side])}
                  style={{ background: surfaceColor }}
                />
              )}
            </motion.span>
          </span>
        )}
      </AnimatePresence>
    </span>
  );
}
