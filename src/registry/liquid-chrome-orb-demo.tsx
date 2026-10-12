"use client";

import type { ComponentProps } from "react";
import { LiquidChromeOrb } from "./liquid-chrome-orb";

export default function LiquidChromeOrbDemo(
  props: Partial<ComponentProps<typeof LiquidChromeOrb>>,
) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <LiquidChromeOrb {...props} />
      <p className="pointer-events-none absolute bottom-4 left-4 z-10 text-xs font-medium uppercase tracking-widest text-white/70">
        Liquid Chrome
      </p>
    </div>
  );
}
