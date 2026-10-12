"use client";

import type { ComponentProps } from "react";
import { TypographyVortex } from "./typography-vortex";

export default function TypographyVortexDemo(
  props: Partial<ComponentProps<typeof TypographyVortex>>,
) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <TypographyVortex className="absolute inset-0" {...props} />
    </div>
  );
}
