"use client";
// A chip that opens a tray of serif options with a gliding highlight and full keyboard control.
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

export interface TrayOption {
  value: string;
  label?: string;
  tag?: string;
}

interface TrayPickerProps {
  options?: (string | TrayOption)[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string, option: TrayOption) => void;
  placeholder?: string;
  showTags?: boolean;
  accentColor?: string;
  surfaceColor?: string;
  highlightColor?: string;
  textColor?: string;
  size?: "sm" | "md" | "lg";
  radius?: number;
  menuWidth?: number;
  placement?: "bottom" | "top";
  align?: "left" | "right";
  popDuration?: number;
  glideDuration?: number;
  rememberPosition?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

const DEFAULT_OPTIONS: TrayOption[] = [
  { value: "garamond", label: "Garamond", tag: "Old style" },
  { value: "bodoni", label: "Bodoni", tag: "Didone" },
  { value: "caslon", label: "Caslon", tag: "Old style" },
  { value: "baskerville", label: "Baskerville", tag: "Transitional" },
  { value: "clarendon", label: "Clarendon", tag: "Slab" },
];

const SIZES = { sm: "h-8 px-3 text-xs", md: "h-9 px-3.5 text-sm", lg: "h-11 px-4 text-base" };

export function TrayPicker({
  options = DEFAULT_OPTIONS,
  value,
  defaultValue,
  onChange,
  placeholder = "Choose a face…",
  showTags = true,
  accentColor = "hsl(var(--foreground))",
  surfaceColor = "hsl(var(--card))",
  highlightColor = "hsl(var(--muted))",
  textColor = "hsl(var(--foreground))",
  size = "md",
  radius = 10,
  menuWidth = 176,
  placement = "bottom",
  align = "left",
  popDuration = 180,
  glideDuration = 220,
  rememberPosition = true,
  disabled = false,
  ariaLabel = "Choose",
  className,
}: TrayPickerProps) {
  const reduce = useReducedMotion();
  const id = useId();
  const items = options.map((o) => (typeof o === "string" ? { value: o } : o));
  const [own, setOwn] = useState(defaultValue);
  const selected = value ?? own;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const current = items.find((o) => o.value === selected);

  useEffect(() => {
    if (!open) return;
    root.current?.querySelector<HTMLElement>("[role=listbox]")?.focus();
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  const show = () => {
    if (disabled) return;
    setActive(
      Math.max(
        0,
        items.findIndex((o) => o.value === selected),
      ),
    );
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };

  const choose = (i: number) => {
    const option = items[i];
    if (!option) return;
    if (value === undefined) setOwn(option.value);
    onChange?.(option.value, option);
    close();
  };

  const onTriggerKey = (e: KeyboardEvent) => {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
      e.preventDefault();
      show();
    }
  };

  const onListKey = (e: KeyboardEvent) => {
    const last = items.length - 1;
    const moves: Record<string, number> = {
      ArrowDown: Math.min(last, active + 1),
      ArrowUp: Math.max(0, active - 1),
      Home: 0,
      End: last,
    };
    if (e.key in moves) setActive(moves[e.key]);
    else if (e.key === "Enter" || e.key === " ") choose(active);
    else if (e.key === "Escape" || e.key === "Tab") close();
    else return;
    e.preventDefault();
  };

  const dir = placement === "top" ? 1 : -1;

  return (
    <div ref={root} className={cn("relative inline-block", className)} style={{ color: textColor }}>
      <button
        ref={trigger}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        onClick={() => (open ? close() : show())}
        onKeyDown={onTriggerKey}
        className={cn(
          "inline-flex items-center gap-2 border border-border font-sans shadow-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          SIZES[size],
        )}
        style={{ borderRadius: radius, background: surfaceColor }}
      >
        <span className={cn(!current && "opacity-60", current && "font-serif")}>
          {current ? (current.label ?? current.value) : placeholder}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: reduce ? 0 : 0.2 }}
          className="opacity-60"
        >
          <HugeiconsIcon icon={ArrowDown01Icon} size={14} />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            id={`${id}-list`}
            role="listbox"
            tabIndex={-1}
            aria-label={ariaLabel}
            aria-activedescendant={active >= 0 ? `${id}-${active}` : undefined}
            onKeyDown={onListKey}
            onPointerLeave={() => !rememberPosition && setActive(-1)}
            initial={{ opacity: 0, y: reduce ? 0 : dir * 6, scaleY: reduce ? 1 : 0.85 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: reduce ? 0 : dir * 4, scaleY: reduce ? 1 : 0.92 }}
            transition={{ duration: reduce ? 0 : popDuration / 1000, ease: [0.2, 0.8, 0.2, 1] }}
            className={cn(
              "absolute z-50 border border-border p-1 shadow-lg outline-none",
              placement === "top" ? "bottom-full mb-2 origin-bottom" : "top-full mt-2 origin-top",
              align === "right" ? "right-0" : "left-0",
            )}
            style={{ width: menuWidth, borderRadius: radius, background: surfaceColor }}
          >
            {items.map((o, i) => (
              <li
                key={o.value}
                id={`${id}-${i}`}
                role="option"
                aria-selected={o.value === selected}
                onPointerEnter={() => setActive(i)}
                onClick={() => choose(i)}
                className="relative flex cursor-pointer items-center justify-between gap-2 px-2.5 py-1.5"
              >
                {active === i && (
                  <motion.span
                    layoutId={`${id}-glide`}
                    className="absolute inset-0"
                    style={{ background: highlightColor, borderRadius: Math.max(0, radius - 4) }}
                    transition={{
                      duration: reduce ? 0 : glideDuration / 1000,
                      ease: [0.2, 0.8, 0.2, 1],
                    }}
                  />
                )}
                <span className="relative font-serif text-base leading-tight">
                  {o.label ?? o.value}
                </span>
                <span className="relative flex items-center gap-1.5">
                  {showTags && o.tag && (
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] opacity-55">
                      {o.tag}
                    </span>
                  )}
                  {o.value === selected && (
                    <HugeiconsIcon icon={Tick02Icon} size={13} color={accentColor} />
                  )}
                </span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
