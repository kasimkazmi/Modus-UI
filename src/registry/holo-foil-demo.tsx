"use client";

import type { ComponentProps } from "react";
import { HoloFoil } from "./holo-foil";

export default function HoloFoilDemo(props: Partial<ComponentProps<typeof HoloFoil>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <HoloFoil {...props} />
      <p className="pointer-events-none absolute bottom-4 left-4 z-10 text-xs font-medium uppercase tracking-widest text-white/70">
        Holo Foil
      </p>
    </div>
  );
}
