"use client";
// A prompt composer with source, slash-command, model and effort menus.

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowUp02Icon,
  FlashIcon,
  Mic01Icon,
  SquareIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

export interface QueryOption {
  id: string;
  label: string;
  hint?: string;
}

const DEFAULT_SOURCES: QueryOption[] = [
  { id: "file", label: "Upload a file" },
  { id: "drive", label: "From the drive" },
  { id: "web", label: "Search the web" },
];
const DEFAULT_COMMANDS: QueryOption[] = [
  { id: "summarize", label: "/summarize", hint: "Condense the thread" },
  { id: "rewrite", label: "/rewrite", hint: "Rework the tone" },
  { id: "outline", label: "/outline", hint: "Draft a structure" },
];
const DEFAULT_MODELS: QueryOption[] = [
  { id: "nova-3", label: "Nova 3" },
  { id: "nova-3-mini", label: "Nova 3 Mini" },
  { id: "atlas", label: "Atlas" },
];
const DEFAULT_EFFORTS: QueryOption[] = [
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
];

export interface QueryWellProps {
  placeholder?: string;
  sources?: QueryOption[];
  commands?: QueryOption[];
  models?: QueryOption[];
  defaultModel?: string;
  efforts?: QueryOption[];
  defaultEffort?: string;
  onEffortChange?: (effort: string) => void;
  busy?: boolean;
  onSend?: (text: string, options: { model: string; effort: string }) => void;
  onStop?: () => void;
  onAttach?: (source: string) => void;
  onDictate?: () => void;
  background?: string;
  color?: string;
  menuBackground?: string;
  sparkColor?: string;
  sparkBoost?: number;
  width?: number;
  radius?: number;
  maxRows?: number;
  morphDuration?: number;
  squash?: number;
  tilt?: number;
  pressScale?: number;
  className?: string;
}

type MenuName = "sources" | "model" | "effort" | null;

export function QueryWell({
  placeholder = "Draft a request",
  sources = DEFAULT_SOURCES,
  commands = DEFAULT_COMMANDS,
  models = DEFAULT_MODELS,
  defaultModel = "",
  efforts = DEFAULT_EFFORTS,
  defaultEffort = "",
  onEffortChange,
  busy = false,
  onSend,
  onStop,
  onAttach,
  onDictate,
  background = "hsl(var(--card))",
  color = "hsl(var(--foreground))",
  menuBackground = "hsl(var(--popover))",
  sparkColor = "hsl(var(--primary))",
  sparkBoost = 1,
  width = 440,
  radius = 12,
  maxRows = 5,
  morphDuration = 240,
  squash = 0.12,
  tilt = 8,
  pressScale = 0.96,
  className,
}: QueryWellProps) {
  const reduce = useReducedMotion();
  const [text, setText] = useState("");
  const [menu, setMenu] = useState<MenuName>(null);
  const [model, setModel] = useState(defaultModel || models[0]?.id || "");
  const [effort, setEffort] = useState(defaultEffort || efforts[efforts.length - 1]?.id || "");
  const area = useRef<HTMLTextAreaElement>(null);
  const root = useRef<HTMLDivElement>(null);

  // Grow the textarea up to maxRows.
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    const line = parseFloat(getComputedStyle(el).lineHeight) || 20;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, line * maxRows)}px`;
  }, [text, maxRows]);

  useEffect(() => {
    if (!menu) return;
    const close = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setMenu(null);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [menu]);

  const slash = /^\/\S*$/.test(text) ? commands.filter((c) => c.label.startsWith(text)) : [];
  const ready = text.trim().length > 0;
  const nameOf = (list: QueryOption[], id: string) => list.find((o) => o.id === id)?.label;

  const send = () => {
    if (busy) return onStop?.();
    if (!ready) return;
    onSend?.(text.trim(), { model, effort });
    setText("");
  };

  const spring = reduce ? { duration: 0 } : { duration: morphDuration / 1000 };

  return (
    <div
      ref={root}
      className={cn("relative max-w-full ring-1 ring-[hsl(var(--border))]", className)}
      style={{ width, borderRadius: radius, background, color }}
    >
      <textarea
        ref={area}
        rows={1}
        value={text}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (slash[0]) setText(`${slash[0].label} `);
            else send();
          }
          if (e.key === "Escape") setMenu(null);
        }}
        className="block w-full resize-none bg-transparent px-3.5 pt-3 text-sm leading-5 outline-none placeholder:text-muted-foreground"
      />

      <div className="flex items-center gap-1 px-2 pb-2 pt-1.5">
        <Chip onClick={() => setMenu(menu === "sources" ? null : "sources")} label="Add source">
          <HugeiconsIcon icon={Add01Icon} size={14} />
        </Chip>
        <Chip onClick={() => setMenu(menu === "model" ? null : "model")} label="Model">
          {nameOf(models, model)}
          <HugeiconsIcon icon={ArrowDown01Icon} size={12} />
        </Chip>
        <Chip onClick={() => setMenu(menu === "effort" ? null : "effort")} label="Effort">
          <HugeiconsIcon icon={FlashIcon} size={12} />
          {nameOf(efforts, effort)}
        </Chip>
        <div className="flex-1" />
        {onDictate && (
          <Chip onClick={onDictate} label="Dictate">
            <HugeiconsIcon icon={Mic01Icon} size={14} />
          </Chip>
        )}
        <motion.button
          type="button"
          aria-label={busy ? "Stop" : "Send"}
          disabled={!busy && !ready}
          onClick={send}
          whileTap={reduce ? undefined : { scale: pressScale, scaleY: pressScale - squash / 2 }}
          whileHover={reduce || (!busy && !ready) ? undefined : { rotate: -tilt }}
          animate={{
            borderRadius: busy ? 6 : 999,
            opacity: busy || ready ? 1 : 0.45,
            boxShadow:
              ready && !busy && !reduce
                ? `0 0 ${10 * sparkBoost}px ${2 * sparkBoost}px color-mix(in srgb, ${sparkColor} 35%, transparent)`
                : "0 0 0 0 transparent",
          }}
          transition={spring}
          className="grid size-7 place-items-center text-[hsl(var(--primary-foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
          style={{ background: sparkColor }}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={busy ? "stop" : "send"}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={spring}
            >
              <HugeiconsIcon icon={busy ? SquareIcon : ArrowUp02Icon} size={14} />
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>

      <AnimatePresence>
        {(menu || slash.length > 0) && (
          <motion.ul
            key={menu ?? "commands"}
            role="listbox"
            initial={{ opacity: 0, y: reduce ? 0 : 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.15 }}
            className="absolute bottom-full left-2 z-20 m-0 mb-2 min-w-44 list-none rounded-md p-1 text-sm shadow-lg ring-1 ring-[hsl(var(--border))]"
            style={{ background: menuBackground }}
          >
            {(menu === "sources"
              ? sources
              : menu === "model"
                ? models
                : menu === "effort"
                  ? efforts
                  : slash
            ).map((o) => (
              <li key={o.id} className="m-0 p-0">
                <button
                  type="button"
                  role="option"
                  aria-selected={
                    (menu === "model" && o.id === model) || (menu === "effort" && o.id === effort)
                  }
                  onClick={() => {
                    if (menu === "sources") onAttach?.(o.id);
                    else if (menu === "model") setModel(o.id);
                    else if (menu === "effort") {
                      setEffort(o.id);
                      onEffortChange?.(o.id);
                    } else {
                      setText(`${o.label} `);
                      area.current?.focus();
                    }
                    setMenu(null);
                  }}
                  className="flex w-full items-baseline justify-between gap-4 rounded px-2 py-1.5 text-left hover:bg-[hsl(var(--muted))] focus-visible:bg-[hsl(var(--muted))] focus-visible:outline-none"
                >
                  <span>{o.label}</span>
                  {o.hint && <span className="text-xs text-muted-foreground">{o.hint}</span>}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function Chip({
  children,
  onClick,
  label,
}: {
  children: ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-7 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:bg-[hsl(var(--muted))] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
    >
      {children}
    </button>
  );
}
