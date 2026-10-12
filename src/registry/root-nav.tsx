"use client";
// A docs navigation tree whose hairline roots draw out to each open chapter's pages.

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  Download01Icon,
  Layers01Icon,
  Notification01Icon,
  PaintBoardIcon,
  Rocket01Icon,
  Settings01Icon,
  SquareIcon,
  TextFontIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

export interface RootNavPage {
  id: string;
  label: string;
  icon?: IconSvgElement;
}

export interface RootNavChapter {
  title: string;
  pages: RootNavPage[];
}

const DEFAULT_ITEMS: RootNavChapter[] = [
  {
    title: "Foundations",
    pages: [
      { id: "installation", label: "Installation", icon: Download01Icon },
      { id: "quick-start", label: "Quick start", icon: Rocket01Icon },
      { id: "configuration", label: "Configuration", icon: Settings01Icon },
      { id: "theming", label: "Theming", icon: PaintBoardIcon },
    ],
  },
  {
    title: "Library",
    pages: [
      { id: "buttons", label: "Buttons", icon: SquareIcon },
      { id: "typography", label: "Typography", icon: TextFontIcon },
      { id: "overlays", label: "Overlays", icon: Layers01Icon },
      { id: "toasts", label: "Toasts", icon: Notification01Icon },
    ],
  },
];

export interface RootNavProps {
  items?: RootNavChapter[];
  defaultOpen?: number;
  defaultActive?: string;
  onSelect?: (id: string) => void;
  onToggle?: (index: number, open: boolean) => void;
  color?: string;
  accentColor?: string;
  lineColor?: string;
  width?: number;
  rowHeight?: number;
  indent?: number;
  trunk?: number;
  radius?: number;
  lineWidth?: number;
  fontSize?: number;
  drawDuration?: number;
  foldDuration?: number;
  className?: string;
}

export function RootNav({
  items = DEFAULT_ITEMS,
  defaultOpen = 0,
  defaultActive = "",
  onSelect,
  onToggle,
  color = "hsl(var(--foreground))",
  accentColor = "hsl(var(--primary))",
  lineColor = "hsl(var(--border))",
  width = 240,
  rowHeight = 36,
  indent = 36,
  trunk = 14,
  radius = 4,
  lineWidth = 1.5,
  fontSize = 14,
  drawDuration = 400,
  foldDuration = 300,
  className,
}: RootNavProps) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState<Set<number>>(() => new Set([defaultOpen]));
  const [active, setActive] = useState(defaultActive || items[defaultOpen]?.pages[0]?.id || "");

  const toggle = (i: number) => {
    const next = new Set(open);
    const isOpen = !next.has(i);
    if (isOpen) next.add(i);
    else next.delete(i);
    setOpen(next);
    onToggle?.(i, isOpen);
  };

  return (
    <nav className={cn("select-none", className)} style={{ width, color, fontSize }}>
      {items.map((chapter, ci) => {
        const isOpen = open.has(ci);
        const listId = `root-nav-${ci}`;
        return (
          <div key={chapter.title} className="relative">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={listId}
              onClick={() => toggle(ci)}
              className={cn(
                "flex w-full items-center font-mono text-[10px] uppercase tracking-[0.18em] transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]",
                !isOpen && "opacity-50 hover:opacity-80",
              )}
              style={{ height: rowHeight, paddingLeft: trunk + 10 }}
            >
              {chapter.title}
            </button>
            {/* Tick marking the chapter; it inks in when the chapter is open. */}
            <span
              aria-hidden
              className="absolute transition-colors"
              style={{
                left: trunk - lineWidth / 2,
                top: rowHeight * 0.3,
                height: isOpen ? rowHeight * 0.7 : rowHeight * 0.4,
                width: lineWidth,
                background: isOpen ? color : lineColor,
              }}
            />
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.ul
                  id={listId}
                  className="relative m-0 list-none overflow-hidden p-0"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{
                    duration: reduce ? 0 : foldDuration / 1000,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                >
                  {chapter.pages.map((page, pi) => {
                    const on = page.id === active;
                    const y = rowHeight / 2;
                    const bend = Math.min(radius, y);
                    const start = pi === 0 ? 0 : -y;
                    const root = `M ${trunk} ${start} V ${y - bend} Q ${trunk} ${y} ${trunk + bend} ${y} H ${indent - 6}`;
                    return (
                      <li key={page.id} className="relative m-0 p-0" style={{ height: rowHeight }}>
                        <svg
                          aria-hidden
                          className="pointer-events-none absolute left-0 top-0 overflow-visible"
                          width={indent}
                          height={rowHeight}
                        >
                          <motion.path
                            d={root}
                            fill="none"
                            stroke={on ? accentColor : lineColor}
                            strokeWidth={lineWidth}
                            initial={{ pathLength: reduce ? 1 : 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{
                              duration: reduce ? 0 : drawDuration / 1000,
                              delay: reduce ? 0 : (pi * drawDuration) / 4000,
                              ease: "easeOut",
                            }}
                          />
                        </svg>
                        <button
                          type="button"
                          aria-current={on ? "page" : undefined}
                          onClick={() => {
                            setActive(page.id);
                            onSelect?.(page.id);
                          }}
                          className={cn(
                            "flex h-full w-full items-center gap-2 text-left transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]",
                            on ? "font-medium" : "opacity-55 hover:opacity-90",
                          )}
                          style={{ paddingLeft: indent }}
                        >
                          {page.icon && (
                            <HugeiconsIcon
                              icon={page.icon}
                              size={fontSize}
                              color={on ? accentColor : "currentColor"}
                            />
                          )}
                          {page.label}
                        </button>
                      </li>
                    );
                  })}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </nav>
  );
}
