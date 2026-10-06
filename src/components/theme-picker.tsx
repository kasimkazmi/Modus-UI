"use client";

import { useEffect, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { useTheme } from "next-themes";
import { Check, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_THEME, THEMES } from "@/lib/themes";

interface ThemePickerProps {
  /** `full` shows the theme name next to the icon; `icon` is a compact toolbar button. */
  variant?: "full" | "icon";
  className?: string;
}

/** Switches the site theme (colours, typography, radius). Previews stay on Modus. */
export function ThemePicker({ variant = "full", className }: ThemePickerProps) {
  const { theme, setTheme } = useTheme();
  // The stored theme is only known on the client; render the default until mounted.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const active = THEMES.find((t) => t.id === (mounted ? theme : DEFAULT_THEME)) ?? THEMES[0];

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
          className="z-[100] w-64 rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-xl"
        >
          <p className="px-2 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Site theme
          </p>
          <div role="radiogroup" aria-label="Site theme" className="space-y-1">
            {THEMES.map((option) => {
              const selected = option.id === active.id;
              return (
                <button
                  key={option.id}
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setTheme(option.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-accent",
                    selected && "bg-accent",
                  )}
                >
                  <span
                    aria-hidden
                    className="flex h-6 w-6 shrink-0 overflow-hidden rounded-full border border-border"
                  >
                    <span className="h-full w-1/2" style={{ backgroundColor: option.swatch[0] }} />
                    <span className="h-full w-1/2" style={{ backgroundColor: option.swatch[1] }} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-foreground">
                      {option.label}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {option.fonts}
                    </span>
                  </span>
                  {selected && <Check className="h-4 w-4 shrink-0 text-foreground" />}
                </button>
              );
            })}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
