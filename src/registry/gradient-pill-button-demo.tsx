"use client";

import type { ComponentProps } from "react";
import { GradientPillButton } from "./gradient-pill-button";

export default function GradientPillButtonDemo(
  props: Partial<ComponentProps<typeof GradientPillButton>>,
) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <GradientPillButton className="min-h-[400px]" {...props} />
    </div>
  );
}
