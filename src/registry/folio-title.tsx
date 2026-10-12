"use client";

// Ported from ThreeUI Community's Article Headings (MIT, © 2026 Meng To).

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FolioTitleEntry {
  title: string;
  meta: string;
}

interface FolioTitleProps {
  duration?: number;
  stagger?: number;
  scrambleLength?: number;
  preserveChance?: number;
  tailChance?: number;
  label?: string;
  entries?: FolioTitleEntry[];
  className?: string;
}

const DEFAULT_ENTRIES: FolioTitleEntry[] = [
  { title: "A Grid Is a Promise You Keep", meta: "ESSAY · 6 MIN" },
  { title: "Motion Should Explain, Not Decorate", meta: "PRINCIPLE · 4 MIN" },
  { title: "Tokens Before Pixels", meta: "WORKSHOP · 9 MIN" },
];

const DECODE_POOL = "#%&@$/\\<>*+=~ABCDEFGHKMNPRSTUVWXYZ0123456789";
const NOISE =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.16'/%3E%3C/svg%3E\")";

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const easeOut = (value: number) => 1 - Math.pow(1 - value, 2);
const randomGlyph = () => DECODE_POOL[(Math.random() * DECODE_POOL.length) | 0];

export function FolioTitle({
  duration = 560,
  stagger = 140,
  scrambleLength = 10,
  preserveChance = 0.3,
  tailChance = 0.18,
  label = "MODUS JOURNAL",
  entries = DEFAULT_ENTRIES,
  className,
}: FolioTitleProps) {
  const prefersReducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
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
        "bg-background font-sans text-foreground",
        className,
      )}
      style={{
        gridTemplateRows: `auto${" 1fr".repeat(entries.length)}`,
      }}
    >
      <div
        className={cn(
          small,
          "flex justify-between pb-[clamp(14px,2.6cqw,30px)] font-mono uppercase leading-none tracking-[0.18em] text-muted-foreground",
        )}
      >
        <span>{label}</span>
        <span>{String(entries.length).padStart(2, "0")} ENTRIES</span>
      </div>
      {entries.map((entry, index) => (
        <article
          key={`${index}-${entry.title}`}
          className="grid grid-cols-[clamp(28px,4cqw,56px)_minmax(0,1fr)_auto] items-center gap-[clamp(10px,2.2cqw,30px)] border-t border-solid border-border max-[600px]:grid-cols-[24px_minmax(0,1fr)]"
        >
          <span
            className={cn(
              small,
              "font-mono leading-[1.3] tracking-[0.06em] text-[hsl(var(--primary))]",
            )}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <h2
            data-article-heading
            className="m-0 font-serif text-[clamp(20px,3.6cqw,50px)] font-normal italic leading-[1.05] tracking-[-0.01em] text-foreground max-[600px]:text-[clamp(18px,6vw,28px)]"
          >
            {entry.title}
          </h2>
          <span
            className={cn(
              small,
              "rounded-full border border-border px-2.5 py-1 text-right font-mono leading-[1.3] tracking-[0.12em] text-muted-foreground max-[600px]:hidden",
            )}
          >
            {entry.meta}
          </span>
        </article>
      ))}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[5] opacity-[0.08] mix-blend-multiply dark:mix-blend-screen"
        style={{ backgroundImage: NOISE }}
      />
    </div>
  );
}
