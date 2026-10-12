import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

interface ModusStageProps {
  /** Caption printed in the stage's footer, e.g. the component title. */
  caption: string;
  /** `bleed` gives the child the whole inner frame (scenes, backgrounds); `center` centres it. */
  layout?: "bleed" | "center";
  children: ReactNode;
  className?: string;
}

/** The house frame every Modus demo sits in: a grained paper card, corner ticks and a mono caption. */
export function ModusStage({ caption, layout = "center", children, className }: ModusStageProps) {
  return (
    <figure
      className={cn(
        "relative m-0 flex min-h-[420px] w-full flex-col rounded-2xl border border-border bg-card p-2",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-[0.07] mix-blend-multiply dark:mix-blend-screen"
        style={{ backgroundImage: GRAIN }}
      />
      <div
        className={cn(
          "relative min-h-[360px] flex-1 overflow-hidden rounded-xl bg-background",
          layout === "center" && "flex items-center justify-center p-10",
        )}
      >
        {children}
        {(
          [
            "left-2 top-2",
            "right-2 top-2 rotate-90",
            "bottom-2 left-2 -rotate-90",
            "bottom-2 right-2 rotate-180",
          ] as const
        ).map((position) => (
          <span
            key={position}
            aria-hidden
            className={cn(
              "pointer-events-none absolute h-2.5 w-2.5 border-l border-t border-[hsl(var(--primary)/0.45)]",
              position,
            )}
          />
        ))}
      </div>
      <figcaption className="relative flex items-center justify-between px-2 pb-0.5 pt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        <span>Modus / {caption}</span>
        <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary))]" />
      </figcaption>
    </figure>
  );
}
