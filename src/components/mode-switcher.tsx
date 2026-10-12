"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const MODES = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
] as const;

/** Segmented Light / Dark / System control for the site's colour mode. */
export function ModeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  // next-themes only knows the stored mode on the client.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div
      role="radiogroup"
      aria-label="Colour mode"
      className={cn(
        "grid grid-cols-3 gap-1 rounded-lg border border-border bg-card/60 p-1",
        className,
      )}
    >
      {MODES.map(({ id, label, icon: Icon }) => {
        const active = mounted && theme === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(id)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
