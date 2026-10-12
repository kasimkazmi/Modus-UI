"use client";
// A monospace command tag that fills with ink while it runs, then settles to done or retry.

import { useEffect, useState, type CSSProperties } from "react";
import { motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  CommandLineIcon,
  ComputerTerminal01Icon,
  RefreshIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

const ICONS = { terminal: ComputerTerminal01Icon, command: CommandLineIcon };

export interface RunTagProps {
  icon?: keyof typeof ICONS;
  name?: string;
  argument?: string;
  status?: "running" | "done" | "error";
  expectedMs?: number;
  size?: number;
  radius?: number;
  color?: string;
  surfaceColor?: string;
  progressColor?: string;
  progressOpacity?: number;
  doneColor?: string;
  errorColor?: string;
  washOpacity?: number;
  shake?: number;
  showTimer?: boolean;
  onRetry?: () => void;
  style?: CSSProperties;
  className?: string;
}

export function RunTag({
  icon = "terminal",
  name = "pnpm",
  argument = "build --filter docs",
  status = "running",
  expectedMs = 2500,
  size = 34,
  radius = 6,
  color = "hsl(var(--foreground))",
  surfaceColor = "hsl(var(--muted))",
  progressColor = "hsl(var(--primary))",
  progressOpacity = 0.16,
  doneColor = "hsl(var(--primary))",
  errorColor = "hsl(var(--destructive))",
  washOpacity = 0.14,
  shake = 6,
  showTimer = true,
  onRetry,
  style,
  className,
}: RunTagProps) {
  const reduce = useReducedMotion();
  const [elapsed, setElapsed] = useState(0);
  const progress = useMotionValue(0);
  const width = useTransform(progress, (p) => `${p * 100}%`);

  useEffect(() => {
    if (status !== "running") {
      progress.set(status === "done" ? 1 : progress.get());
      return;
    }
    const start = performance.now();
    progress.set(0);
    let frame = 0;
    const tick = () => {
      const ms = performance.now() - start;
      setElapsed(Math.round(ms));
      // Eases towards the end but never arrives until the run does.
      progress.set(1 - Math.exp(-ms / expectedMs));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [status, expectedMs, progress]);

  const settled = status !== "running";
  const tone = status === "done" ? doneColor : status === "error" ? errorColor : progressColor;

  return (
    <motion.div
      className={cn(
        "relative inline-flex items-center gap-2 overflow-hidden whitespace-nowrap px-3 font-mono text-xs",
        className,
      )}
      style={{ height: size, borderRadius: radius, background: surfaceColor, color, ...style }}
      animate={
        status === "error" && !reduce
          ? { x: [0, -shake, shake, -shake / 2, shake / 2, 0] }
          : { x: 0 }
      }
      transition={{ duration: 0.4 }}
    >
      <motion.span
        aria-hidden
        className="absolute inset-y-0 left-0"
        style={{ width: settled ? "100%" : width, background: tone }}
        initial={false}
        animate={{ opacity: settled ? washOpacity : progressOpacity }}
        transition={{ duration: reduce ? 0 : 0.3 }}
      />
      <span className="relative flex items-center gap-2" aria-hidden>
        <HugeiconsIcon icon={ICONS[icon] ?? ComputerTerminal01Icon} size={size * 0.4} />
        <span className="font-semibold">{name}</span>
        <span className="opacity-70">{argument}</span>
        {showTimer && <span className="tabular-nums opacity-50">{elapsed} ms</span>}
        {status === "done" && (
          <HugeiconsIcon icon={Tick02Icon} size={size * 0.4} color={doneColor} />
        )}
        {status === "error" && (
          <HugeiconsIcon icon={Alert02Icon} size={size * 0.4} color={errorColor} />
        )}
      </span>
      {status === "error" && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="relative -mr-1.5 flex items-center gap-1 rounded px-1.5 py-1 uppercase tracking-[0.12em] hover:bg-[hsl(var(--background)/0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
          style={{ color: errorColor }}
        >
          <HugeiconsIcon icon={RefreshIcon} size={size * 0.35} />
          Retry
        </button>
      )}
      <span className="sr-only" role="status">
        {`${name} ${argument}, ${status}`}
      </span>
    </motion.div>
  );
}
