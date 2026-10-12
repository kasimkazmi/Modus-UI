"use client";
// Dictation button that widens into a capsule with a scrolling level meter and a running clock.

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface HumCapsuleProps {
  accentColor?: string;
  iconColor?: string;
  background?: string;
  /** Height of the button, and its width at rest, in px. */
  size?: number;
  shape?: "rounded" | "circle";
  /** Number of bars in the scrolling meter. */
  reach?: number;
  showTime?: boolean;
  /** Scrolling bars; off shows a single pulsing dot. */
  waveform?: boolean;
  slideToCancel?: boolean;
  /** Pixels to slide left before a held press cancels. */
  cancelDistance?: number;
  /** Meter rise time in ms. */
  attack?: number;
  /** Meter fall time in ms. */
  release?: number;
  sensitivity?: number;
  /** Lowest bar height, as a fraction of the meter. */
  floor?: number;
  openDuration?: number;
  pressScale?: number;
  /** "toggle" taps on and off, "hold" is push-to-talk, "auto" does both. */
  mode?: "auto" | "toggle" | "hold";
  /** In auto mode, a press longer than this (ms) becomes push-to-talk. */
  holdAfter?: number;
  /** "microphone" meters the real input; "simulated" fakes a voice. */
  reactive?: "simulated" | "microphone";
  disabled?: boolean;
  ariaLabel?: string;
  onStart?: () => void;
  onStop?: (seconds: number, cancelled: boolean) => void;
  className?: string;
}

function MicGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[55%] w-[55%]"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
    >
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
    </svg>
  );
}

/** Returns a 0–1 loudness sampler: the real microphone or a voice-like fake. */
async function openSource(kind: "simulated" | "microphone") {
  if (kind === "microphone") {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    ctx.createMediaStreamSource(stream).connect(analyser);
    const buf = new Float32Array(analyser.fftSize);
    return {
      read() {
        analyser.getFloatTimeDomainData(buf);
        return Math.min(1, Math.sqrt(buf.reduce((s, v) => s + v * v, 0) / buf.length) * 4);
      },
      close() {
        stream.getTracks().forEach((t) => t.stop());
        void ctx.close();
      },
    };
  }
  return {
    read() {
      const t = performance.now() / 1000;
      const syllable = Math.max(0, Math.sin(t * 7.3) * Math.sin(t * 2.1 + 1));
      return Math.min(1, syllable * 0.8 + Math.random() * 0.25);
    },
    close() {},
  };
}

export function HumCapsule({
  accentColor = "hsl(var(--primary))",
  iconColor = "hsl(var(--foreground))",
  background = "hsl(var(--muted))",
  size = 28,
  shape = "rounded",
  reach = 8,
  showTime = true,
  waveform = true,
  slideToCancel = true,
  cancelDistance = 64,
  attack = 40,
  release = 240,
  sensitivity = 1,
  floor = 0.1,
  openDuration = 200,
  pressScale = 0.95,
  mode = "auto",
  holdAfter = 300,
  reactive = "simulated",
  disabled = false,
  ariaLabel = "Dictate",
  onStart,
  onStop,
  className,
}: HumCapsuleProps) {
  const reduce = useReducedMotion();
  const [live, setLive] = useState(false);
  const [bars, setBars] = useState<number[]>(() => Array(reach).fill(floor));
  const [elapsed, setElapsed] = useState(0);
  const [slide, setSlide] = useState(0);
  const press = useRef<{ x: number; at: number; wasLive: boolean } | null>(null);
  const began = useRef(0);

  useEffect(() => {
    if (!live) return;
    let raf = 0;
    let level = 0;
    let last = performance.now();
    let lastPush = 0;
    let source: Awaited<ReturnType<typeof openSource>> | null = null;
    let stopped = false;
    openSource(reactive)
      .then((s) => (stopped ? s.close() : (source = s)))
      .catch(() => setLive(false));
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      const target = Math.min(1, (source?.read() ?? 0) * sensitivity);
      const tau = target > level ? attack : release;
      level += (target - level) * (1 - Math.exp(-dt / Math.max(1, tau)));
      setElapsed((now - began.current) / 1000);
      if (now - lastPush > 70) {
        lastPush = now;
        setBars((prev) => [...prev.slice(1 - reach), Math.max(floor, level)]);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      source?.close();
    };
  }, [live, reactive, sensitivity, attack, release, floor, reach]);

  const start = () => {
    began.current = performance.now();
    setElapsed(0);
    setBars(Array(reach).fill(floor));
    setLive(true);
    onStart?.();
  };
  const stop = (cancelled: boolean) => {
    setLive(false);
    setSlide(0);
    onStop?.((performance.now() - began.current) / 1000, cancelled);
  };

  const radius = shape === "circle" ? size / 2 : size * 0.3;
  const clock = `${Math.floor(elapsed / 60)}:${String(Math.floor(elapsed % 60)).padStart(2, "0")}`;
  const cancelling = slideToCancel && slide > cancelDistance;

  return (
    <motion.button
      type="button"
      layout
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={live}
      onPointerDown={(e) => {
        if (disabled || e.button !== 0) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        press.current = { x: e.clientX, at: performance.now(), wasLive: live };
        if (!live && mode !== "toggle") start();
      }}
      onPointerMove={(e) => {
        if (press.current && live && slideToCancel)
          setSlide(Math.max(0, press.current.x - e.clientX));
      }}
      onPointerUp={() => {
        const p = press.current;
        press.current = null;
        if (!p) return;
        const held = performance.now() - p.at > holdAfter;
        if (cancelling) return stop(true);
        setSlide(0);
        if (mode === "hold" || (mode === "auto" && held && !p.wasLive)) return live && stop(false);
        if (p.wasLive) return stop(false);
        if (mode === "toggle") start();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && live) stop(true);
      }}
      onClick={(e) => {
        // Keyboard activation (pointer presses are handled above).
        if (e.detail === 0) live ? stop(false) : start();
      }}
      whileTap={reduce ? undefined : { scale: pressScale }}
      transition={{ duration: reduce ? 0 : openDuration / 1000, ease: [0.2, 0.8, 0.2, 1] }}
      className={cn(
        "inline-flex touch-none select-none items-center overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
        className,
      )}
      style={{
        height: size,
        minWidth: size,
        borderRadius: radius,
        background,
        color: iconColor,
        x: live ? -Math.min(slide, cancelDistance) / 3 : 0,
        opacity: cancelling ? 0.6 : 1,
      }}
    >
      <motion.span
        layout
        className="grid shrink-0 place-items-center"
        style={{ width: size, height: size }}
      >
        <MicGlyph />
      </motion.span>
      {live && (
        <motion.span
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 pr-3"
          style={{ height: size, color: accentColor }}
        >
          {waveform ? (
            <span className="flex items-center gap-[2px]" style={{ height: size * 0.5 }}>
              {bars.map((b, i) => (
                <span
                  key={i}
                  className="w-[2px] rounded-full"
                  style={{
                    height: `${b * 100}%`,
                    background: accentColor,
                    transition: reduce ? undefined : "height 70ms linear",
                  }}
                />
              ))}
            </span>
          ) : (
            <span
              className="rounded-full"
              style={{
                width: size * 0.25,
                height: size * 0.25,
                background: accentColor,
                transform: reduce ? undefined : `scale(${0.6 + bars[bars.length - 1]})`,
              }}
            />
          )}
          {showTime && (
            <span className="font-mono text-[11px] tabular-nums">
              {cancelling ? "Release" : clock}
            </span>
          )}
        </motion.span>
      )}
    </motion.button>
  );
}
