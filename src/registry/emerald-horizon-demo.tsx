"use client";

import type { ComponentProps } from "react";
import { EmeraldHorizon } from "./emerald-horizon";

export default function EmeraldHorizonDemo(props: Partial<ComponentProps<typeof EmeraldHorizon>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <EmeraldHorizon {...props} />
    </div>
  );
}
