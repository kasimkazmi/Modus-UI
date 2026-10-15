"use client";
// Variable-font letters that swell in width, weight and slant near the cursor.

import * as React from "react";
import { useAnimationFrame, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface TextPressureProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: string;
  fontFamily?: string;
  fontUrl?: string;
  width?: boolean;
  weight?: boolean;
  italic?: boolean;
  alpha?: boolean;
  flex?: boolean;
  stroke?: boolean;
  scale?: boolean;
  textColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  minFontSize?: number;
}

export function TextPressure({
  text = "Pressure",
  fontFamily = "Roboto Flex",
  fontUrl = "https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wdth,wght@8..144,25..151,100..1000&display=swap",
  width = true,
  weight = true,
  italic = true,
  alpha = false,
  flex = true,
  stroke = false,
  scale = false,
  textColor = "hsl(var(--foreground))",
  strokeColor = "hsl(var(--foreground))",
  strokeWidth = 2,
  minFontSize = 24,
  className,
  ...props
}: TextPressureProps) {
  const reduceMotion = useReducedMotion();
  const boxRef = React.useRef<HTMLDivElement>(null);
  const lineRef = React.useRef<HTMLDivElement>(null);
  const letters = React.useRef<(HTMLSpanElement | null)[]>([]);
  const target = React.useRef<{ x: number; y: number } | null>(null);
  const cursor = React.useRef({ x: 0, y: 0 });
  const [fontSize, setFontSize] = React.useState(minFontSize);
  const [stretch, setStretch] = React.useState(1);
  const chars = Array.from(text);

  React.useEffect(() => {
    if (document.querySelector(`link[href="${fontUrl}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = fontUrl;
    document.head.appendChild(link);
  }, [fontUrl]);

  React.useEffect(() => {
    const box = boxRef.current!;
    const fit = () => {
      const rect = box.getBoundingClientRect();
      setFontSize(
        Math.max(minFontSize, Math.min(rect.width / (chars.length / 2), rect.height || Infinity)),
      );
      cursor.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    const track = (e: PointerEvent) => (target.current = { x: e.clientX, y: e.clientY });
    window.addEventListener("pointermove", track);
    return () => {
      observer.disconnect();
      window.removeEventListener("pointermove", track);
    };
  }, [chars.length, minFontSize]);

  React.useLayoutEffect(() => {
    if (!scale) return setStretch(1);
    const lineHeight = lineRef.current!.getBoundingClientRect().height / stretch;
    setStretch(boxRef.current!.clientHeight / lineHeight || 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale, fontSize, text]);

  useAnimationFrame(() => {
    const box = boxRef.current;
    if (!box) return;
    const goal = target.current ?? cursor.current;
    const ease = reduceMotion ? 1 : 0.12;
    cursor.current.x += (goal.x - cursor.current.x) * ease;
    cursor.current.y += (goal.y - cursor.current.y) * ease;
    const reach = box.getBoundingClientRect().width / 2 || 1;

    for (const el of letters.current) {
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const d = Math.hypot(
        cursor.current.x - (r.left + r.width / 2),
        cursor.current.y - (r.top + r.height / 2),
      );
      const pull = Math.max(0, 1 - d / reach);
      const wdth = width ? 25 + pull * 125 : 100;
      const wght = weight ? 100 + pull * 800 : 400;
      el.style.fontVariationSettings = `"wdth" ${wdth.toFixed(0)}, "wght" ${wght.toFixed(0)}, "ital" ${italic ? pull.toFixed(2) : 0}`;
      el.style.opacity = alpha ? pull.toFixed(2) : "1";
    }
  });

  return (
    <div
      ref={boxRef}
      className={cn("relative h-full w-full overflow-hidden", className)}
      {...props}
    >
      <div
        ref={lineRef}
        aria-label={text}
        role="img"
        className={cn("select-none whitespace-nowrap uppercase", flex && "flex justify-between")}
        style={{
          fontFamily,
          fontSize,
          lineHeight: 1,
          color: textColor,
          transform: `scaleY(${stretch})`,
          transformOrigin: "top center",
          WebkitTextStroke: stroke ? `${strokeWidth}px ${strokeColor}` : undefined,
        }}
      >
        {chars.map((char, i) => (
          <span
            key={i}
            aria-hidden
            ref={(el) => {
              letters.current[i] = el;
            }}
            className="inline-block"
          >
            {char === " " ? " " : char}
          </span>
        ))}
      </div>
    </div>
  );
}
