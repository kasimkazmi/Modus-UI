"use client";

import { useEffect, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { useTheme } from "next-themes";
import { Check, Monitor, Moon, Palette, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { PALETTES } from "@/lib/themes";
import { usePalette } from "@/lib/palette";

const MODES = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
] as const;

interface ThemePickerProps {
  /** `full` shows the palette name next to the icon; `icon` is a compact toolbar button. */
  variant?: "full" | "icon";
  className?: string;
}

/** Switches the site's palette (colours, typography, radius) and light/dark mode. Previews stay on Modus. */
export function ThemePicker({ variant = "full", className }: ThemePickerProps) {
  const { palette, setPalette } = usePalette();
  const { theme, setTheme } = useTheme();
  // next-themes only knows the stored mode on the client; render a neutral state until mounted.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const active = PALETTES.find((p) => p.id === palette) ?? PALETTES[0];
  const mode = mounted ? theme : undefined;

  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label="Change site theme"
        className={cn(
          "inline-flex items-center gap-2 rounded-md border border-border bg-card/80 text-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          variant === "full" ? "h-9 px-3 text-sm font-medium" : "h-8 w-8 justify-center",
          className,
        )}
      >
        <Palette className="h-4 w-4 shrink-0" />
        {variant === "full" && <span>{active.label}</span>}
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          collisionPadding={16}
          className="z-[100] w-[19rem] rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-xl"
        >
          <p className="pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Mode
          </p>
          <div
            role="radiogroup"
            aria-label="Colour mode"
            className="grid grid-cols-3 gap-1 rounded-md bg-muted p-1"
          >
            {MODES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                role="radio"
                aria-checked={mode === id}
                onClick={() => setTheme(id)}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-[calc(var(--radius)-4px)] px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
                  mode === id && "bg-card text-foreground shadow-sm",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          <p className="pb-2 pt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Palette
          </p>
          <div role="radiogroup" aria-label="Palette" className="grid grid-cols-2 gap-1">
            {PALETTES.map((option) => {
              const selected = option.id === active.id;
              return (
                <button
                  key={option.id}
                  role="radio"
                  aria-checked={selected}
                  title={option.fonts}
                  onClick={() => setPalette(option.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent",
                    selected && "bg-accent",
                  )}
                >
                  <span
                    aria-hidden
                    className="flex h-5 w-5 shrink-0 overflow-hidden rounded-full border border-border"
                  >
                    <span className="h-full w-1/2" style={{ backgroundColor: option.swatch[0] }} />
                    <span className="h-full w-1/2" style={{ backgroundColor: option.swatch[1] }} />
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                    {option.label}
                  </span>
                  {selected && <Check className="h-3.5 w-3.5 shrink-0 text-foreground" />}
                </button>
              );
            })}
          </div>
          <p className="pt-3 text-xs text-muted-foreground">{active.fonts}</p>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
