"use client";

// Ported from ThreeUI Community's Article Headings (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface EditorialHeadingEntry {
  title: string;
  meta: string;
}

interface EditorialHeadingProps {
  mode?: "dark" | "light";
  duration?: number;
  stagger?: number;
  scrambleLength?: number;
  preserveChance?: number;
  tailChance?: number;
  label?: string;
  entries?: EditorialHeadingEntry[];
  className?: string;
}

const DEFAULT_ENTRIES: EditorialHeadingEntry[] = [
  { title: "Context Is Infrastructure, Not a Prompt", meta: "SYSTEMS NOTE · 8 MIN" },
  { title: "The Last Mile Is Verification", meta: "FIELD GUIDE · 11 MIN" },
];

const DECODE_POOL = "#%&@$/\\<>*+=~ABCDEFGHKMNPRSTUVWXYZ0123456789";
const MONO = "'ThreeUI Fragment Mono','Fragment Mono',ui-monospace,monospace";
const NOISE =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.16'/%3E%3C/svg%3E\")";

const PALETTES = {
  dark: {
    surface: "#0b0b0b",
    text: "#ecece8",
    heading: "#e9e9e5",
    muted: "#62625e",
    label: "#60605c",
    rule: "#2a2a28",
  },
  light: {
    surface: "#f3f5f8",
    text: "#202128",
    heading: "#1d1f26",
    muted: "#71737b",
    label: "#71737b",
    rule: "#d9dce3",
  },
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const easeOut = (value: number) => 1 - Math.pow(1 - value, 2);
const randomGlyph = () => DECODE_POOL[(Math.random() * DECODE_POOL.length) | 0];

export function EditorialHeading({
  mode = "dark",
  duration = 560,
  stagger = 140,
  scrambleLength = 10,
  preserveChance = 0.3,
  tailChance = 0.18,
  label = "FIELD NOTES",
  entries = DEFAULT_ENTRIES,
  className,
}: EditorialHeadingProps) {
  const prefersReducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const palette = mode === "light" ? PALETTES.light : PALETTES.dark;
  const titles = entries.map((entry) => entry.title).join("\n");

  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion) return;
    const frames = new Set<number>();
    const originals = new Map<Text, string>();

    const decodeElement = (element: HTMLElement, delay: number) => {
      const nodes: Array<{ node: Text; original: string }> = [];
      const walk = (node: Node) => {
        node.childNodes.forEach((child) => {
          if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) {
            const text = child as Text;
            const original = text.textContent ?? "";
            originals.set(text, original);
            nodes.push({ node: text, original });
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            walk(child);
          }
        });
      };
      walk(element);

      const total = nodes.reduce((sum, node) => sum + node.original.length, 0);
      const start = performance.now() + delay;
      const frame = (now: number) => {
        const progress = clamp((now - start) / Math.max(1, duration), 0, 1);
        if (now < start) {
          frames.add(requestAnimationFrame(frame));
          return;
        }

        let budget = Math.floor(easeOut(progress) * total);
        for (const textNode of nodes) {
          const length = textNode.original.length;
          const revealed = clamp(budget, 0, length);
          budget -= revealed;
          if (revealed >= length) {
            textNode.node.textContent = textNode.original;
            continue;
          }

          let output = textNode.original.slice(0, revealed);
          const scramble = Math.min(length - revealed, Math.round(scrambleLength));
          for (let index = 0; index < scramble; index += 1) {
            const original = textNode.original[revealed + index];
            output += original === " " || Math.random() < preserveChance ? original : randomGlyph();
          }
          output += textNode.original
            .slice(revealed + scramble)
            .replace(/\S/g, (character) =>
              Math.random() < tailChance ? randomGlyph() : character,
            );
          textNode.node.textContent = output;
        }

        if (progress < 1) frames.add(requestAnimationFrame(frame));
      };
      frames.add(requestAnimationFrame(frame));
    };

    root.querySelectorAll<HTMLElement>("[data-article-heading]").forEach((element, index) => {
      decodeElement(element, index * stagger);
    });

    return () => {
      frames.forEach(cancelAnimationFrame);
      originals.forEach((original, node) => {
        node.textContent = original;
      });
    };
  }, [duration, stagger, scrambleLength, preserveChance, tailChance, titles, prefersReducedMotion]);

  const small = "text-[clamp(8px,0.85cqw,10px)] font-normal";

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative isolate grid h-full min-h-0 w-full min-w-0 overflow-hidden [container-type:inline-size]",
        "px-[clamp(20px,6.2cqw,86px)] py-[clamp(20px,5.4cqw,74px)] max-[600px]:p-[18px]",
        "[font-family:Geist,'Helvetica_Neue',Helvetica,Arial,sans-serif]",
        className,
      )}
      style={{
        color: palette.text,
        background: palette.surface,
        gridTemplateRows: `auto${" 1fr".repeat(entries.length)}`,
      }}
    >
      <div
        className={cn(
          small,
          "flex justify-between pb-[clamp(14px,2.6cqw,30px)] leading-none tracking-[0.12em]",
        )}
        style={{ color: palette.muted, fontFamily: MONO }}
      >
        <span>{label}</span>
        <span>{String(entries.length).padStart(2, "0")} ENTRIES</span>
      </div>
      {entries.map((entry, index) => (
        <article
          key={`${index}-${entry.title}`}
          className="grid grid-cols-[clamp(28px,4cqw,56px)_minmax(0,1fr)_auto] items-center gap-[clamp(10px,2.2cqw,30px)] border-t border-solid max-[600px]:grid-cols-[24px_minmax(0,1fr)]"
          style={{ borderColor: palette.rule }}
        >
          <span
            className={cn(small, "leading-[1.3] tracking-[0.06em]")}
            style={{ color: palette.label, fontFamily: MONO }}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <h2
            data-article-heading
            className="m-0 text-[clamp(18px,3.2cqw,44px)] font-semibold leading-[1.08] tracking-[-0.02em] max-[600px]:text-[clamp(17px,5.5vw,26px)]"
            style={{ color: palette.heading }}
          >
            {entry.title}
          </h2>
          <span
            className={cn(small, "text-right leading-[1.3] tracking-[0.06em] max-[600px]:hidden")}
            style={{ color: palette.label, fontFamily: MONO }}
          >
            {entry.meta}
          </span>
        </article>
      ))}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[5] opacity-[0.12] mix-blend-soft-light"
        style={{ backgroundImage: NOISE }}
      />
    </div>
  );
}
